import { useEffect, useState } from 'react'
import { accountRequest, getJobCardForm } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'

export default function JobCardSettings() {
  const { t } = useLanguage()
  const [form, setForm] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([getJobCardForm(), accountRequest('/admin/job-card-sheet')]).then(([questions, status]) => { if (active) { setForm(questions); setSheet(status) } }).catch(failure => { if (active) setError(failure.message) }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])
  async function act(action) {
    setBusy(true); setError(''); setNotice('')
    try { await action(); setNotice(t('Changes saved')) } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  const button = 'rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50'
  function edit(index, column, value) {
    setForm({ ...form, questions: form.questions.map((q, i) => i === index ? q.map((v, c) => c === column ? value : v) : q) })
  }
  return <div className="space-y-6">
    {busy && <p role="status"><Spinner />{t('Loading...')}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!sheet && !busy && <button className={button} onClick={() => act(async () => { setForm(await getJobCardForm()); setSheet(await accountRequest('/admin/job-card-sheet')) })}>{t('Refresh')}</button>}
    {sheet && <section className="rounded-xl bg-white p-5"><h3 className="text-xl font-bold">{t('Google Sheets connection')}</h3>
      <a className="my-3 block underline text-teal-700" target="_blank" rel="noopener noreferrer" href={sheet.spreadsheet_url}>{t('Open job-card spreadsheet')}</a>
      <p>{t(sheet.credentials_configured ? 'Backend credentials configured. Share the spreadsheet with the account below as Editor.' : 'Google credentials are not configured. Job cards remain safe in the database and wait to sync.')}</p>
      {sheet.service_account_email && <p className="my-3 break-all font-mono">{sheet.service_account_email}</p>}
      <p className="my-3">{t('Waiting to sync')}: {sheet.pending} / {t('Synced job cards')}: {sheet.synced}</p>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); act(async () => setSheet(await accountRequest('/admin/job-card-sheet', 'PUT', { enabled: sheet.enabled, spreadsheet_url: sheet.spreadsheet_url }))) }}>
        <label className="block">{t('Spreadsheet link')}<input required type="url" disabled={busy} value={sheet.spreadsheet_url} onChange={event => setSheet({ ...sheet, spreadsheet_url: event.target.value })} className="mt-1 block w-full rounded border p-3" /></label>
        <label className="block"><input type="checkbox" disabled={busy} checked={sheet.enabled} onChange={event => setSheet({ ...sheet, enabled: event.target.checked })} /> {t('Enable Google Sheets sync')}</label>
        <button disabled={busy} className={button}>{t('Save connection settings')}</button>
      </form>
      <div className="my-3 flex flex-wrap gap-3"><button disabled={busy} className={button} onClick={() => act(async () => setSheet(await accountRequest('/admin/job-card-sheet')))}>{t('Refresh sync status')}</button><button disabled={busy} className={button} onClick={() => act(async () => setSheet(await accountRequest('/admin/job-card-sheet/retry', 'POST')))}>{t('Retry pending sync')}</button></div>
      <button disabled={busy} className={button} onClick={() => act(async () => setSheet(await accountRequest('/admin/job-card-sheet/include-existing', 'POST')))}>{t('Include existing job cards')}</button>
      {sheet.errors.map(row => <p key={row.job_card_id} className="my-2 text-sm text-red-700">#{row.job_card_id}: {row.error}</p>)}
    </section>}
    {form && <form className="rounded-xl bg-white p-5" onSubmit={event => { event.preventDefault(); act(async () => setForm(await accountRequest('/admin/job-card-form', 'PUT', { version: form.version, questions: form.questions.map(q => ({ key: q[0], label: q[1], help: q[2] || '', required: !!q[3], kind: q[4] || 'text' })) }))) }}>
      <h3 className="text-xl font-bold">{t('Job-card questions')}</h3>
      <p className="my-3">{t('Changes apply to new conversations. Existing drafts and answers keep their original questions. Each version uses a separate spreadsheet tab.')}</p>
      <p className="my-3">{t('Edit question wording and help, or add custom text questions. Essential job-card fields stay required.')}</p>
      <div className="space-y-4">{form.questions.map((q, index) => <fieldset key={q[0]} disabled={busy} className="rounded-lg border p-4">
        <legend className="px-2 text-sm">{index + 1} / {q[0]}</legend>
        <label className="block">{t('Question / column heading')}<input required maxLength={200} value={q[1]} onChange={event => edit(index, 1, event.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
        <label className="my-2 block">{t('Question help')}<textarea maxLength={1000} value={q[2]} onChange={event => edit(index, 2, event.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
        <label><input type="checkbox" disabled={['equipment', 'manufacturer', 'model', 'problem_description', 'successful'].includes(q[0])} checked={!!q[3]} onChange={event => edit(index, 3, event.target.checked)} /> {t('Required answer')}</label>
        {q[0].startsWith('custom_') && <button type="button" className={`${button} ml-3`} onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) })}>{t('Remove question')}</button>}
      </fieldset>)}</div>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={busy || form.questions.length >= 50} className={button} onClick={() => setForm({ ...form, questions: [...form.questions, ['custom_' + crypto.randomUUID().replaceAll('-', ''), '', '', false, 'text']] })}>{t('Add question')}</button><button disabled={busy} className={button}>{t('Publish questions')}</button></div>
    </form>}
  </div>
}
