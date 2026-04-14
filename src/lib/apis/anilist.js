const ENDPOINT = 'https://graphql.anilist.co'

const SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      idMal
      title { romaji english }
      status
      episodes
      coverImage { large }
      startDate { year month day }
      season
      seasonYear
      averageScore
      nextAiringEpisode { episode airingAt }
      siteUrl
    }
  }
}
`

const SEASON_MAP = {
  WINTER: 'Invierno',
  SPRING: 'Primavera',
  SUMMER: 'Verano',
  FALL: 'Otoño',
}

function mapStatus(status) {
  if (status === 'RELEASING') return 'Going'
  if (status === 'FINISHED') return 'Finish'
  if (status === 'NOT_YET_RELEASED') return 'Waiting'
  return 'Desc'
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function horarioFromAiringAt(airingAt) {
  if (!airingAt) return null
  const date = new Date(airingAt * 1000)
  const madridTime = date.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  // Capitalize first letter
  return madridTime.charAt(0).toUpperCase() + madridTime.slice(1)
}

export function normalizeAniList(anime) {
  const season = anime.season
    ? `${SEASON_MAP[anime.season] ?? anime.season} de ${anime.seasonYear}`
    : null
  const fecha = anime.startDate?.year
    ? new Date(
        anime.startDate.year,
        (anime.startDate.month ?? 1) - 1,
        anime.startDate.day ?? 1
      ).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return {
    titulo: anime.title.english ?? anime.title.romaji,
    link_mal: anime.idMal ? `https://myanimelist.net/anime/${anime.idMal}` : null,
    imagen_url: anime.coverImage?.large ?? null,
    estado: mapStatus(anime.status),
    numero_episodios: anime.episodes ?? null,
    temporada: season,
    fecha,
    horario: horarioFromAiringAt(anime.nextAiringEpisode?.airingAt),
    nota_mal: anime.averageScore ? (anime.averageScore / 10).toFixed(2) : null,
    mal_id: anime.idMal,
    anilist_id: anime.id,
    nextAiring: anime.nextAiringEpisode ?? null, // { episode, airingAt }
    source: 'AniList',
  }
}

const CURRENT_EPISODES_QUERY = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    media(idMal_in: $ids, type: ANIME) {
      idMal
      status
      episodes
      nextAiringEpisode { episode airingAt }
    }
  }
}
`

// Returns Map<malId, { capActual, airingAt }>
export async function getCurrentEpisodesByMalIds(malIds) {
  const map = new Map()
  if (!malIds.length) return map
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: CURRENT_EPISODES_QUERY, variables: { ids: malIds } }),
    })
    if (!res.ok) return map
    const json = await res.json()
    for (const media of json.data?.Page?.media ?? []) {
      if (!media.idMal) continue
      let ep = null
      if (media.nextAiringEpisode?.episode) {
        ep = media.nextAiringEpisode.episode - 1
      } else if (media.status === 'FINISHED' && media.episodes) {
        ep = media.episodes
      }
      map.set(media.idMal, {
        capActual: ep !== null && ep > 0 ? ep : null,
        airingAt: media.nextAiringEpisode?.airingAt ?? null,
      })
    }
  } catch {
    // fail silently
  }
  return map
}

const AIRING_SCHEDULE_QUERY = `
query ($from: Int, $to: Int, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
      episode
      airingAt
      media {
        id
        idMal
        title { romaji english }
        coverImage { large }
        status
        episodes
      }
    }
  }
}
`

export async function getAiringSchedule(fromUnix, toUnix) {
  const all = []
  let page = 1
  try {
    while (true) {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          query: AIRING_SCHEDULE_QUERY,
          variables: { from: fromUnix, to: toUnix, page },
        }),
      })
      if (!res.ok) break
      const json = await res.json()
      const pageData = json.data?.Page
      if (!pageData) break
      all.push(...(pageData.airingSchedules ?? []))
      if (!pageData.pageInfo?.hasNextPage) break
      page++
      if (page > 10) break
    }
  } catch {
    // fail silently
  }
  return all
}

export async function searchAniList(query) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: query } }),
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data?.Page?.media ?? []).map(normalizeAniList)
  } catch {
    return []
  }
}
