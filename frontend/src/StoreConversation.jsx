import PhotoSizeOption from './PhotoSizeOption'
import { preparePhoto } from './preparePhoto'
import { Spinner } from './LoadingStatus'
import { useEffect, useRef, useState } from 'react'
import { readDraft, saveDraft, queueDraft } from './offlineStore'
import { submissionPayload, syncQueue } from './offlineSync'
import { offlineCopy } from './offlineCopy'
import { jobFieldsForAccount, partFields } from './conversationFields'
import { useLanguage } from './language'
import LanguageSwitcher from './LanguageSwitcher'

const words = {
  en: ['Back to dashboard', 'Let’s record this together. I’ll ask one question at a time.', 'What would you like to record for', 'Send reply', 'Skip for now', 'Review your answers before saving.', 'Change answer', 'Not added', 'Yes, completed successfully', 'Not yet confirmed', 'Saved. Thank you for sharing your experience.', 'Please answer this question before continuing.', 'Leave this conversation? Your unsaved answers will be lost.', 'The job card is saved, but validation failed. You can confirm it from My Job Cards.', 'Photo added'],
  rw: ['Subira ku rubuga rw’ibanze', 'Reka tubyandike hamwe. Ndakubaza ikibazo kimwe kimwe.', 'Ni iki wifuza kwandika kuri', 'Ohereza igisubizo', 'Bireke ubu', 'Banza usuzume ibisubizo byawe mbere yo kubika.', 'Hindura igisubizo', 'Ntibyongewemo', 'Yego, byarangiye neza', 'Ntibiramenyekana', 'Byabitswe. Urakoze gusangiza abandi ubunararibonye bwawe.', 'Banza usubize iki kibazo.', 'Uve muri iki kiganiro? Ibisubizo bitarabikwa biratakara.', 'Ifishi yabitswe ariko kwemeza byanze. Ushobora kuyemeza mu mafishi yawe y’akazi.', 'Ifoto yongewemo'],
  fr: ['Retour au tableau de bord', 'Enregistrons cela ensemble. Je vous poserai une question à la fois.', 'Que souhaitez-vous indiquer pour', 'Envoyer la réponse', 'Passer pour le moment', 'Vérifiez vos réponses avant d’enregistrer.', 'Modifier la réponse', 'Non ajouté', 'Oui, terminé avec succès', 'Pas encore confirmé', 'Enregistré. Merci de partager votre expérience.', 'Veuillez répondre à cette question pour continuer.', 'Quitter cette conversation ? Vos réponses non enregistrées seront perdues.', 'La fiche est enregistrée, mais la validation a échoué. Confirmez-la depuis vos fiches d’intervention.', 'Photo ajoutée'],
  sw: ['Rudi kwenye dashibodi', 'Turekodi pamoja. Nitakuuliza swali moja baada ya jingine.', 'Ungependa kurekodi nini kuhusu', 'Tuma jibu', 'Ruka kwa sasa', 'Kagua majibu yako kabla ya kuhifadhi.', 'Badilisha jibu', 'Haijaongezwa', 'Ndiyo, yamekamilika kwa mafanikio', 'Bado haijathibitishwa', 'Imehifadhiwa. Asante kwa kushiriki uzoefu wako.', 'Tafadhali jibu swali hili kabla ya kuendelea.', 'Uondoke kwenye mazungumzo? Majibu ambayo hayajahifadhiwa yatapotea.', 'Kadi imehifadhiwa lakini uthibitisho umeshindikana. Ithibitishe kutoka kwenye kadi zako za kazi.', 'Picha imeongezwa'],
}

export default function StoreConversation(props) {
  const { language } = useLanguage()
  const w = offlineCopy[language] || offlineCopy.en
  const [loaded, setLoaded] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    readDraft(props.account.user_id, props.kind).then(value => { if (active) setLoaded({ value }) }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [props.account.user_id, props.kind])
  if (!loaded) return <div className="p-6"><p role="status">{w[failed ? 6 : 9]}</p><button onClick={props.onClose}>← {props.account.full_name}</button></div>
  return <Conversation {...props} initial={loaded.value} />
}

function Conversation({ kind, account, onClose, onSaved, initial }) {
  const { t, language } = useLanguage()
  const w = words[language] || words.en
  const offlineWords = offlineCopy[language] || offlineCopy.en
  const fields = kind === 'job' ? jobFieldsForAccount(account.role) : partFields
  const [answers, setAnswers] = useState(() => initial?.answers || (account.role === 'technician' ? { submitter_name: account.full_name } : {}))
  const [step, setStep] = useState(initial?.step || 0)
  const [draft, setDraft] = useState(initial?.draft || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [compressPhoto, setCompressPhoto] = useState(false)
  const [saved, setSaved] = useState(null)
  const [storageError, setStorageError] = useState(false)
  const [draftStored, setDraftStored] = useState(false)
  const submissionId = useRef(initial?.submissionId || crypto.randomUUID())
  const committing = useRef(false)
  const latestWrite = useRef(Promise.resolve())
  const bottom = useRef(null)
  const input = useRef(null)
  const review = step === fields.length
  const field = fields[step]

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    input.current?.focus()
  }, [step])

  useEffect(() => {
    if (saved || committing.current) return
    let active = true
    const write = saveDraft(account.user_id, kind, { answers, step, draft, submissionId: submissionId.current })
    latestWrite.current = write
    write.then(() => { if (active) { setStorageError(false); setDraftStored(true) } }).catch(() => { if (active) { setStorageError(true); setDraftStored(false) } })
    return () => { active = false }
  }, [account.user_id, kind, answers, step, draft, saved])

  async function close() {
    try { await latestWrite.current; onClose() }
    catch { setStorageError(true) }
  }

  function reply(value) {
    if (busy) return
    if (field[4] === 'price' && (!/^\d{1,12}(\.\d{1,2})?$/.test(value) || Number(value) <= 0)) { setError(t('Enter a price greater than zero with at most two decimal places.')); return }
    if (field[0] === 'submitter_name' && value.length > 150) { setError(t('Name must be 150 characters or fewer.')); return }
    if (field[3] && (value === '' || value === null)) { setError(w[11]); return }
    setAnswers((previous) => ({ ...previous, [field[0]]: value }))
    setDraft('')
    setError('')
    const nextAnswers = { ...answers, [field[0]]: value }
    const next = fields.findIndex(([key]) => !(key in nextAnswers))
    setStep(next < 0 ? fields.length : next)
  }

  function edit(index) {
    setStep(index)
    setDraft(typeof answers[fields[index][0]] === 'string' && fields[index][4] !== 'photo' ? answers[fields[index][0]] : '')
    setError('')
  }

  async function photo(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError(t('Choose a JPEG, PNG, or WebP image.')); return }
    if (file.size > 5 * 1024 * 1024) { setError(t('Photo must be 5 MB or smaller.')); return }
    setBusy(true)
    try {
      const data = await preparePhoto(file, compressPhoto)
      reply(data)
    } catch { setError(t('Unable to read the photo.')) }
    finally { setBusy(false) }
  }

  async function save() {
    if (busy || saved) return
    const missing = fields.findIndex(([key, , , required]) => required && (answers[key] === undefined || answers[key] === '' || answers[key] === null))
    if (missing >= 0) { edit(missing); setError(w[11]); return }
    setBusy(true)
    setError('')
    committing.current = true
    try {
      await latestWrite.current
      await queueDraft(account.user_id, kind, submissionPayload(kind, answers, submissionId.current))
      setSaved(true)
      syncQueue(account.user_id).catch(() => {})
      onSaved(kind)
    } catch { setStorageError(true); committing.current = false }

    finally { setBusy(false) }
  }

  function display(key, type) {
    if (type === 'boolean') return answers[key] ? w[8] : w[9]
    if (type === 'photo') return answers[key] ? w[14] : w[7]
    return (type === 'availability' ? t(answers[key]) : answers[key]) || w[7]
  }

  return <div className="min-h-screen bg-slate-100">
    <header className="bg-slate-900 px-6 py-4 text-white"><div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Simeon</h1><p className="text-sm text-slate-300">{t(kind === 'job' ? 'Digital Job Card' : 'Spare Part')}</p></div><LanguageSwitcher /></div></header>
    <main className="mx-auto max-w-3xl px-4 py-6">
      <p className="mb-4 font-semibold text-slate-700">{account.full_name} · {t(account.role)}</p>
      {kind === 'job' && account.role === 'technician' && <p className="mb-4 text-sm text-slate-600">{t('Submitter name')}: {account.full_name}</p>}
      <button disabled={busy} onClick={close} className="mb-5 text-sm font-medium text-slate-600 disabled:opacity-50">← {w[0]}</button>
      {storageError && <p role="alert" className="mb-4 text-red-700">{offlineWords[6]}</p>}
      {!storageError && draftStored && !saved && <p className="mb-4 text-sm text-teal-800">{offlineWords[7]}</p>}
      <p className="mb-6 rounded-2xl bg-white p-5 text-slate-700">{w[1]}</p>
      <div className="space-y-4">
        {fields.slice(0, step).map(([key, label, , , type], index) => <div key={key}>
          <p className="mb-2 text-sm text-slate-600">Simeon · {t(label)}</p>
          <div className="ml-8 rounded-2xl bg-slate-200 p-4"><p className="whitespace-pre-wrap break-words">{display(key, type)}</p>{type === 'photo' && answers[key] && <img src={answers[key]} alt={t(label)} className="mt-2 max-h-40 rounded-lg" />}{!saved && <button disabled={busy} onClick={() => edit(index)} className="mt-2 text-sm underline">{w[6]}</button>}</div>
        </div>)}
      </div>
      <div ref={bottom} className="mt-6 rounded-2xl bg-white p-5 shadow-sm" aria-live="polite">
        {saved ? <><p className="font-semibold text-green-700">{offlineWords[8]}</p></> : review ? <><p className="mb-4">{w[5]}</p><button disabled={busy} onClick={save} className="rounded-xl bg-slate-900 px-5 py-3 text-white disabled:opacity-50">{busy && <Spinner />}{t(busy ? 'Saving...' : kind === 'job' ? 'Save Job Card' : 'Save Spare Part')}</button></> : <>
          <p className="text-xs text-slate-500">Simeon · {step + 1}/{fields.length}</p>
          <h2 className="mt-2 text-lg font-semibold">{w[2]} {t(field[1])}?</h2>
          {field[2] && <p className="my-3 text-sm text-slate-600">{t(field[2])}</p>}
          {field[4] === 'currency' && <div className="mt-4 flex flex-wrap gap-3">{['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX'].map(value => <button key={value} onClick={() => reply(value)} className="rounded-xl border border-slate-300 px-4 py-3">{value}</button>)}</div>}
          {field[4] === 'currency' ? null : field[4] === 'boolean' ? <div className="mt-4 flex flex-wrap gap-3">{[true, false].map((value) => <button key={String(value)} onClick={() => reply(value)} className="rounded-xl border border-slate-300 px-4 py-3">{value ? w[8] : w[9]}</button>)}</div> : field[4] === 'availability' ? <div className="mt-4 flex flex-wrap gap-3">{['available', 'limited', 'unavailable', 'unknown'].map((value) => <button key={value} onClick={() => reply(value)} className="rounded-xl border border-slate-300 px-4 py-3">{t(value)}</button>)}</div> : field[4] === 'photo' ? <><PhotoSizeOption checked={compressPhoto} onChange={setCompressPhoto} disabled={busy} /><input aria-label={t(field[1])} disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => photo(event.target.files[0])} className="my-4 block w-full" /></> : <form onSubmit={(event) => { event.preventDefault(); reply(draft.trim()) }}>{field[4] === 'price' ? <input ref={input} aria-label={t(field[1])} inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={15} className="mt-4 w-full rounded-xl border border-slate-300 p-3" /> : <textarea ref={input} aria-label={t(field[1])} value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={12000} className="mt-4 w-full rounded-xl border border-slate-300 p-3" />}<button className="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-white">{w[3]}</button></form>}
          {!field[3] && <button disabled={busy} onClick={() => reply(null)} className="mt-3 block text-sm text-slate-500">{w[4]}</button>}
        </>}
        {saved && <button disabled={busy} onClick={close} className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white disabled:opacity-50">{w[0]}</button>}
        {busy && <p role="status" className="mt-3 flex items-center gap-2"><Spinner />{t('Saving...')}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  </div>
}
