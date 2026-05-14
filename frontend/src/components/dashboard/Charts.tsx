import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  getInquiriesOverTime, getDurationByEmployee,
  getInquiriesByCity, getHourlyDistribution,
  type TimeSeriesPoint, type EmployeeDuration,
  type CityCount, type HourlyPoint,
} from '../../services/api'

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function formatDurationMin(ms: number): string {
  const sec = Math.round(ms / 1000)
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return min > 0 ? `${min}:${String(s).padStart(2, '0')}` : `${sec}s`
}

export default function Charts() {
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([])
  const [byEmployee, setByEmployee] = useState<EmployeeDuration[]>([])
  const [byCity, setByCity] = useState<CityCount[]>([])
  const [hourly, setHourly] = useState<HourlyPoint[]>([])

  useEffect(() => {
    getInquiriesOverTime(30).then(setTimeSeries)
    getDurationByEmployee().then(setByEmployee)
    getInquiriesByCity().then(setByCity)
    getHourlyDistribution(30).then(setHourly)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="פניות לאורך זמן (30 יום)">
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip labelFormatter={(v) => `תאריך: ${v}`} formatter={(v) => [String(v), 'פניות']} />
              <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="זמן טיפול ממוצע לפי עובד">
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byEmployee} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDurationMin(v)} />
              <YAxis dataKey="employee" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => [formatDurationMin(Number(v)), 'ממוצע']} />
              <Bar dataKey="avg_duration_ms" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="פניות לפי יישוב">
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byCity}
                dataKey="count"
                nameKey="city"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(props: Record<string, unknown>) => `${props.name ?? ''} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={11}
              >
                {byCity.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              <Tooltip formatter={(v) => [String(v), 'פניות']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="התפלגות שעתית (30 יום)">
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}:00`} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip labelFormatter={(v) => `שעה ${v}:00`} formatter={(v) => [String(v), 'פניות']} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
