import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './services/AuthContext.tsx'
import { ThemeProvider } from './provider/ThemeProvider.tsx'
import { ToastProvider } from './components/ui/toast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
      <ThemeProvider>
      <App />
      </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
