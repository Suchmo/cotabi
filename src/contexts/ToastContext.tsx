import {
  createContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import './ToastContext.css'

type ToastContextValue = {
  showToast: (message: string, durationMs?: number) => void
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

const DEFAULT_DISPLAY_MS = 2500

// main.tsxでルーターの外側(App全体)を包んでいるため、画面遷移をまたいでも
// トーストが消えない(例: 保存成功→一覧画面へ遷移、の直後でも表示され続ける)。
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<number | undefined>(undefined)

  // 同期待ち・一部失敗などの文章が長めのメッセージは、既定の2.5秒では
  // 読み切れないことがあるため、呼び出し側で表示時間を延ばせるようにする。
  const showToast = useCallback((text: string, durationMs: number = DEFAULT_DISPLAY_MS) => {
    setMessage(text)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setMessage(null), durationMs)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
