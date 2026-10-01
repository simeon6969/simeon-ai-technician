import { saveRequestIntent } from './requestIntent'
import CommissionPanel from './CommissionPanel'
import { useId, useRef, useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'

export default function HomeItemRequest({ item, loggedIn = true, onLogin, notes, onRequested, existingRequestId = null, showCommission = false }) {
  const { t } = useLanguage()
  const menuId = useId()
  const lock = useRef(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [requestId, setRequestId] = useState(existingRequestId)
  const [info, setInfo] = useState(showCommission)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  async function choose(sellerInfo) {
    if (lock.current) return
    if (!loggedIn) { saveRequestIntent(item); onLogin?.(); return }
    lock.current = true; setBusy(true); setError(''); setOpen(false)
    try {
      let id = requestId
      if (!id) {
        const result = await accountRequest('/item-requests/', 'POST', { item_type: item.item_type, item_id: item.item_id, notes: notes || null })
        id = result.request_id
        setRequestId(id)
        onRequested?.(result)
      }
      setInfo(sellerInfo || showCommission)
      if (!sellerInfo) setSent(true)
    } catch (failure) { setError(failure.message) }
    finally { lock.current = false; setBusy(false) }
  }
  return <div className="my-2" onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
    <button type="button" aria-expanded={open} aria-controls={menuId} disabled={busy || item.availability_status === 'unavailable'} onClick={() => setOpen(value => !value)} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
      {busy && <Spinner />}{t('Request')} <span aria-hidden="true">▾</span>
    </button>
    {open && <div id={menuId} className="mt-2 flex flex-col gap-1 rounded-lg border bg-white p-2 text-slate-900 shadow-sm">
      <button type="button" disabled={busy} onClick={() => choose(false)} className="rounded p-3 text-left hover:bg-teal-50">{t('Request to seller')}</button>
      <button type="button" disabled={busy} onClick={() => choose(true)} className="rounded p-3 text-left hover:bg-teal-50">{t('Request seller info')}</button>
    </div>}
    {sent && <p role="status" className="mt-2 text-sm text-teal-700">{t('Request saved')}</p>}
    {info && requestId && <CommissionPanel key={requestId} requestId={requestId} autoOpen />}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{t(error)}</p>}
  </div>
}
