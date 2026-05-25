import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowRight, Settings as SettingsIcon, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import heroFallback from './assets/hero.png'
import { imageUrl, mediaTypeFromItem, titleFromItem, yearFromItem, hasTmdbCredentials, pickTrailer, buildVideasyUrl } from './lib/tmdb'
import { useHomeCatalog, useFeaturedDetails, useLocalStorageState, defaultSettings, STORAGE_KEYS, THEME_PRESETS, upsertHistory, useWatchlist } from './hooks'
import type { WatchHistoryEntry, ThemeSettings } from './hooks'
import type { MediaKind, MediaItem } from './types'
import { FullscreenPlayer } from './FullscreenPlayer'
import {
  ContentRail,
  ContinueWatchingRail,
  SectionHeader,
  Chip,
  SetupNotice,
  MediaGrid,
  WatchlistButton,
} from './ui'
import { HomeSearchToggle } from './SearchOverlay'
import { locales } from './locales'

// ─── HomePage ────────────────────────────────────────────────────────────────

export function HomePage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const homeState = useHomeCatalog(query)
  const [history, setHistory] = useLocalStorageState<WatchHistoryEntry[]>(STORAGE_KEYS.history, [])
  const [settings] = useLocalStorageState<ThemeSettings>(STORAGE_KEYS.settings, defaultSettings)
  const [watchlist] = useWatchlist()
  const [playback, setPlayback] = useState<{ mediaType: MediaKind; id: number; season?: number; episode?: number } | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const dragState = useRef<{ x: number } | null>(null)

  const gallery = homeState.gallery.length ? homeState.gallery : homeState.recommendations
  const heroItems = gallery.length ? gallery : homeState.featured ? [homeState.featured] : []
  const activeHero = heroItems[activeIndex % heroItems.length] ?? homeState.featured
  const activeDetails = useFeaturedDetails(activeHero)
  const lang = settings.language || 'en'
  const t = locales[lang].home
  const navT = locales[lang].nav

  const heroBackdrop =
    imageUrl(activeHero?.backdrop_path, 'w1280') ||
    imageUrl(activeHero?.poster_path, 'w780') ||
    heroFallback

  const heroLogo = activeDetails?.images?.logos
    ?.slice()
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .find((l) => l.file_path)?.file_path
    ? imageUrl(
        activeDetails.images!.logos!
          .slice()
          .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          .find((l) => l.file_path)!.file_path!,
        'w500'
      )
    : null

  const featuredLink = activeHero
    ? `/title/${mediaTypeFromItem(activeHero)}/${activeHero.id}`
    : '/'

  const trailer = pickTrailer(activeDetails?.videos)
  const heroCount = heroItems.length

  useEffect(() => {
    queueMicrotask(() => setActiveIndex(0))
  }, [query])

  useEffect(() => {
    if (heroCount <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroCount)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [heroCount])

  function goToHero(nextIndex: number) {
    if (!heroCount) {
      return
    }

    setActiveIndex(((nextIndex % heroCount) + heroCount) % heroCount)
  }

  function goPrevHero() {
    goToHero(activeIndex - 1)
  }

  function goNextHero() {
    goToHero(activeIndex + 1)
  }

  function handleHeroPointerDown(event: ReactPointerEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null
    if (target?.closest('a,button,input,textarea,select')) {
      return
    }

    dragState.current = { x: event.clientX }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleHeroPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const start = dragState.current
    dragState.current = null
    if (!start) {
      return
    }

    const delta = event.clientX - start.x
    if (delta > 60) {
      goPrevHero()
    } else if (delta < -60) {
      goNextHero()
    }
  }

  function handlePlayClick(e: React.MouseEvent) {
    e.preventDefault()
    if (!activeHero) return
    const type = mediaTypeFromItem(activeHero)
    const isEpisodic = type === 'tv' || type === 'anime'
    const season = isEpisodic ? 1 : undefined
    const episode = isEpisodic ? 1 : undefined
    
    setPlayback({ mediaType: type, id: activeHero.id, season, episode })
    
    setHistory((current) => upsertHistory(current, {
      mediaType: type,
      id: activeHero.id,
      title: titleFromItem(activeHero),
      posterPath: activeHero.poster_path,
      backdropPath: activeHero.backdrop_path,
      season,
      episode,
      watchedAt: Date.now(),
    }))
  }

  const playerUrl = playback 
    ? buildVideasyUrl(playback.mediaType, playback.id, playback.season, playback.episode, { color: THEME_PRESETS[settings.theme].accent })
    : null

  const progressKey = playback ? `${playback.mediaType}-${playback.id}-${playback.season || 0}-${playback.episode || 0}` : undefined

  return (
    <div>
      {/* Fullscreen player — portal-mounted */}
      {playback && playerUrl && (
        <FullscreenPlayer
          src={playerUrl}
          onClose={() => setPlayback(null)}
          progressKey={progressKey}
          onEpisodeChange={(season, episode) => {
            setPlayback(p => p ? { ...p, season, episode } : p)
          }}
        />
      )}
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '75svh' }}
      >
        {/* Ken Burns backdrop */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            key={activeHero?.id}
            src={heroBackdrop}
            alt=""
            className="w-full h-full object-cover animate-ken-burns"
            style={{ opacity: 0.45 }}
          />
        </div>

        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.55) 40%, rgba(8,8,8,0.1) 100%),
              linear-gradient(to right, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.0) 60%)
            `,
          }}
        />

        {/* Nav row */}
        <div className="relative z-10 mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="no-bg-hover text-2xl font-bold tracking-widest text-white"
              style={{ fontFamily: '"Bebas Neue", cursive', letterSpacing: '0.12em', fontSize: '1.6rem' }}
            >
              BAROFLIX
            </Link>
            <nav className="hidden sm:flex items-center gap-6">
              <Link to="/" className="text-sm font-semibold text-white hover:text-white transition-colors">
                {navT.home}
              </Link>
              <Link to="/browse" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {navT.browse}
              </Link>
              <Link to="/coming-soon" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {navT.comingSoon}
              </Link>
              <Link to="/stats" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {navT.stats}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <HomeSearchToggle />
            <Link
              to="/settings"
              className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
              }}
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hero content */}
        <div
          className="relative z-10 mx-auto flex h-[75svh] max-w-screen-2xl w-full flex-col justify-end px-6 pb-12 sm:pb-14"
          onPointerDown={handleHeroPointerDown}
          onPointerUp={handleHeroPointerUp}
          onPointerCancel={() => { dragState.current = null }}
          onPointerLeave={() => { dragState.current = null }}
          style={{ touchAction: 'pan-y' }}
        >
          <motion.div
            key={activeHero?.id ?? 'default'}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <div className="max-w-3xl space-y-5">
              {/* Title / Logo */}
              {heroLogo ? (
                <img
                  src={heroLogo}
                  alt={activeHero ? titleFromItem(activeHero) : 'Baroflix'}
                  className="max-h-28 w-auto object-contain drop-shadow-2xl sm:max-h-36"
                />
              ) : (
                <h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-normal text-white"
                  style={{ fontFamily: 'DM Serif Display, serif', textShadow: '0 4px 32px rgba(0,0,0,0.6)', letterSpacing: '-0.02em' }}
                >
                  {activeHero ? titleFromItem(activeHero) : 'Baroflix'}
                </h1>
              )}

              {/* Overview */}
              <p
                className="text-base sm:text-lg max-w-xl leading-relaxed line-clamp-3"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                {activeHero?.overview ?? 'Discover trending movies and TV shows from around the world.'}
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 items-center">
                {activeHero?.vote_average ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
                    style={{ borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    {activeHero.vote_average.toFixed(1)}
                  </span>
                ) : null}
                {activeHero && <Chip>{mediaTypeFromItem(activeHero) === 'tv' ? 'TV Series' : 'Movie'}</Chip>}
                {activeHero && yearFromItem(activeHero) && <Chip>{String(yearFromItem(activeHero))}</Chip>}
                {activeDetails?.genres?.slice(0, 2).map((g) => <Chip key={g.id}>{g.name}</Chip>)}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePlayClick}
                  id="hero-play-btn"
                  className="primary-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 hover:text-white"
                  style={{ background: 'var(--accent)', boxShadow: '0 0 32px var(--accent-glow)' }}
                >
                  <Play className="w-4 h-4 fill-white" />
                  {t.play}
                </button>
                <Link
                  to={featuredLink}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  {t.moreInfo}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {activeHero && (
                  <WatchlistButton item={activeHero} className="px-6 py-3" />
                )}
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-colors"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    {t.trailer}
                  </a>
                )}
              </div>
            </div>

            {heroCount > 1 ? (
              <div className="mt-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={goPrevHero}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/80 backdrop-blur-xl transition hover:bg-white/12 hover:text-white"
                  aria-label="Previous hero item"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex flex-1 items-center justify-center gap-2 px-2" aria-label="Hero gallery position">
                  {heroItems.slice(0, 8).map((item, index) => (
                    <button
                      key={`dot-${item.id}`}
                      type="button"
                      onClick={() => goToHero(index)}
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: index === activeIndex ? 28 : 10,
                        background: index === activeIndex ? 'var(--accent)' : 'rgba(255,255,255,0.28)',
                        boxShadow: index === activeIndex ? '0 0 18px var(--accent-glow)' : undefined,
                      }}
                      aria-label={`Go to hero item ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNextHero}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/80 backdrop-blur-xl transition hover:bg-white/12 hover:text-white"
                  aria-label="Next hero item"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* ── Catalog Sections ───────────────────────────────────────────────── */}
      <div className="px-6 py-12 space-y-14 max-w-screen-2xl mx-auto">
        {!hasTmdbCredentials && (
          <SetupNotice />
        )}

        {/* Continue Watching */}
        {history.length > 0 && (
          <section>
            <SectionHeader number="01" title={t.continueWatching} subtitle={t.continueWatchingSub} />
            <ContinueWatchingRail history={history} />
          </section>
        )}

        {/* My List */}
        {watchlist.length > 0 && (
          <section>
            <SectionHeader number={history.length > 0 ? "02" : "01"} title={t.myList} subtitle={t.myListSub} />
            <ContentRail 
              items={watchlist.map(w => ({ id: w.id, media_type: w.mediaType, title: w.title, poster_path: w.posterPath, backdrop_path: w.backdropPath })) as MediaItem[]} 
              loading={false}
            />
          </section>
        )}

        {/* Trending */}
        <section>
          <SectionHeader number={history.length > 0 && watchlist.length > 0 ? "03" : (history.length > 0 || watchlist.length > 0) ? "02" : "01"} title={t.trending} subtitle={t.trendingSub} />
          <ContentRail items={homeState.recommendations} loading={homeState.loading && !homeState.recommendations.length} />
        </section>

        {/* Browse All */}
        <section>
          <SectionHeader number="03" title={t.browseAll} subtitle={t.browseAllSub} />
          <MediaGrid
            items={homeState.recommendations.slice(0, 20)}
            loading={homeState.loading && !homeState.recommendations.length}
            emptyLabel="Connect TMDB to unlock the full catalog."
            columnsClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          />
        </section>
      </div>

      {/* Footer */}
      <footer className="px-6 py-10 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Powered by{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline hover:text-white/50 transition-colors">
            TMDB
          </a>
          {' '}· Baroflix © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
