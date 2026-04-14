import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Tv, Calendar } from 'lucide-react'
import { useAnimeList } from '../hooks/useAnime'
import { getAiringSchedule } from '../lib/apis/anilist'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAYS_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function extractMalId(linkMal) {
  if (!linkMal) return null
  const m = linkMal.match(/myanimelist\.net\/anime\/(\d+)/)
  return m ? parseInt(m[1]) : null
}

// Returns { from, to (Unix seconds), monday (Date UTC midnight) }
function getWeekBounds(weekOffset) {
  const now = new Date()
  const dow = now.getUTCDay() // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const mondayMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + diffToMon + weekOffset * 7,
  )
  // Extend ±2h to cover Madrid timezone boundaries
  return {
    from: Math.floor(mondayMs / 1000) - 7200,
    to: Math.floor(mondayMs / 1000) + 7 * 86400 + 7200,
    monday: new Date(mondayMs),
  }
}

// 0=Mon, 6=Sun in Madrid timezone
function getMadridDayIdx(airingAtUnix) {
  const d = new Date(
    new Date(airingAtUnix * 1000).toLocaleString('en-US', { timeZone: 'Europe/Madrid' }),
  )
  const jsDay = d.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function getMadridTime(airingAtUnix) {
  return new Date(airingAtUnix * 1000).toLocaleTimeString('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Returns a comparable local-time Date representing the Madrid date of a Unix ts
function toMadridDate(airingAtUnix) {
  return new Date(
    new Date(airingAtUnix * 1000).toLocaleString('en-US', { timeZone: 'Europe/Madrid' }),
  )
}

export default function HorarioPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [rawSchedule, setRawSchedule] = useState([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  const { data: allAnime, loading: loadingDB } = useAnimeList({ estado: 'Going' })

  const dbByMalId = useMemo(() => {
    const map = new Map()
    for (const a of allAnime) {
      const malId = extractMalId(a.link_mal)
      if (malId) map.set(malId, a)
    }
    return map
  }, [allAnime])

  const { from, to, monday } = useMemo(() => getWeekBounds(weekOffset), [weekOffset])

  useEffect(() => {
    let cancelled = false
    setLoadingSchedule(true)
    setRawSchedule([])
    getAiringSchedule(from, to).then((data) => {
      if (!cancelled) {
        setRawSchedule(data)
        setLoadingSchedule(false)
      }
    })
    return () => { cancelled = true }
  }, [from, to])

  // Group by Madrid day, filtered to only our DB anime and within this week
  const byDay = useMemo(() => {
    const days = Array.from({ length: 7 }, () => [])

    // Monday 00:00 Madrid (represented as local Date)
    const mondayMadrid = toMadridDate(from + 7200) // from+2h = Monday 00:00 Madrid approx
    mondayMadrid.setHours(0, 0, 0, 0)
    const sundayMadrid = new Date(mondayMadrid.getTime() + 7 * 86400 * 1000)

    for (const entry of rawSchedule) {
      const malId = entry.media?.idMal
      if (!malId || !dbByMalId.has(malId)) continue

      const entryMadrid = toMadridDate(entry.airingAt)
      if (entryMadrid < mondayMadrid || entryMadrid >= sundayMadrid) continue

      const dayIdx = getMadridDayIdx(entry.airingAt)
      days[dayIdx].push({ ...entry, dbAnime: dbByMalId.get(malId) })
    }

    for (const day of days) day.sort((a, b) => a.airingAt - b.airingAt)
    return days
  }, [rawSchedule, dbByMalId, from])

  const todayDayIdx = useMemo(() => {
    if (weekOffset !== 0) return -1
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
    const jsDay = d.getDay()
    return jsDay === 0 ? 6 : jsDay - 1
  }, [weekOffset])

  const formatWeekRange = () => {
    const end = new Date(monday.getTime() + 6 * 86400 * 1000)
    const opts = { day: 'numeric', month: 'short', timeZone: 'UTC' }
    return `${monday.toLocaleDateString('es-ES', opts)} – ${end.toLocaleDateString('es-ES', opts)} ${monday.getUTCFullYear()}`
  }

  const getDayDate = (dayIdx) => {
    const d = new Date(monday.getTime() + dayIdx * 86400 * 1000)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  }

  const totalThisWeek = byDay.reduce((s, d) => s + d.length, 0)
  const loading = loadingDB || loadingSchedule

  return (
    <div className="space-y-3 max-w-6xl mx-auto">
      {/* Week navigation */}
      <div className="flex items-center justify-between bg-anime-surface border border-white/10 rounded-lg px-3 py-2">
        <button
          onClick={() => setWeekOffset((o) => Math.max(o - 1, -4))}
          disabled={weekOffset <= -4}
          className="btn-ghost p-1 disabled:opacity-25"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <Calendar size={12} className="text-white/40" />
          <span className="text-white font-medium">{formatWeekRange()}</span>
          {weekOffset === 0 && (
            <span className="text-[10px] bg-anime-accent/20 text-anime-accent border border-anime-accent/30 px-1.5 py-0.5 rounded-full font-medium">
              Esta semana
            </span>
          )}
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[10px] text-white/30 hover:text-anime-accent transition-colors"
            >
              Hoy
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset((o) => Math.min(o + 1, 4))}
          disabled={weekOffset >= 4}
          className="btn-ghost p-1 disabled:opacity-25"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={22} className="animate-spin text-white/30" />
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-cols-7 gap-1.5" style={{ minWidth: '700px' }}>
              {DAYS.map((day, idx) => {
                const isToday = idx === todayDayIdx
                return (
                  <div key={day} className="flex flex-col gap-1.5">
                    {/* Day header */}
                    <div
                      className={`rounded-md px-1 py-1.5 text-center border ${
                        isToday
                          ? 'bg-anime-accent/15 border-anime-accent/40'
                          : 'bg-anime-surface border-white/10'
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isToday ? 'text-anime-accent' : 'text-white/50'
                        }`}
                      >
                        {DAYS_SHORT[idx]}
                      </p>
                      <p className="text-white/30 text-[9px] mt-0.5">{getDayDate(idx)}</p>
                      {byDay[idx].length > 0 && (
                        <p className="text-white/20 text-[8px] mt-0.5">
                          {byDay[idx].length} ep.
                        </p>
                      )}
                    </div>

                    {/* Cards */}
                    {byDay[idx].length === 0 ? (
                      <div className="flex items-center justify-center py-4 text-white/10 text-sm">—</div>
                    ) : (
                      byDay[idx].map((entry, i) => (
                        <AnimeCard key={`${entry.media.id}-${entry.episode}-${i}`} entry={entry} />
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {totalThisWeek === 0 && (
            <div className="text-center text-white/30 text-sm py-10">
              No hay episodios de tus animes en emisión esta semana.
            </div>
          )}

          <p className="text-white/20 text-xs text-right">
            Horarios en <span className="text-white/30">Europe/Madrid</span> · Fuente: AniList
          </p>
        </>
      )}
    </div>
  )
}

function AnimeCard({ entry }) {
  const { dbAnime, episode, airingAt, media } = entry
  const cover = dbAnime?.imagen_url || media?.coverImage?.large
  const title = dbAnime?.titulo || media?.title?.english || media?.title?.romaji
  const time = getMadridTime(airingAt)
  const link = dbAnime?.link_ver

  const inner = (
    <div
      className={`relative rounded-lg overflow-hidden border border-white/10 bg-anime-card/40 transition-all group ${
        link ? 'hover:border-anime-accent/50 cursor-pointer' : ''
      }`}
    >
      {/* Cover */}
      <div className="w-full aspect-[3/4] bg-anime-surface relative overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/15">
            <Tv size={16} />
          </div>
        )}
        {/* Episode badge */}
        <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1 py-0.5 rounded leading-tight">
          {episode}
        </div>
        {/* Time badge */}
        <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white/80 text-[9px] px-1 py-0.5 rounded leading-tight">
          {time}
        </div>
      </div>
      {/* Title */}
      <div className="px-1 py-1">
        <p className="text-white text-[9px] font-medium leading-tight line-clamp-2">{title}</p>
      </div>
    </div>
  )

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    )
  }
  return inner
}
