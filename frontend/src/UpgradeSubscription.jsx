import { useLanguage } from './language'
import { useState } from 'react'
import { accountRequest } from './api'
import { Spinner } from './LoadingStatus'

export default function UpgradeSubscription({ user }) {
  const { t } = useLanguage()
  const [prices, setPrices] = useState(null)
  const [plan, setPlan] = useState('standard')
  const [period, setPeriod] = useState('yearly')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <div className="w-full"><button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={async () => {
    setBusy(true); setMessage('')
    try { const result = await accountRequest('/subscription-plans'); setPrices(result); setPeriod(result.period) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }}>{busy && <Spinner />}{t("Upgrade subscription")}</button>
    {prices && <form className="my-3 space-y-3 rounded-lg bg-amber-50 p-3" onSubmit={async event => {
      event.preventDefault()
      if (!window.confirm(`${user.full_name}: ${t(plan)} / ${t(period === 'monthly' ? 'month' : 'year')} / ${prices.settings[plan]} RWF. ${t('Access will be blocked until admin confirms payment.')} ${t('Confirm upgrade?')}`)) return
      setBusy(true); setMessage('')
      try { const result = await accountRequest(`/admin/subscriptions/${user.user_id}/upgrade`, 'POST', { plan, period, revision: prices.revision }); setMessage(result.message); setPrices(null) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
    }}>
      <label className="block">{t("Higher plan")}<select disabled={busy} value={plan} onChange={event => setPlan(event.target.value)} className="ml-2 border p-2"><option value="standard">{t("Standard")}</option><option value="premium">{t("Premium")}</option></select></label>
      <label className="block">{t("Billing period")}<select disabled={busy} value={period} onChange={event => setPeriod(event.target.value)} className="ml-2 border p-2"><option value="monthly">{t("Monthly")}</option><option value="yearly">{t("Yearly")}</option></select></label>
      <p>{prices.settings[plan]} {t("RWF per")} {period === 'monthly' ? t('month') : t('year')}{t(". Access will be blocked until admin confirms payment.")}</p>
      <button disabled={busy} className="rounded-lg bg-amber-700 px-3 py-2 text-white">{busy && <Spinner />}{t("Upgrade and require payment")}</button><button type="button" disabled={busy} className="ml-3" onClick={() => setPrices(null)}>{t("Cancel")}</button>
    </form>}
    {message && <p role="status" className="mt-2 text-sm">{t(message)}</p>}
  </div>
}
