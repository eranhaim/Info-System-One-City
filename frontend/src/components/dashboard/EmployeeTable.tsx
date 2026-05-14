import { useEffect, useState } from 'react'
import { getEmployeePerformance, type EmployeePerformance } from '../../services/api'

type SortKey = 'name' | 'total_inquiries' | 'avg_duration_ms' | 'total_messages' | 'today'

function formatDuration(ms: number): string {
  if (ms === 0) return '—'
  const sec = Math.round(ms / 1000)
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return min > 0 ? `${min}:${String(s).padStart(2, '0')}` : `${sec}s`
}

export default function EmployeeTable() {
  const [data, setData] = useState<EmployeePerformance[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('total_inquiries')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    getEmployeePerformance().then(setData)
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <span className={`mr-1 text-[10px] ${active ? 'text-brand-600' : 'text-gray-300'}`}>
      {active ? (asc ? '▲' : '▼') : '⇅'}
    </span>
  )

  const th = (label: string, key: SortKey) => (
    <th
      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-brand-600 transition-colors select-none"
      onClick={() => handleSort(key)}
    >
      {label}
      <SortIcon active={sortKey === key} asc={sortAsc} />
    </th>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">ביצועי עובדים</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">אין נתונים.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                {th('עובד', 'name')}
                {th('סה״כ פניות', 'total_inquiries')}
                {th('זמן ממוצע', 'avg_duration_ms')}
                {th('סה״כ הודעות', 'total_messages')}
                {th('היום', 'today')}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((emp) => (
                <tr key={emp.user_id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.total_inquiries}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDuration(emp.avg_duration_ms)}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.total_messages}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                      {emp.today}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
