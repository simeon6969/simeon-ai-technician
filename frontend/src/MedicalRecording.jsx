import { useState } from 'react'
import { medicalCategories } from './medicalCategories'
import { medicalRecordingFields, medicalPayload } from './medicalRecordingFields'
import { saleItemsRequest } from './api'
import { preparePhoto } from './preparePhoto'
import PhotoSizeOption from './PhotoSizeOption'
import { Spinner } from './LoadingStatus'

export default function MedicalRecording({ category, account, onClose, onSaved }) {
  const fields = medicalRecordingFields[category]
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [compress, setCompress] = useState(false)
  const [saved, setSaved] = useState(false)
  const field = fields[step]
  function next(answer) {
    const updated = { ...answers, [field.key]: answer }
    setAnswers(updated); setValue(''); setError('')
    const missing = fields.findIndex(item => !(item.key in updated))
    setStep(missing === -1 ? fields.length : missing)
  }
  function edit(index) { setStep(index); setValue(answers[fields[index].key] ?? ''); setError('') }
  return <div className="min-h-screen bg-slate-100"><header className="bg-teal-950 px-6 py-5 text-white"><div className="mx-auto max-w-3xl"><p className="text-sm text-teal-200">{account.full_name}</p><h1 className="text-2xl font-bold">Simeon · {medicalCategories[category]}</h1></div></header>
    <main className="mx-auto max-w-3xl p-5"><button disabled={busy} onClick={() => { if (saved || !Object.keys(answers).length || window.confirm('Leave this recording? Unsaved answers will be lost.')) onClose() }} className="mb-5 font-medium text-teal-800">← Back to medical store</button>
      {saved ? <section className="rounded-xl bg-white p-6"><p role="status">Saved to {medicalCategories[category]}. You can review and post it from your inventory.</p><button onClick={onClose} className="mt-4 rounded-lg bg-teal-700 px-4 py-3 text-white">Return to inventory</button></section> : <section className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="mb-5 text-slate-600">{category === 'pharmacy' ? 'Let’s record one medicine and batch using its product label. These are stock details, not prescribing instructions.' : category === 'consumables' ? 'Let’s record the consumable specifications, pack size, and batch stock.' : 'Let’s record this equipment’s identity, condition, accessories, and service information.'}</p>
        <progress className="mb-4 w-full accent-teal-700" max={fields.length} value={step} aria-label="Recording progress" />
        {field ? <form onSubmit={event => {
          event.preventDefault()
          if (field.type === 'photo') { if (answers.photo_data) next(answers.photo_data); return }
          const answer = String(value).trim()
          if (field.required && !answer) return
          if (field.type === 'price' && (!/^\d+(\.\d{1,2})?$/.test(answer) || Number(answer) <= 0 || Number(answer) >= 1e12)) { setError('Enter a valid price greater than zero, with up to two decimals.'); return }
          next(field.type === 'number' && answer ? Number(answer) : answer || null)
        }}>
          <p className="mb-2 text-xs text-slate-500">Simeon · {step + 1} / {fields.length}</p><label className="block text-lg font-semibold" htmlFor="medical-answer">{field.label}</label>
          {field.type === 'photo' ? <><PhotoSizeOption checked={compress} onChange={setCompress} disabled={busy} /><input id="medical-answer" type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" onChange={async event => {
            const file = event.target.files[0]; if (!file) return
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Choose a JPEG, PNG, or WebP photo up to 5 MB.'); return }
            setBusy(true); setError('')
            try { const photo = await preparePhoto(file, compress); setAnswers(previous => ({ ...previous, photo_data: photo })) } catch { setError('Unable to read photo.') } finally { setBusy(false) }
          }} />{answers.photo_data && <img src={answers.photo_data} alt="Product" className="my-3 max-h-48 rounded-lg" />}</> : field.type === 'select' ? <select id="medical-answer" required={field.required} disabled={busy} value={value} onChange={event => setValue(event.target.value)} className="mt-4 w-full rounded-xl border p-3"><option value="">Select</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input id="medical-answer" key={field.key} autoFocus type={field.type === 'number' || field.type === 'date' ? field.type : 'text'} inputMode={field.type === 'price' ? 'decimal' : undefined} min={field.type === 'number' ? 0 : undefined} max={field.type === 'number' ? 1000000000 : undefined} step={field.type === 'number' ? 1 : undefined} maxLength={field.type === 'textarea' ? 2000 : 100} required={field.required} disabled={busy} value={value} onChange={event => setValue(event.target.value)} className="mt-4 w-full rounded-xl border p-3" />}
          <div className="mt-4 flex gap-3"><button disabled={busy || (field.type === 'photo' && !answers.photo_data)} className="rounded-lg bg-teal-700 px-5 py-3 text-white disabled:opacity-50">{busy && <Spinner />}Continue</button>{!field.required && <button type="button" disabled={busy} onClick={() => next(null)}>Skip</button>}</div>
        </form> : <><h2 className="text-xl font-bold">Review {medicalCategories[category]}</h2><dl>{fields.map((item, index) => <div key={item.key} className="border-b py-3"><dt className="text-sm text-slate-600">{item.label}</dt><dd className="break-words">{item.type === 'photo' ? <img src={answers[item.key]} alt="Product" className="max-h-40" /> : String(answers[item.key] ?? 'Not recorded')}</dd><button disabled={busy} onClick={() => edit(index)} className="text-sm text-teal-700 underline">Change answer</button></div>)}</dl><button disabled={busy} onClick={async () => {
          setBusy(true); setError('')
          try { await saleItemsRequest('/', 'POST', medicalPayload(category, answers)); setSaved(true); onSaved() } catch (failure) { setError(failure.message || 'Unable to save. Your answers are still here.') } finally { setBusy(false) }
        }} className="mt-5 rounded-lg bg-teal-700 px-5 py-3 text-white">{busy && <Spinner />}Save {medicalCategories[category]}</button></>}
        {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
      </section>}
    </main>
  </div>
}
