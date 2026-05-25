const BASE_URL = 'https://streamed.pk'

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
  const res = await fetch(`${BASE_URL}/api/sports`)
  if (!res.ok) throw new Error(`Failed to fetch sports: ${res.status}`)
  return res.json()
}

/** Fetch matches for a specific sport category or 'all' */
export async function fetchMatches(sportId = 'all', popularOnly = false): Promise<APIMatch[]> {
  const path = popularOnly ? `/api/matches/${sportId}/popular` : `/api/matches/${sportId}`
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Failed to fetch matches: ${res.status}`)
  return res.json()
}

/** Fetch all currently live matches */
export async function fetchLiveMatches(popularOnly = false): Promise<APIMatch[]> {
  const path = popularOnly ? '/api/matches/live/popular' : '/api/matches/live'
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Failed to fetch live matches: ${res.status}`)
  return res.json()
}

/** Fetch matches scheduled for today */
export async function fetchTodayMatches(popularOnly = false): Promise<APIMatch[]> {
  const path = popularOnly ? '/api/matches/all-today/popular' : '/api/matches/all-today'
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Failed to fetch today's matches: ${res.status}`)
  return res.json()
}

/** Fetch streams for a specific match source and source-specific id */
export async function fetchStreams(source: string, id: string): Promise<Stream[]> {
  const res = await fetch(`${BASE_URL}/api/stream/${source}/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch streams: ${res.status}`)
  return res.json()
}

/** Build full badge image URL */
export function getBadgeUrl(badgeName?: string): string {
  if (!badgeName) return ''
  return `${BASE_URL}/api/images/badge/${badgeName}.webp`
}

/** Build full poster image URL */
export function getPosterUrl(posterName?: string): string {
  if (!posterName) return ''
  if (posterName.startsWith('http')) return posterName
  return `${BASE_URL}/api/images/proxy/${posterName}.webp`
}
