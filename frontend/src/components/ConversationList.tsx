import { useEffect, useState } from 'react'
import { getChatSessions, type ChatSession } from '../services/api'
import { useUser } from '../context/UserContext'

interface Props {
  activeSessionId?: string
  onSelectSession: (sessionId: string, cityId: string) => void
  onNewChat: () => void
  refreshKey: number
}

function timeAgo(iso: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'עכשיו'
  if (min < 60) return `לפני ${min} דק׳`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `לפני ${hrs} שע׳`
  const days = Math.floor(hrs / 24)
  return `לפני ${days} ימים`
}

export default function ConversationList({ activeSessionId, onSelectSession, onNewChat, refreshKey }: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const { user } = useUser()

  useEffect(() => {
    if (user?.id) {
      getChatSessions(user.id).then(setSessions)
    }
  }, [user?.id, refreshKey])

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:scale-[0.97] transition-all duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          שיחה חדשה
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-6">אין שיחות קודמות</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.session_id}
              onClick={() => onSelectSession(s.session_id, s.city_id)}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-xs transition-all duration-150 group ${
                activeSessionId === s.session_id
                  ? 'bg-white shadow-sm border border-gray-200'
                  : 'hover:bg-white/60'
              }`}
            >
              <p className={`font-medium truncate leading-snug ${
                activeSessionId === s.session_id ? 'text-gray-800' : 'text-gray-600'
              }`}>
                {s.title || 'שיחה ללא כותרת'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400 truncate">{s.city_id}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400 shrink-0">{timeAgo(s.opened_at)}</span>
                {s.closed_at ? (
                  <span className="mr-auto inline-block w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" title="טופלה" />
                ) : (
                  <span className="mr-auto inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="פתוחה" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
