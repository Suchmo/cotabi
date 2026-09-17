import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './BackLink.css'

type BackLinkProps = {
  to: string
  label: string
}

// この画面には複数の入口(記録一覧・思い出フラッシュバック・地域詳細の
// 凡例など)があり得るため、固定の遷移先ではなくブラウザ標準の「1つ戻る」を
// 使い、実際に辿ってきた画面に戻す。history.state.idxが0(=アプリ内履歴が
// 無い状態、ディープリンク等での直接アクセス)の場合のみ、toへフォールバックする。
export function BackLink({ to, label }: BackLinkProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    const state = window.history.state as { idx?: number } | null
    if (state && typeof state.idx === 'number' && state.idx > 0) {
      navigate(-1)
    } else {
      navigate(to)
    }
  }

  return (
    <button type="button" className="back-link" onClick={handleClick}>
      <ArrowLeft size={14} strokeWidth={1.5} />
      {label}
    </button>
  )
}
