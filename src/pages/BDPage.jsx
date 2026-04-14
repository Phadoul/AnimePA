import { useState, useMemo } from 'react'
import { useAnimeList, useSeasons } from '../hooks/useAnime'
import StatusBadge from '../components/ui/StatusBadge'
import { ExternalLink, RefreshCw, Search } from 'lucide-react'

const ESTADOS = ['Todos', 'Going', 'Finish', 'Waiting', 'Desc']

export default function BDPage() {
  const [filters, setFilters] = useState({ estado: '', temporada: '', participantes: '' })
  const [search, setSearch] = useState('')
  const seasons = useSeasons()

  const { data, loading, error, refetch } = useAnimeList(filters)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((a) => a.titulo?.toLowerCase().includes(q))
  }, [data, search])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center bg-anime-surface border border-white/10 rounded-xl px-4 py-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-8 text-sm py-1.5"
          />
        </div>
        <select
          value={filters.estado}
          onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value === 'Todos' ? '' : e.target.value }))}
          className="input-field w-auto text-sm py-1.5"
        >
          {ESTADOS.map((e) => <option key={e} value={e === 'Todos' ? '' : e}>{e}</option>)}
        </select>
        <select
          value={filters.temporada}
          onChange={(e) => setFilters((f) => ({ ...f, temporada: e.target.value }))}
          className="input-field w-auto text-sm py-1.5"
        >
          <option value="">Todas las temporadas</option>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={refetch} className="btn-ghost flex items-center gap-1.5 text-sm">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-anime-surface border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-white/30">Cargando...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-anime-card/50">
                  <th className="table-header w-10">Ref</th>
                  <th className="table-header text-left min-w-[180px]">Título</th>
                  <th className="table-header w-24">Agregado</th>
                  <th className="table-header w-20">Estado</th>
                  <th className="table-header w-20">Partic.</th>
                  <th className="table-header w-28">Temporada</th>
                  <th className="table-header w-28">Fecha</th>
                  <th className="table-header w-20">Horario</th>
                  <th className="table-header w-14">Ep.</th>
                  <th className="table-header w-14">Actual</th>
                  <th className="table-header w-36">Links</th>
                  <th className="table-header w-20">Nota MAL</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((anime) => (
                  <tr key={anime.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                    <td className="table-cell text-white/30">{anime.referencia}</td>
                    <td className="table-cell text-left">
                      <span className="font-medium text-white">{anime.titulo}</span>
                    </td>
                    <td className="table-cell text-white/40">
                      {anime.agregado ? new Date(anime.agregado).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={anime.estado} />
                    </td>
                    <td className="table-cell text-anime-accent font-medium">{anime.participantes ?? '—'}</td>
                    <td className="table-cell text-white/60">{anime.temporada ?? '—'}</td>
                    <td className="table-cell text-white/60">{anime.fecha ?? '—'}</td>
                    <td className="table-cell text-white/60">{anime.horario ?? '—'}</td>
                    <td className="table-cell font-mono text-white/70">{anime.numero_episodios ?? '—'}</td>
                    <td className="table-cell font-mono text-white/70">{anime.episodio_actual ?? '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-2">
                        {anime.link_mal && (
                          <a href={anime.link_mal} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-[10px] font-medium">MAL</a>
                        )}
                        {anime.link_schedule && (
                          <a href={anime.link_schedule} target="_blank" rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-[10px] font-medium">SCH</a>
                        )}
                        {anime.link_ver && (
                          <a href={anime.link_ver} target="_blank" rel="noopener noreferrer"
                            className="text-anime-accent hover:text-red-400 text-[10px] font-medium">VER</a>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-white/60">{anime.nota_mal ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-right text-white/20 text-xs">{filtered.length} entradas</p>
    </div>
  )
}
