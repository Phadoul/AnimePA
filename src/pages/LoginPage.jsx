import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage({ onCancel }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel ? (e) => { if (e.target === e.currentTarget) onCancel() } : undefined}>
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎌</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AnimePA</h1>
          <p className="text-white/40 text-sm mt-1">Acceso privado · Solo para nosotros</p>
        </div>

        {/* Card */}
        <div className="bg-anime-surface border border-white/10 rounded-2xl p-8 shadow-2xl relative">
          {onCancel && (
            <button onClick={onCancel} className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors text-xl leading-none">✕</button>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Contraseña</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          No hay registro público · Acceso solo por invitación
        </p>
      </div>
    </div>
  )
}
