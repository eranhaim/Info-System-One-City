import { useEffect, useState } from 'react'
import {
  getInquiryLog, getInquiryMessages, getUsers, getCities,
  type InquiryLogItem, type InquiryMessage, type User, type City,
} from '../../services/api'

function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  const sec = Math.round(ms / 1000)
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return min > 0 ? `${min}:${String(s).padStart(2, '0')}` : `${sec}s`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

export default function InquiryLog() {
  const [items, setItems] = useState<InquiryLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [users, setUsers] = useState<User[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [messages, setMessages] = useState<InquiryMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    getUsers().then(setUsers)
    getCities().then(setCities)
  }, [])

  useEffect(() => {
    loadPage()
  }, [page, filterEmployee, filterCity, filterStatus])

  const loadPage = async () => {
    const res = await getInquiryLog({
      page, limit,
      employee: filterEmployee,
      city: filterCity,
      status: filterStatus,
    })
    setItems(res.items)
    setTotal(res.total)
  }

  const toggleExpand = async (sessionId: string) => {
    if (expanded === sessionId) {
      setExpanded(null)
      setMessages([])
      return
    }
    setExpanded(sessionId)
    setLoadingMessages(true)
    try {
      const msgs = await getInquiryMessages(sessionId)
      setMessages(msgs)
    } finally {
      setLoadingMessages(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-700 shrink-0">יומן פניות</h3>
        <div className="flex-1" />
        <select
          value={filterEmployee}
          onChange={(e) => { setFilterEmployee(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-400/40"
        >
          <option value="">כל העובדים</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select
          value={filterCity}
          onChange={(e) => { setFilterCity(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-400/40"
        >
          <option value="">כל היישובים</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-400/40"
        >
          <option value="">הכל</option>
          <option value="open">פתוח</option>
          <option value="closed">סגור</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין פניות.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">עובד</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">יישוב</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">הודעות</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משך</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.session_id} className="group">
                  <td colSpan={6} className="p-0">
                    <div
                      className="grid grid-cols-6 px-4 py-3 cursor-pointer hover:bg-gray-50/60 transition-colors"
                      onClick={() => toggleExpand(item.session_id)}
                    >
                      <span className="text-gray-600">{formatDate(item.opened_at)}</span>
                      <span className="text-gray-800 font-medium">{item.user_name || '—'}</span>
                      <span className="text-gray-600">{item.city_id}</span>
                      <span className="text-gray-600">{item.message_count}</span>
                      <span className="text-gray-600">{formatDuration(item.total_duration_ms)}</span>
                      <span>
                        {item.closed_at ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">סגור</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">פתוח</span>
                        )}
                      </span>
                    </div>

                    {expanded === item.session_id && (
                      <div className="px-6 pb-4 bg-gray-50/40 border-t border-gray-100">
                        {loadingMessages ? (
                          <p className="text-gray-400 text-xs py-3">טוען שיחה...</p>
                        ) : messages.length === 0 ? (
                          <p className="text-gray-400 text-xs py-3">אין הודעות.</p>
                        ) : (
                          <div className="space-y-3 py-3 max-h-80 overflow-y-auto">
                            {messages.map((m, i) => (
                              <div key={i} className="space-y-1.5">
                                <div className="flex items-start gap-2">
                                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded shrink-0">שאלה</span>
                                  <p className="text-xs text-gray-700 leading-relaxed">{m.question}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">תשובה</span>
                                  <p className="text-xs text-gray-600 leading-relaxed">{m.answer}</p>
                                </div>
                                <p className="text-[10px] text-gray-300 pr-12">זמן תגובה: {m.duration_ms}ms</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">סה״כ {total} פניות</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              הקודם
            </button>
            <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
