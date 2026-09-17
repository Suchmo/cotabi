import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './styles/theme.css'
import './index.css'
import './lib/firebase'
import './lib/leafletIconFix'
import { AuthProvider } from './contexts/AuthContext'
import { LockProvider } from './contexts/LockContext'
import { ToastProvider } from './contexts/ToastContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <LockProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LockProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
