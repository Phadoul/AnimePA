import { useState } from 'react'
import { addAnime } from '../hooks/useAnime'
import { CheckCircle, AlertCircle, Loader2, Link, Save } from 'lucide-react'

const ESTADOS = ['Going', 'Finish', 'Waiting', 'Desc']
const PARTICIPANTES = ['P&A', 'Pedro', 'Asencio']

const INITIAL = {
  link_mal: '',
  link_schedule: '',
  link_ver: '',
  titulo: '',
  estado: 'Going',
  participantes: 'P&A',
  temporada: '',
  fecha: '',
  horario: '',
  numero_episodios: '',
  nota_mal: '',
}

export default function EntradaDatos() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { ok: bool, message: string }
  const [fetching, setFetching] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.link_mal && !form.titulo) {
      setResult({ ok: false, message: 'Necesitas al menos el Link MAL o el título.' })
      return
    }
    setLoading(true)
    setResult(null)

    const payload = {
      ...form,
      agregado: new Date().toISOString(),
      numero_episodios: form.numero_episodios ? Number(form.numero_episodios) : null,
      nota_mal: form.nota_mal ? Number(form.nota_mal) : null,
    }

    const { data, error } = await addAnime(payload)

    setLoading(false)
    if (error) {
      setResult({ ok: false, message: error.message })
    } else {
      setResult({ ok: true, message: `"${data.titulo || 'Anime'}" añadido correctamente.` })
      setForm(INITIAL)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold text-white">Nueva entrada</h2>

      {/* Links section */}
      <div className="bg-anime-surface border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
          <Link size={14} /> Links
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'Link MAL', field: 'link_mal', placeholder: 'https://myanimelist.net/anime/...' },
            { label: 'Link Schedule', field: 'link_schedule', placeholder: 'https://livechart.me/...' },
            { label: 'Link Ver', field: 'link_ver', placeholder: 'https://...' },
          ].map(({ label, field, placeholder }) => (
            <div key={field} className="flex items-center gap-3">
              <label className="w-32 text-sm text-white/50 shrink-0">{label}</label>
              <input
                type="url"
                value={form[field]}
                onChange={set(field)}
                placeholder={placeholder}
                className="input-field text-sm py-2"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info section */}
      <div className="bg-anime-surface border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-white/60">Información</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-white/50 mb-1.5">Título <span className="text-white/25">(opcional si pones MAL link)</span></label>
            <input type="text" value={form.titulo} onChange={set('titulo')} placeholder="Nombre del anime" className="input-field" />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Estado</label>
            <select value={form.estado} onChange={set('estado')} className="input-field">
              {ESTADOS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Participantes</label>
            <select value={form.participantes} onChange={set('participantes')} className="input-field">
              {PARTICIPANTES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Temporada</label>
            <input type="text" value={form.temporada} onChange={set('temporada')} placeholder="Ej: Invierno de 2026" className="input-field" />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Fecha emisión</label>
            <input type="text" value={form.fecha} onChange={set('fecha')} placeholder="Ej: 5 de enero de 2026" className="input-field" />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Horario</label>
            <input type="text" value={form.horario} onChange={set('horario')} placeholder="Ej: 13:00" className="input-field" />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Nº episodios</label>
            <input type="number" min={0} value={form.numero_episodios} onChange={set('numero_episodios')} placeholder="12" className="input-field" />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Nota MAL</label>
            <input type="number" min={0} max={10} step={0.01} value={form.nota_mal} onChange={set('nota_mal')} placeholder="8.5" className="input-field" />
          </div>
        </div>
      </div>

      {/* Preview row */}
      <div className="bg-anime-surface border border-white/10 rounded-xl p-4 overflow-x-auto">
        <p className="text-xs text-white/40 mb-3">Vista previa</p>
        <table className="w-full min-w-[700px] text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {['LINK MAL', 'TÍTULO', 'ESTADO', 'PARTIC.', 'TEMPORADA', 'HORARIO', 'Nº EP.', 'NOTA MAL'].map((h) => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="table-cell text-blue-400 truncate max-w-[120px]">
                {form.link_mal ? <span title={form.link_mal}>🔗</span> : '—'}
              </td>
              <td className="table-cell font-medium text-white">{form.titulo || '—'}</td>
              <td className="table-cell">
                <span className={`badge-${(form.estado || 'desc').toLowerCase()}`}>{form.estado}</span>
              </td>
              <td className="table-cell text-anime-accent">{form.participantes}</td>
              <td className="table-cell text-white/60">{form.temporada || '—'}</td>
              <td className="table-cell text-white/60">{form.horario || '—'}</td>
              <td className="table-cell font-mono text-white/70">{form.numero_episodios || '—'}</td>
              <td className="table-cell text-white/60">{form.nota_mal || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Result feedback */}
      {result && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
          result.ok
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {result.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {result.message}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? 'Guardando...' : 'GUARDAR'}
      </button>
    </div>
  )
}
