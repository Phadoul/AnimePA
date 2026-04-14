// AnimeSchedule API — https://animeschedule.net/api/v3
// Get your token at: https://animeschedule.net/users/settings/api
// Then add it to .env.local as: VITE_ANIMESCHEDULE_TOKEN=your_token_here

const BASE = 'https://animeschedule.net/api/v3'

function getToken() {
  return import.meta.env.VITE_ANIMESCHEDULE_TOKEN ?? null
}

export function hasAnimeScheduleToken() {
  return !!getToken()
}

export async function getWeeklySchedule() {
  const token = getToken()
  if (!token) return []

  try {
    const res = await fetch(`${BASE}/timetables`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json ?? []
  } catch {
    return []
  }
}

export async function searchAnimeSchedule(query) {
  const token = getToken()
  if (!token) return null

  try {
    const res = await fetch(
      `${BASE}/anime?title=${encodeURIComponent(query)}&per_page=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.anime ?? []
  } catch {
    return null
  }
}

// Enrich a normalized anime with AnimeSchedule schedule data
export function extractScheduleInfo(scheduleAnime) {
  if (!scheduleAnime) return {}
  return {
    horario: scheduleAnime.time ?? null,
    link_schedule: scheduleAnime.route
      ? `https://animeschedule.net/anime/${scheduleAnime.route}`
      : null,
  }
}
