import { useState } from 'react'
import CitySelector from '../components/CitySelector'
import ChatPanel from '../components/ChatPanel'

export default function ChatPage() {
  const [cityId, setCityId] = useState('')

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 shrink-0">חיפוש מידע</h2>
        <div className="w-64">
          <CitySelector value={cityId} onChange={setCityId} />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {cityId ? (
          <ChatPanel cityId={cityId} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50/50">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-brand-600">
                  <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.69 2.92l.037.024.012.006.003.001.002.001ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-base font-medium">בחר יישוב כדי להתחיל</p>
                <p className="text-gray-400 text-sm mt-1">המערכת תחפש מידע רלוונטי מתוך מאגר הקבצים</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
