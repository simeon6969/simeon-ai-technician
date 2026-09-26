import { useLanguage } from './language'
import { useEffect, useState } from 'react'
import { accountRequest } from './api'
import { Spinner } from './LoadingStatus'

const input = 'mt-1 block w-full rounded-lg border p-3'
const format = (value, currency) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${currency}`

export function SubscriptionChoices({ value, onChange }) {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    accountRequest('/subscription-plans').then(result => { if (active) { setData(result); setError('') } }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [reload])
  if (error) return <div role="alert">{t(error)}<button onClick={() => setReload(reload + 1)}>{t("Retry prices")}</button></div>
  if (!data) return <p role="status"><Spinner />{t("Loading plans…")}</p>
  const currency = value?.currency || 'RWF'
  const plan = value?.plan || 'free'
  const quote = data.plans.find(item => item.plan === plan && item.currency === currency)
  function choose(changes) { onChange({ plan, currency, revision: data.revision, accepted_terms: false, ...changes }) }
  return <section className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
    <h3 className="font-semibold">{t("Subscription")}</h3>
    <label className="mt-3 block">{t("Display currency")}<select value={currency} onChange={event => choose({ currency: event.target.value })} className={input}>{Object.keys(data.settings.rates).map(code => <option key={code}>{code}</option>)}</select></label>
    <div className="my-3 space-y-2">{data.plans.filter(item => item.currency === currency).map(item => <label key={item.plan} className="flex items-center gap-3 rounded-lg bg-white p-3"><input type="radio" name="subscription" checked={item.plan === plan} onChange={() => choose({ plan: item.plan })} /><span className="capitalize">{t(item.plan)} — {format(item.amount, currency)} / {data.period === 'monthly' ? t('month') : t('year')}</span></label>)}</div>
    <p className="text-sm">{t("All plans include all services in this version. An admin upgrade may require payment confirmation before account access. No automatic renewal or automatic charge. Service differences may be introduced in a future update.")}</p>
    {plan !== 'free' && <p className="mt-2 text-sm">{t("Pay")} {format(quote?.amount_rwf || 0, 'RWF')} {t("by MoMo to")} <strong>{data.momo_number}</strong>{t(". Admin confirms payment manually; choosing a plan does not confirm payment.")}</p>}
    {currency !== 'RWF' && <p className="mt-2 text-xs text-slate-600">{t("Converted display estimate. MoMo payment is in RWF.")} {data.settings.rates_note}</p>}
    <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={!!value?.accepted_terms && value.revision === data.revision} onChange={event => choose({ accepted_terms: event.target.checked })} />{t("I have reviewed the subscription price and payment terms.")}</label>
  </section>
}

export function SubscriptionAdmin() {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(null)
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([accountRequest('/subscription-plans'), accountRequest('/admin/subscriptions')]).then(([data, rows]) => { if (active) { setDraft(data.settings); setRows(rows) } }).catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [])
  if (!draft) return <p role="status">{message || <><Spinner />{t("Loading subscriptions…")}</>}</p>
  return <section className="space-y-5 rounded-xl bg-white p-5">
    <h2 className="text-xl font-bold">{t("Subscriptions")}</h2>
    <p>{t("All plans retain every service; accounts upgraded by admin require confirmed payment. Changes apply to new selections; existing quoted prices stay unchanged. Free remains 0 RWF.")}</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage('')
      try { const result = await accountRequest('/admin/subscription-plans', 'PUT', draft); setDraft(result.settings); setMessage('Subscription settings saved.') } catch (error) { setMessage(error.message) } finally { setBusy(false) }
    }}>
      <label>{t("Default billing period")}<select value={draft.period || 'yearly'} disabled={busy} onChange={event => setDraft({ ...draft, period: event.target.value })} className={input}><option value="monthly">{t("Monthly")}</option><option value="yearly">{t("Yearly")}</option></select></label>
      {['standard', 'premium'].map(plan => <label key={plan} className="block capitalize">{t(plan)} / {draft.period === 'monthly' ? t('month') : t('year')} (RWF)<input type="number" min="0.01" step="0.01" required disabled={busy} value={draft[plan]} onChange={event => setDraft({ ...draft, [plan]: event.target.value })} className={input} /></label>)}
      <label className="block">{t("MoMo number")}<input required disabled={busy} value={draft.momo_number} onChange={event => setDraft({ ...draft, momo_number: event.target.value })} className={input} /></label>
      <h3 className="font-semibold">{t("Conversion rates")}</h3><p className="text-sm">{t("Enter how many RWF equal 1 unit of each currency. Uncheck a currency to hide it at signup. These rates are maintained here, not updated automatically.")}</p>
      {['USD', 'EUR', 'KES', 'TZS', 'UGX'].map(code => <div key={code} className="flex items-center gap-3"><label><input type="checkbox" disabled={busy} checked={code in draft.rates} onChange={event => { const rates = { ...draft.rates }; if (event.target.checked) rates[code] = ''; else delete rates[code]; setDraft({ ...draft, rates }) }} /> {code}</label>{code in draft.rates && <label className="flex-1">1 {code} {t("in RWF")}<input type="number" min="0.000001" step="any" required disabled={busy} value={draft.rates[code]} onChange={event => setDraft({ ...draft, rates: { ...draft.rates, [code]: event.target.value } })} className={input} /></label>}</div>)}
      <label className="block">{t("Rate date / source note")}<input maxLength={300} value={draft.rates_note} onChange={event => setDraft({ ...draft, rates_note: event.target.value })} className={input} /></label>
      <button disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 text-white">{busy && <Spinner />}{t("Save subscription settings")}</button>
    </form>
    {message && <p role="status">{t(message)}</p>}
    <h3 className="text-lg font-bold">{t("Account subscriptions")}</h3>
    {rows.map(row => <article key={row.user_id} className="rounded-lg border p-3"><p className="font-semibold">{row.full_name}</p><p>{row.email} · {t(row.plan)} · {format(row.amount, row.currency)}  / {t(row.period === 'monthly' ? 'month' : 'year')} ·  {format(row.amount_rwf, 'RWF')}</p>{row.plan === 'free' ? <p>{t("No payment required")}</p> : <label>{t("Payment status")}<select disabled={busy} value={row.payment_status} className={input} onChange={async event => {
      const status = event.target.value
      if (status === 'paid' && !window.confirm(t('Confirm you have verified this MoMo payment?'))) return
      setBusy(true); setMessage('')
      try { await accountRequest(`/admin/subscriptions/${row.user_id}`, 'PATCH', { status }); setRows(previous => previous.map(item => item.user_id === row.user_id ? { ...item, payment_status: status } : item)) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
    }}>{(row.payment_required ? ['pending', 'paid'] : ['pending', 'paid', 'waived']).map(status => <option key={status} value={status}>{t(status)}</option>)}</select></label>}</article>)}
  </section>
}
