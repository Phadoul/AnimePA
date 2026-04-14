import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Anime list (global, shared by all users) ────────────────────────────────
export function useAnimeList(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('anime')
      .select('*')
      .order('referencia', { ascending: false })

    if (filters.estado) query = query.eq('estado', filters.estado)
    if (filters.temporada) query = query.eq('temporada', filters.temporada)
    if (filters.participantes) {
      const allowed =
        filters.participantes === 'Pedro'   ? ['Pedro', 'P&A'] :
        filters.participantes === 'Asencio' ? ['Asencio', 'P&A'] :
        [filters.participantes]
      query = query.in('participantes', allowed)
    }

    const { data: rows, error: err } = await query
    if (err) setError(err.message)
    else setData(rows ?? [])
    setLoading(false)
  }, [filters.estado, filters.temporada, filters.participantes])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── Update global episode progress ──────────────────────────────────────────
export async function updateProgress(animeId, _userId, newEpisode) {
  const { error } = await supabase
    .from('anime')
    .update({ mis_episodios: newEpisode })
    .eq('id', animeId)
  return { error }
}

// ─── Update anime fields ──────────────────────────────────────────────────────
export async function updateAnime(animeId, fields) {
  const { error } = await supabase
    .from('anime')
    .update(fields)
    .eq('id', animeId)
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
