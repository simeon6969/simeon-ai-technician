import { useState } from 'react'
import { useLanguage } from './language'
import { CommissionSettings } from './CommissionPanel'
import PaymentReviews from './PaymentReviews'
import usePaymentReviews from './usePaymentReviews'

export default function CommissionWorkspace() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('fees')
  const [status, setStatus] = useState('pending_review')
  const [offset, setOffset] = useState(0)
  const queue = usePaymentReviews(offset, status)
  return <section>
    <p className="mb-4 rounded-xl bg-teal-50 p-4 text-teal-900">{t('Set your starting percentage, minimum percentage and reduction per round. Review submitted payments to unlock seller information.')}</p>
    <div className="mb-5 flex flex-wrap gap-3">
      <button aria-pressed={tab === 'fees'} onClick={() => setTab('fees')} className="rounded-lg border bg-white px-4 py-3 font-semibold">{t('Review payments and unlock seller info')}</button>
      <button aria-pressed={tab === 'settings'} onClick={() => setTab('settings')} className="rounded-lg border bg-white px-4 py-3 font-semibold">{t('Set commission percentages')}</button>
    </div>
    {tab === 'settings' ? <CommissionSettings /> : <>
      <label className="mb-4 block">{t('Commission status')}<select className="ml-3 rounded-lg border p-3" value={status} onChange={event => { setStatus(event.target.value); setOffset(0) }}>
        {[['pending_review', 'Payments awaiting review'], ['negotiating', 'Negotiating'], ['awaiting_payment', 'Awaiting payment'], ['approved', 'Approved'], ['all', 'All negotiations']].map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
      </select></label>
      <PaymentReviews key={status} queue={queue} offset={offset} onPage={setOffset} activity />
    </>}
  </section>
}
