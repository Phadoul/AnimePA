import { useState, useMemo, useRef, useEffect } from 'react'
import { useAnimeList, useSeasons, updateProgress, updateAnime } from '../hooks/useAnime'
import StatusBadge from '../components/ui/StatusBadge'
import EpisodeCounter from '../components/ui/EpisodeCounter'
import { getCurrentEpisodesByMalIds } from '../lib/apis/anilist'
import { getJikanById, searchJikan } from '../lib/apis/jikan'
import { ExternalLink, RefreshCw, Filter } from 'lucide-react'

const PARTICIPANT_COLOR = {
  'P&A': 'text-anime-accent',
  'Pedro': 'text-purple-300',
  'Asencio': 'text-green-300',
}
const PARTICIPANTS = ['Todos', 'P&A', 'Pedro', 'Asencio']
const PARTICIPANTS_EDIT = ['P&A', 'Pedro', 'Asencio']
const ESTADOS = ['Todos', 'Going', 'Finish', 'Waiting', 'Desc']
const ESTADOS_EDIT = ['Going', 'Finish', 'Waiting', 'Desc']

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function InlineText({ value, linkUrl, malId, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)
  const committed = useRef(false)

  const start = (e) => { e.preventDefault(); e.stopPropagation(); committed.current = false; setDraft(value); setEditing(true); setTimeout(() => inputRef.current?.select(), 0) }
  const commit = async () => {
    if (committed.current) return
    committed.current = true
    setEditing(false)
    const trimmed = draft.trim()
    if (!trimmed) {
      console.log('[InlineText] draft vacío → buscando título en API, malId:', malId, 'value:', value)
      try {
        if (malId) {
          const data = await getJikanById(malId)
          console.log('[InlineText] Jikan resultado:', data)
          if (data?.titulo) { onSave(data.titulo); return }
        }
        if (value) {
          const results = await searchJikan(value)
          console.log('[InlineText] searchJikan resultado:', results)
          if (results?.[0]?.titulo) onSave(results[0].titulo)
        }
      } catch (err) {
        console.error('[InlineText] Error al obtener título:', err)
      }
    } else if (trimmed !== value) {
      onSave(trimmed)
    }
  }
  const cancel = () => { committed.current = true; setEditing(false); setDraft(value) }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
        className="bg-anime-card border border-anime-accent/50 text-white rounded px-2 py-0.5 text-xs w-full focus:outline-none"
        style={{ minWidth: '180px' }}
      />
    )
  }
  return (
    <span className="flex items-center gap-1 group">
      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
        >
          {value}
        </a>
      ) : (
        <span className="font-medium text-white">{value}</span>
      )}
      <button
        onClick={start}
        title="Editar nombre"
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-white/50 hover:text-anime-accent transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </span>
  )
}

function InlineSelect({ value, options, onSave, render }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <select
        autoFocus
        value={value}
        onChange={(e) => { onSave(e.target.value); setEditing(false) }}
        onBlur={() => setEditing(false)}
        className="bg-anime-card border border-anime-accent/50 text-white rounded px-1 py-0.5 text-xs focus:outline-none cursor-pointer"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <span
      onClick={() => setEditing(true)}
      title="Haz clic para editar"
      className="cursor-pointer"
    >
      {render ? render(value) : value}
    </span>
  )
}

function ProgressBar({ seen, total, capActual }) {
  const knownTotal = total && Number(total) > 0
  const hasData = knownTotal || capActual

  // No data at all → grey neutral bar
  if (!hasData) {
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-white/15" style={{ width: `${Math.max((seen / 10) * 100, seen > 0 ? 5 : 0)}%` }} />
        </div>
        <span className="text-[10px] text-white/20">{seen > 0 ? seen : '—'}</span>
      </div>
    )
  }

  const pct = knownTotal
    ? Math.min((seen / Number(total)) * 100, 100)
    : Math.min((seen / capActual) * 100, 100)

  const atLatestAired = capActual !== null && seen >= capActual
  const atFullEnd = knownTotal && seen >= Number(total)

  // Green: reached total (series done), Blue: caught up to latest aired, Yellow: behind
  const color = atFullEnd ? 'bg-green-500' : atLatestAired ? 'bg-anime-blue' : 'bg-yellow-400'

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.max(pct, seen > 0 ? 3 : 0)}%` }}
        />
      </div>
      <span className="text-[10px] text-white/30">
        {knownTotal ? `${Math.round(pct)}%` : `${seen}/${capActual}`}
      </span>
    </div>
  )
}

export default function ViendoPage() {
  const [filters, setFilters] = useState({ estado: 'Going', temporada: '', participantes: '' })
  const seasons = useSeasons()

  const queryFilters = useMemo(() => ({
    estado: filters.estado === 'Todos' ? '' : filters.estado,
    temporada: filters.temporada === 'Todos' ? '' : filters.temporada,
    participantes: filters.participantes === 'Todos' ? '' : filters.participantes,
  }), [filters])

  const { data, loading, error, refetch } = useAnimeList(queryFilters)

  const [currentEps, setCurrentEps] = useState(new Map())

  useEffect(() => {
    if (!data.length) return
    const malIds = data
      .map((a) => { const m = a.link_mal?.match(/\/anime\/(\d+)/); return m ? parseInt(m[1]) : null })
      .filter(Boolean)
    if (!malIds.length) return
    getCurrentEpisodesByMalIds(malIds).then(setCurrentEps)
  }, [data])

  // Sort by next airing time: soonest first, no-date at the end
  const sortedData = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return [...data].sort((a, b) => {
      const malA = a.link_mal?.match(/\/anime\/(\d+)/)?.[1]
      const malB = b.link_mal?.match(/\/anime\/(\d+)/)?.[1]
      const atA = malA ? (currentEps.get(parseInt(malA))?.airingAt ?? null) : null
      const atB = malB ? (currentEps.get(parseInt(malB))?.airingAt ?? null) : null
      // Future airing: sort ascending
      const futureA = atA && atA > now ? atA : null
      const futureB = atB && atB > now ? atB : null
      if (futureA && futureB) return futureA - futureB
      if (futureA) return -1
      if (futureB) return 1
      return 0
    })
  }, [data, currentEps])

  const handleProgressUpdate = async (animeId, newVal) => {
    await updateProgress(animeId, null, newVal)
    refetch()
  }

  const handleFieldUpdate = async (animeId, field, value) => {
    await updateAnime(animeId, { [field]: value })
    refetch()
  }

  const getUserProgress = (anime) => anime.mis_episodios ?? 0

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-anime-surface border border-white/10 rounded-xl px-4 py-3">
        <Filter size={15} className="text-white/40" />

        <select
          value={filters.estado}
          onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
          className="input-field w-auto text-sm py-1.5"
        >
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select
          value={filters.temporada}
          onChange={(e) => setFilters((f) => ({ ...f, temporada: e.target.value }))}
          className="input-field w-auto text-sm py-1.5"
        >
          <option value="">Todas las temporadas</option>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.participantes}
          onChange={(e) => setFilters((f) => ({ ...f, participantes: e.target.value }))}
          className="input-field w-auto text-sm py-1.5"
        >
          {PARTICIPANTS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <button onClick={refetch} className="btn-ghost ml-auto flex items-center gap-1.5 text-sm">
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Table */}
      <div className="bg-anime-surface border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-white/30">Cargando...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-white/30">Sin resultados con estos filtros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="table-header w-12">Ref</th>
                  <th className="table-header w-20">Partic.</th>
                  <th className="table-header w-10"></th>
                  <th className="table-header text-left">Nombre</th>
                  <th className="table-header w-20">Estado</th>
                  <th className="table-header w-24">Temporada</th>
                  <th className="table-header w-28">Horario</th>
                  <th className="table-header w-16">Cap. actual</th>
                  <th className="table-header w-16">Cap. total</th>
                  <th className="table-header w-36">Mis episodios</th>
                  <th className="table-header w-28">Al día</th>
                  <th className="table-header w-14">Ver</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((anime) => {
                  const myEps = getUserProgress(anime)
                  const total = anime.numero_episodios
                  const malId = anime.link_mal?.match(/\/anime\/(\d+)/)?.[1]
                  const capActual = malId ? (currentEps.get(parseInt(malId))?.capActual ?? null) : null

                  return (
                    <tr
                      key={anime.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="table-cell text-white/40 text-xs">{anime.referencia}</td>
                      <td className="table-cell">
                        <InlineSelect
                          value={anime.participantes}
                          options={PARTICIPANTS_EDIT}
                          onSave={(v) => handleFieldUpdate(anime.id, 'participantes', v)}
                          render={(v) => <span className={`text-xs font-medium ${PARTICIPANT_COLOR[v] ?? 'text-white'}`}>{v}</span>}
                        />
                      </td>
                      <td className="table-cell p-1">
                        {anime.imagen_url
                          ? <img src={anime.imagen_url} alt="" className="w-7 h-10 object-cover rounded opacity-80" loading="lazy" />
                          : <div className="w-7 h-10 rounded bg-white/5" />}
                      </td>
                      <td className="table-cell text-left">
                        <div className="flex items-center gap-2">
                          <InlineText
                            value={anime.titulo}
                            linkUrl={anime.link_mal || null}
                            malId={anime.link_mal ? (anime.link_mal.match(/\/anime\/(\d+)/)?.[1] ? parseInt(anime.link_mal.match(/\/anime\/(\d+)/)[1]) : null) : null}
                            onSave={(v) => handleFieldUpdate(anime.id, 'titulo', v)}
                          />
                          {anime.horario_dias && (
                            <div className="flex gap-0.5">
                              {DAYS.map((d) => (
                                <span
                                  key={d}
                                  className={`text-[10px] w-4 h-4 flex items-center justify-center rounded ${
                                    anime.horario_dias.includes(d)
                                      ? 'bg-anime-accent text-white'
                                      : 'bg-white/5 text-white/20'
                                  }`}
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <InlineSelect
                          value={anime.estado}
                          options={ESTADOS_EDIT}
                          onSave={(v) => handleFieldUpdate(anime.id, 'estado', v)}
                          render={(v) => <StatusBadge status={v} />}
                        />
                      </td>
                      <td className="table-cell text-white/60 text-xs">{anime.temporada ?? '—'}</td>
                      <td className="table-cell text-white/50 text-[10px] leading-tight">{anime.horario ? anime.horario.replace(/\s*\(Madrid\)/i, '') : '—'}</td>
                      <td className="table-cell text-white/70 font-mono text-sm">
                        {capActual ?? '—'}
                      </td>
                      <td className="table-cell text-white/70 font-mono text-sm">
                        {anime.numero_episodios ?? '∞'}
                      </td>
                      <td className="table-cell">
                        <EpisodeCounter
                          value={myEps}
                          total={anime.numero_episodios}
                          onUpdate={(val) => handleProgressUpdate(anime.id, val)}
                        />
                      </td>
                      <td className="table-cell">
                        <ProgressBar seen={myEps} total={total} capActual={capActual} />
                      </td>
                      <td className="table-cell">
                        <div className="flex justify-center">
                        {anime.link_ver ? (
                          <a
                            href={anime.link_ver}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-anime-accent hover:text-red-400 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <a
                            href={`https://nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(anime.titulo)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/20 hover:text-white/50 transition-colors"
                            title={`Buscar "${anime.titulo}" en Nyaa`}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-right text-white/20 text-xs">{data.length} series</p>
    </div>
  )
}
