import { useEffect, useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'
import CommissionPanel from './CommissionPanel'

export default function ClientApprovals() {
  const { t, language } = useLanguage()
  const [data, setData] = useState({ total: 0, items: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true, pending = false
    async function refresh() {
      if (pending || document.visibilityState === 'hidden') return
      pending = true; setBusy(true)
      try {
        const result = await accountRequest(`/my/commission-approvals?offset=${offset}&limit=20`)
        if (active) { setData(result); setError(false) }
      } catch { if (active) setError(true) }
      finally { pending = false; if (active) setBusy(false) }
    }
    refresh()
    const timer = setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [offset, revision])
  const button = 'rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50'
  return <section className="mb-5 rounded-xl border border-teal-300 bg-white p-4" aria-label={t('Approval notifications')}>
    <div className="flex flex-wrap items-center justify-between gap-3"><button className={button} aria-expanded={open} onClick={() => setOpen(!open)}>{t('Approval notifications')} ({data.total})</button><button disabled={busy} className={button} onClick={() => setRevision(value => value + 1)}>{busy && <Spinner />}{t('Refresh approvals')}</button></div>
    <p role="status" className="mt-3 text-sm">{data.total > 0 ? `${t('Admin approved your requests. Seller contacts are unlocked.') } (${data.total})` : t('Approvals will appear here after admin confirms payment.')}</p>
    {error && <p role="alert" className="mt-2 text-red-700">{t('Unable to refresh approvals. Please try again.')}</p>}
    {open && <div className="mt-3 space-y-3">{data.items.map(item => <article key={item.request_id} className="rounded-lg border p-3">
      <h3 className="font-semibold">#{item.request_id} / {item.item_name}</h3>
      {item.approved_at && <p className="text-sm">{new Date(item.approved_at).toLocaleString(language)}</p>}
      <button className={`${button} mt-2`} onClick={() => setSelected(selected === item.request_id ? null : item.request_id)} aria-expanded={selected === item.request_id}>{t('View unlocked seller contacts')}</button>
      {selected === item.request_id && <CommissionPanel requestId={item.request_id} autoOpen />}
    </article>)}
      <div className="flex gap-3"><button className={button} disabled={busy || offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>{t('Previous')}</button><button className={button} disabled={busy || offset + 20 >= data.total} onClick={() => setOffset(offset + 20)}>{t('Next')}</button></div>
    </div>}
  </section>
}
