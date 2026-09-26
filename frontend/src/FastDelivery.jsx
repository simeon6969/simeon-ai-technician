import { useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'

const copy = {
  en: ['Fast delivery', 'Call', 'Email', 'Delivery contacts are not configured yet.', 'Unable to load contacts. Please try again.', 'I would like delivery for: ', 'Delivery contacts', 'Phone', 'WhatsApp number', 'Save contacts', 'Saved', 'Use international numbers, for example +250786854200. These contacts appear on all listings. Leave a field empty to hide that option.'],
  rw: ['Kugeza vuba', 'Hamagara', 'Imeyili', 'Aho kubariza ibijyanye no kugeza ibintu ntiharashyirwaho.', 'Kubona aho kubariza byanze. Ongera ugerageze.', 'Ndifuza ko mungezaho: ', 'Aho kubariza ibijyanye no kugeza ibintu', 'Telefoni', 'Nimero ya WhatsApp', 'Bika', 'Byabitswe', 'Koresha nimero mpuzamahanga, urugero +250786854200. Zigaragara ku bintu byose. Siga ahantu ubusa kugira ngo bitagaragara.'],
  fr: ['Livraison rapide', 'Appeler', 'E-mail', 'Les coordonnées de livraison ne sont pas encore configurées.', 'Impossible de charger les coordonnées. Réessayez.', 'Je souhaite une livraison pour : ', 'Coordonnées de livraison', 'Téléphone', 'Numéro WhatsApp', 'Enregistrer', 'Enregistré', 'Utilisez le format international, par exemple +250786854200. Ces coordonnées apparaissent sur toutes les annonces. Laissez un champ vide pour masquer cette option.'],
  sw: ['Uwasilishaji wa haraka', 'Piga simu', 'Barua pepe', 'Mawasiliano ya usafirishaji bado hayajawekwa.', 'Imeshindwa kupakia mawasiliano. Jaribu tena.', 'Ningependa kuletewa: ', 'Mawasiliano ya usafirishaji', 'Simu', 'Nambari ya WhatsApp', 'Hifadhi', 'Imehifadhiwa', 'Tumia nambari ya kimataifa, kwa mfano +250786854200. Mawasiliano haya yanaonekana kwenye matangazo yote. Acha sehemu tupu ili kuficha chaguo hilo.'],
}

export default function FastDelivery({ name }) {
  const { language } = useLanguage()
  const w = copy[language] || copy.en
  const [open, setOpen] = useState(false)
  const [contacts, setContacts] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const message = w[5] + name
  return <div className="mt-3">
    <button type="button" aria-expanded={open} disabled={busy} onClick={async () => {
      if (open) { setOpen(false); return }
      setOpen(true); setBusy(true); setError(false); setContacts(null)
      try { setContacts(await accountRequest('/delivery-contacts')) } catch { setError(true) } finally { setBusy(false) }
    }} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy && <Spinner />}{w[0]}</button>
    {open && <div className="mt-2 flex flex-wrap gap-3 rounded-lg border border-teal-200 p-3 text-sm">
      {error && <p role="alert">{w[4]}</p>}
      {contacts?.phone && <a className="underline" href={`tel:${contacts.phone}`}>{w[1]}: {contacts.phone}</a>}
      {contacts?.whatsapp && <a className="underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${contacts.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}>WhatsApp</a>}
      {contacts?.email && <a className="underline" href={`mailto:${contacts.email}?subject=${encodeURIComponent(w[0])}&body=${encodeURIComponent(message)}`}>{w[2]}</a>}
      {contacts && !contacts.phone && !contacts.whatsapp && !contacts.email && <p>{w[3]}</p>}
    </div>}
  </div>
}

export function DeliverySettings() {
  const { language } = useLanguage()
  const w = copy[language] || copy.en
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function load() {
    setBusy(true); setMessage('')
    try { const result = await accountRequest('/delivery-contacts'); setDraft({ ...result, email: result.email || '' }) } catch { setMessage(w[4]) } finally { setBusy(false) }
  }
  return <section className="rounded-xl bg-white p-6"><h2 className="text-xl font-bold">{w[6]}</h2><p className="my-3 text-sm text-slate-600">{w[11]}</p>
    {!draft ? <button disabled={busy} onClick={load} className="rounded-lg border p-3">{busy && <Spinner />}{w[6]}</button> : <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage('')
      try { await accountRequest('/admin/delivery-contacts', 'PUT', draft); setMessage(w[10]) } catch (failure) { setMessage(failure.message) } finally { setBusy(false) }
    }}>
      {[['phone', w[7]], ['whatsapp', w[8]], ['email', w[2]]].map(([key, label]) => <label key={key} className="my-3 block">{label}<input disabled={busy} type={key === 'email' ? 'email' : 'tel'} pattern={key === 'email' ? undefined : '\\+[1-9][0-9]{6,14}'} maxLength={key === 'email' ? 254 : 16} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border p-3" /></label>)}
      <button disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 text-white">{busy && <Spinner />}{w[9]}</button>
    </form>}
    {message && <p role="status" className="mt-3">{message}</p>}
  </section>
}
