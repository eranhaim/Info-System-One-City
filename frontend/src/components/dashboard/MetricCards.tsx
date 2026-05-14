import { useEffect, useState } from 'react'
import { getAnalyticsSummary, type AnalyticsSummary } from '../../services/api'

function formatDuration(ms: number): string {
  if (ms === 0) return '—'
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return min > 0 ? `${min}:${String(sec).padStart(2, '0')} דק׳` : `${sec} שנ׳`
}

function formatResponseTime(ms: number): string {
  if (ms === 0) return '—'
  return `${(ms / 1000).toFixed(1)} שנ׳`
}

interface CardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
}

function Card({ label, value, sub, icon }: CardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function MetricCards() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    getAnalyticsSummary(7).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse h-28" />
        ))}
      </div>
    )
  }

  const diff = data.total_today - data.total_yesterday
  const diffText = diff > 0 ? `+${diff} מאתמול` : diff < 0 ? `${diff} מאתמול` : 'ללא שינוי מאתמול'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        label="פניות (7 ימים)"
        value={String(data.total_inquiries)}
        sub={`${data.total_today} היום · ${diffText}`}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 10 2.5c1.753 0 3.476.107 5.152.27 1.724.253 2.848 1.711 2.848 3.348v5.764c0 1.637-1.124 3.095-2.848 3.348a47.58 47.58 0 0 1-3.476.315.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 47.58 47.58 0 0 1-3.476-.315C2.124 14.977 1 13.519 1 11.882V6.118c0-1.637 1.124-3.095 2.848-3.347Z" clipRule="evenodd" />
          </svg>
        }
      />
      <Card
        label="זמן טיפול ממוצע"
        value={formatDuration(data.avg_duration_ms)}
        sub="מפתיחה עד סגירה"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
          </svg>
        }
      />
      <Card
        label="זמן תגובת AI"
        value={formatResponseTime(data.avg_response_ms)}
        sub="ממוצע לכל הודעה"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
            <path d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06ZM14.95 3.05a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8ZM14 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8ZM7.172 13.828a.75.75 0 0 1-1.061-1.06l1.06-1.062a.75.75 0 1 1 1.062 1.061l-1.061 1.06ZM10 14a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 14Z" />
            <path fillRule="evenodd" d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z" clipRule="evenodd" />
          </svg>
        }
      />
      <Card
        label="פניות פתוחות"
        value={String(data.open_inquiries)}
        sub="טרם טופלו"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
        }
      />
    </div>
  )
}
