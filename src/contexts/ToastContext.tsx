import {
  createContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import './ToastContext.css'

type ToastContextValue = {
  showToast: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

const DISPLAY_MS = 2500

// main.tsxでルーターの外側(App全体)を包んでいるため、画面遷移をまたいでも
// トーストが消えない(例: 保存成功→一覧画面へ遷移、の直後でも表示され続ける)。
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<number | undefined>(undefined)

  const showToast = useCallback((text: string) => {
    setMessage(text)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setMessage(null), DISPLAY_MS)
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
