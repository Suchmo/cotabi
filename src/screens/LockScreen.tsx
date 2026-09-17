import { useEffect, useState, type FormEvent } from 'react'
import { Fingerprint, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLock } from '../hooks/useLock'
import { verifyWebAuthnCredential } from '../lib/webauthn'
import { verifyPin } from '../lib/pinLock'
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

  const hasWebAuthn = !!settings?.webauthnCredentialId

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
    if (!settings?.pinHash || !settings.pinSalt) return
    const ok = await verifyPin(pin, settings.pinSalt, settings.pinHash)
    if (ok) {
      unlock()
    } else {
      setError('PINコードが違います。')
      setPin('')
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
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </label>
          {error && <p className="lock-screen__error">{error}</p>}
          <button type="submit" disabled={pin.length !== 4}>
            解除
          </button>
        </form>
      </div>
    </div>
  )
}
