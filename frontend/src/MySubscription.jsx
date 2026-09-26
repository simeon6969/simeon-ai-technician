import { useLanguage } from './language'
import { useState } from 'react'
import { SubscriptionChoices } from './Subscriptions'
import { accountRequest } from './api'
import { Spinner } from './LoadingStatus'

export function SubscriptionSetup({ onDone, onLogout }) {
  const { t } = useLanguage()
  const [selection, setSelection] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return <main className="mx-auto max-w-xl p-6"><h1 className="mb-3 text-2xl font-bold">{t("Choose your subscription")}</h1><p className="mb-5">{t("Your account was created before a subscription was selected. Review the plans to continue. Your existing records will stay in your account.")}</p>
    <SubscriptionChoices value={selection} onChange={setSelection} />
    {error && <p role="alert" className="my-3 text-red-700">{t(error)}</p>}
    <button disabled={busy || !selection?.accepted_terms} className="rounded-lg bg-teal-700 px-4 py-3 text-white disabled:opacity-50" onClick={async () => {
      if (busy) return
      setBusy(true); setError('')
      try { const subscription = await accountRequest('/users/subscription', 'PUT', selection); onDone(subscription) } catch (error) { setError(error.message) } finally { setBusy(false) }
    }}>{busy && <Spinner />}{t("Save subscription and continue")}</button><button disabled={busy} onClick={onLogout} className="ml-4">{t("Logout")}</button>
  </main>
}

export default function MySubscription({ subscription }) {
  const { t } = useLanguage()
  if (!subscription) return null
  return <section aria-label={t("My subscription")} className="mb-6 rounded-xl border border-teal-200 bg-white p-4"><h2 className="font-semibold">{t("My subscription")}</h2><p className="mt-2 capitalize">{t(subscription.plan)} · {subscription.amount} {subscription.currency} / {subscription.period === 'monthly' ? t('month') : t('year')}</p><p>{t("Payment:")} {t(subscription.payment_status.replaceAll('_', ' '))}</p><p className="mt-2 text-sm text-slate-600">{t("All current services are included. Contact admin to change your plan.")}</p></section>
}
