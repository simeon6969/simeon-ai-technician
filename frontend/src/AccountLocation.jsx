import { useEffect, useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'

export default function AccountLocation() {
  const { t } = useLanguage()
  const [location, setLocation] = useState('')
  const [busy, setBusy] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    accountRequest('/users/me/location').then(data => { if (active) { setLocation(data.location); setLoaded(true); setError('') } }).catch(failure => { if (active) setError(failure.message) }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [revision])
  return <section className="mb-6 rounded-xl border bg-white p-5">
    <h2 className="text-xl font-bold">{t('Account location')}</h2>
    <p className="my-3 text-sm text-slate-600">{t('Enter your address or business location, including city, district and street or landmark.')}</p>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setSaved(false); setError('')
      try { const result = await accountRequest('/users/me/location', 'PUT', { location }); setLocation(result.location); setSaved(true) }
      catch (failure) { setError(failure.message) } finally { setBusy(false) }
    }}>
      <label className="block">{t('Location or address')}<textarea disabled={busy || !loaded} maxLength={500} rows={3} value={location} onChange={event => { setLocation(event.target.value); setSaved(false) }} className="mt-2 block w-full rounded-lg border p-3" /></label>
      <p className="my-2 text-sm text-slate-600">{t('Leave blank and save to remove your location.')}</p>
      <button disabled={busy || !loaded} className="rounded-lg bg-teal-700 px-4 py-2 text-white disabled:opacity-50">{busy && <Spinner />}{t('Save changes')}</button>
      {!loaded && !busy && <button type="button" onClick={() => { setBusy(true); setRevision(value => value + 1) }} className="ml-3 rounded-lg border px-4 py-2">{t('Refresh')}</button>}
    </form>
    {error && <p role="alert" className="mt-3 text-red-700">{t(error)}</p>}
    {saved && <p role="status" className="mt-3">{t('Changes saved')}</p>}
  </section>
}
