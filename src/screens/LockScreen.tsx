import { useEffect, useState, type FormEvent } from 'react'
import { Fingerprint, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLock } from '../hooks/useLock'
import { verifyWebAuthnCredential } from '../lib/webauthn'
import { verifyPin } from '../lib/pinLock'
import {
  PIN_LOCKOUT_MS,
  clearAttempts,
  getLockedUntil,
  recordFailedAttempt,
} from '../lib/pinAttempts'
import './LockScreen.css'

// Firebase Authenticationのログインセッションとは別に挟む、端末上の
// のぞき見防止ロック。ログイン状態自体はAuthProviderが維持したままで、
// このロックが解除されるまで下のApp本体(ルーティング)を表示しない。
export function LockScreen() {
  const { user } = useAuth()
  const { settings, unlock } = useLock()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [webauthnTrying, setWebauthnTrying] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const hasWebAuthn = !!settings?.webauthnCredentialId
  const pinLockedOut = lockedUntil !== null

  // PINの連続失敗によるロックアウトは端末に永続化しているため、画面表示時に
  // 既にロックアウト中でないか確認する(ページ再読み込みでの回避を防ぐ)。
  useEffect(() => {
    if (!user) return
    setLockedUntil(getLockedUntil(user.uid))
  }, [user])

  // ロックアウト中は1秒ごとに残り時間を更新し、経過したら解除する。
  useEffect(() => {
    if (!lockedUntil) return
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setError(null)
      } else {
        setRemainingSeconds(remaining)
      }
    }
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [lockedUntil])

  // PIN未設定のままロックが有効になっている(通常は設定画面側で防いでいる)
  // 想定外の状態では、解除不能になることを避けるためロックしない。
  useEffect(() => {
    if (settings && settings.lockEnabled && !settings.pinHash) {
      unlock()
    }
  }, [settings, unlock])

  const tryWebAuthn = async (credentialId: string) => {
    setWebauthnTrying(true)
    setError(null)
    const ok = await verifyWebAuthnCredential(credentialId)
    setWebauthnTrying(false)
    if (ok) {
      unlock()
    } else {
      setError('生体認証に失敗しました。PINコードを入力してください。')
    }
  }

  // 画面表示時、生体認証が登録済みなら自動で一度試す。
  useEffect(() => {
    if (settings?.webauthnCredentialId) {
      tryWebAuthn(settings.webauthnCredentialId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePinSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!settings?.pinHash || !settings.pinSalt || !user) return
    if (pinLockedOut) return

    const ok = await verifyPin(pin, settings.pinSalt, settings.pinHash)
    if (ok) {
      clearAttempts(user.uid)
      unlock()
      return
    }

    setPin('')
    const newLockedUntil = recordFailedAttempt(user.uid)
    if (newLockedUntil) {
      setLockedUntil(newLockedUntil)
      setError(
        `PINコードが違います。試行回数が上限に達したため、${PIN_LOCKOUT_MS / 1000}秒間ロックします。`,
      )
    } else {
      setError('PINコードが違います。')
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-screen__card">
        <Lock size={32} strokeWidth={1.5} />
        <h1>ロック中</h1>
        {user?.email && <p className="lock-screen__meta">{user.email}</p>}

        {hasWebAuthn && (
          <button
            type="button"
            className="lock-screen__biometric"
            onClick={() => tryWebAuthn(settings!.webauthnCredentialId!)}
            disabled={webauthnTrying}
          >
            <Fingerprint size={18} strokeWidth={1.5} />
            {webauthnTrying ? '認証中…' : '生体認証で解除'}
          </button>
        )}

        <form className="lock-screen__pin-form" onSubmit={handlePinSubmit}>
          <label>
            PINコード(4桁)
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              disabled={pinLockedOut}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </label>
          {error && <p className="lock-screen__error">{error}</p>}
          {pinLockedOut && (
            <p className="lock-screen__error">
              しばらく待ってから再度お試しください(残り{remainingSeconds}秒)。
            </p>
          )}
          <button type="submit" disabled={pinLockedOut || pin.length !== 4}>
            解除
          </button>
        </form>
      </div>
    </div>
  )
}
