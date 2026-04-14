import { useState, useCallback } from 'react'
import { addAnime } from '../hooks/useAnime'
import { searchAnime } from '../lib/apis/index'
import { hasAnimeScheduleToken } from '../lib/apis/animeschedule'
import {
  CheckCircle, AlertCircle, Loader2, Search, Link, Save,
  Star, Calendar, Tv, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'

const PARTICIPANTES = ['P&A', 'Pedro', 'Asencio']

const INITIAL = {
  link_mal: '',
  link_schedule: '',
  link_ver: '',
  titulo: '',
  imagen_url: '',
  estado: 'Going',
  participantes: 'P&A',
  temporada: '',
  fecha: '',
  horario: '',
  numero_episodios: '',
  nota_mal: '',
}

function NextAiringBadge({ nextAiring }) {
  if (!nextAiring) return null
  const date = new Date(nextAiring.airingAt * 1000)
  const now = new Date()
  const diffH = Math.round((date - now) / 3600000)
  const label = diffH < 24
    ? `En ${diffH}h`
    : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <span className="text-xs bg-anime-accent/20 text-anime-accent border border-anime-accent/30 px-2 py-0.5 rounded-full">
      Ep. {nextAiring.episode} · {label}
    </span>
  )
}

export default function EntradaDatosPage() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const [selectedCover, setSelectedCover] = useState(null)

  const hasSchedule = hasAnimeScheduleToken()

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    setSearchError('')
    setSearchResults([])
    try {
      const results = await searchAnime(query)
      setSearchResults(results)
      if (results.length === 0) setSearchError('No se encontraron resultados.')
    } catch {
      setSearchError('Error al conectar con las APIs. Inténtalo de nuevo.')
    }
    setSearching(false)
  }, [query])

  const handleImport = (anime) => {
    setForm({
      link_mal: anime.link_mal ?? '',
      link_schedule: anime.link_schedule ?? '',
      link_ver: '',
      titulo: anime.titulo ?? '',
      imagen_url: anime.imagen_url ?? '',
      estado: anime.estado ?? 'Waiting',
      participantes: 'P&A',
      temporada: anime.temporada ?? '',
      fecha: anime.fecha ?? '',
      horario: anime.horario ?? '',
      numero_episodios: anime.numero_episodios?.toString() ?? '',
      nota_mal: anime.nota_mal?.toString() ?? '',
    })
    setSelectedCover(anime.imagen_url ?? null)
    setSearchResults([])
    setQuery('')
    setShowForm(true)
    setTimeout(() => document.getElementById('entry-form')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleSave = async () => {
    if (!form.titulo) {
      setResult({ ok: false, message: 'El título es obligatorio.' })
      setShowForm(true)
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
      setSelectedCover(null)
      setShowForm(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* Search */}
      <div className="bg-anime-surface border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Search size={14} />
            Buscar en APIs
            <span className="text-white/25 text-xs font-normal">
              Jikan · AniList{hasSchedule ? ' · AnimeSchedule ✓' : ''}
            </span>
          </h3>
          {!hasSchedule && (
            <a
              href="https://animeschedule.net/users/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-anime-accent flex items-center gap-1 transition-colors"
            >
              Token AnimeSchedule <ExternalLink size={11} />
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ej: One Piece, Jujutsu Kaisen..."
            className="input-field text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="btn-primary flex items-center gap-2 shrink-0 px-5 disabled:opacity-50"
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {searchError && <p className="text-white/40 text-sm">{searchError}</p>}

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {searchResults.map((anime, i) => (
              <div
                key={anime.mal_id ?? anime.anilist_id ?? i}
                className="flex items-start gap-3 bg-anime-card/40 border border-white/5 rounded-xl p-3 hover:border-anime-accent/40 transition-colors"
              >
                <div className="w-12 h-16 shrink-0 rounded overflow-hidden bg-white/10">
                  {anime.imagen_url
                    ? <img src={anime.imagen_url} alt={anime.titulo} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white/20"><Tv size={18} /></div>
                  }
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-white text-sm leading-tight">{anime.titulo}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={anime.estado} />
                    {anime.temporada && (
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Calendar size={10} /> {anime.temporada}
                      </span>
                    )}
                    {anime.numero_episodios && (
                      <span className="text-white/40 text-xs">{anime.numero_episodios} ep.</span>
                    )}
                    {anime.nota_mal && (
                      <span className="text-yellow-400 text-xs flex items-center gap-0.5">
                        <Star size={10} className="fill-yellow-400" /> {anime.nota_mal}
                      </span>
                    )}
                    {anime.nextAiring && <NextAiringBadge nextAiring={anime.nextAiring} />}
                  </div>
                  <p className="text-white/25 text-[10px]">
                    vía {anime.source}{anime.mal_id ? ` · MAL #${anime.mal_id}` : ''}
                    {anime.horario ? ` · ${anime.horario}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleImport(anime)}
                  className="btn-primary text-xs px-3 py-1.5 shrink-0 self-center"
                >
                  Importar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <div id="entry-form" className="bg-anime-surface border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <Link size={14} />
            {form.titulo ? `Editando: ${form.titulo}` : 'Añadir manualmente'}
          </span>
          {showForm ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showForm && (
          <div className="px-5 pb-5 space-y-5 border-t border-white/10 pt-5">
            {selectedCover && (
              <div className="flex items-center gap-4">
                <img src={selectedCover} alt="cover" className="w-16 h-20 object-cover rounded-lg border border-white/10" />
                <div>
                  <p className="text-white font-medium">{form.titulo || '—'}</p>
                  <p className="text-white/40 text-xs mt-0.5">{form.temporada || '—'}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider">Links</p>
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm text-white/50 shrink-0">Link Ver</label>
                <input type="url" value={form.link_ver} onChange={set('link_ver')} placeholder="https://..." className="input-field text-sm py-2" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider">Información</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm text-white/50 mb-1.5">Título</label>
                  <input type="text" value={form.titulo} onChange={set('titulo')} placeholder="Nombre del anime" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Participantes</label>
                  <select value={form.participantes} onChange={set('participantes')} className="input-field">
                    {PARTICIPANTES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Estado</label>
                  <p className="text-sm text-white/70 py-2">{form.estado || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Temporada</label>
                  <p className="text-sm text-white/70 py-2">{form.temporada || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Fecha emisión</label>
                  <p className="text-sm text-white/70 py-2">{form.fecha || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Horario</label>
                  <p className="text-sm text-white/70 py-2">{form.horario || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Nº episodios</label>
                  <p className="text-sm text-white/70 py-2">{form.numero_episodios || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Nota MAL</label>
                  <p className="text-sm text-yellow-400/80 py-2 flex items-center gap-1">
                    {form.nota_mal ? <><Star size={12} className="fill-yellow-400/80" /> {form.nota_mal}</> : '—'}
                  </p>
                </div>
              </div>
            </div>

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

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Guardando...' : 'GUARDAR'}
            </button>
          </div>
        )}
      </div>

      {result?.ok && !showForm && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm">
          <CheckCircle size={16} />
          {result.message}
        </div>
      )}
    </div>
  )
}

