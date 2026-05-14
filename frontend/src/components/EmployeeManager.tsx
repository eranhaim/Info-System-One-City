import { useEffect, useState } from 'react'
import { getUsers, createUser, deleteUser } from '../services/api'

interface User {
  id: string
  name: string
  created_at: string
}

export default function EmployeeManager() {
  const [users, setUsers] = useState<User[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const loadUsers = () => getUsers().then(setUsers)

  useEffect(() => { loadUsers() }, [])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setLoading(true)
    try {
      await createUser(name)
      setNewName('')
      loadUsers()
    } catch {
      alert('שגיאה ביצירת עובד.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`להסיר את העובד ${name}?`)) return
    await deleteUser(id)
    loadUsers()
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
            <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
          </svg>
          <h3 className="font-semibold text-gray-800">הוספת עובד</h3>
        </div>

        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="שם העובד..."
            aria-label="שם עובד חדש"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-150 focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 hover:border-gray-300"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || loading}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? 'מוסיף...' : 'הוסף עובד'}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
            <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.25 2.25 0 0 1 1 14.75l-.01-9.51Zm8.26 9.52v-.625a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v.615c0 .414.336.75.75.75h5.373a.75.75 0 0 0 .627-.74Zm1.5 0a.75.75 0 0 0 .627.74h5.373a.75.75 0 0 0 .75-.75v-.615a.75.75 0 0 0-.75-.75H11.5a.75.75 0 0 0-.75.75v.625ZM2.5 7.5a.75.75 0 0 0 .75.75h5.25a.75.75 0 0 0 .75-.75v-1a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v1Zm8.25.75a.75.75 0 0 1-.75-.75v-1a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-.75.75h-5.25ZM2.5 11a.75.75 0 0 0 .75.75h5.25a.75.75 0 0 0 .75-.75v-1a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v1Zm8.25.75a.75.75 0 0 1-.75-.75v-1a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-.75.75h-5.25Z" clipRule="evenodd" />
          </svg>
          <h3 className="font-semibold text-gray-800">רשימת עובדים</h3>
        </div>

        {users.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">אין עובדים במערכת.</p>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-600">
                      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm text-gray-800">{u.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(u.id, u.name)}
                  aria-label={`הסר ${u.name}`}
                  className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
