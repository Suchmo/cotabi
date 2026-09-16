import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export function SettingsScreen() {
  const { user } = useAuth()

  return (
    <div style={{ padding: 16 }}>
      <h1>設定</h1>
      {user?.email && <p>ログイン中: {user.email}</p>}
      <button type="button" onClick={() => signOut(auth)}>
        ログアウト
      </button>
    </div>
  )
}
