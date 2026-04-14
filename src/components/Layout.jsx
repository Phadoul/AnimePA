import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, LogIn, Tv, Database, PlusCircle, CalendarDays } from 'lucide-react'

const TABS = [
  { id: 'viendo', label: 'Viendo', icon: Tv },
  { id: 'horario', label: 'Horario', icon: CalendarDays },
  { id: 'bd', label: 'BD', icon: Database },
  { id: 'entrada', label: 'Entrada de datos', icon: PlusCircle },
]

const PUBLIC_TABS = ['horario']

export default function Layout({ children, activeTab, onTabChange, onLogin }) {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const displayName = user?.email?.split('@')[0] ?? 'Usuario'
  const visibleTabs = user ? TABS : TABS.filter(t => PUBLIC_TABS.includes(t.id))

  return (
    <div className="min-h-screen flex flex-col bg-anime-bg">
      {/* Top bar */}
      <header className="bg-anime-surface border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎌</span>
          <span className="font-bold text-lg text-white tracking-tight">AnimePA</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-white/50">
                <span className="text-white/30">Hola, </span>
                <span className="text-anime-accent font-medium capitalize">{displayName}</span>
              </span>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="btn-ghost flex items-center gap-2 text-sm text-white/50 hover:text-white"
              >
                <LogOut size={15} />
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <LogIn size={14} />
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-anime-surface border-b border-white/10 px-6">
        <div className="flex gap-1">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === id
                  ? 'border-anime-accent text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
