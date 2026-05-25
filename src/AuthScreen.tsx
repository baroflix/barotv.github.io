import { useState, type FormEvent } from 'react'
import { Mail, Lock, LogIn, Globe, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from './context/AuthContext'

// ─────────────────────────────────────────────────────────────
// AuthScreen
// Matches the existing dark/glassmorphism design language.
// ─────────────────────────────────────────────────────────────
export function AuthScreen() {
  const { signInWithEmail, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
      setLoading(false)
    }
  }

  const isAccessDenied = error?.includes('Access Denied')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at 60% 0%, rgba(var(--accent-rgb, 139,92,246),0.12) 0%, transparent 60%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'white',
              marginBottom: '0.5rem',
            }}
          >
            Baroflix
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
            Sign in to access your private catalogue
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 20,
            padding: '2rem',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.875rem 1rem',
                borderRadius: 12,
                background: isAccessDenied
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isAccessDenied ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.25)'}`,
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle
                size={16}
                style={{ color: '#f87171', marginTop: 2, flexShrink: 0 }}
              />
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          {/* Email / Password form */}
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label
                htmlFor="auth-email"
                style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}
              >
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    paddingLeft: 40,
                    paddingRight: 14,
                    paddingTop: 10,
                    paddingBottom: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: 'white',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password"
                style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    paddingLeft: 40,
                    paddingRight: 42,
                    paddingTop: 10,
                    paddingBottom: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: 'white',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    padding: 2,
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="auth-submit-email"
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.7rem',
                borderRadius: 10,
                border: 'none',
                background: 'var(--accent, #8b5cf6)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s',
              }}
            >
              <LogIn size={16} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              margin: '1.25rem 0',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google OAuth */}
          <button
            id="auth-submit-google"
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            style={{
              width: '100%',
              padding: '0.7rem',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              transition: 'background 0.2s',
            }}
          >
            <Globe size={16} />
            Continue with Google
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          Access is restricted to invited users only.
        </p>
      </div>
    </div>
  )
}
