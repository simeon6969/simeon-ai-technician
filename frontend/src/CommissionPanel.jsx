import BrandName from './BrandName'
import { commissionStatuses, commissionEvents } from './commissionLabels'
import { useEffect, useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'

const button = 'rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50'

export default function CommissionPanel({ requestId, admin = false, autoOpen = false }) {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(autoOpen)
  const [error, setError] = useState('')
  const [counter, setCounter] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const path = `/item-requests/${requestId}/commission`
  useEffect(() => {
    if (!autoOpen) return
    let active = true
    accountRequest(path).then(result => { if (active) setData(result) }).catch(failure => { if (active) setError(failure.message) }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [autoOpen, path])
  async function send(action) {
    setBusy(true); setError('')
    try {
      const result = await accountRequest(action === 'refresh' || action === 'start' ? path : `${path}/action`, action === 'refresh' ? 'GET' : 'POST',
        action === 'refresh' || action === 'start' ? undefined : { action, revision: data.revision,
          ...(action === 'counter' ? { counter_percent: counter } : {}),
          ...(action === 'payment' ? { payment_reference: reference } : {}),
          ...(action === 'reject' ? { note } : {}) })
      setData(result); setCounter('')
      if (action === 'approve' || action === 'reject') window.dispatchEvent(new Event('commission-reviewed'))
    } catch (failure) { setError(t(failure.message)) } finally { setBusy(false) }
  }
  return <section className="mt-4 rounded-xl border border-teal-300 bg-teal-50 p-4">
    <button className={button} disabled={busy} onClick={() => send('refresh')}>{busy && <Spinner />}{t('Refresh item commission')}</button>
    {error && <p role="alert" className="my-2 text-red-700">{error}</p>}
    {data && <div className="mt-3 space-y-3" aria-live="polite">
      <p className="font-semibold"><BrandName /> ? {t('Seller information')}</p>
      <ol className="grid gap-2 text-sm sm:grid-cols-2" aria-label={t('Commission steps')}>
        {['1. Agree on the fee', '2. Pay by MoMo', '3. Admin confirms payment', '4. Seller information unlocked'].map((label, index) => {
          const step = { not_started: 0, negotiating: 0, awaiting_payment: 1, pending_review: 2, approved: 3 }[data.status] ?? 0
          return <li key={label} aria-current={step === index ? 'step' : undefined} className={`rounded-lg border p-2 ${step === index ? 'border-teal-700 bg-white font-bold text-teal-900' : 'border-transparent text-slate-600'}`}>{t(label)}</li>
        })}
      </ol>
      {data.status === 'not_started' ? <><p>{t(data.enabled ? 'Seller contacts stay locked until admin confirms the commission payment.' : 'Commission negotiations are not configured by admin yet')}</p>{data.enabled && <button disabled={busy} className={button} onClick={() => send('start')}>{t('Start negotiation')}</button>}</> : <>
        <p>{t('Commission payer')}: <strong>{t(data.payer === 'client' ? 'Requesting client' : 'Seller')}</strong></p>
        <p>{t('Listed price')}: {data.listed_price} {data.currency}</p>
        <p className="text-lg font-semibold">{t('My commission offer')}: {data.current_percent}% = {data.amount} {data.currency}</p>
        <p>{t('This fee is for access to seller information, separate from the item price.')}</p>
        <p>{t('Commission status')}: {t(commissionStatuses[data.status] || data.status)}</p>
        {data.status !== 'approved' && !data.is_payer && !admin && <p>{t('Waiting for the selected payer and admin payment confirmation.')}</p>}
        {data.is_payer && data.status === 'negotiating' && <>
          <p>{t('You can accept my offer or suggest a lower percentage. I can reduce it gradually within the approved limits.')}</p>
          <form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); send('counter') }}><label>{t('Your counteroffer (%)')}<input type="number" required min="0" max="100" step="0.01" disabled={busy} value={counter} onChange={event => setCounter(event.target.value)} className="ml-2 w-24 rounded border bg-white p-2" /></label><button disabled={busy} className={button}>{t('Negotiate')}</button></form>
          <button disabled={busy} className={button} onClick={() => send('accept')}>{t(Number(data.amount) === 0 ? 'Accept zero fee and request approval' : 'Accept fee and continue to payment')}</button>
        </>}
        {data.is_payer && data.status === 'awaiting_payment' && <form onSubmit={event => { event.preventDefault(); send('payment') }}>
          <div className="my-3 rounded-xl border-2 border-teal-700 bg-white p-4"><p className="font-semibold">{t('Pay the agreed commission via MoMo to')}</p><p className="my-2 break-all text-2xl font-bold text-teal-900">{data.momo_number}</p><p className="text-lg font-semibold">{data.amount} {data.currency}</p></div>
          <p>{t('Submitting a reference does not confirm payment. Admin verifies it manually.')}</p>
          <label className="my-3 block">{t('MoMo transaction reference')}<input required minLength={3} maxLength={200} value={reference} disabled={busy} onChange={event => setReference(event.target.value)} className="mt-1 block w-full rounded border bg-white p-2" /></label><button disabled={busy} className={button}>{t('Submit payment for review')}</button>
        </form>}
        {!admin && data.status === 'pending_review' && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">{t('Payment submitted. Wait for admin confirmation, then refresh this item to view seller information.')}</p>}
        {Number(data.current_percent) === 0 && <p>{t('No commission payment is due. Admin approval is still required to unlock contacts.')}</p>}
        {data.review_note && <p>{t('Admin review note')}: {data.review_note}</p>}
        {admin && <><p>{t('Minimum percentage')}: {data.minimum_percent}% / {t('Reduction per round')}: {data.reduction_percent}</p><p>{t('MoMo transaction reference')}: {data.payment_reference || t('Not provided')}</p></>}
        {admin && ['negotiating', 'awaiting_payment'].includes(data.status) && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">{t('Approval becomes available after the payer accepts the fee and submits payment for review.')}</p>}
        {admin && data.status === 'pending_review' && <>
          <label className="block">{t('Admin review note')}<textarea maxLength={2000} value={note} onChange={event => setNote(event.target.value)} className="block w-full rounded border bg-white p-2" /></label>
          <div className="flex flex-wrap gap-2"><button disabled={busy} className={button} onClick={() => { if (window.confirm(t('Confirm payment is verified and unlock seller contacts for this client?'))) send('approve') }}>{t('Confirm payment and unlock')}</button><button disabled={busy || !note.trim()} className={button} onClick={() => send('reject')}>{t('Return payment for correction')}</button></div>
        </>}
        {data.seller && <div className="rounded border bg-white p-3"><h4 className="font-bold">{t('Seller contacts unlocked')}</h4><p>{data.seller.name}</p>{data.seller.phone && <a className="block underline" href={`tel:${data.seller.phone}`}>{data.seller.phone}</a>}{data.seller.email && <a className="block break-all underline" href={`mailto:${data.seller.email}`}>{data.seller.email}</a>}</div>}
        <details><summary>{t('Negotiation history')}</summary><ol className="mt-2 space-y-2">{data.history.map((entry, index) => <li key={index}>{t(commissionEvents[entry.action] || entry.action)}: {entry.percent}% {entry.counter_percent != null && `(${t('Your counteroffer (%)')}: ${entry.counter_percent})`} {entry.note || ''}</li>)}</ol></details>
      </>}
    </div>}
  </section>
}

export function CommissionSettings() {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    let active = true
    accountRequest('/admin/commission-settings').then(result => { if (active) setDraft(result) }).catch(failure => { if (active) setError(failure.message) }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])
  async function request(method) {
    setBusy(true); setError(''); setSaved(false)
    try { setDraft(await accountRequest('/admin/commission-settings', method, method === 'PUT' ? draft : undefined)); setSaved(method === 'PUT') }
    catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  return <section className="rounded-xl bg-white p-6"><h2 className="text-2xl font-bold">{t('Set commission percentages')}</h2>
    <p className="my-3">{t('Changes apply to new negotiations. Existing offers keep their recorded terms.')}</p>
    <p className="my-3">{t('Review payments in Item requests. Approval confirms all required payments and unlocks contacts for that client only.')}</p>
    {!draft ? <button disabled={busy} className={button} onClick={() => request('GET')}>{busy && <Spinner />}{t('Load settings')}</button> : <form onSubmit={event => { event.preventDefault(); request('PUT') }} className="space-y-4">
      <label className="block"><input type="checkbox" checked={draft.enabled} disabled={busy} onChange={event => setDraft({ ...draft, enabled: event.target.checked })} /> {t('Enable commission negotiations')}</label>
      <label className="block">{t('Commission payer')}<select aria-label={t('Commission payer')} disabled={busy} value={draft.payer} onChange={event => setDraft({ ...draft, payer: event.target.value })} className="ml-3 rounded border p-2"><option value="client">{t('Requesting client')}</option><option value="seller">{t('Seller')}</option></select></label>
      {[['starting_percent', 'Starting percentage'], ['minimum_percent', 'Minimum percentage'], ['reduction_percent', 'Reduction per round']].map(([key, label]) => <label key={key} className="block">{t(label)}<input required type="number" min={key === 'minimum_percent' ? '0' : '0.01'} max="100" step="0.01" disabled={busy} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} className="ml-3 w-32 rounded border p-2" /></label>)}
      <p>{t('The reduction is measured in percentage points per round.')}</p>
      <label className="block">{t('MoMo number')}<input required pattern="[+]?[0-9]{9,15}" value={draft.momo_number} disabled={busy} onChange={event => setDraft({ ...draft, momo_number: event.target.value })} className="ml-3 rounded border p-2" /></label>
      <button disabled={busy} className={button}>{busy && <Spinner />}{t('Save changes')}</button>
    </form>}
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}{saved && <p role="status" className="mt-3">{t('Changes saved')}</p>}
  </section>
}
