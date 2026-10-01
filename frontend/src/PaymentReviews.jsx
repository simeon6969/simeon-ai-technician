import { commissionStatuses } from './commissionLabels'
import { useState } from 'react'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'
import CommissionPanel from './CommissionPanel'

export default function PaymentReviews({ queue, offset, onPage, activity = false }) {
  const { t, language } = useLanguage()
  const [selected, setSelected] = useState(null)
  const button = 'rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50'
  return <section className="rounded-2xl bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">{t(activity ? 'Commission requests' : 'Payments awaiting review')}: {queue.total ?? '...'}</h3><button disabled={queue.loading} onClick={queue.refresh} className={button}>{queue.loading && <Spinner />}{t('Refresh payments')}</button></div>
    <p className="my-3 text-sm text-slate-600">{t('Oldest submissions first. Opening a notification does not clear it.')}</p>
    <p className="my-3 text-sm text-slate-600">{t('Refreshes every 30 seconds while this dashboard is visible.')}</p>
    {queue.error && <p role="alert" className="my-3 text-red-700">{t('Unable to refresh payment notifications. Previously loaded reminders are kept.')}</p>}
    {!queue.loading && !queue.error && queue.total === 0 && <p className="py-6">{t(activity ? 'No matching records' : 'No payments awaiting review')}</p>}
    <div className="space-y-4">{queue.items.map(item => <article key={item.notification_id} className="rounded-xl border p-4">
      <h4 className="font-semibold">#{item.request_id} / {item.item_name}</h4>
      {activity && <><p>{t('Requesting client')}: {item.client_name}</p><p>{t('Seller')}: {item.seller_name}</p><p>{t('Commission status')}: {t(commissionStatuses[item.status] || item.status)}</p></>}
      <p className="mt-2">{t('Commission payer')}: {item.payer_name} ({t(item.payer === 'client' ? 'Requesting client' : 'Seller')})</p>
      <p>{item.current_percent}% = {item.amount} {item.currency}</p>
      <p>{t(activity ? 'Request created' : 'Submitted for review')}: <time dateTime={item.submitted_at}>{new Date(item.submitted_at).toLocaleString(language)}</time></p>
      <p className="break-all">{t('MoMo transaction reference')}: {item.payment_reference || t(Number(item.amount) === 0 ? 'No commission payment is due. Admin approval is still required to unlock contacts.' : 'Not provided')}</p>
      <button className={`${button} mt-3`} aria-expanded={selected === item.notification_id} onClick={() => setSelected(selected === item.notification_id ? null : item.notification_id)}>{t(activity && item.status === 'pending_review' ? 'Review payment and unlock' : activity ? 'Open negotiation' : 'Review this payment')}</button>
      {selected === item.notification_id && <CommissionPanel key={item.notification_id} requestId={item.request_id} admin autoOpen />}
    </article>)}</div>
    <div className="mt-5 flex gap-3"><button className={button} disabled={offset === 0 || queue.loading} onClick={() => onPage(Math.max(0, offset - 50))}>{t('Previous')}</button><button className={button} disabled={queue.total == null || offset + 50 >= queue.total || queue.loading} onClick={() => onPage(offset + 50)}>{t('Next')}</button></div>
  </section>
}
