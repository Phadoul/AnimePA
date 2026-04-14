import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Anime list with user progress joined ────────────────────────────────────
export function useAnimeList(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('anime')
      .select(`
        *,
        progress:user_progress(*)
      `)
      .order('referencia', { ascending: false })

    if (filters.estado) query = query.eq('estado', filters.estado)
    if (filters.temporada) query = query.eq('temporada', filters.temporada)
    if (filters.participantes) query = query.eq('participantes', filters.participantes)

    const { data: rows, error: err } = await query
    if (err) setError(err.message)
    else setData(rows ?? [])
    setLoading(false)
  }, [filters.estado, filters.temporada, filters.participantes])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Update episode progress for a user ──────────────────────────────────────
export async function updateProgress(animeId, userId, newEpisode) {
  const { error } = await supabase
    .from('user_progress')
    .upsert(
      { anime_id: animeId, user_id: userId, episodios_vistos: newEpisode, updated_at: new Date().toISOString() },
      { onConflict: 'anime_id,user_id' }
    )
  return { error }
}

// ─── Add new anime entry ──────────────────────────────────────────────────────
export async function addAnime(animeData) {
  const { data, error } = await supabase
    .from('anime')
    .insert([animeData])
    .select()
    .single()
  return { data, error }
}

// ─── Get distinct seasons for filter ─────────────────────────────────────────
export function useSeasons() {
  const [seasons, setSeasons] = useState([])

  useEffect(() => {
    supabase
      .from('anime')
      .select('temporada')
      .order('temporada', { ascending: false })
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((r) => r.temporada).filter(Boolean))]
        setSeasons(unique)
      })
  }, [])

  return seasons
}
