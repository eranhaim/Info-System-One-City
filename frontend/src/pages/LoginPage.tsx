import { useEffect, useState } from 'react'
import { getUsers } from '../services/api'
import { useUser } from '../context/UserContext'

interface User {
  id: string
  name: string
}

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const { setUser } = useUser()

  useEffect(() => {
    getUsers().then((u) => { setUsers(u); setLoading(false) })
  }, [])

  const handleLogin = () => {
    const user = users.find((u) => u.id === selected)
    if (user) setUser({ id: user.id, name: user.name })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <img src="/logo.png" alt="One City" className="h-12 mx-auto" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">עיר אחת</h1>
            <p className="text-gray-400 text-sm mt-1">מערכת מידע ארגונית</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">בחר את שמך</label>
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <svg className="animate-spin w-5 h-5 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">אין עובדים במערכת. פנה למנהל.</p>
            ) : (
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-150 focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 hover:border-gray-300 bg-white"
              >
                <option value="">-- בחר עובד --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleLogin}
            disabled={!selected}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            כניסה למערכת
          </button>
        </div>
      </div>
    </div>
  )
}
