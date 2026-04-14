const BASE = 'https://api.jikan.moe/v4'

const SEASON_MAP = {
  winter: 'Invierno',
  spring: 'Primavera',
  summer: 'Verano',
  fall: 'Otoño',
}

function mapStatus(status) {
  if (!status) return 'Waiting'
  if (status.includes('Airing')) return 'Going'
  if (status.includes('Finished')) return 'Finish'
  if (status.includes('Not yet')) return 'Waiting'
  return 'Desc'
}

export function normalizeJikan(anime) {
  const season = anime.season
    ? `${SEASON_MAP[anime.season.toLowerCase()] ?? anime.season} de ${anime.year}`
    : null
  const fecha = anime.aired?.from
    ? new Date(anime.aired.from).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return {
    titulo: anime.title_english ?? anime.title,
    link_mal: anime.url,
    imagen_url: anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url ?? null,
    estado: mapStatus(anime.status),
    numero_episodios: anime.episodes ?? null,
    temporada: season,
    fecha,
    horario: anime.broadcast?.time ? `${anime.broadcast.time} (JST)` : null,
    nota_mal: anime.score ?? null,
    mal_id: anime.mal_id,
    source: 'Jikan',
  }
}

export async function searchJikan(query) {
  try {
    const res = await fetch(
      `${BASE}/anime?q=${encodeURIComponent(query)}&limit=8&order_by=popularity&sfw=true`
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []).map(normalizeJikan)
  } catch {
    return []
  }
}

export async function getJikanById(malId) {
  try {
    const res = await fetch(`${BASE}/anime/${malId}`)
    if (!res.ok) return null
    const json = await res.json()
    return json.data ? normalizeJikan(json.data) : null
  } catch {
    return null
  }
}
