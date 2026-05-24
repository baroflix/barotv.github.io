import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
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
import { useLocalStorageState } from './hooks'
import { defaultSettings, STORAGE_KEYS } from './hooks'
import type { ThemeSettings } from './hooks'
import { initSpatialNavigation } from './lib/spatial'

function App() {
  const [settings, setSettings] = useLocalStorageState<ThemeSettings>(STORAGE_KEYS.settings, defaultSettings)

  useEffect(() => {
    return initSpatialNavigation()
  }, [])

  return (
    <Routes>
      <Route element={<Shell settings={settings} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="coming-soon" element={<ComingSoonPage />} />
        <Route path="/title/:mediaType/:id" element={<TitlePage />} />
        <Route path="/person/:id" element={<CastPage />} />
        <Route path="/network/:id" element={<NetworkPage />} />
        <Route path="/collection/:id" element={<CollectionPage />} />
        <Route path="/settings" element={<SettingsPage settings={settings} onChange={setSettings} />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}

export default App
