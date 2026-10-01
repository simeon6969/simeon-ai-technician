import { accountRequest } from './api'
import { useEffect, useState } from 'react'
import { useBranding } from './branding'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'
export default function BrandingSettings() {
  const branding = useBranding()
  const { t } = useLanguage()
  const [name, setName] = useState(branding.name)
  const [logo, setLogo] = useState(branding.logo)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    accountRequest('/app-branding').then(data => { if (active) { setName(data.name); setLogo(data.logo); setReady(true) } }).catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [])
  return <form className="max-w-2xl rounded-2xl border bg-white p-6 text-slate-900" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage('')
    try { await branding.save({ name: name.trim(), logo }); setMessage(t('Branding saved.')) }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }}>
    <h2 className="mb-5 text-xl font-bold">{t('App branding')}</h2>
    <label className="block">{t('App name')}<input required maxLength={60} value={name} disabled={busy || !ready} onChange={e => setName(e.target.value)} className="my-2 block w-full rounded border p-3" /></label>
    <label className="my-4 block">{t('App logo')}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || !ready} onChange={event => {
      const file = event.target.files[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) { setMessage(t('Choose an image up to 5 MB.')); return }
      setBusy(true)
      const reader = new FileReader()
      reader.onload = () => { setLogo(reader.result); setBusy(false) }
      reader.onerror = () => { setMessage(t('Unable to read the photo.')); setBusy(false) }
      reader.readAsDataURL(file)
    }} className="mt-2 block max-w-full" /></label>
    {logo && <img src={logo} alt={name} className="my-4 h-24 w-24 object-contain" />}
    <button type="button" disabled={busy || !ready} onClick={() => setLogo(null)} className="mr-4 rounded border p-3">{t('Remove logo')}</button>
    <button disabled={busy || !ready || !name.trim()} className="rounded bg-teal-700 p-3 text-white">{busy && <Spinner />}{t('Save changes')}</button>
    <p role="status" className="mt-4">{message}</p>
  </form>
}
