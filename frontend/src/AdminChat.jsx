import { useState } from 'react'
import { sendAdminChatMessage } from './api'
import { useLanguage } from './language'

const copy = {
  en: ['Ask about users, equipment, job cards, spare parts, requests, or chat records.', 'Example: Which spare-part requests are still pending, and who should I contact?', 'New conversation', 'Database sources', 'Simeon is unavailable. Please try again.'],
  rw: ['Baza ku bakoresha, ibikoresho, amafishi y’akazi, ibice bisimbura, ubusabe cyangwa ibiganiro.', 'Urugero: Ni ubuhe busabe bw’ibice bisimbura butararangira, kandi navugisha nde?', 'Ikiganiro gishya', 'Inkomoko mu bubiko bw’amakuru', 'Simeon ntiboneka ubu. Ongera ugerageze.'],
  fr: ['Posez des questions sur les utilisateurs, équipements, interventions, pièces, demandes ou conversations.', 'Exemple : Quelles demandes de pièces sont en attente et qui dois-je contacter ?', 'Nouvelle conversation', 'Sources de la base de données', 'Simeon est indisponible. Veuillez réessayer.'],
  sw: ['Uliza kuhusu watumiaji, vifaa, kadi za kazi, vipuri, maombi au rekodi za mazungumzo.', 'Mfano: Ni maombi gani ya vipuri bado yanasubiri, na niwasiliane na nani?', 'Mazungumzo mapya', 'Vyanzo vya hifadhidata', 'Simeon haipatikani. Tafadhali jaribu tena.'],
}

export default function AdminChat() {
  const { language, t } = useLanguage()
  const labels = copy[language] || copy.en
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function send(event) {
    event.preventDefault()
    if (!question.trim() || loading) return
    const content = question.trim()
    setLoading(true)
    setError(false)
    try {
      const result = await sendAdminChatMessage(content, messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 12000) })), language)
      setMessages((previous) => [...previous, { role: 'user', content }, { role: 'assistant', content: result.answer, sources: result.sources }])
      setQuestion('')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-900">{t('Ask Simeon')}</h3>
        <button type="button" disabled={loading} onClick={() => { setMessages([]); setQuestion(''); setError(false) }} className="text-sm text-slate-600 disabled:opacity-50">{labels[2]}</button>
      </div>
      <p className="mt-2 text-sm text-slate-600">{labels[0]}</p>
      <div role="log" aria-live="polite" className="my-4 max-h-[32rem] space-y-3 overflow-y-auto">
        {messages.map((message, index) => (
          <article key={index} className={`rounded-xl p-4 ${message.role === 'user' ? 'bg-slate-100' : 'border border-slate-200'}`}>
            <p className="mb-2 text-xs font-semibold text-slate-500">{message.role === 'user' ? t('admin') : 'Simeon'}</p>
            <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{message.content}</p>
            {message.sources?.length > 0 && <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer">{labels[3]}</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(message.sources, null, 2)}</pre></details>}
          </article>
        ))}
      </div>
      <form onSubmit={send}>
        <label htmlFor="admin-question" className="sr-only">{t('Ask Simeon')}</label>
        <textarea id="admin-question" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={loading} maxLength={4000} rows={3} placeholder={labels[1]} className="w-full rounded-xl border border-slate-300 p-3 text-slate-900" />
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{labels[4]}</p>}
        <button disabled={loading || !question.trim()} className="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{t(loading ? 'Thinking...' : 'Ask Simeon')}</button>
      </form>
    </section>
  )
}
