import { useEffect, useState } from 'react'
import { BrandingContext } from './branding'
import { accountRequest } from './api'

const defaults = { name: 'S', logo: null }
export default function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem('app-branding')); return saved && typeof saved.name === 'string' && saved.name.trim() ? saved : defaults } catch { return defaults }
  })
  useEffect(() => {
    const controller = new AbortController()
    const refresh = () => {
      if (document.hidden) return
      const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      fetch(`${base}/app-branding`, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('Unavailable')
        return response.json()
      }).then(data => { if (typeof data.name === 'string') setBranding(data) }).catch(() => {})
    }
    refresh()
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  useEffect(() => {
    document.title = branding.name
    try { localStorage.setItem('app-branding', JSON.stringify(branding)) } catch { /* Offline cache is optional. */ }
    let icon = document.querySelector('link[rel="icon"]')
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.append(icon) }
    icon.href = branding.logo || '/app-icons/icon-192.png'
  }, [branding])
  const save = async values => {
    const data = await accountRequest('/admin/app-branding', 'PUT', values)
    setBranding(data)
    return data
  }
  return <BrandingContext.Provider value={{ ...branding, save }}>{children}</BrandingContext.Provider>
}
