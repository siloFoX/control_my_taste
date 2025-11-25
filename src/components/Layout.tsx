import { Outlet, NavLink } from 'react-router-dom'
import { Music, Star, Trash2, RefreshCw } from 'lucide-react'

function Layout() {
  const navItems = [
    { to: '/', icon: Music, label: '음악 목록' },
    { to: '/evaluate', icon: Star, label: '평가하기' },
    { to: '/trash', icon: Trash2, label: '휴지통' },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* 사이드바 */}
      <aside className="w-64 bg-gray-800 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8 px-2">Control My Taste</h1>

        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon size={20} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* 동기화 버튼 */}
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors mt-4">
          <RefreshCw size={20} />
          YouTube 동기화
        </button>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
