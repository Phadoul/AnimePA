import { useState } from 'react'
import { Plus, Minus, Edit2, Check, X } from 'lucide-react'

export default function EpisodeCounter({ value = 0, total, onUpdate, disabled }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  const safeTotal = total && total !== '∞' ? Number(total) : null

  const commit = async (newVal) => {
    const clamped = safeTotal ? Math.min(newVal, safeTotal) : newVal
    const clamped2 = Math.max(0, clamped)
    await onUpdate(clamped2)
  }

  const handleManualSubmit = async () => {
    const parsed = parseInt(input, 10)
    if (!isNaN(parsed)) await commit(parsed)
    setEditing(false)
    setInput('')
  }

  const pct = safeTotal ? Math.round((value / safeTotal) * 100) : null

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <button
          onClick={() => commit(value - 1)}
          disabled={disabled || value <= 0}
          className="w-6 h-6 rounded bg-white/10 hover:bg-anime-accent/60 flex items-center justify-center disabled:opacity-30 transition-colors"
        >
          <Minus size={11} />
        </button>

        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="number"
              min={0}
              max={safeTotal ?? undefined}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSubmit()
                if (e.key === 'Escape') { setEditing(false); setInput('') }
              }}
              className="w-14 bg-anime-card border border-anime-accent text-white text-center text-xs rounded px-1 py-0.5 focus:outline-none"
            />
            <button onClick={handleManualSubmit} className="text-green-400 hover:text-green-300">
              <Check size={13} />
            </button>
            <button onClick={() => { setEditing(false); setInput('') }} className="text-red-400 hover:text-red-300">
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditing(true); setInput(String(value)) }}
            className="px-2 text-sm font-mono font-semibold text-white hover:text-anime-accent transition-colors min-w-[3rem] text-center"
          >
            {value}
            {safeTotal ? <span className="text-white/30 text-xs">/{safeTotal}</span> : null}
          </button>
        )}

        <button
          onClick={() => commit(value + 1)}
          disabled={disabled || (safeTotal !== null && value >= safeTotal)}
          className="w-6 h-6 rounded bg-white/10 hover:bg-green-500/60 flex items-center justify-center disabled:opacity-30 transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>

    </div>
  )
}
