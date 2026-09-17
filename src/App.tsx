import { Navigate, Route, Routes } from 'react-router-dom'
import { BottomTabBar } from './components/BottomTabBar'
import { MapScreen } from './screens/MapScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { LoginScreen } from './screens/LoginScreen'
import { LockScreen } from './screens/LockScreen'
import { RecordFormScreen } from './screens/RecordFormScreen'
import { RecordListScreen } from './screens/RecordListScreen'
import { RegionDetailScreen } from './screens/RegionDetailScreen'
import { TripDetailScreen } from './screens/TripDetailScreen'
import { SpotDetailScreen } from './screens/SpotDetailScreen'
import { useAuth } from './hooks/useAuth'
import { useLock } from './hooks/useLock'
import './App.css'

function App() {
  const { user, loading } = useAuth()
  const { settingsLoaded, settings, locked } = useLock()

  if (loading) {
    return <div className="app-loading">読み込み中…</div>
  }

  if (!user) {
    return <LoginScreen />
  }

  // プライバシーロック(Phase2)は、Firebase Authenticationのログイン状態とは
  // 別の「同じ端末をのぞき見されない」ための仕組み。ログイン済みでも、
  // ロックが有効かつ未解除の間はコンテンツを一切表示しない。
  if (settingsLoaded && settings?.lockEnabled && locked) {
    return <LockScreen />
  }

  return (
    <div className="app-layout">
      <main className="app-layout__content">
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/stats" element={<StatsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/records/new" element={<RecordFormScreen />} />
          <Route path="/records" element={<RecordListScreen />} />
          <Route path="/region/:kind/:code" element={<RegionDetailScreen />} />
          <Route path="/trips/:tripId" element={<TripDetailScreen />} />
          <Route path="/spots/:spotId" element={<SpotDetailScreen />} />
        </Routes>
      </main>
      <BottomTabBar />
    </div>
  )
}

export default App
