import { NavLink } from 'react-router-dom'

const links = [
  {
    to: '/',
    label: 'חיפוש מידע',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/manage',
    label: 'ניהול קבצים',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-gray-900 text-white flex flex-col">
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="One City" className="h-8 w-auto" />
        </div>
        <p className="text-gray-400 text-xs mt-2 tracking-wide">מערכת מידע ארגונית</p>
      </div>

      <div className="px-4 mb-2">
        <div className="h-px bg-gray-700/60" />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-brand-600 text-white font-medium shadow-md shadow-brand-600/20'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="rounded-lg bg-gray-800/60 px-3 py-2.5 text-center">
          <p className="text-[11px] text-gray-500">One City Knowledge System</p>
        </div>
      </div>
    </aside>
  )
}
