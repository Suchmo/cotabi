import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { auth } from '../lib/firebase'
import './LoginScreen.css'

function toErrorMessage(error: unknown): string {
  const code = (error as AuthError | undefined)?.code
  switch (code) {
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません。'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'メールアドレスまたはパスワードが正しくありません。'
    case 'auth/too-many-requests':
      return '試行回数が多すぎます。しばらく待ってから再度お試しください。'
    default:
      return 'ログインに失敗しました。時間をおいて再度お試しください。'
  }
}

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入力してください。')
      return
    }
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      {/* ブラウザ標準の必須項目バリデーション吹き出しはダークテーマと
          見た目が合わないため、noValidateで無効化し、上のhandleSubmitでの
          チェック+下の.login-screen__errorでの表示に統一する。 */}
      <form className="login-screen__card" onSubmit={handleSubmit} noValidate>
        <h1 className="login-screen__title">COTABI</h1>
        <label>
          メールアドレス
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          パスワード
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="login-screen__error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}
