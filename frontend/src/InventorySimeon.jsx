import { useBranding, brandText } from './branding'
import BrandName from './BrandName'
import CommissionPanel from './CommissionPanel'
import { useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'
import { MedicalStockSummary } from './MedicalStock'
import FastDelivery from './FastDelivery'

const words = {
  en: ['Ask S', 'Ask about stored items, prices, stock, or medical products.', 'Show medical consumables', 'Show biomedical equipment', 'Show pharmacy items', 'Posted items', 'My stored stock', 'Request item', 'Request sent to the seller.', 'No matching posted items were found. Try a product name or another field.', 'Results shown', 'All fields'],
  rw: ['Baza S', 'Baza ku bintu bibitswe, ibiciro cyangwa ibikoresho by’ubuvuzi.', 'Erekana ibikoreshwa mu buvuzi', 'Erekana ibikoresho by’ubuvuzi', 'Erekana imiti', 'Ibyatangajwe', 'Ibyanjye bibitswe', 'Saba ikintu', 'Ubusabe bwoherejwe ku ugurisha.', 'Nta bintu byatangajwe bihuye nabyo. Gerageza izina ry’ikintu cyangwa urundi rwego.', 'Ibyabonetse', 'Inzego zose'],
  fr: ['Demander à S', 'Posez une question sur les articles, les prix, le stock ou les produits médicaux.', 'Afficher les consommables médicaux', 'Afficher les équipements biomédicaux', 'Afficher les articles de pharmacie', 'Articles publiés', 'Mon stock', 'Demander cet article', 'Demande envoyée au vendeur.', 'Aucun article publié correspondant. Essayez un nom de produit ou un autre domaine.', 'Résultats affichés', 'Tous les domaines'],
  sw: ['Uliza S', 'Uliza kuhusu bidhaa, bei, akiba au bidhaa za matibabu.', 'Onyesha vifaa vinavyotumika vya matibabu', 'Onyesha vifaa vya tiba', 'Onyesha bidhaa za famasia', 'Bidhaa zilizochapishwa', 'Akiba yangu', 'Omba bidhaa', 'Ombi limetumwa kwa muuzaji.', 'Hakuna bidhaa zinazolingana. Jaribu jina la bidhaa au fani nyingine.', 'Matokeo', 'Fani zote'],
}

export default function InventorySimeon({ account }) {
  const branding = useBranding()
  const { language, t } = useLanguage()
  const w = (words[language] || words.en).map(text => brandText(text, branding.name))
  const [field, setField] = useState(account.account_field || 'all')
  const [scope, setScope] = useState('posted')
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState([])
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [requested, setRequested] = useState({})
  const [notice, setNotice] = useState('')
  async function ask(message) {
    if (!message.trim() || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const data = await accountRequest('/inventory-chat', 'POST', { message, field, scope, language, history: turns.slice(-6) })
      setTurns(previous => [...previous, { role: 'user', content: message }, { role: 'assistant', content: data.answer.slice(0, 12000) }].slice(-6))
      setResult(data); setQuestion('')
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <section className="my-6 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm" aria-label="S inventory assistant">
    <h2 className="text-2xl font-bold text-teal-800"><BrandName /></h2><p className="my-3 text-slate-600">{w[1]}</p>
    <div className="mb-3 flex flex-wrap gap-3"><select aria-label={t('Account field')} disabled={busy} value={field} onChange={event => { setField(event.target.value); setResult(null); setTurns([]) }} className="rounded-lg border p-2"><option value="all">{w[11]}</option>{['medical', 'it', 'electrical', 'mechanical'].map(value => <option key={value} value={value}>{t(value)}</option>)}</select>{account.role !== 'client' && <select aria-label="Inventory scope" disabled={busy} value={scope} onChange={event => { setScope(event.target.value); setResult(null); setTurns([]) }} className="rounded-lg border p-2"><option value="posted">{w[5]}</option><option value="mine">{w[6]}</option></select>}</div>
    {field === 'medical' && <div className="mb-4 flex flex-wrap gap-2">{[2, 3, 4].map(index => <button key={index} disabled={busy} onClick={() => ask(w[index])} className="rounded-full border border-teal-300 px-3 py-2 text-sm">{w[index]}</button>)}</div>}
    <div aria-live="polite" className="space-y-3">{turns.map((turn, index) => <p key={index} className={`whitespace-pre-wrap rounded-xl p-3 ${turn.role === 'user' ? 'ml-6 bg-slate-100' : 'bg-teal-50'}`}><strong>{turn.role === 'assistant' ? <BrandName /> : account.full_name}: </strong>{turn.content}</p>)}</div>
    <form onSubmit={event => { event.preventDefault(); ask(question) }}><label className="mt-4 block">{w[0]}<textarea disabled={busy} value={question} onChange={event => setQuestion(event.target.value)} maxLength={2000} rows={3} className="mt-2 w-full rounded-xl border p-3" /></label><button disabled={busy || !question.trim()} className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-white disabled:opacity-50">{busy && <Spinner />}{w[0]}</button></form>
    {error && <p role="alert" className="my-3 text-red-700">{error}</p>}{notice && <p role="status" className="my-3 text-teal-700">{notice}</p>}
    {result && <><p className="my-3 text-sm">{w[10]}: {result.records.length} / {result.total}</p>{!result.records.length && <p>{w[9]}</p>}<div className="grid gap-3 md:grid-cols-2">{result.records.map(item => <article key={`${item.item_type}-${item.item_id}`} className="rounded-xl border p-4"><h3 className="font-bold">{item.name}</h3><p>{item.seller_name ? `${item.seller_name} / ` : ''}{item.price == null ? t('Price not provided') : `${item.price} ${item.currency}`}</p><p>{item.description}</p><p>{t(item.availability)}</p><MedicalStockSummary item={item} />{item.can_request && <button disabled={busy} className="mt-3 rounded-lg bg-teal-700 px-3 py-2 text-white" onClick={async () => {
      setBusy(true); setError(''); setNotice('')
      try { const request = await accountRequest('/item-requests/', 'POST', { item_type: item.item_type, item_id: item.item_id }); setRequested(previous => ({ ...previous, [`${item.item_type}-${item.item_id}`]: request.request_id })); setNotice(w[8]) } catch (error) { setError(error.message) } finally { setBusy(false) }
    }}>{w[7]}</button>}{requested[`${item.item_type}-${item.item_id}`] && <CommissionPanel requestId={requested[`${item.item_type}-${item.item_id}`]} />}<FastDelivery name={item.name} /></article>)}</div></>}
  </section>
}
