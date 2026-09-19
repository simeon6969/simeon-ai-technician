import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LanguageProvider from './LanguageProvider.jsx'
import Footer from './Footer.jsx'
import InstallApp from './InstallApp.jsx'
import AndroidUpdate from './AndroidUpdate.jsx'
import { Capacitor } from '@capacitor/core'

if (!Capacitor.isNativePlatform() && import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error) => {
      console.error('Simeon offline support could not be registered:', error)
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
      {Capacitor.getPlatform() === 'android' && <AndroidUpdate />}
      {!Capacitor.isNativePlatform() && <InstallApp />}
      <Footer />
    </LanguageProvider>
  </StrictMode>,
)
