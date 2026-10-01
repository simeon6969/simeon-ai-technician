import { useBranding, brandText } from './branding'
import { useEffect, useState } from 'react'
import { useLanguage } from './language'
import { listQueue, updateQueued } from './offlineStore'
import { syncQueue } from './offlineSync'
import { offlineCopy } from './offlineCopy'

export default function OfflineStatus({ account }) {
  const { language, t } = useLanguage()
  const branding = useBranding()
  const w = (offlineCopy[language] || offlineCopy.en).map(text => brandText(text, branding.name))
  const [records, setRecords] = useState([])
  const [offline, setOffline] = useState(!navigator.onLine)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    const refresh = () => listQueue(account.user_id).then(rows => { if (active) setRecords(rows) }).catch(() => { if (active) setError(true) })
    const network = () => setOffline(!navigator.onLine)
    refresh()
    window.addEventListener('simeon-offline-change', refresh)
    window.addEventListener('online', network)
    window.addEventListener('offline', network)
    return () => { active = false; window.removeEventListener('simeon-offline-change', refresh); window.removeEventListener('online', network); window.removeEventListener('offline', network) }
  }, [account.user_id])
  async function retry() {
    setBusy(true)
    setError(false)
    try {
      for (const row of records.filter(row => row.status === 'blocked')) await updateQueued({ ...row, status: 'pending', error: null })
      await syncQueue(account.user_id)
    } catch { setError(true) }
    finally { setBusy(false) }
  }
  if (!offline && records.length === 0 && !error) return null
  return <section className="mx-auto my-4 max-w-6xl rounded-xl border border-teal-200 bg-teal-50 p-4" aria-live="polite">
    {offline && <p className="mb-2">{w[10]}</p>}
    {records.length > 0 && <><h2 className="mt-3 font-semibold">{w[11]}</h2><ul className="my-3 space-y-2">{[...records.filter(row => row.status !== 'synced'), ...records.filter(row => row.status === 'synced').slice(-5).reverse()].map(row => <li key={row.key}>
      {t(row.kind === 'job' ? 'Digital Job Card' : 'Spare Part')} · {row.status === 'synced' ? `${w[2]} #${row.recordId}` : w[1]}
      {row.error && <p className="text-sm text-amber-900">{w[row.error === 'auth' ? 4 : row.error === 'rejected' ? 12 : 5]}</p>}
    </li>)}</ul><button disabled={busy || offline} onClick={retry} className="rounded-lg bg-teal-700 px-4 py-2 text-white disabled:opacity-50">{w[3]}</button></>}
    {error && <p role="alert" className="text-red-700">{w[6]}</p>}
  </section>
}
