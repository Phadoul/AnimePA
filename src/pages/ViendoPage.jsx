import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAnimeList, useSeasons, updateProgress } from '../hooks/useAnime'
import StatusBadge, { STATUS_CONFIG } from '../components/ui/StatusBadge'
import EpisodeCounter from '../components/ui/EpisodeCounter'
import { ExternalLink, RefreshCw, Filter } from 'lucide-react'

const PARTICIPANTS = ['Todos', 'P&A', 'Pedro', 'Asencio']
const ESTADOS = ['Todos', 'Going', 'Finish', 'Waiting', 'Desc']
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function ViendoPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ estado: 'Going', temporada: '', participantes: '' })
  const seasons = useSeasons()

  const queryFilters = useMemo(() => ({
    estado: filters.estado === 'Todos' ? '' : filters.estado,
    temporada: filters.temporada === 'Todos' ? '' : filters.temporada,
    participantes: filters.participantes === 'Todos' ? '' : filters.participantes,
  }), [filters])

  const { data, loading, error, refetch } = useAnimeList(queryFilters)

  const handleProgressUpdate = async (animeId, newVal) => {
    await updateProgress(animeId, user.id, newVal)
    refetch()
  }

  const getUserProgress = (anime) => {
    const p = anime.progress?.find((p) => p.user_id === user?.id)
    return p?.episodios_vistos ?? 0
  }

  return (
    <div className="space-y-4">
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
                  <th className="table-header text-left">Nombre</th>
                  <th className="table-header w-20">Estado</th>
                  <th className="table-header w-24">Temporada</th>
                  <th className="table-header w-20">Horario</th>
                  <th className="table-header w-16">Cap. total</th>
                  <th className="table-header w-36">Mis episodios</th>
                  <th className="table-header w-16">Al día</th>
                  <th className="table-header w-14">Ver</th>
                </tr>
              </thead>
              <tbody>
                {data.map((anime) => {
                  const myEps = getUserProgress(anime)
                  const total = anime.numero_episodios
                  const isUpToDate = total && total !== '∞'
                    ? myEps >= Number(total)
                    : false

                  return (
                    <tr
                      key={anime.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="table-cell text-white/40 text-xs">{anime.referencia}</td>
                      <td className="table-cell">
                        <span className="text-xs text-anime-accent font-medium">{anime.participantes}</span>
                      </td>
                      <td className="table-cell text-left">
                        <div className="flex items-center gap-2">
                          {anime.link_mal ? (
                            <a
                              href={anime.link_mal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                            >
                              {anime.titulo}
                            </a>
                          ) : (
                            <span className="font-medium">{anime.titulo}</span>
                          )}
                          {/* emission days */}
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
                        <StatusBadge status={anime.estado} />
                      </td>
                      <td className="table-cell text-white/60 text-xs">{anime.temporada ?? '—'}</td>
                      <td className="table-cell text-white/60 text-xs">{anime.horario ?? '—'}</td>
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
                        {isUpToDate ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="table-cell">
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
                          <span className="text-white/20">—</span>
                        )}
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
