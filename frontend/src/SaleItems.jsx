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

export default function SaleItems() {
  const { t, language } = useLanguage()
  const w = labels[language] || labels.en
  const [items, setItems] = useState([])
  const [board, setBoard] = useState(false)
  const [total, setTotal] = useState(0)
  const [draft, setDraft] = useState(null)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
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
      } catch { if (active) setError('load') }
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
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file)
      })
      setDraft((value) => ({ ...value, photo_data: data }))
    } catch { setError('Unable to read the photo.') }
    finally { setBusy(false) }
  }

  async function save() {
    if (busy) return
    setBusy(true); setError('')
    try {
      await saleItemsRequest('/', 'POST', draft)
      setDraft(null); setNotice(true); setBoard(false); setReload((value) => value + 1)
    } catch { setError('load') }
    finally { setBusy(false) }
  }

  async function action(item, remove) {
    if (remove && !window.confirm(w[15])) return
    setBusy(true); setError('')
    try {
      const result = await saleItemsRequest(`/${item.item_id}${remove ? '' : '/post'}`, remove ? 'DELETE' : 'POST')
      setItems((previous) => remove ? previous.filter((value) => value.item_id !== item.item_id) : previous.map((value) => value.item_id === item.item_id ? result : value))
    } catch { setError('load') }
    finally { setBusy(false) }
  }

  return <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
    <h3 className="text-2xl font-bold text-slate-900">{w[0]}</h3>
    <div className="my-4 flex flex-wrap gap-3">
      <button disabled={busy || !!draft} onClick={() => { setDraft({ ...empty }); setStep(0); setError(''); setNotice(false) }} className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{w[1]}</button>
      <button disabled={busy || !!draft} onClick={() => { setBoard(!board); setNotice(false) }} className="rounded-xl border border-slate-300 px-4 py-2">{board ? w[3] : w[2]}</button>
      <button disabled={busy || !!draft} onClick={() => setReload((value) => value + 1)} className="rounded-xl border border-slate-300 px-4 py-2">{t('Refresh')}</button>
    </div>
    {notice && <p role="status" className="my-3 text-green-700">{w[18]}</p>}
    {draft && <div className="my-6 rounded-xl bg-slate-50 p-5">
      <p className="mb-3 font-semibold">Simeon · {step < 5 ? `${step + 1}/5` : w[11]}</p>
      {step < 5 ? <form onSubmit={(event) => {
        event.preventDefault()
        const value = draft[fields[step]]
        if (!value.trim() || (step === 2 && (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) >= 1e12))) { setError('answer'); return }
        setError(''); setStep(step + 1)
      }}>
        <label htmlFor="sale-answer" className="mb-3 block">{w[step + 4]}</label>
        {step === 4 ? <><input id="sale-answer" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => upload(event.target.files[0])} />{draft.photo_data && <img src={draft.photo_data} alt={draft.name} className="my-3 max-h-48 rounded-lg" />}</> : step === 3 ? <select id="sale-answer" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value })} className="rounded-lg border p-3">{['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX'].map((currency) => <option key={currency}>{currency}</option>)}</select> : <textarea id="sale-answer" key={step} autoFocus rows={step === 1 ? 4 : 2} maxLength={step === 0 ? 200 : step === 2 ? 15 : 12000} inputMode={step === 2 ? 'decimal' : 'text'} value={draft[fields[step]]} onChange={(event) => setDraft({ ...draft, [fields[step]]: event.target.value })} className="w-full rounded-xl border border-slate-300 p-3" />}
        <button disabled={busy} className="mt-4 block rounded-xl bg-slate-900 px-4 py-2 text-white">{w[9]}</button>
      </form> : <><h4 className="font-semibold">{draft.name}</h4><p className="whitespace-pre-wrap break-words">{draft.description}</p><p>{draft.price} {draft.currency}</p><img src={draft.photo_data} alt={draft.name} className="my-3 max-h-48 rounded-lg" /><button disabled={busy} onClick={save} className="rounded-xl bg-slate-900 px-4 py-2 text-white">{t(busy ? 'Saving...' : '') || w[12]}</button></>}
      <div className="mt-4 flex gap-4">{step > 0 && <button disabled={busy} onClick={() => { setError(''); setStep(step - 1) }}>{w[10]}</button>}<button disabled={busy} onClick={() => { setDraft(null); setError('') }}>{t('Cancel')}</button></div>
    </div>}
    {error && <p role="alert" className="my-3 text-red-600">{error === 'load' ? w[17] : error === 'answer' ? w[16] : t(error)}</p>}
    {busy && <p role="status">{t('Updating...')}</p>}
    {!busy && !error && !items.length && <p className="text-slate-500">{w[14]}</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2">{items.map((item) => <article key={item.item_id} className="rounded-xl border border-slate-200 p-4">
      <h4 className="font-semibold">{item.name}</h4><p className="my-2 text-lg font-bold">{new Intl.NumberFormat(language, { style: 'currency', currency: item.currency }).format(Number(item.price))}</p>
      <img src={item.photo_data} alt={item.name} className="my-3 max-h-52 rounded-lg object-contain" />
      <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{item.description}</p>
      {board ? <p className="mt-3 text-sm">{t('Technician')}: {item.seller_name}</p> : <div className="mt-4 flex gap-3"><button disabled={busy || !!item.posted_at} onClick={() => action(item, false)} className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{item.posted_at ? t('Posted') : w[13]}</button><button disabled={busy} onClick={() => action(item, true)} className="rounded-xl border border-red-300 px-4 py-2 text-red-700">{t('Delete')}</button></div>}
    </article>)}</div>
    {board && items.length < total && <button disabled={busy} onClick={async () => {
      setBusy(true); setError('')
      try { const result = await saleItemsRequest(`/posts?offset=${items.length}`); setItems((previous) => [...previous, ...result.items.filter((item) => !previous.some((value) => value.item_id === item.item_id))]); setTotal(result.total) }
      catch { setError('load') } finally { setBusy(false) }
    }} className="mt-4 rounded-xl border px-4 py-2">{t('Load more')}</button>}
  </section>
}
