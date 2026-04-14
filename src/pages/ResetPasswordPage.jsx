import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const { setRecoveryMode } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setResult({ ok: false, message: 'Las contraseñas no coinciden.' })
      return
    }
    if (password.length < 6) {
      setResult({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setResult({ ok: false, message: error.message })
    } else {
      setResult({ ok: true, message: '¡Contraseña cambiada correctamente!' })
      // Give user a moment to read the message then go to main app
      setTimeout(() => setRecoveryMode(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-anime-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎌</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AnimePA</h1>
          <p className="text-white/40 text-sm mt-1">Nueva contraseña</p>
        </div>

        <div className="bg-anime-surface border border-white/10 rounded-2xl p-8 shadow-2xl">
          {result?.ok ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle size={40} className="text-green-400" />
              <p className="text-green-400 text-sm">{result.message}</p>
              <p className="text-white/30 text-xs">Entrando a la app...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Nueva contraseña</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Confirmar contraseña</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {result && !result.ok && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  <AlertCircle size={15} />
                  {result.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
