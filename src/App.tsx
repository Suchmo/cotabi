import { Navigate, Route, Routes } from 'react-router-dom'
import { BottomTabBar } from './components/BottomTabBar'
import { MapScreen } from './screens/MapScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RecordFormScreen } from './screens/RecordFormScreen'
import { RecordListScreen } from './screens/RecordListScreen'
import { RegionDetailScreen } from './screens/RegionDetailScreen'
import { TripDetailScreen } from './screens/TripDetailScreen'
import { SpotDetailScreen } from './screens/SpotDetailScreen'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="app-loading">読み込み中…</div>
  }

  if (!user) {
    return <LoginScreen />
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
