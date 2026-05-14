import { useState } from 'react'
import { adminLogin } from '../services/api'
import MetricCards from '../components/dashboard/MetricCards'
import Charts from '../components/dashboard/Charts'
import EmployeeTable from '../components/dashboard/EmployeeTable'
import InquiryLog from '../components/dashboard/InquiryLog'
import EmployeeManager from '../components/EmployeeManager'

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!password.trim()) return
    setLoading(true)
    setError('')
    const ok = await adminLogin(password)
    if (ok) {
      sessionStorage.setItem('onecity_admin', '1')
      onSuccess()
    } else {
      setError('סיסמה שגויה.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-full bg-gray-50/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-brand-600">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800">כניסת מנהל</h2>
          <p className="text-gray-400 text-sm">הזן סיסמה לגישה לפאנל הניהול</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="סיסמה..."
            dir="ltr"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 hover:border-gray-300"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!password.trim() || loading}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-40"
          >
            {loading ? 'בודק...' : 'כניסה'}
          </button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'dashboard' | 'employees'

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('onecity_admin') === '1')
  const [tab, setTab] = useState<Tab>('dashboard')

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />

  return (
    <div className="h-full overflow-auto bg-gray-50/50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-6">
        <h2 className="text-lg font-semibold text-gray-800">פאנל ניהול</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab('dashboard')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'dashboard'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            לוח בקרה
          </button>
          <button
            onClick={() => setTab('employees')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'employees'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ניהול עובדים
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { sessionStorage.removeItem('onecity_admin'); setAuthed(false) }}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          התנתק מניהול
        </button>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {tab === 'dashboard' ? (
          <>
            <MetricCards />
            <Charts />
            <EmployeeTable />
            <InquiryLog />
          </>
        ) : (
          <EmployeeManager />
        )}
      </div>
    </div>
  )
}
