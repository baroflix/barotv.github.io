import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { Shell } from './Shell'
import { HomePage } from './HomePage'
import { TitlePage } from './TitlePage'
import { CastPage } from './CastPage'
import { BrowsePage } from './BrowsePage'
import { StatsPage } from './StatsPage'
import { ComingSoonPage } from './ComingSoonPage'
import { NetworkPage } from './NetworkPage'
import { CollectionPage } from './CollectionPage'
import { SettingsPage } from './SettingsPage'
import { AuthScreen } from './AuthScreen'
import { ProfileScreen } from './ProfileScreen'
import { SportsPage } from './SportsPage'
import { initSpatialNavigation } from './lib/spatial'
import { useAuth } from './context/AuthContext'

// Redirects unauthenticated users to the sign-in screen.
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate replace to="/auth" />
  return <>{children}</>
}

function App() {
  const { settings, updateSettings } = useAuth()

  useEffect(() => {
    return initSpatialNavigation()
  }, [])

  return (
    <Routes>
      {/* Public: authentication screen */}
      <Route path="/auth" element={<AuthScreen />} />

      {/* Protected: all app content */}
      <Route
        element={
          <ProtectedRoute>
            <Shell settings={settings} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="coming-soon" element={<ComingSoonPage />} />
        <Route path="/title/:mediaType/:id" element={<TitlePage />} />
        <Route path="/person/:id" element={<CastPage />} />
        <Route path="/network/:id" element={<NetworkPage />} />
        <Route path="/collection/:id" element={<CollectionPage />} />
        <Route path="/settings" element={<SettingsPage settings={settings} onChange={updateSettings} />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/sports" element={<SportsPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}

export default App
