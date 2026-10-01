import ItemRequestStatus from './ItemRequestStatus'
import { medicalCategories } from './medicalCategories'
import { MedicalStockFields, MedicalStockSummary } from './MedicalStock'
import FastDelivery from './FastDelivery'
import PhotoSizeOption from './PhotoSizeOption'
import { preparePhoto } from './preparePhoto'
import { Spinner } from './LoadingStatus'
import { useEffect, useState } from 'react'
import { saleItemsRequest } from './api'
import { useLanguage } from './language'

const labels = {
  en: ['Items for sale', 'Store an item', 'View sale posts', 'My items', 'What is the equipment or item name?', 'Describe its condition, model, location and other details.', 'What is the selling price?', 'Which currency?', 'Upload a photo of the item.', 'Next', 'Back', 'Review and save', 'Save item', 'Post', 'No items yet.', 'Delete this item and its post?', 'Please enter a valid answer.', 'Unable to update or load sale items.', 'Saved successfully.'],
  rw: ['Ibintu bigurishwa', 'Bika ikintu', 'Reba ibigurishwa', 'Ibintu byanjye', 'Igikoresho cyangwa ikintu cyitwa gute?', 'Sobanura uko kimeze, ubwoko, aho kiri n’ibindi.', 'Igiciro ni angahe?', 'Ni irihe faranga?', 'Shyiraho ifoto y’ikintu.', 'Komeza', 'Subira inyuma', 'Suzuma ubike', 'Bika ikintu', 'Tangaza', 'Nta bintu biraboneka.', 'Usibe iki kintu n’itangazo ryacyo?', 'Andika igisubizo gikwiye.', 'Kubika cyangwa kubona ibigurishwa byanze.', 'Byabitswe neza.'],
  fr: ['Articles à vendre', 'Enregistrer un article', 'Voir les annonces', 'Mes articles', 'Quel est le nom de l’équipement ou de l’article ?', 'Décrivez son état, modèle, emplacement et autres détails.', 'Quel est le prix de vente ?', 'Quelle devise ?', 'Ajoutez une photo de l’article.', 'Suivant', 'Retour', 'Vérifier et enregistrer', 'Enregistrer l’article', 'Publier', 'Aucun article pour le moment.', 'Supprimer cet article et son annonce ?', 'Veuillez saisir une réponse valide.', 'Impossible de charger ou modifier les articles.', 'Enregistré avec succès.'],
  sw: ['Vitu vya kuuza', 'Hifadhi kitu', 'Tazama matangazo', 'Vitu vyangu', 'Kifaa au kitu kinaitwaje?', 'Eleza hali, modeli, mahali na maelezo mengine.', 'Bei ya kuuza ni kiasi gani?', 'Sarafu gani?', 'Pakia picha ya kitu.', 'Endelea', 'Rudi', 'Kagua na uhifadhi', 'Hifadhi kitu', 'Chapisha', 'Bado hakuna vitu.', 'Ufute kitu hiki na tangazo lake?', 'Tafadhali weka jibu sahihi.', 'Imeshindwa kupakia au kubadilisha vitu.', 'Imehifadhiwa.'],
}
const empty = { name: '', description: '', price: '', currency: 'RWF', photo_data: '' }
const fields = ['name', 'description', 'price', 'currency', 'photo_data']

export default function SaleItems({ medical = false, onRecordMedical, initialCategory = 'consumables', hideCategoryNavigation = false }) {
  const { t, language } = useLanguage()
  const w = labels[language] || labels.en
  const [category, setCategory] = useState(initialCategory)
  const [editingStock, setEditingStock] = useState(null)
  const [items, setItems] = useState([])
  const [board, setBoard] = useState(false)
  const [total, setTotal] = useState(0)
  const [draft, setDraft] = useState(null)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [compressPhoto, setCompressPhoto] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setBusy(true); setError(''); setItems([])
      try {
        const result = await saleItemsRequest(board ? '/posts' : '/my')
        if (active) { setItems(board ? result.items : result); setTotal(board ? result.total : result.length) }
      } catch (failure) { if (active) setError(failure.message || 'load') }
      finally { if (active) setBusy(false) }
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [board, reload])

  async function upload(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPEG, PNG, or WebP image.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be 5 MB or smaller.'); return }
    setBusy(true); setError('')
    try {
      const data = await preparePhoto(file, compressPhoto)
      setDraft((value) => ({ ...value, photo_data: data }))
    } catch { setError('Unable to read the photo.') }
    finally { setBusy(false) }
  }

  async function save() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const created = await saleItemsRequest('/', 'POST', draft)
      setItems(previous => [{ ...created, request_status: 'non_requested', active_request_count: 0 }, ...previous]); setTotal(value => value + 1)
      setDraft(null); setNotice(true); setBoard(false)
    } catch (failure) { setError(failure.message || 'load') }
    finally { setBusy(false) }
  }

  async function action(item, remove) {
    if (remove && !window.confirm(w[15])) return
    setBusy(true); setError('')
    try {
      const result = await saleItemsRequest(`/${item.item_id}${remove ? '' : '/post'}`, remove ? 'DELETE' : 'POST')
      setItems((previous) => remove ? previous.filter((value) => value.item_id !== item.item_id) : previous.map((value) => value.item_id === item.item_id ? { ...value, ...result } : value))
    } catch (failure) { setError(failure.message || 'load') }
    finally { setBusy(false) }
  }

  const visibleItems = items.filter(item => !medical || board || (category === 'general' ? !item.medical_category : item.medical_category === category))
  return <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
    <h3 className="text-2xl font-bold text-slate-900">{medical ? t('Medical store inventory') : w[0]}</h3>
    {medical && !hideCategoryNavigation && <div className="my-4 flex flex-wrap gap-2">{Object.entries({ ...medicalCategories, general: 'Other items' }).map(([key, label]) => <button key={key} disabled={busy || !!draft || !!editingStock} aria-pressed={category === key} onClick={() => { setCategory(key); if (key !== 'general' && onRecordMedical) onRecordMedical(key) }} className={`rounded-xl border px-4 py-3 ${category === key ? 'bg-teal-700 text-white' : ''}`}>{t(label)}</button>)}</div>}
    {medical && !hideCategoryNavigation && <label className="my-3 block text-sm">{t("View saved inventory")}<select value={category} disabled={busy || !!draft} onChange={event => setCategory(event.target.value)} className="ml-3 rounded-lg border p-2">{Object.entries({ ...medicalCategories, general: 'Other items' }).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></label>}
    <div className="my-4 flex flex-wrap gap-3">
      <button disabled={busy || !!draft} onClick={() => { if (medical && category !== 'general' && onRecordMedical) { onRecordMedical(category); return } setDraft({ ...empty, ...(medical && category !== 'general' ? { medical_category: category, medical_details: { quantity: 0, unit: '' } } : {}) }); setStep(0); setError(''); setNotice(false) }} className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{w[1]}</button>
      <button disabled={busy || !!draft} onClick={() => { setBoard(!board); setNotice(false) }} className="rounded-xl border border-slate-300 px-4 py-2">{board ? w[3] : w[2]}</button>
      <button disabled={busy || !!draft} onClick={() => setReload((value) => value + 1)} className="rounded-xl border border-slate-300 px-4 py-2">{t('Refresh')}</button>
    </div>
    {editingStock && <form className="my-4 rounded-xl border p-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('')
      try { const updated = await saleItemsRequest(`/${editingStock.item_id}/medical-stock`, 'PATCH', editingStock.medical_details); setItems(previous => previous.map(item => item.item_id === updated.item_id ? { ...item, ...updated } : item)); setEditingStock(null) } catch (failure) { setError(failure.message || 'load') } finally { setBusy(false) }
    }}><h4>{editingStock.name}</h4><MedicalStockFields category={editingStock.medical_category} value={editingStock.medical_details} disabled={busy} onChange={medical_details => setEditingStock({ ...editingStock, medical_details })} /><button disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 text-white">{busy && <Spinner />}{t("Save stock details")}</button><button type="button" disabled={busy} onClick={() => setEditingStock(null)} className="ml-3">{t("Cancel")}</button></form>}
    {notice && <p role="status" className="my-3 text-green-700">{w[18]}</p>}
    {draft && <div className="my-6 rounded-xl bg-slate-50 p-5">
      <p className="mb-3 font-semibold">{t("S ·")} {step < 5 ? `${step + 1}/5` : w[11]}</p>
      {step < 5 ? <form onSubmit={(event) => {
        event.preventDefault()
        const value = draft[fields[step]]
        if (!value.trim() || (step === 2 && (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) >= 1e12))) { setError('answer'); return }
        setError(''); setStep(step + 1)
      }}>
        <label htmlFor="sale-answer" className="mb-3 block">{w[step + 4]}</label>
        {step === 4 ? <><PhotoSizeOption checked={compressPhoto} onChange={setCompressPhoto} disabled={busy} /><input id="sale-answer" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => upload(event.target.files[0])} />{draft.photo_data && <img src={draft.photo_data} alt={draft.name} className="my-3 max-h-48 rounded-lg" />}</> : step === 3 ? <select id="sale-answer" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value })} className="rounded-lg border p-3">{['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX'].map((currency) => <option key={currency}>{currency}</option>)}</select> : <textarea id="sale-answer" key={step} autoFocus rows={step === 1 ? 4 : 2} maxLength={step === 0 ? 200 : step === 2 ? 15 : 12000} inputMode={step === 2 ? 'decimal' : 'text'} value={draft[fields[step]]} onChange={(event) => setDraft({ ...draft, [fields[step]]: event.target.value })} className="w-full rounded-xl border border-slate-300 p-3" />}
        <button disabled={busy} className="mt-4 block rounded-xl bg-slate-900 px-4 py-2 text-white">{w[9]}</button>
      </form> : <form onSubmit={event => { event.preventDefault(); save() }}><h4 className="font-semibold">{draft.name}</h4><p className="whitespace-pre-wrap break-words">{draft.description}</p><p>{draft.price} {draft.currency}</p><img src={draft.photo_data} alt={draft.name} className="my-3 max-h-48 rounded-lg" /><>{draft.medical_category && <MedicalStockFields category={draft.medical_category} value={draft.medical_details} onChange={medical_details => setDraft({ ...draft, medical_details })} disabled={busy} />}</><button disabled={busy} type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white">{busy && <Spinner />}{t(busy ? 'Saving...' : '') || w[12]}</button></form>}
      <div className="mt-4 flex gap-4">{step > 0 && <button disabled={busy} onClick={() => { setError(''); setStep(step - 1) }}>{w[10]}</button>}<button disabled={busy} onClick={() => { setDraft(null); setError('') }}>{t('Cancel')}</button></div>
    </div>}
    {error && <p role="alert" className="my-3 text-red-600">{error === 'load' ? w[17] : error === 'answer' ? w[16] : t(error)}</p>}
    {busy && <p role="status" className="flex items-center gap-2"><Spinner />{t('Updating...')}</p>}
    {!busy && !error && !visibleItems.length && <p className="text-slate-500">{w[14]}</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2">{visibleItems.map((item) => <article key={item.item_id} className="rounded-xl border border-slate-200 p-4">
      {!board && item.posted_at && <a href="#sales-board" className="mb-2 block text-sm font-medium text-teal-700 underline">{t('View on homepage')}</a>}
      <h4 className="font-semibold">{item.name}</h4><p className="my-2 text-lg font-bold">{new Intl.NumberFormat(language, { style: 'currency', currency: item.currency }).format(Number(item.price))}</p>
      <img src={item.photo_data} alt={item.name} className="my-3 max-h-52 rounded-lg object-contain" />
      <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{item.description}</p>
      {board ? item.seller_name && <p className="mt-3 text-sm">{t('Technician')}: {item.seller_name}</p> : <div className="mt-4 flex gap-3"><button disabled={busy || !!item.posted_at} onClick={() => action(item, false)} className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{item.posted_at ? t('Posted') : w[13]}</button><button disabled={busy} onClick={() => action(item, true)} className="rounded-xl border border-red-300 px-4 py-2 text-red-700">{t('Delete')}</button></div>}
    {!board && <ItemRequestStatus item={item} />}<MedicalStockSummary item={item} />
    {!board && item.medical_category && <button disabled={busy} onClick={() => setEditingStock({ ...item, medical_details: { ...item.medical_details } })} className="my-3 rounded-lg border px-3 py-2">{t("Update stock details")}</button>}
    <FastDelivery name={item.name} /></article>)}</div>
    {board && items.length < total && <button disabled={busy} onClick={async () => {
      setBusy(true); setError('')
      try { const result = await saleItemsRequest(`/posts?offset=${items.length}`); setItems((previous) => [...previous, ...result.items.filter((item) => !previous.some((value) => value.item_id === item.item_id))]); setTotal(result.total) }
      catch (failure) { setError(failure.message || 'load') } finally { setBusy(false) }
    }} className="mt-4 rounded-xl border px-4 py-2">{t('Load more')}</button>}
  </section>
}
