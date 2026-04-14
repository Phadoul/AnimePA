import { searchJikan } from './jikan'
import { searchAniList } from './anilist'
import { searchAnimeSchedule, extractScheduleInfo, hasAnimeScheduleToken } from './animeschedule'

// Merge results from Jikan + AniList by MAL ID, preferring AniList data
function mergeResults(anilistResults, jikanResults) {
  const map = new Map()

  // AniList first (richer real-time data)
  for (const a of anilistResults) {
    const key = a.mal_id ?? `al_${a.anilist_id}`
    map.set(key, a)
  }

  // Jikan: fill in missing fields (especially horario)
  for (const j of jikanResults) {
    if (!j.mal_id) continue
    if (map.has(j.mal_id)) {
      const existing = map.get(j.mal_id)
      map.set(j.mal_id, {
        ...existing,
        horario: existing.horario ?? j.horario,
        imagen_url: existing.imagen_url ?? j.imagen_url,
        nota_mal: existing.nota_mal ?? j.nota_mal,
        numero_episodios: existing.numero_episodios ?? j.numero_episodios,
      })
    } else {
      map.set(j.mal_id, j)
    }
  }

  return Array.from(map.values())
}

export async function searchAnime(query) {
  // Query Jikan + AniList in parallel
  const [anilistRes, jikanRes] = await Promise.allSettled([
    searchAniList(query),
    searchJikan(query),
  ])

  const anilist = anilistRes.status === 'fulfilled' ? anilistRes.value : []
  const jikan = jikanRes.status === 'fulfilled' ? jikanRes.value : []

  let results = mergeResults(anilist, jikan)

  // Enrich with AnimeSchedule if token is set
  if (hasAnimeScheduleToken() && results.length > 0) {
    try {
      const schedResults = await searchAnimeSchedule(query)
      if (schedResults?.length) {
        const first = schedResults[0]
        const schedInfo = extractScheduleInfo(first)
        // Apply schedule info to first matching result
        results = results.map((r, i) =>
          i === 0 ? { ...r, ...schedInfo } : r
        )
      }
    } catch {
      // AnimeSchedule enrichment is optional, fail silently
    }
  }

  return results
}
