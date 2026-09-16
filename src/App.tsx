import { Navigate, Route, Routes } from 'react-router-dom'
import { BottomTabBar } from './components/BottomTabBar'
import { MapScreen } from './screens/MapScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { LoginScreen } from './screens/LoginScreen'
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
        </Routes>
      </main>
      <BottomTabBar />
    </div>
  )
}

export default App
