import { useState } from 'react'
import { accountRequest } from './api'
import { Spinner } from './LoadingStatus'

export default function AccountRecovery({ setup = false }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({ email: '', current_password: '', question: '', answer: '', new_password: '', full_name: '' })
  const title = setup ? 'Set up account recovery' : 'Forgot password or account name?'
  return <section className="my-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-900">
    <button type="button" aria-expanded={open} disabled={busy} onClick={() => setOpen(!open)} className="text-sm font-semibold text-teal-700">{title}</button>
    {open && <form className="mt-4 space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return
      setBusy(true); setNotice('')
      try {
        const body = setup ? { question: draft.question, answer: draft.answer, current_password: draft.current_password } : { email: draft.email, question: draft.question, answer: draft.answer, ...(draft.new_password ? { new_password: draft.new_password } : {}), ...(draft.full_name.trim() ? { full_name: draft.full_name } : {}) }
        const result = await accountRequest(setup ? '/users/recovery' : '/users/recovery/reset', setup ? 'PUT' : 'POST', body)
        setNotice(result.message); setDraft({ email: '', current_password: '', question: '', answer: '', new_password: '', full_name: '' })
      } catch (error) { setNotice(error.message) } finally { setBusy(false) }
    }}>
      <p className="text-sm text-slate-600">{setup ? 'Choose a private question and a long answer that others cannot guess. Remember both. Your current password is required to set or replace them.' : 'Enter your registered email and the question and answer you previously saved. Names are display names; you still sign in with your email. Set a new name, password, or both.'}</p>
      {!setup && <p className="text-sm text-slate-600">Five incorrect attempts lock recovery for 30 minutes. If you never set a question or cannot remember it, contact support.</p>}
      {(setup ? [['current_password', 'Current password', 'password'], ['question', 'Secret question', 'text'], ['answer', 'Secret answer', 'password']] : [['email', 'Registered email', 'email'], ['question', 'Secret question', 'text'], ['answer', 'Secret answer', 'password'], ['full_name', 'New account name (optional)', 'text'], ['new_password', 'New password (optional, at least 12 characters)', 'password']]).map(([key, label, type]) => <label key={key} className="block text-sm">{label}<input disabled={busy} type={type} required={!['full_name', 'new_password'].includes(key)} minLength={key === 'new_password' ? 12 : ['question', 'answer'].includes(key) ? 8 : 1} maxLength={key === 'full_name' ? 150 : 200} autoComplete={key === 'current_password' ? 'current-password' : key === 'new_password' ? 'new-password' : 'off'} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border p-3" /></label>)}
      <button disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 text-white">{busy && <Spinner />}{setup ? 'Save recovery question' : 'Verify and update account'}</button>
    </form>}
    {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
  </section>
}
