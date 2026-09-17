import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserLockSettings, type UserLockSettings } from '../lib/userSettings'

// バックグラウンドから復帰した際、この時間以上経過していたら再ロックする。
const RELOCK_AFTER_MS = 5 * 60 * 1000

type LockContextValue = {
  settingsLoaded: boolean
  settings: UserLockSettings | null
  locked: boolean
  unlock: () => void
  refreshSettings: () => Promise<void>
}

export const LockContext = createContext<LockContextValue>({
  settingsLoaded: false,
  settings: null,
  locked: false,
  unlock: () => {},
  refreshSettings: async () => {},
})

export function LockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserLockSettings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [locked, setLocked] = useState(false)
  const backgroundedAtRef = useRef<number | null>(null)

  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(null)
      setSettingsLoaded(false)
      setLocked(false)
      return
    }
    const loaded = await getUserLockSettings(user.uid)
    setSettings(loaded)
    setSettingsLoaded(true)
  }, [user])

  // ユーザーが変わった(ログイン/ログアウト)タイミングで設定を読み込む。
  // ログイン済みの状態でアプリを開いた場合も、ここでlockEnabledがtrueなら
  // 下のuseEffectでlocked初期値をtrueにする。
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (settingsLoaded && settings) {
      setLocked(settings.lockEnabled)
    }
  }, [settingsLoaded, settings])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        backgroundedAtRef.current = Date.now()
        return
      }
      const backgroundedAt = backgroundedAtRef.current
      backgroundedAtRef.current = null
      if (
        backgroundedAt &&
        settings?.lockEnabled &&
        Date.now() - backgroundedAt > RELOCK_AFTER_MS
      ) {
        setLocked(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [settings])

  const unlock = useCallback(() => setLocked(false), [])

  return (
    <LockContext.Provider
      value={{ settingsLoaded, settings, locked, unlock, refreshSettings: loadSettings }}
    >
      {children}
    </LockContext.Provider>
  )
}
