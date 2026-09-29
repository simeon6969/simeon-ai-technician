import FastDelivery from './FastDelivery'
import { Spinner } from './LoadingStatus'
import { useEffect, useState } from 'react'
import { accountRequest, getPublicSaleItems } from './api'
import { useLanguage } from './language'

export default function ItemMarket() {
  const { t, language } = useLanguage()
  const [field, setField] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [requests, setRequests] = useState([])
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    getPublicSaleItems(query, offset, controller.signal, field).then(data => {
      if (controller.signal.aborted) return
      setItems(data.items); setTotal(data.total); setError('')
    }).catch(failure => { if (!controller.signal.aborted) setError(failure.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [query, field, offset, revision])
  useEffect(() => {
    let active = true
    accountRequest('/item-requests/').then(rows => { if (active) setRequests(rows) }).catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [revision])
  async function act(action) {
    setBusy(true); setNotice(''); setError('')
    try { await action(); setNotice(t('Request saved')); setRevision(value => value + 1) }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  return <section className="my-8 rounded-2xl bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-2xl font-bold">{t('Browse and request items')}</h2>
    <form className="mb-5 flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); setLoading(true); setQuery(search); setOffset(0); setRevision(value => value + 1) }}>
      <label className="sr-only" htmlFor="market-field">{t('Account field')}</label>
      <select id="market-field" value={field} onChange={event => { setLoading(true); setField(event.target.value); setOffset(0) }} className="rounded-lg border p-3">
        <option value="">{t('All fields')}</option>{['medical', 'it', 'electrical', 'mechanical'].map(value => <option key={value} value={value}>{t(value)}</option>)}
      </select>
      <input aria-label={t('Search')} value={search} onChange={event => setSearch(event.target.value)} className="rounded-lg border p-3" />
      <button className="rounded-lg bg-teal-700 px-4 py-2 text-white">{t('Search')}</button>
    </form>
    {error && <p role="alert" className="my-3 text-red-700">{t(error)}</p>}{notice && <p role="status" className="my-3 text-teal-700">{notice}</p>}
    {loading ? <p role="status"><Spinner />{t('Loading...')}</p> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.listing_key} className="rounded-xl border p-4">
      {item.photo_data && <img src={item.photo_data} alt={item.name} className="mb-3 h-40 w-full object-contain" />}
      <h3 className="font-semibold">{item.name}</h3><p className="text-sm text-slate-600">{t(item.account_field || 'Not provided')}</p>
      <p className="my-2 font-semibold">{item.price == null ? t('Price not provided') : new Intl.NumberFormat(language, { style: 'currency', currency: item.currency || 'RWF' }).format(Number(item.price))}</p>
      <p className="mb-3 whitespace-pre-wrap text-sm">{item.description}</p>
      <textarea aria-label={`${t('Optional request note')} — ${item.name}`} maxLength={2000} value={notes[item.listing_key] || ''} onChange={event => setNotes({ ...notes, [item.listing_key]: event.target.value })} className="w-full rounded-lg border p-2" />
      <button disabled={busy || item.availability_status === 'unavailable'} onClick={() => act(() => accountRequest('/item-requests/', 'POST', { item_type: item.item_type, item_id: item.item_id, notes: notes[item.listing_key] || null }))} className="mt-2 rounded-lg bg-teal-700 px-4 py-2 text-white disabled:opacity-50">{busy && <Spinner />}{t('Request item')}</button>
    <FastDelivery name={item.name} /></article>)}</div>}
    {!loading && items.length === 0 && <p>{t('No items found')}</p>}
    <div className="mt-4 flex gap-3"><button disabled={offset === 0 || loading} onClick={() => { setLoading(true); setOffset(Math.max(0, offset - 12)) }}>{t('Previous')}</button><button disabled={offset + 12 >= total || loading} onClick={() => { setLoading(true); setOffset(offset + 12) }}>{t('Next')}</button></div>
    <h2 className="mb-3 mt-8 text-xl font-semibold">{t('Item requests')}</h2>
    {requests.map(row => <article key={row.request_id} className="mb-3 rounded-xl border p-4">
      <h3 className="font-semibold">{row.item_name} · {t(row.status)}</h3>
      <p>{t('Requester:')} {row.requester_name} {row.requester_phone}</p>{row.seller_name && <p>{t('Seller')}: {row.seller_name} {row.seller_phone}</p>}<p>{row.notes}</p>
      {row.can_manage && <select aria-label={`${t('Request status')} #${row.request_id}`} disabled={busy} value={row.status} onChange={event => act(() => accountRequest(`/item-requests/${row.request_id}`, 'PATCH', { status: event.target.value }))} className="mt-3 rounded-lg border p-2">{['pending', 'accepted', 'declined', 'fulfilled'].map(value => <option key={value} value={value}>{t(value)}</option>)}</select>}
    <FastDelivery name={row.item_name} /></article>)}
  </section>
}
