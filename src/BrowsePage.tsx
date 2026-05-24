import { useBrowseData, useCollectionDetails } from './hooks'
import { SectionHeader, ContentRail, SetupNotice } from './ui'
import { hasTmdbCredentials, imageUrl } from './lib/tmdb'
import { Link } from 'react-router-dom'
import { NETWORKS } from './NetworkPage'

const FRANCHISES = [
  { id: 86311, title: 'Marvel Cinematic Universe' },
  { id: 10, title: 'Star Wars' },
  { id: 1241, title: 'Harry Potter' },
  { id: 119, title: 'The Lord of the Rings' },
  { id: 645, title: 'James Bond' },
  { id: 556, title: 'The Matrix' },
]

function CollectionCard({ id, fallbackTitle }: { id: number; fallbackTitle: string }) {
  const { details } = useCollectionDetails(String(id))
  
  const title = details?.name || fallbackTitle
  // For collections, a backdrop is usually better for horizontal cards
  const image = imageUrl(details?.backdrop_path, 'w780') || imageUrl(details?.poster_path, 'w500')
  
  return (
    <Link 
      to={`/collection/${id}`}
      className="group relative overflow-hidden block transition-transform hover:-translate-y-1"
      style={{ aspectRatio: '16/9', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
      )}
      <div className="absolute inset-0 transition-opacity group-hover:opacity-100" style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.95), transparent 70%)' }} />
      <div className="absolute bottom-5 left-5 right-5">
        <h3 className="text-xl font-medium text-white truncate" style={{ fontFamily: 'DM Serif Display, serif' }}>
          {title}
        </h3>
      </div>
    </Link>
  )
}

export function BrowsePage() {
  const { movies, tv, classics, loading } = useBrowseData()

  if (!hasTmdbCredentials) {
    return <div className="px-6 pt-24 max-w-3xl mx-auto"><SetupNotice /></div>
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 space-y-16">
      
      {/* ── Studio Hubs ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Studio Hubs" subtitle="Explore by network and production company" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {Object.values(NETWORKS).map(network => (
            <Link
              key={network.id}
              to={`/network/${network.id}`}
              className="group relative flex items-center justify-center rounded-2xl aspect-video transition-transform hover:-translate-y-1 shadow-[0_4px_16px_rgba(0,0,0,0.4)] p-6"
              style={{ background: network.color }}
            >
              {network.logo_path ? (
                <img src={imageUrl(network.logo_path, 'w342')} alt={network.name} className="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" style={{ filter: network.filter }} />
              ) : (
                <span 
                  className="text-2xl sm:text-3xl font-black tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity" 
                  style={{ color: network.color === '#FFFFFF' ? 'black' : 'white' }}
                >
                  {network.name.slice(0,1)}
                </span>
              )}
              <div className="absolute inset-0 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Franchises & Collections ────────────────────────────────────── */}
      <section>
        <SectionHeader title="Franchises & Collections" subtitle="Epic marathons" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {FRANCHISES.map(f => (
            <CollectionCard key={f.id} id={f.id} fallbackTitle={f.title} />
          ))}
        </div>
      </section>

      {/* ── Must Watch TV ──────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Must-Watch TV Shows" subtitle="Highest rated of all time" />
        <ContentRail items={tv} loading={loading} />
      </section>

      {/* ── Must Watch Movies ───────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Must-Watch Movies" subtitle="Highest rated of all time" />
        <ContentRail items={movies} loading={loading} />
      </section>

      {/* ── Classics ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Timeless Classics" subtitle="Released before 1995" />
        <ContentRail items={classics} loading={loading} />
      </section>

    </div>
  )
}
