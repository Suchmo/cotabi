import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './styles/theme.css'
import './index.css'
import './lib/firebase'
import './lib/leafletIconFix'
import { AuthProvider } from './contexts/AuthContext'
import { LockProvider } from './contexts/LockContext'
import { ToastProvider } from './contexts/ToastContext'
import App from './App.tsx'

// createBrowserRouter/RouterProvider(データルーター)を使う。App自身が
// 内部で<Routes>によるルーティングを行うため、ここではワイルドカード1本を
// Appに丸ごと渡すだけでよい。useBlocker(入力中の離脱確認、RecordFormScreen)
// はデータルーターでしか使えないため、この構成にしている。
const router = createBrowserRouter([{ path: '*', element: <App /> }])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <LockProvider>
          <RouterProvider router={router} />
        </LockProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
