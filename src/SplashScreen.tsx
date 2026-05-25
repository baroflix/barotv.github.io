import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
// SplashScreen
//
// Shown once per browser session on first load.
// Uses sessionStorage so it only fires on the very first page
// visit — subsequent navigations within the same tab skip it.
// ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'baroflix.splash_shown'

export const CATALOGUE_PHRASES = [
  "your private catalogue",
  "your personal theater",
  "your digital library",
  "your entertainment hub",
  "your streaming vault",
  "your exclusive cinema",
  "your ultimate watchlist",
  "your media collection",
  "your binge-watching sanctuary",
  "your cinematic universe"
];

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [phrase] = useState(() => CATALOGUE_PHRASES[Math.floor(Math.random() * CATALOGUE_PHRASES.length)]);
  const [visible, setVisible] = useState(() => {
    // Don't show during hot-module reload in dev
    try {
      return !window.sessionStorage.getItem(SESSION_KEY)
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!visible) return

    // Mark as shown so it won't appear again this tab session
    try {
      window.sessionStorage.setItem(SESSION_KEY, '1')
    } catch { }

    // Auto-dismiss after 2.6 s total (logo fades in for 0.9 s, holds, then exit)
    const timer = window.setTimeout(() => setVisible(false), 2600)
    return () => window.clearTimeout(timer)
  }, [visible])

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#080808',
              gap: '1.25rem',
            }}
          >
            {/* Radial ambient glow behind the logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                width: 480,
                height: 480,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,61,61,0.18) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            {/* Logo text */}
            <motion.img
              src="/SVG/Asset 1.svg"
              alt="Baroflix"
              initial={{ opacity: 0, y: 18, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              style={{
                position: 'relative',
                width: 'min(70vw, 420px)',
                height: 'auto',
              }}
            />

            {/* Animated underline bar */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              style={{
                height: 3,
                width: 80,
                borderRadius: 99,
                background: 'var(--accent, #ff3d3d)',
                boxShadow: '0 0 18px var(--accent-glow, rgba(255,61,61,0.5))',
                transformOrigin: 'left',
                position: 'relative',
              }}
            />

            {/* Subtle tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.45, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.78rem',
                letterSpacing: '0.25em',
                color: 'white',
                textTransform: 'uppercase',
                position: 'relative',
              }}
            >
              {phrase.charAt(0).toUpperCase() + phrase.slice(1)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App content renders underneath immediately so it's ready when splash exits */}
      {children}
    </>
  )
}
