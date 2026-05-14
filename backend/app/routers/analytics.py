from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Query

from app.services.database import chat_logs_col, inquiries_col

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _days_ago(days: int) -> str:
    return (_utc_now() - timedelta(days=days)).isoformat()


# ------------------------------------------------------------------ summary
@router.get("/summary")
async def summary(days: int = Query(7, ge=1, le=365)):
    col = inquiries_col()
    since = _days_ago(days)
    today_start = _utc_now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    yesterday_start = (_utc_now() - timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    ).isoformat()

    total = await col.count_documents({"opened_at": {"$gte": since}})
    total_today = await col.count_documents({"opened_at": {"$gte": today_start}})
    total_yesterday = await col.count_documents({
        "opened_at": {"$gte": yesterday_start, "$lt": today_start},
    })
    open_inquiries = await col.count_documents({"closed_at": None})

    dur_pipeline = [
        {"$match": {"opened_at": {"$gte": since}, "total_duration_ms": {"$ne": None}}},
        {"$group": {"_id": None, "avg": {"$avg": "$total_duration_ms"}}},
    ]
    dur_result = await col.aggregate(dur_pipeline).to_list(1)
    avg_duration_ms = dur_result[0]["avg"] if dur_result else 0

    resp_pipeline = [
        {"$match": {"started_at": {"$gte": since}}},
        {"$group": {"_id": None, "avg": {"$avg": "$duration_ms"}}},
    ]
    resp_result = await chat_logs_col().aggregate(resp_pipeline).to_list(1)
    avg_response_ms = resp_result[0]["avg"] if resp_result else 0

    return {
        "total_inquiries": total,
        "total_today": total_today,
        "total_yesterday": total_yesterday,
        "avg_duration_ms": round(avg_duration_ms or 0),
        "avg_response_ms": round(avg_response_ms or 0),
        "open_inquiries": open_inquiries,
    }


# ------------------------------------------------------------------ charts
@router.get("/inquiries-over-time")
async def inquiries_over_time(days: int = Query(30, ge=1, le=365)):
    col = inquiries_col()
    since = _days_ago(days)

    pipeline = [
        {"$match": {"opened_at": {"$gte": since}}},
        {"$addFields": {"date": {"$substr": ["$opened_at", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    results = await col.aggregate(pipeline).to_list(365)
    return [{"date": r["_id"], "count": r["count"]} for r in results]


@router.get("/duration-by-employee")
async def duration_by_employee():
    col = inquiries_col()
    pipeline = [
        {"$match": {"total_duration_ms": {"$ne": None}, "user_id": {"$ne": None}}},
        {"$group": {
            "_id": "$user_id",
            "avg_duration_ms": {"$avg": "$total_duration_ms"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"avg_duration_ms": -1}},
    ]
    results = await col.aggregate(pipeline).to_list(100)

    enriched = []
    for r in results:
        name = r["_id"] or "לא ידוע"
        inq = await col.find_one({"user_id": r["_id"], "user_id": {"$ne": None}})
        if inq and "user_name" in inq:
            name = inq.get("user_name", name)
        enriched.append({
            "employee": name,
            "avg_duration_ms": round(r["avg_duration_ms"]),
            "count": r["count"],
        })
    return enriched


@router.get("/inquiries-by-city")
async def inquiries_by_city():
    col = inquiries_col()
    pipeline = [
        {"$match": {"city_id": {"$ne": None}}},
        {"$group": {"_id": "$city_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await col.aggregate(pipeline).to_list(100)
    return [{"city": r["_id"], "count": r["count"]} for r in results]


@router.get("/hourly-distribution")
async def hourly_distribution(days: int = Query(30, ge=1, le=365)):
    col = inquiries_col()
    since = _days_ago(days)

    pipeline = [
        {"$match": {"opened_at": {"$gte": since}}},
        {"$addFields": {"hour_str": {"$substr": ["$opened_at", 11, 2]}}},
        {"$group": {"_id": "$hour_str", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    results = await col.aggregate(pipeline).to_list(24)
    hour_map = {r["_id"]: r["count"] for r in results}
    return [{"hour": h, "count": hour_map.get(f"{h:02d}", 0)} for h in range(24)]


# ------------------------------------------------------------------ employees
@router.get("/employee-performance")
async def employee_performance():
    col = inquiries_col()
    today_start = _utc_now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    pipeline = [
        {"$match": {"user_id": {"$ne": None}}},
        {"$group": {
            "_id": "$user_id",
            "total_inquiries": {"$sum": 1},
            "avg_duration_ms": {"$avg": {"$ifNull": ["$total_duration_ms", 0]}},
            "total_messages": {"$sum": "$message_count"},
        }},
        {"$sort": {"total_inquiries": -1}},
    ]
    results = await col.aggregate(pipeline).to_list(100)

    enriched = []
    for r in results:
        today_count = await col.count_documents({
            "user_id": r["_id"], "opened_at": {"$gte": today_start},
        })
        sample = await col.find_one({"user_id": r["_id"]})
        name = r["_id"] or "לא ידוע"
        if sample:
            name = sample.get("user_name", name)
        enriched.append({
            "user_id": r["_id"],
            "name": name,
            "total_inquiries": r["total_inquiries"],
            "avg_duration_ms": round(r["avg_duration_ms"] or 0),
            "total_messages": r["total_messages"] or 0,
            "today": today_count,
        })
    return enriched


# ------------------------------------------------------------------ inquiry log
@router.get("/inquiry-log")
async def inquiry_log(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    employee: str = Query("", alias="employee"),
    city: str = Query("", alias="city"),
    status: str = Query("", alias="status"),
    date_from: str = Query("", alias="date_from"),
    date_to: str = Query("", alias="date_to"),
):
    col = inquiries_col()
    query: dict = {}

    if employee:
        query["user_id"] = employee
    if city:
        query["city_id"] = city
    if status == "open":
        query["closed_at"] = None
    elif status == "closed":
        query["closed_at"] = {"$ne": None}
    if date_from:
        query.setdefault("opened_at", {})["$gte"] = date_from
    if date_to:
        query.setdefault("opened_at", {})["$lte"] = date_to

    total = await col.count_documents(query)
    skip = (page - 1) * limit
    docs = await col.find(query).sort("opened_at", -1).skip(skip).limit(limit).to_list(limit)

    items = []
    for d in docs:
        items.append({
            "session_id": d.get("session_id", ""),
            "user_id": d.get("user_id"),
            "user_name": d.get("user_name", ""),
            "city_id": d.get("city_id", ""),
            "message_count": d.get("message_count", 0),
            "opened_at": d.get("opened_at", ""),
            "closed_at": d.get("closed_at"),
            "total_duration_ms": d.get("total_duration_ms"),
        })

    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/inquiry-log/{session_id}/messages")
async def inquiry_messages(session_id: str):
    col = chat_logs_col()
    docs = await col.find({"session_id": session_id}).sort("started_at", 1).to_list(500)
    return [
        {
            "question": d.get("question", ""),
            "answer": d.get("answer", ""),
            "started_at": d.get("started_at", ""),
            "duration_ms": d.get("duration_ms", 0),
        }
        for d in docs
    ]
