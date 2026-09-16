import { signOut } from 'firebase/auth'
import { LogOut } from 'lucide-react'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import './SettingsScreen.css'

export function SettingsScreen() {
  const { user } = useAuth()

  return (
    <div className="settings-screen">
      <h1>設定</h1>
      {user?.email && <p className="settings-screen__meta">ログイン中: {user.email}</p>}
      <button type="button" onClick={() => signOut(auth)}>
        <LogOut size={16} strokeWidth={1.5} />
        ログアウト
      </button>
    </div>
  )
}
