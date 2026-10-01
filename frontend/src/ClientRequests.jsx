import { useEffect, useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'
import FastDelivery from './FastDelivery'
import HomeItemRequest from './HomeItemRequest'

export default function ClientRequests() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    const load = () => {
      if (document.hidden) return
      accountRequest('/item-requests/').then(data => { if (active) { setRows(data.filter(row => !row.incoming)); setError('') } }).catch(failure => { if (active) setError(failure.message) }).finally(() => { if (active) setLoading(false) })
    }
    load()
    const timer = setInterval(load, 30000)
    window.addEventListener('focus', load)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', load) }
  }, [revision])
  return <section className="rounded-2xl bg-white p-5">
    <div className="mb-4 flex justify-between gap-3"><h2 className="text-xl font-bold">{t('My requests')}</h2><button disabled={loading} onClick={() => { setLoading(true); setRevision(value => value + 1) }} className="rounded border px-4 py-2">{loading && <Spinner />}{t('Refresh')}</button></div>
    {error && <p role="alert" className="my-3 text-red-700">{t(error)}</p>}
    {!loading && !error && !rows.length && <p>{t('No matching records')}</p>}
    <div className="grid gap-4 md:grid-cols-2">{rows.map(row => <article key={row.request_id} className="rounded-xl border p-4">
      <h3 className="font-semibold">{row.item_name}</h3>
      <p>{t('Request status')}: {t(row.status)}</p>
      <HomeItemRequest showCommission existingRequestId={row.request_id} item={{ item_type: row.item_type, item_id: row.item_id }} />
      <FastDelivery name={row.item_name} />
      <button disabled={busy === row.request_id} className="mt-3 rounded border border-red-200 px-4 py-2 text-red-700" onClick={async () => {
        if (!window.confirm(t('Remove this request? Pending item requests will be cancelled. Payment history is retained for admin review.'))) return
        setBusy(row.request_id); setError('')
        try { await accountRequest(`/item-requests/${row.request_id}`, 'DELETE'); setRows(previous => previous.filter(item => item.request_id !== row.request_id)) }
        catch (failure) { setError(failure.message) } finally { setBusy(null) }
      }}>{busy === row.request_id && <Spinner />}{t('Delete')}</button>
    </article>)}</div>
  </section>
}
