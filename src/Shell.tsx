import { Link, useLocation, Outlet } from 'react-router-dom'
import { Settings as SettingsIcon, Search, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { THEME_PRESETS, useScrollDirection } from './hooks'
import type { ThemeSettings } from './hooks'
import { SearchOverlay } from './SearchOverlay'
import { locales } from './locales'

// ─── Shell ───────────────────────────────────────────────────────────────────

export function Shell({ settings }: { settings: ThemeSettings }) {
  const theme = THEME_PRESETS[settings.theme]
  const location = useLocation()
  const isHome = location.pathname === '/'

  // Sync theme CSS vars to :root so body::before gradient picks them up
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--accent-glow', theme.glow)
    const dimAlpha = theme.glow.replace(/[\d.]+\)$/, '0.15)')
    const softAlpha = theme.glow.replace(/[\d.]+\)$/, '0.08)')
    root.style.setProperty('--accent-dim', dimAlpha)
    root.style.setProperty('--accent-soft', softAlpha)
  }, [theme])

  return (
    <div
      className="relative min-h-screen text-white"
      style={
        {
          '--accent': theme.accent,
          '--accent-glow': theme.glow,
          '--accent-dim': theme.glow.replace('0.35)', '0.15)').replace('0.30)', '0.12)').replace('0.28)', '0.10)'),
          '--accent-soft': theme.glow.replace('0.35)', '0.08)').replace('0.30)', '0.06)').replace('0.28)', '0.06)'),
        } as CSSProperties
      }
    >
      {!isHome && <NavBar language={settings.language} />}
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  )
}

// ─── NavBar ──────────────────────────────────────────────────────────────────

function NavBar({ language }: { language?: 'en' | 'pl' }) {
  const hidden = useScrollDirection()
  const [searchOpen, setSearchOpen] = useState(false)
  const lang = language || 'en'
  const t = locales[lang].nav

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300"
        style={{
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          background: 'linear-gradient(180deg, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.0) 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-6 gap-4">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="no-bg-hover shrink-0">
              <img
                  src="/1x/Asset 1.webp"
                  alt="Baroflix"
                  className="block h-10 w-auto"
              />
            </Link>

            {/* Left nav */}
            <nav className="hidden sm:flex items-center gap-6">
              <Link to="/" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {t.home}
              </Link>
              <Link to="/browse" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {t.browse}
              </Link>
              <Link to="/sports" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {t.sports}
              </Link>
              <Link to="/collections" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {t.collections}
              </Link>
              <Link to="/coming-soon" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {t.comingSoon}
              </Link>
              <Link to="/stats" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {t.stats}
              </Link>
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              to="/settings"
              className="flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
            <Link
              to="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label="Profile"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}
