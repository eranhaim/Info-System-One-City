import { useEffect, useState } from 'react'
import { getCities } from '../services/api'

interface City {
  id: string
  name: string
  file_count: number
}

interface Props {
  value: string
  onChange: (cityId: string) => void
}

export default function CitySelector({ value, onChange }: Props) {
  const [cities, setCities] = useState<City[]>([])

  const load = () => getCities().then(setCities)

  useEffect(() => { load() }, [])

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="בחירת יישוב"
        className="w-full appearance-none px-4 py-2.5 pe-10 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 shadow-sm transition-all duration-150 focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none hover:border-gray-300"
      >
        <option value="">-- בחר יישוב --</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.file_count} קבצים)
          </option>
        ))}
      </select>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
      </svg>
    </div>
  )
}
