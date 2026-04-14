import { useEffect, useState } from 'react'
import CitySelector from '../components/CitySelector'
import FileManager from '../components/FileManager'
import { createCity, deleteCity, getCities, syncCity } from '../services/api'

interface City {
  id: string
  name: string
  file_count: number
}

export default function ManagePage() {
  const [cityId, setCityId] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [newCityName, setNewCityName] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const loadCities = () => getCities().then(setCities)

  useEffect(() => { loadCities() }, [])

  const handleCreateCity = async () => {
    const name = newCityName.trim()
    if (!name) return
    await createCity(name)
    setNewCityName('')
    loadCities()
  }

  const handleDeleteCity = async (id: string) => {
    if (!confirm(`למחוק את היישוב ${id} וכל הקבצים שלו?`)) return
    await deleteCity(id)
    if (cityId === id) setCityId('')
    loadCities()
  }

  return (
    <div className="h-full overflow-auto bg-gray-50/50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">ניהול קבצים</h2>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* City management */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
              <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.274 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
            </svg>
            <h3 className="font-semibold text-gray-800">ניהול יישובים</h3>
          </div>

          <div className="flex gap-2">
            <input
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCity()}
              placeholder="שם יישוב חדש..."
              aria-label="שם יישוב חדש"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none shadow-sm transition-all duration-150 focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 hover:border-gray-300"
            />
            <button
              onClick={handleCreateCity}
              disabled={!newCityName.trim()}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:shadow-none"
            >
              הוסף יישוב
            </button>
          </div>

          {cities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">אין יישובים במערכת.</p>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {cities.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-600">
                        <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.274 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-sm text-gray-800">{c.name}</span>
                      <span className="text-gray-400 text-xs mr-2">{c.file_count} קבצים</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCity(c.id)}
                    aria-label={`מחק ${c.name}`}
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

        {/* File management */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-600">
              <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
            </svg>
            <h3 className="font-semibold text-gray-800">קבצים</h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <CitySelector value={cityId} onChange={setCityId} />
            </div>
            {cityId && (
              <button
                onClick={async () => {
                  setSyncing(true)
                  setSyncMsg('')
                  try {
                    const res = await syncCity(cityId)
                    setSyncMsg(res.message)
                  } catch {
                    setSyncMsg('שגיאה בסנכרון.')
                  } finally {
                    setSyncing(false)
                  }
                }}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium shadow-sm shadow-amber-500/20 hover:bg-amber-600 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    מסנכרן...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.06-.179Zm-5.625-7.848a5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V-1.463a.75.75 0 0 0-1.5 0v2.033l-.312-.311A7 7 0 0 0 7.627 3.397a.75.75 0 0 0 1.06.179Z" clipRule="evenodd" />
                    </svg>
                    סנכרן אינדקס
                  </>
                )}
              </button>
            )}
          </div>

          {syncMsg && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              {syncMsg}
            </div>
          )}

          <FileManager cityId={cityId} />
        </section>
      </div>
    </div>
  )
}
