import io
import json
import logging
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)

PREFIX = "cities"


@lru_cache(maxsize=1)
def _get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


def _bucket():
    return settings.s3_bucket_name


def _file_key(city_id: str, filename: str) -> str:
    return f"{PREFIX}/{city_id}/files/{filename}"


def _vector_store_key(city_id: str, filename: str) -> str:
    return f"{PREFIX}/{city_id}/vector_store/{filename}"


def _config_key(city_id: str) -> str:
    return f"{PREFIX}/{city_id}/config.json"


# --------------- City config ---------------


def get_city_config(city_id: str) -> dict:
    """Read per-city config (widget_id, folder_id, etc.) from S3."""
    s3 = _get_s3_client()
    try:
        resp = s3.get_object(Bucket=_bucket(), Key=_config_key(city_id))
        return json.loads(resp["Body"].read().decode("utf-8"))
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return {}
        raise


def save_city_config(city_id: str, config: dict) -> None:
    """Write per-city config to S3, merging with existing values."""
    existing = get_city_config(city_id)
    existing.update(config)
    s3 = _get_s3_client()
    s3.put_object(
        Bucket=_bucket(),
        Key=_config_key(city_id),
        Body=json.dumps(existing, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )


# --------------- City operations ---------------


def list_cities() -> list[dict]:
    """List all city folders by looking at common prefixes under cities/."""
    s3 = _get_s3_client()
    resp = s3.list_objects_v2(
        Bucket=_bucket(), Prefix=f"{PREFIX}/", Delimiter="/"
    )
    cities: list[dict] = []
    for cp in resp.get("CommonPrefixes", []):
        city_id = cp["Prefix"].split("/")[1]
        file_count = count_files(city_id)
        config = get_city_config(city_id)
        cities.append({
            "id": city_id,
            "name": city_id,
            "file_count": file_count,
            "widget_id": config.get("widget_id"),
            "folder_id": config.get("folder_id"),
        })
    return cities


def create_city(city_id: str) -> None:
    """Create a city folder marker in S3."""
    s3 = _get_s3_client()
    s3.put_object(Bucket=_bucket(), Key=f"{PREFIX}/{city_id}/", Body=b"")


def delete_city(city_id: str) -> None:
    """Delete all objects under a city prefix."""
    s3 = _get_s3_client()
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=_bucket(), Prefix=f"{PREFIX}/{city_id}/"):
        objects = [{"Key": obj["Key"]} for obj in page.get("Contents", [])]
        if objects:
            s3.delete_objects(Bucket=_bucket(), Delete={"Objects": objects})


# --------------- File operations ---------------


def upload_file(city_id: str, filename: str, data: bytes) -> int:
    """Upload a file to the city's files folder. Returns size in bytes."""
    s3 = _get_s3_client()
    key = _file_key(city_id, filename)
    s3.put_object(Bucket=_bucket(), Key=key, Body=data)
    return len(data)


def download_file(city_id: str, filename: str) -> bytes:
    s3 = _get_s3_client()
    key = _file_key(city_id, filename)
    resp = s3.get_object(Bucket=_bucket(), Key=key)
    return resp["Body"].read()


def delete_file(city_id: str, filename: str) -> None:
    s3 = _get_s3_client()
    s3.delete_object(Bucket=_bucket(), Key=_file_key(city_id, filename))


def list_files(city_id: str) -> list[dict]:
    s3 = _get_s3_client()
    prefix = f"{PREFIX}/{city_id}/files/"
    resp = s3.list_objects_v2(Bucket=_bucket(), Prefix=prefix)
    files: list[dict] = []
    for obj in resp.get("Contents", []):
        name = obj["Key"].removeprefix(prefix)
        if not name:
            continue
        files.append(
            {"filename": name, "size_bytes": obj["Size"], "city_id": city_id}
        )
    return files


def count_files(city_id: str) -> int:
    s3 = _get_s3_client()
    prefix = f"{PREFIX}/{city_id}/files/"
    resp = s3.list_objects_v2(Bucket=_bucket(), Prefix=prefix)
    return max(0, resp.get("KeyCount", 0) - 1)


# --------------- Vector store persistence ---------------


def upload_vector_store(city_id: str, faiss_bytes: bytes, pkl_bytes: bytes) -> None:
    s3 = _get_s3_client()
    s3.put_object(
        Bucket=_bucket(), Key=_vector_store_key(city_id, "index.faiss"), Body=faiss_bytes
    )
    s3.put_object(
        Bucket=_bucket(), Key=_vector_store_key(city_id, "index.pkl"), Body=pkl_bytes
    )


def upload_consolidated_text(city_id: str, text: str) -> None:
    """Save the consolidated knowledge file alongside the vector store."""
    s3 = _get_s3_client()
    s3.put_object(
        Bucket=_bucket(),
        Key=_vector_store_key(city_id, "consolidated.txt"),
        Body=text.encode("utf-8"),
        ContentType="text/plain; charset=utf-8",
    )


def download_vector_store(city_id: str) -> tuple[bytes, bytes] | None:
    """Returns (faiss_bytes, pkl_bytes) or None if not found."""
    s3 = _get_s3_client()
    try:
        faiss_resp = s3.get_object(
            Bucket=_bucket(), Key=_vector_store_key(city_id, "index.faiss")
        )
        pkl_resp = s3.get_object(
            Bucket=_bucket(), Key=_vector_store_key(city_id, "index.pkl")
        )
        return faiss_resp["Body"].read(), pkl_resp["Body"].read()
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def delete_vector_store(city_id: str) -> None:
    s3 = _get_s3_client()
    s3.delete_object(
        Bucket=_bucket(), Key=_vector_store_key(city_id, "index.faiss")
    )
    s3.delete_object(
        Bucket=_bucket(), Key=_vector_store_key(city_id, "index.pkl")
    )
