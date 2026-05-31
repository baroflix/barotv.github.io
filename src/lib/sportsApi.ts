// ─── Konfiguracja ────────────────────────────────────────────────────────────
//
// W Electron/Capacitor fetch leci bezpośrednio do streamed.pk (brak CORS).
// W przeglądarce (GitHub Pages) używamy własnego Cloudflare Workera — patrz:
//   sports-proxy-worker.js w katalogu głównym projektu.
//
// Po wdrożeniu workera wstaw jego URL poniżej:
const WORKER_URL = 'https://baroflixsports.bartlomiej-cwiklak.workers.dev/'

const BASE_URL = 'https://streamed.pk'
const IS_NATIVE = typeof navigator !== 'undefined' && /electron|capacitor/i.test(navigator.userAgent)

function apiFetch(path: string): Promise<Response> {
  if (IS_NATIVE) return fetch(`${BASE_URL}${path}`)
  // Trim trailing slash from WORKER_URL to avoid double-slash if user pastes URL with /
  const base = WORKER_URL.replace(/\/+$/, '')
  return fetch(`${base}${path}`)
}

export interface APIMatch {
  id: string
  title: string
  category: string
  date: number // Unix timestamp in milliseconds
  poster?: string
  popular: boolean
  teams?: {
    home?: {
      name: string
      badge: string
    }
    away?: {
      name: string
      badge: string
    }
  }
  sources: {
    source: string
    id: string
  }[]
}

export interface Sport {
  id: string
  name: string
}

export interface Stream {
  id: string
  streamNo: number
  language: string
  hd: boolean
  embedUrl: string
  source: string
}

/** Fetch all available sport categories */
export async function fetchSports(): Promise<Sport[]> {
  const res = await apiFetch('/api/sports')
  if (!res.ok) throw new Error(`Failed to fetch sports: ${res.status}`)
  return res.json()
}

/** Fetch matches for a specific sport category or 'all' */
export async function fetchMatches(sportId = 'all', popularOnly = false): Promise<APIMatch[]> {
  const path = popularOnly ? `/api/matches/${sportId}/popular` : `/api/matches/${sportId}`
  const res = await apiFetch(path)
  if (!res.ok) throw new Error(`Failed to fetch matches: ${res.status}`)
  return res.json()
}

/** Fetch all currently live matches */
export async function fetchLiveMatches(popularOnly = false): Promise<APIMatch[]> {
  const path = popularOnly ? '/api/matches/live/popular' : '/api/matches/live'
  const res = await apiFetch(path)
  if (!res.ok) throw new Error(`Failed to fetch live matches: ${res.status}`)
  return res.json()
}

/** Fetch matches scheduled for today */
export async function fetchTodayMatches(popularOnly = false): Promise<APIMatch[]> {
  const path = popularOnly ? '/api/matches/all-today/popular' : '/api/matches/all-today'
  const res = await apiFetch(path)
  if (!res.ok) throw new Error(`Failed to fetch today's matches: ${res.status}`)
  return res.json()
}

/** Fetch streams for a specific match source and source-specific id */
export async function fetchStreams(source: string, id: string): Promise<Stream[]> {
  const res = await apiFetch(`/api/stream/${source}/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch streams: ${res.status}`)
  return res.json()
}

/** Build full badge image URL */
export function getBadgeUrl(badgeName?: string): string {
  if (!badgeName) return ''
  if (badgeName.startsWith('http://') || badgeName.startsWith('https://')) {
    return badgeName
  }

  let path = badgeName
  // If badgeName is not already a path (does not start with '/' and doesn't contain '/images/'),
  // prefix it with the badge endpoint folder
  if (!path.startsWith('/') && !path.includes('/images/')) {
    path = `/api/images/badge/${path}`
  }

  // Ensure it starts with '/'
  if (!path.startsWith('/')) {
    path = '/' + path
  }

  // Combine with BASE_URL, and clean up any double slashes
  let url = `${BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1')

  // Check if it already ends with .webp (case-insensitive)
  if (!url.toLowerCase().endsWith('.webp')) {
    url = url + '.webp'
  }

  return url
}

/** Build full poster image URL */
export function getPosterUrl(posterName?: string): string {
  if (!posterName) return ''
  if (posterName.startsWith('http://') || posterName.startsWith('https://')) {
    return posterName
  }

  let path = posterName
  // If posterName is not already a path (does not start with '/' and doesn't contain '/images/'),
  // prefix it with the proxy endpoint folder
  if (!path.startsWith('/') && !path.includes('/images/')) {
    path = `/api/images/proxy/${path}`
  }

  // Ensure it starts with '/'
  if (!path.startsWith('/')) {
    path = '/' + path
  }

  // Combine with BASE_URL, and clean up any double slashes
  let url = `${BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1')

  // Check if it already ends with .webp (case-insensitive)
  if (!url.toLowerCase().endsWith('.webp')) {
    url = url + '.webp'
  }

  return url
}

/** Dictionary mapping stream source keys to custom display names */
export const STREAM_SOURCE_NAMES: Record<string, string> = {
  admin: 'Ezreal',
  alpha: 'Akali',
  bravo: 'Twisted Fate',
  charlie: 'Ahri',
  delta: 'Katarina',
  echo: 'Zyra',
  foxtrot: 'Syndra',
  golf: 'Diana',
  hotel: 'Ashe',
  intel: 'Veigar',
}

/** Get a friendly formatted name for a stream source */
export function getFriendlySourceName(source: string): string {
  const cleanSource = source.toLowerCase().trim()
  if (STREAM_SOURCE_NAMES[cleanSource]) {
    return STREAM_SOURCE_NAMES[cleanSource]
  }
  // Fallback to capitalizing the source name if not found in dictionary
  return cleanSource.charAt(0).toUpperCase() + cleanSource.slice(1)
}


