import { useState } from 'react'
import { accountRequest } from './api'
import { Spinner } from './LoadingStatus'

export default function UpgradeSubscription({ user }) {
  const [prices, setPrices] = useState(null)
  const [plan, setPlan] = useState('standard')
  const [period, setPeriod] = useState('yearly')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <div className="w-full"><button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={async () => {
    setBusy(true); setMessage('')
    try { const result = await accountRequest('/subscription-plans'); setPrices(result); setPeriod(result.period) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }}>{busy && <Spinner />}Upgrade subscription</button>
    {prices && <form className="my-3 space-y-3 rounded-lg bg-amber-50 p-3" onSubmit={async event => {
      event.preventDefault()
      if (!window.confirm(`Upgrade ${user.full_name} to ${plan} for ${prices.settings[plan]} RWF per ${period === 'monthly' ? 'month' : 'year'}? Their account will be blocked until payment is confirmed by admin.`)) return
      setBusy(true); setMessage('')
      try { const result = await accountRequest(`/admin/subscriptions/${user.user_id}/upgrade`, 'POST', { plan, period, revision: prices.revision }); setMessage(result.message); setPrices(null) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
    }}>
      <label className="block">Higher plan<select disabled={busy} value={plan} onChange={event => setPlan(event.target.value)} className="ml-2 border p-2"><option value="standard">Standard</option><option value="premium">Premium</option></select></label>
      <label className="block">Billing period<select disabled={busy} value={period} onChange={event => setPeriod(event.target.value)} className="ml-2 border p-2"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
      <p>{prices.settings[plan]} RWF per {period === 'monthly' ? 'month' : 'year'}. Access will be blocked until admin confirms payment.</p>
      <button disabled={busy} className="rounded-lg bg-amber-700 px-3 py-2 text-white">{busy && <Spinner />}Upgrade and require payment</button><button type="button" disabled={busy} className="ml-3" onClick={() => setPrices(null)}>Cancel</button>
    </form>}
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </div>
}
