import { useEffect, useState, type FormEvent } from 'react'
import { signOut } from 'firebase/auth'
import { Fingerprint, LogOut, ShieldCheck } from 'lucide-react'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLock } from '../hooks/useLock'
import { useToast } from '../hooks/useToast'
import { generateSalt, hashPin } from '../lib/pinLock'
import { isWebAuthnAvailable, registerWebAuthnCredential } from '../lib/webauthn'
import { updateUserLockSettings } from '../lib/userSettings'
import './SettingsScreen.css'

export function SettingsScreen() {
  const { user } = useAuth()
  const { settings, refreshSettings } = useLock()
  const { showToast } = useToast()

  const [webauthnAvailable, setWebauthnAvailable] = useState(false)
  const [showPinForm, setShowPinForm] = useState(false)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [webauthnBusy, setWebauthnBusy] = useState(false)
  const [webauthnError, setWebauthnError] = useState<string | null>(null)

  useEffect(() => {
    isWebAuthnAvailable().then(setWebauthnAvailable)
  }, [])

  const hasPin = !!settings?.pinHash
  const hasWebAuthn = !!settings?.webauthnCredentialId

  const resetPinForm = () => {
    setPin('')
    setPinConfirm('')
    setPinError(null)
    setShowPinForm(false)
  }

  const handleToggleLock = async (enabled: boolean) => {
    if (!user) return
    if (enabled && !hasPin) {
      // ロックのフォールバック手段としてPINが必須のため、先にPIN設定を促す。
      setShowPinForm(true)
      return
    }
    try {
      await updateUserLockSettings(user.uid, { lockEnabled: enabled })
      await refreshSettings()
      showToast(enabled ? 'ロックを有効にしました' : 'ロックを無効にしました')
    } catch {
      showToast('設定の変更に失敗しました。時間をおいて再度お試しください。')
    }
  }

  const handleSavePin = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!/^\d{4}$/.test(pin)) {
      setPinError('4桁の数字で入力してください。')
      return
    }
    if (pin !== pinConfirm) {
      setPinError('確認用のPINが一致しません。')
      return
    }
    try {
      const salt = generateSalt()
      const pinHash = await hashPin(pin, salt)
      await updateUserLockSettings(user.uid, {
        pinHash,
        pinSalt: salt,
        lockEnabled: true,
      })
      await refreshSettings()
      resetPinForm()
      showToast('PINコードを設定しました')
    } catch {
      setPinError('保存に失敗しました。時間をおいて再度お試しください。')
    }
  }

  const handleRegisterWebAuthn = async () => {
    if (!user) return
    setWebauthnBusy(true)
    setWebauthnError(null)
    try {
      const credentialId = await registerWebAuthnCredential(user.uid, user.email ?? '')
      await updateUserLockSettings(user.uid, { webauthnCredentialId: credentialId })
      await refreshSettings()
      showToast('生体認証を設定しました')
    } catch {
      setWebauthnError('生体認証の設定に失敗しました。')
    } finally {
      setWebauthnBusy(false)
    }
  }

  const handleRemoveWebAuthn = async () => {
    if (!user) return
    try {
      await updateUserLockSettings(user.uid, { webauthnCredentialId: null })
      await refreshSettings()
      showToast('生体認証の設定を解除しました')
    } catch {
      showToast('生体認証の解除に失敗しました。時間をおいて再度お試しください。')
    }
  }

  return (
    <div className="settings-screen">
      <h1>設定</h1>
      {user?.email && <p className="settings-screen__meta">ログイン中: {user.email}</p>}

      <section className="settings-screen__section">
        <h2>
          <ShieldCheck size={16} strokeWidth={1.5} />
          プライバシーロック
        </h2>
        <p className="settings-screen__description">
          有効にすると、アプリを開いた時や、しばらく操作せずバックグラウンドから
          戻った時に、ロック画面での解除が必要になります。
        </p>

        <div className="settings-screen__lock-toggle">
          <button
            type="button"
            className={!settings?.lockEnabled ? 'is-selected' : ''}
            onClick={() => handleToggleLock(false)}
          >
            オフ
          </button>
          <button
            type="button"
            className={settings?.lockEnabled ? 'is-selected' : ''}
            onClick={() => handleToggleLock(true)}
          >
            オン
          </button>
        </div>

        {showPinForm && (
          <form className="settings-screen__pin-form" onSubmit={handleSavePin}>
            <p className="settings-screen__description">
              ロックを有効にするには、まずPINコード(4桁)を設定してください。
            </p>
            <label>
              新しいPINコード
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </label>
            <label>
              確認のため再入力
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </label>
            {pinError && <p className="settings-screen__error">{pinError}</p>}
            <div className="settings-screen__pin-form-buttons">
              <button type="button" onClick={resetPinForm}>
                キャンセル
              </button>
              <button type="submit" disabled={pin.length !== 4 || pinConfirm.length !== 4}>
                設定する
              </button>
            </div>
          </form>
        )}

        {!showPinForm && hasPin && (
          <button type="button" onClick={() => setShowPinForm(true)}>
            PINコードを再設定
          </button>
        )}

        {webauthnAvailable && (
          <div className="settings-screen__webauthn">
            <p className="settings-screen__description">
              生体認証: {hasWebAuthn ? '設定済み' : '未設定'}
            </p>
            {webauthnError && <p className="settings-screen__error">{webauthnError}</p>}
            {hasWebAuthn ? (
              <button type="button" onClick={handleRemoveWebAuthn}>
                <Fingerprint size={16} strokeWidth={1.5} />
                生体認証を解除
              </button>
            ) : (
              <button type="button" onClick={handleRegisterWebAuthn} disabled={webauthnBusy}>
                <Fingerprint size={16} strokeWidth={1.5} />
                {webauthnBusy ? '設定中…' : 'このデバイスで生体認証を設定する'}
              </button>
            )}
          </div>
        )}
      </section>

      <button type="button" onClick={() => signOut(auth)}>
        <LogOut size={16} strokeWidth={1.5} />
        ログアウト
      </button>
    </div>
  )
}
