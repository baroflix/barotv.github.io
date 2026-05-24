import { useEffect, useRef, useState } from 'react'
import type { MediaDetails, MediaItem, MediaKind, CollectionDetails } from './types'
import {
  fetchRecommendations,
  fetchTitleDetails,
  fetchTrendingTitles,
  fetchTopRatedMovies,
  fetchTopRatedTv,
  fetchClassics,
  fetchCollection,
  hasTmdbCredentials,
  mediaTypeFromItem,
  searchTitles,
} from './lib/tmdb'
import { fetchTrendingAnime, searchAnime as searchAnilist, fetchAnimeDetails } from './lib/anilist'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ThemeId = 'scarlet' | 'emerald' | 'aurora' | 'oxide' | 'pearl' | 'fuchsia' | 'amethyst'

export type LanguageId = 'en' | 'pl'

export type ThemeSettings = {
  theme: ThemeId
  language: LanguageId
}

export type WatchHistoryEntry = {
  mediaType: MediaKind
  id: number
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  season?: number
  episode?: number
  watchedAt: number
}

export type WatchlistEntry = {
  mediaType: MediaKind
  id: number
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  addedAt: number
}

export type ReminderEntry = {
  mediaType: MediaKind
  id: number
  title: string
  posterPath?: string | null
  releaseDate?: string
  addedAt: number
}

export type HomeState = {
  featured: MediaItem | null
  gallery: MediaItem[]
  recommendations: MediaItem[]
  searchResults: MediaItem[]
  loading: boolean
  error: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  settings: 'nextflix.settings',
  history: 'nextflix.history',
  catalog: 'nextflix.home_catalog',
  progress: 'nextflix.progress',
  watchlist: 'nextflix.watchlist',
  reminders: 'nextflix.reminders',
} as const

export const THEME_PRESETS: Record<ThemeId, { label: string; accent: string; glow: string; surface: string }> = {
  scarlet:  { label: 'Scarlet',  accent: '#ff3d3d', glow: 'rgba(255,61,61,0.30)',   surface: 'rgba(28,16,18,0.9)' },
  emerald:  { label: 'Emerald',  accent: '#10b981', glow: 'rgba(16,185,129,0.30)',  surface: 'rgba(6,30,22,0.9)'  },
  aurora:   { label: 'Aurora',   accent: '#22d3ee', glow: 'rgba(34,211,238,0.28)',  surface: 'rgba(7,25,33,0.9)'  },
  oxide:    { label: 'Oxide',    accent: '#f59e0b', glow: 'rgba(245,158,11,0.28)',  surface: 'rgba(35,20,6,0.9)'  },
  pearl:    { label: 'Pearl',    accent: '#ffffff', glow: 'rgba(255,255,255,0.30)', surface: 'rgba(20,20,20,0.9)'  },
  fuchsia:  { label: 'Fuchsia',  accent: '#ec4899', glow: 'rgba(236,72,153,0.30)',  surface: 'rgba(36,10,24,0.9)'  },
  amethyst: { label: 'Amethyst', accent: '#a855f7', glow: 'rgba(168,85,247,0.30)',  surface: 'rgba(24,10,36,0.9)'  },
}

export const defaultSettings: ThemeSettings = {
  theme: 'scarlet',
  language: 'en',
}

const defaultHomeState: HomeState = {
  featured: null,
  gallery: [],
  recommendations: [],
  searchResults: [],
  loading: true,
  error: null,
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as any
        // Migrate old users off the removed midnight theme
        if (key === STORAGE_KEYS.settings && parsed) {
          if (parsed.theme === 'midnight') {
            parsed.theme = 'scarlet'
          }
          if (!parsed.language) {
            parsed.language = 'en'
          }
        }
        return parsed as T
      }
      return initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

export function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])
  return debounced
}

export function useRotatingItems(items: MediaItem[]) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!items.length) return
    const timer = window.setInterval(() => setIndex((c) => (c + 1) % items.length), 6500)
    return () => window.clearInterval(timer)
  }, [items])
  return items.length ? [...items.slice(index), ...items.slice(0, index)] : []
}

export function useWatchHistory() {
  const [history] = useLocalStorageState<WatchHistoryEntry[]>(STORAGE_KEYS.history, [])
  return history
}

export function useProgressStore() {
  const [progress, setProgress] = useLocalStorageState<Record<string, number>>(STORAGE_KEYS.progress, {})

  useEffect(() => {
    const handler = () => {
      const raw = window.localStorage.getItem(STORAGE_KEYS.progress)
      if (raw) setProgress(JSON.parse(raw))
    }
    window.addEventListener('progress-updated', handler)
    return () => window.removeEventListener('progress-updated', handler)
  }, [setProgress])

  return progress
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useLocalStorageState<WatchlistEntry[]>(STORAGE_KEYS.watchlist, [])

  useEffect(() => {
    const handler = () => {
      const raw = window.localStorage.getItem(STORAGE_KEYS.watchlist)
      if (raw) setWatchlist(JSON.parse(raw))
    }
    window.addEventListener('watchlist-updated', handler)
    return () => window.removeEventListener('watchlist-updated', handler)
  }, [setWatchlist])

  return [watchlist, setWatchlist] as const
}

export function useReminders() {
  const [reminders, setReminders] = useLocalStorageState<ReminderEntry[]>(STORAGE_KEYS.reminders, [])

  useEffect(() => {
    const handler = () => {
      const raw = window.localStorage.getItem(STORAGE_KEYS.reminders)
      if (raw) setReminders(JSON.parse(raw))
    }
    window.addEventListener('reminders-updated', handler)
    return () => window.removeEventListener('reminders-updated', handler)
  }, [setReminders])

  return [reminders, setReminders] as const
}

export function useBrowseData() {
  const [data, setData] = useState<{
    movies: MediaItem[]
    tv: MediaItem[]
    classics: MediaItem[]
    loading: boolean
  }>({ movies: [], tv: [], classics: [], loading: true })

  useEffect(() => {
    if (!hasTmdbCredentials) return
    const controller = new AbortController()
    
    Promise.all([
      fetchTopRatedMovies(controller.signal),
      fetchTopRatedTv(controller.signal),
      fetchClassics(controller.signal)
    ]).then(([movies, tv, classics]) => {
      if (!controller.signal.aborted) {
        setData({ movies, tv, classics, loading: false })
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setData(p => ({ ...p, loading: false }))
      }
    })

    return () => controller.abort()
  }, [])

  return data
}

export function useCollectionDetails(id: string | undefined) {
  const [details, setDetails] = useState<CollectionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !hasTmdbCredentials) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    
    fetchCollection(id, controller.signal)
      .then(res => {
        if (!controller.signal.aborted) {
          setDetails(res)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load collection.')
          setLoading(false)
        }
      })
      
    return () => controller.abort()
  }, [id])

  return { details, loading, error }
}

export function useScrollDirection() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > 80 && y > lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return hidden
}

export function useHomeCatalog(query: string): HomeState {
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  
  const [state, setState] = useState<HomeState>(() => {
    try {
      const cached = window.localStorage.getItem(STORAGE_KEYS.catalog)
      if (cached && !query) {
        const parsed = JSON.parse(cached)
        return { ...defaultHomeState, ...parsed, loading: false }
      }
    } catch {}
    return defaultHomeState
  })

  useEffect(() => {
    const controller = new AbortController()

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setState((c) => ({ ...c, loading: true, error: null }))
      }
    })

    async function load() {
      try {
        const [trending, recommendations, animeTrending] = await Promise.all([
          hasTmdbCredentials ? fetchTrendingTitles(controller.signal).catch(() => []) : Promise.resolve([]),
          hasTmdbCredentials ? fetchRecommendations(controller.signal).catch(() => []) : Promise.resolve([]),
          fetchTrendingAnime(controller.signal).catch(() => []),
        ])

        if (controller.signal.aborted) return

        let searchResults: MediaItem[] = []
        let featured = trending.find(hasArtwork) ?? animeTrending.find(hasArtwork) ?? recommendations.find(hasArtwork) ?? trending[0] ?? animeTrending[0] ?? null

        if (debouncedQuery.length >= 2) {
          const [tmdbSearch, anilistSearch] = await Promise.all([
            hasTmdbCredentials ? searchTitles(debouncedQuery, controller.signal).catch(() => []) : Promise.resolve([]),
            searchAnilist(debouncedQuery, controller.signal).catch(() => []),
          ])
          searchResults = [...tmdbSearch, ...anilistSearch]
          featured = searchResults.find(hasArtwork) ?? searchResults[0] ?? featured
        }

        const gallery = uniqueMedia([...trending, ...animeTrending, ...recommendations]).filter(hasArtwork).slice(0, 8)
        const recs = uniqueMedia([...recommendations, ...animeTrending, ...trending]).filter(hasArtwork).slice(0, 20)

        const error = (!hasTmdbCredentials && !animeTrending.length) ? 'Add TMDB credentials to load live posters, search, and details.' : null

        setState({ featured, gallery, recommendations: recs, searchResults, loading: false, error })

        // Cache the default catalog (not search results) so the next refresh is instant
        if (!debouncedQuery && featured && gallery.length) {
          window.localStorage.setItem(
            STORAGE_KEYS.catalog, 
            JSON.stringify({ featured, gallery, recommendations: recs })
          )
        }
      } catch (err) {
        if (controller.signal.aborted) return
        setState({ ...defaultHomeState, loading: false, error: err instanceof Error ? err.message : 'Unable to load catalog.' })
      }
    }

    void load()
    return () => controller.abort()
  }, [debouncedQuery])

  return state
}

export function useFeaturedDetails(item: MediaItem | null): MediaDetails | null {
  const cache = useRef<Record<string, MediaDetails>>({})
  const [details, setDetails] = useState<MediaDetails | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      if (!item) { setDetails(null); return }
      const key = `${mediaTypeFromItem(item)}-${item.id}`
      if (cache.current[key]) { setDetails(cache.current[key]); return }
      try {
        let res
        if (mediaTypeFromItem(item) === 'anime') {
          res = await fetchAnimeDetails(String(item.id), controller.signal)
        } else {
          res = await fetchTitleDetails(mediaTypeFromItem(item), String(item.id), controller.signal)
        }
        cache.current[key] = res
        setDetails(res)
      } catch {
        if (!controller.signal.aborted) setDetails(null)
      }
    }
    void load()
    return () => controller.abort()
  }, [item])

  return details
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uniqueMedia(items: MediaItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${mediaTypeFromItem(item)}-${item.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function hasArtwork(item: MediaItem) {
  return Boolean(item.poster_path || item.backdrop_path)
}

export function upsertHistory(entries: WatchHistoryEntry[], next: WatchHistoryEntry) {
  // Deduplicate by mediaType and id so only the latest episode of a show appears
  const filtered = entries.filter(
    (e) => !(e.mediaType === next.mediaType && e.id === next.id)
  )
  return [next, ...filtered].slice(0, 20)
}

export function formatDuration(minutes?: number) {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function formatMoney(amount?: number) {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact' }).format(amount)
}

export function parsePositiveNumber(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}
