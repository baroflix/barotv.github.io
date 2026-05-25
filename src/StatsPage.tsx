import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Film, Tv, Star, Flame } from 'lucide-react'
import { useWatchHistory, useProgressStore } from './hooks'
import { fetchTitleDetails } from './lib/tmdb'
import type { MediaDetails } from './types'

export function StatsPage() {
  const history = useWatchHistory()
  const progress = useProgressStore()

  const [topDetails, setTopDetails] = useState<MediaDetails[]>([])
  const [loading, setLoading] = useState(true)

  const totalSecondsWatched = Object.values(progress).reduce((a, b) => a + b, 0)
  const totalHoursWatched = Math.floor(totalSecondsWatched / 3600)

  useEffect(() => {
    const controller = new AbortController()
    
    async function loadStats() {
      // Pick top 20 most recently watched unique items to analyze
      const recent = history.slice(0, 20)
      if (!recent.length) {
        setLoading(false)
        return
      }

      try {
        const details = await Promise.all(
          recent.map(item => 
            fetchTitleDetails(item.mediaType, String(item.id), controller.signal).catch(() => null)
          )
        )
        if (!controller.signal.aborted) {
          setTopDetails(details.filter(Boolean) as MediaDetails[])
          setLoading(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadStats()
    return () => controller.abort()
  }, [history])

  // Calculate Genres
  const genreCounts: Record<string, number> = {}
  topDetails.forEach(d => {
    d.genres?.forEach(g => {
      genreCounts[g.name] = (genreCounts[g.name] || 0) + 1
    })
  })
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // Calculate Actors
  const actorCounts: Record<string, { count: number; profilePath?: string | null }> = {}
  topDetails.forEach(d => {
    d.credits?.cast?.slice(0, 8).forEach(actor => {
      if (!actorCounts[actor.name]) {
        actorCounts[actor.name] = { count: 0, profilePath: actor.profile_path }
      }
      actorCounts[actor.name].count += 1
    })
  })
  const topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  // Calculate TV vs Movies
  const movieCount = history.filter(h => h.mediaType === 'movie').length
  const tvCount = history.filter(h => h.mediaType === 'tv').length

  return (
    <div className="mx-auto max-w-screen-2xl px-6 pb-20 pt-24 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-500 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
          Your Baroflix Wrapped
        </h1>
        <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
          A deep dive into your streaming habits.
        </p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {/* Total Time */}
        <StatCard delay={0.1} color="from-blue-500 to-cyan-400" icon={<Clock className="w-8 h-8 opacity-50" />}>
          <div className="text-5xl font-bold mb-2">{totalHoursWatched}</div>
          <div className="text-lg font-medium opacity-80">Hours Watched</div>
        </StatCard>

        {/* Movies vs TV */}
        <StatCard delay={0.2} color="from-pink-500 to-rose-400" icon={<Flame className="w-8 h-8 opacity-50" />}>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-4xl font-bold mb-1">{movieCount}</div>
              <div className="text-sm font-medium opacity-80 flex items-center gap-1"><Film className="w-4 h-4"/> Movies</div>
            </div>
            <div className="w-px h-12 bg-white/20 mx-4" />
            <div>
              <div className="text-4xl font-bold mb-1">{tvCount}</div>
              <div className="text-sm font-medium opacity-80 flex items-center gap-1"><Tv className="w-4 h-4"/> TV Shows</div>
            </div>
          </div>
        </StatCard>

        {/* Top Genres */}
        <StatCard delay={0.3} color="from-amber-500 to-orange-400" icon={<Star className="w-8 h-8 opacity-50" />}>
          <div className="text-lg font-medium opacity-80 mb-3">Top Genres</div>
          {loading ? (
            <div className="animate-pulse h-16 bg-white/10 rounded" />
          ) : topGenres.length > 0 ? (
            <div className="space-y-2">
              {topGenres.map(([genre, _], i) => (
                <div key={genre} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
                  <span className="font-semibold text-white truncate max-w-[150px]">{i + 1}. {genre}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm opacity-60">Not enough data yet.</div>
          )}
        </StatCard>
      </div>

      {/* Top Actors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Most Watched Actors</h2>
        {loading ? (
          <div className="animate-pulse h-32 bg-white/5 rounded-2xl" />
        ) : topActors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {topActors.map(([name, { profilePath, count }]) => (
              <div key={name} className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-white/10">
                  {profilePath ? (
                    <img src={`https://image.tmdb.org/t/p/w185${profilePath}`} alt={name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{name}</div>
                  <div className="text-xs text-white/50">{count} appearances</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/50">Keep watching to discover your favorite actors!</div>
        )}
      </motion.div>
    </div>
  )
}

function StatCard({ children, delay, color, icon }: { children: React.ReactNode; delay: number; color: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`relative overflow-hidden rounded-3xl p-8 text-white bg-gradient-to-br ${color} shadow-2xl`}
      style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute -bottom-2 -right-2 z-0 pointer-events-none" style={{ transform: 'rotate(-15deg) scale(1.5)' }}>
        {icon}
      </div>
    </motion.div>
  )
}
