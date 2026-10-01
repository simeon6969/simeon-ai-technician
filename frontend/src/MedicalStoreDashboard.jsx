import BrandMark from './BrandMark'
import { useEffect, useState } from 'react'
import { accountRequest, saleItemsRequest, getMySpareParts, deleteSparePart } from './api'
import { useLanguage } from './language'
import LanguageSwitcher from './LanguageSwitcher'
import { medicalCategories } from './medicalCategories'
import MedicalRecording from './MedicalRecording'
import StoreConversation from './StoreConversation'
import InventorySimeon from './InventorySimeon'
import SaleItems from './SaleItems'
import ItemMarket from './ItemMarket'
import MySubscription from './MySubscription'
import AccountRecovery from './AccountRecovery'
import OfflineStatus from './OfflineStatus'
import SparePartPosts, { PostSparePartButton } from './SparePartPosts'
import SparePartPrice from './SparePartPrice'
import FastDelivery from './FastDelivery'
import { Spinner } from './LoadingStatus'

const sections = [['overview', 'Overview', '01'], ['assistant', 'Ask S', '02'], ['consumables', 'Medical consumables', '03'], ['biomedical', 'Biomedical equipment', '04'], ['pharmacy', 'Pharmacy', '05'], ['parts', 'Spare parts', '06'], ['requests', 'Requests & marketplace', '07'], ['general', 'Other items', '08'], ['account', 'My account', '09']]

export default function MedicalStoreDashboard({ account, onHome, onLogout }) {
  const { t } = useLanguage()
  const [section, setSection] = useState('overview')
  const [recording, setRecording] = useState(null)
  const [revision, setRevision] = useState(0)
  const [items, setItems] = useState([])
  const [parts, setParts] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    Promise.all([saleItemsRequest('/my'), getMySpareParts(), accountRequest('/item-requests/')]).then(([items, parts, requests]) => {
      if (active) { setItems(items); setParts(parts); setRequests(requests); setError('') }
    }).catch(error => { if (active) setError(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])
  function refresh() { setLoading(true); setRevision(value => value + 1) }
  function navigate(key) { setSection(key); refresh() }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const soon = new Date(today); soon.setDate(soon.getDate() + 30)
  const alerts = items.flatMap(item => {
    const details = item.medical_details
    if (!details) return []
    const expiry = details.expiry_date ? new Date(`${details.expiry_date}T00:00:00`) : null
    const reasons = []
    if (expiry && expiry < today) reasons.push('Expired')
    else if (expiry && expiry <= soon) reasons.push('Expires within 30 days')
    if (details.quantity === 0) reasons.push('Out of stock')
    else if (details.reorder_level != null && details.quantity <= details.reorder_level) reasons.push('Reorder level reached')
    return reasons.length ? [{ ...item, reasons }] : []
  })
  const pending = requests.filter(row => row.seller_id === account.user_id && row.status === 'pending').length
  if (recording === 'parts') return <StoreConversation kind="part" account={account} onClose={() => { setRecording(null); navigate('parts') }} onSaved={refresh} />
  if (recording) return <MedicalRecording category={recording} account={account} onClose={() => { const category = recording; setRecording(null); navigate(category) }} onSaved={refresh} />
  const title = sections.find(([key]) => key === section)[1]
  return <div className="min-h-screen bg-[#f3f6f3] text-slate-900">
    <header className="border-b border-teal-900/10 bg-white px-4 py-4 sm:px-8"><div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-950 text-2xl font-bold text-lime-200"><BrandMark /></span><div><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">{t("S · Medical store")}</p><h1 className="break-words text-xl font-bold">{account.full_name}</h1></div></div><div className="flex flex-wrap items-center gap-4 text-sm"><LanguageSwitcher /><button onClick={onHome}>{t('Home')}</button><button onClick={onLogout}>{t('Logout')}</button></div></div></header>
    <div className="mx-auto grid max-w-screen-2xl gap-6 p-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-8">
      <nav aria-label={t("Medical store navigation")} className="flex gap-2 overflow-x-auto rounded-2xl bg-teal-950 p-3 text-white lg:sticky lg:top-4 lg:h-fit lg:flex-col">{sections.map(([key, label, number]) => <button key={key} onClick={() => navigate(key)} aria-current={section === key ? 'page' : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${section === key ? 'bg-lime-200 font-semibold text-teal-950' : 'hover:bg-white/10'}`}><span className="text-xs opacity-60">{number}</span>{t(label)}</button>)}</nav>
      <main className="min-w-0"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">{t("Medical inventory workspace")}</p><h2 className="mt-2 text-3xl font-bold tracking-tight">{t(title)}</h2></div><button disabled={loading} onClick={refresh} className="rounded-xl border bg-white px-4 py-2 text-sm">{loading && <Spinner />}{t('Refresh')}</button></div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{t(error)}</p>}
        {section === 'overview' && <>
          <section className="rounded-2xl bg-teal-950 p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-lime-200">{t("Your store, at a glance")}</p><h3 className="mt-3 text-2xl font-semibold">{t("What would you like to record today?")}</h3><p className="mt-3 max-w-2xl text-sm leading-relaxed text-teal-100">{t("Choose a department. S will guide you through the right questions for that stock.")}</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{Object.entries(medicalCategories).map(([key, label]) => <button key={key} onClick={() => setRecording(key)} className="rounded-xl border border-white/20 bg-white/10 p-4 text-left font-semibold transition hover:bg-white/20">{t(label)}<span aria-hidden="true" className="ml-2">＋</span></button>)}</div></section>
          <div className="my-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{[['Stored products', items.length], ['Posted products', items.filter(item => item.posted_at).length], ['Stock alerts', alerts.length], ['Pending requests', pending]].map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 text-left"><p className="text-sm text-slate-500">{t(label)}</p><p className="mt-2 text-3xl font-bold text-teal-900">{loading || error ? t('?') : count}</p></div>)}</div>
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><section id="stock-alerts" className="scroll-mt-5 rounded-2xl border bg-white p-5"><h3 className="text-lg font-bold">{t("Stock attention")}</h3><p className="mt-1 text-sm text-slate-500">{t("Expiry and reorder checks based on recorded stock details.")}</p>{loading ? <p role="status" className="mt-5"><Spinner />{t("Loading stock…")}</p> : !error && !alerts.length ? <p className="mt-5 rounded-lg bg-teal-50 p-4 text-sm text-teal-800">{t("No expiry or reorder alerts in your recorded stock.")}</p> : alerts.slice(0, 8).map(item => <button key={item.item_id} onClick={() => navigate(item.medical_category)} className="mt-3 block w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left"><strong className="block">{item.name}</strong><span className="text-sm text-amber-900">{item.reasons.map(t).join(' · ')}</span></button>)}{alerts.length > 8 && <p className="mt-3 text-sm">{t("Showing 8 of")} {alerts.length} {t("alerts. Review the inventory sections for more.")}</p>}</section>
          <section className="rounded-2xl border bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 font-bold text-teal-800"><BrandMark /></span><h3 className="mt-4 text-xl font-bold">{t("Your inventory assistant")}</h3><p className="my-3 text-sm leading-relaxed text-slate-600">{t("Ask S about stored products, prices, quantities, or available medical supplies.")}</p><button onClick={() => navigate('assistant')} className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white">{t("Ask S →")}</button><hr className="my-5 border-slate-100" /><p className="text-sm text-slate-500">{t("Products appear to clients after you post them. Review stock details before posting.")}</p></section></div>
        </>}
        {section === 'assistant' && <InventorySimeon account={account} />}
        {(section in medicalCategories || section === 'general') && <SaleItems key={`${section}-${revision}`} medical initialCategory={section} hideCategoryNavigation onRecordMedical={setRecording} />}
        {section === 'requests' && <ItemMarket />}
        {section === 'account' && <><MySubscription subscription={account.subscription} /><AccountRecovery setup /><OfflineStatus account={account} /></>}
        {section === 'parts' && <><OfflineStatus account={account} /><button onClick={() => setRecording('parts')} className="rounded-xl bg-teal-700 px-5 py-3 text-white">{t('Store Spare Part')}</button><div className="my-5 grid gap-4 md:grid-cols-2">{parts.map(part => <article key={part.spare_part_id} className="rounded-xl border bg-white p-4"><h3 className="font-semibold">{part.part_name}</h3><SparePartPrice part={part} /><p>{part.description}</p>{part.photo_data && <img src={part.photo_data} alt={part.part_name} className="my-3 max-h-40" />}<PostSparePartButton part={part} onPosted={refresh} /><button disabled={busy} onClick={async () => { if (!window.confirm(t('Delete this spare part? Existing requests for it will also be removed.'))) return; setBusy(true); try { await deleteSparePart(part.spare_part_id); refresh() } catch (error) { setError(error.message) } finally { setBusy(false) } }} className="ml-3 text-red-700">{t('Delete')}</button><FastDelivery name={part.part_name} /></article>)}</div><SparePartPosts /></>}
      </main>
    </div>
  </div>
}
