import BrandingSettings from './BrandingSettings'
import JobCardSettings from './JobCardSettings'
import CommissionWorkspace from './CommissionWorkspace'
import { commissionStatuses } from './commissionLabels'
import CommissionPanel from './CommissionPanel'
import UpgradeSubscription from './UpgradeSubscription'
import { SubscriptionAdmin } from './Subscriptions'
import { DeliverySettings } from './FastDelivery'
import { Spinner } from './LoadingStatus'
import { useCallback, useEffect, useRef, useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import DashboardLayout from './DashboardLayout'
import AdminChat from './AdminChat'

const sections = [
  ['overview', 'Overview'], ['branding', 'App branding'], ['job-settings', 'Job cards & Google Sheets'], ['account', 'My account'], ['commissions', 'Commission'], ['subscriptions', 'Subscriptions'], ['delivery', 'Delivery contacts'], ['users', 'Accounts'], ['job-cards', 'Job Cards'],
  ['spare-parts', 'Spare Parts'], ['sale-items', 'Items for sale'], ['item-requests', 'Item requests'],
  ['spare-part-requests', 'Legacy requests'], ['knowledge', 'Knowledge'], ['assistant', 'S'],
]
const ids = { users: 'user_id', 'job-cards': 'job_card_id', 'spare-parts': 'spare_part_id', 'sale-items': 'item_id', 'knowledge': 'knowledge_id', 'item-requests': 'request_id', 'spare-part-requests': 'request_id' }
const fields = {
  users: [['full_name', 'Full name'], ['email', 'Email'], ['phone', 'Phone'], ['account_field', 'Account field', ['medical', 'it', 'electrical', 'mechanical']], ['role', 'Account role', ['technician', 'store', 'client']]],
  'job-cards': [['fault_description', 'Problem Description'], ['symptoms', 'Symptoms / Error'], ['diagnosis', 'Diagnosis'], ['actions_taken', 'Solution / Repair Performed'], ['parts_used', 'Parts Used'], ['result', 'Result'], ['successful', 'Maintenance successful', 'boolean']],
  'spare-parts': [['part_name', 'Part Name'], ['part_number', 'Part Number'], ['manufacturer', 'Manufacturer'], ['description', 'Description'], ['specifications', 'Specifications'], ['compatibility', 'Compatible equipment'], ['price', 'Asking price'], ['currency', 'Currency', ['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX']], ['availability_status', 'Availability', ['available', 'limited', 'unavailable', 'unknown']]],
  'sale-items': [['name', 'Name'], ['description', 'Description'], ['price', 'Asking price'], ['currency', 'Currency', ['RWF', 'USD', 'EUR', 'KES', 'TZS', 'UGX']]],
}

function Editor({ editing, onCancel, onSave, busy }) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(() => Object.fromEntries(fields[editing.section].map(([key]) => [key, editing.row[key] ?? ''])))
  const [photo, setPhoto] = useState(editing.row.photo_data || null)
  const [error, setError] = useState('')
  return <section className="mb-6 rounded-2xl border-2 border-teal-600 bg-white p-6" aria-label={t('Edit record')}>
    <h2 className="mb-4 text-xl font-semibold">{t('Edit record')} #{editing.row[ids[editing.section]]}</h2>
    {editing.section === 'job-cards' && <p className="mb-4 text-amber-800">{t('Editing a job card removes its validation. Review and validate it again afterward.')}</p>}
    <form onSubmit={async event => {
      event.preventDefault(); setError('')
      const payload = { ...draft }
      for (const key of ['price', 'phone']) if (payload[key] === '') payload[key] = null
      if (['spare-parts', 'sale-items'].includes(editing.section)) payload.photo_data = photo
      try { await onSave(payload) } catch (failure) { setError(failure.message) }
    }}>
      <div className="grid gap-4 md:grid-cols-2">{fields[editing.section].map(([key, label, type]) => <label key={key} className="text-sm font-medium">{t(label)}
        {Array.isArray(type) ? <select aria-label={t(label)} required value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border p-3"><option value="" disabled>{t('Select')}</option>{type.map(value => <option key={value} value={value}>{t(value)}</option>)}</select>
          : type === 'boolean' ? <input aria-label={t(label)} type="checkbox" checked={!!draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.checked })} className="ml-3" />
          : <textarea aria-label={t(label)} rows={2} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border p-3" />}
      </label>)}</div>
      {['spare-parts', 'sale-items'].includes(editing.section) && <label className="my-4 block">{t('Photo')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
        const file = event.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError(t('Choose a JPEG, PNG, or WebP image.')); return }
        const reader = new FileReader(); reader.onload = () => setPhoto(reader.result); reader.onerror = () => setError(t('Unable to read the photo.')); reader.readAsDataURL(file)
      }} className="mt-2 block" />{photo && <img src={photo} alt={t('Photo')} className="mt-2 h-24 object-contain" />}</label>}
      {error && <p role="alert" className="my-3 text-red-700">{t(error)}</p>}
      <div className="mt-5 flex gap-3"><button disabled={busy} className="rounded-lg bg-teal-700 px-5 py-3 text-white">{busy && <Spinner />}{t(busy ? 'Saving...' : 'Save changes')}</button><button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border px-5 py-3">{t('Cancel')}</button></div>
    </form>
  </section>
}

export default function AdminConsole({ account, onHome, onLogout }) {
  const { t } = useLanguage()
  const [section, setSection] = useState('overview')
  const [data, setData] = useState({})
  const [counts, setCounts] = useState({})
  const [offset, setOffset] = useState(0)
  const [updated, setUpdated] = useState(null)
  const generation = useRef(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [field, setField] = useState('')
  const [role, setRole] = useState('')
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  const load = useCallback(async (all = false) => {
    const request = ++generation.current
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ offset, limit: 25, search: debouncedSearch, field, role })
      const [summary, page] = await Promise.all([
        all || section === 'overview' ? accountRequest('/admin/overview-counts') : null,
        ids[section] ? accountRequest(`/admin/records/${section}?${params}`) : null,
      ])
      if (request !== generation.current) return
      if (summary) setCounts(summary)
      if (page) {
        if (offset && offset >= page.total) { setOffset(Math.max(0, Math.ceil(page.total / 25) - 1) * 25); return }
        setData(previous => ({ ...previous, [section]: page }))
      }
      setUpdated(new Date())
    } catch (failure) { if (request === generation.current) setError(failure.message) }
    finally { if (request === generation.current) setLoading(false) }
  }, [section, offset, debouncedSearch, field, role])
  useEffect(() => {
    const counter = generation
    const timer = setTimeout(() => load(), 0)
    return () => { clearTimeout(timer); counter.current++ }
  }, [load])
  async function openRecord(row, edit = false) {
    const request = generation.current
    setBusy(true); setError('')
    try {
      const detail = await accountRequest(`/admin/records/${section}/${row[ids[section]]}`)
      if (request !== generation.current) return
      if (edit) { setEditing({ section, row: detail }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
      else setData(previous => ({ ...previous, [section]: { ...previous[section], items: previous[section].items.map(item => item[ids[section]] === row[ids[section]] ? { ...item, ...detail, detailLoaded: true } : item) } }))
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  async function mutate(path, method, payload) {
    setBusy(true); setError(''); setNotice('')
    try { await accountRequest(path, method, payload); setNotice(t('Changes saved')); await load() }
    catch (failure) { setError(failure.message); throw failure }
    finally { setBusy(false) }
  }
  const action = (path, method, payload) => mutate(path, method, payload).catch(() => {})
  const owner = row => row.owner
  const rows = data[section]?.items || []
  const total = data[section]?.total || 0
  const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50'
  function go(key) { setSection(key); setEditing(null); setSearch(''); setDebouncedSearch(''); setOffset(0); setField(''); setRole('') }
  return <DashboardLayout account={account} sections={sections} section={section} onNavigate={go} onHome={onHome} onLogout={onLogout}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="text-slate-600">{t('Manage every field, role and record from one workspace.')}</p><div className="flex flex-wrap items-center gap-3">{(ids[section] || section === 'overview') && <button disabled={loading || busy} onClick={() => load()} className={`${button} bg-white`}>{loading && <Spinner />}{t('Refresh section')}</button>}<button disabled={loading || busy} onClick={() => load(true)} className={button}>{t('Refresh all')}</button>{updated && <span className="text-xs text-slate-500">{t('Last refreshed')}: {updated.toLocaleTimeString()}</span>}</div></div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{t(error)}</p>}{notice && <p role="status" className="mb-4 text-teal-800">{notice}</p>}
        {section === 'overview' && <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['users', 'Accounts'], ['job-cards', 'Job Cards'], ['sale-items', 'Items for sale'], ['item-requests', 'Item requests']].map(([key, label]) => <button key={key} onClick={() => go(key)} className="rounded-2xl bg-white p-6 text-left shadow-sm"><p className="text-sm text-slate-500">{t(label)}</p><p className="mt-3 text-4xl font-semibold">{counts[key] ?? '—'}</p></button>)}</div>
          <section className="mt-6 rounded-2xl bg-slate-900 p-6 text-white"><h3 className="text-xl font-semibold">{t('Account setup')}</h3><p className="my-3">{counts.awaiting_setup ?? '...' } · {t('Accounts awaiting field and role selection')}</p><button onClick={() => { go('users'); setField('unset') }} className={`${button} border-slate-500`}>{t('Review accounts')}</button></section>
          <div className="mt-6 grid gap-4 md:grid-cols-2"><section className="rounded-2xl bg-white p-6"><h3 className="mb-4 text-xl font-semibold">{t('Account field')}</h3>{['medical', 'it', 'electrical', 'mechanical'].map(value => <button key={value} onClick={() => { go('users'); setField(value) }} className="flex w-full justify-between border-b py-3"><span>{t(value)}</span><strong>{counts.fields?.[value] ?? '...'}</strong></button>)}</section><section className="rounded-2xl bg-white p-6"><h3 className="mb-4 text-xl font-semibold">{t('Account role')}</h3>{['technician', 'store', 'client'].map(value => <button key={value} onClick={() => { go('users'); setRole(value) }} className="flex w-full justify-between border-b py-3"><span>{t(value)}</span><strong>{counts.roles?.[value] ?? '...'}</strong></button>)}</section></div>
        </>}
        {section === 'assistant' && <AdminChat />}
        {section === 'branding' && <BrandingSettings />}
        {section === 'job-settings' && <JobCardSettings />}
        {section === 'commissions' && <CommissionWorkspace />}
        {section === 'delivery' && <DeliverySettings />}
        {section === 'subscriptions' && <SubscriptionAdmin />}
        {ids[section] && <>
          <div className="mb-5 flex flex-wrap gap-3"><input aria-label={t('Search records')} placeholder={t('Search records')} value={search} onChange={event => { setOffset(0); setSearch(event.target.value) }} className="min-w-0 flex-1 rounded-xl border p-3" /><select aria-label={t('Account field')} value={field} onChange={event => { setOffset(0); setField(event.target.value) }} className="rounded-xl border p-3"><option value="">{t('All fields')}</option>{['medical', 'it', 'electrical', 'mechanical', 'unset'].map(value => <option key={value} value={value}>{t(value === 'unset' ? 'Not provided' : value)}</option>)}</select><select aria-label={t('Account role')} value={role} onChange={event => { setOffset(0); setRole(event.target.value) }} className="rounded-xl border p-3"><option value="">{t('All roles')}</option>{['technician', 'store', 'client', 'admin'].map(value => <option key={value} value={value}>{t(value)}</option>)}</select></div>
          {editing && <Editor key={`${editing.section}-${editing.row[ids[editing.section]]}`} editing={editing} busy={busy} onCancel={() => setEditing(null)} onSave={async payload => { await mutate(`/admin/${editing.section}/${editing.row[ids[editing.section]]}`, 'PATCH', payload); setEditing(null) }} />}
          <div className="my-4 flex items-center gap-4"><button className={button} disabled={loading || busy || !offset} onClick={() => setOffset(value => Math.max(0, value - 25))}>{t('Previous')}</button><span>{total ? offset + 1 : 0}-{Math.min(offset + 25, total)} / {total}</span><button className={button} disabled={loading || busy || offset + 25 >= total} onClick={() => setOffset(value => value + 25)}>{t('Next')}</button></div>
          {busy && <p role="status"><Spinner />{t('Loading...')}</p>}
          {loading && <p role="status" className="mb-3"><Spinner />{t('Loading admin data...')}</p>}
          {!loading && rows.length === 0 && <p className="rounded-xl bg-white p-8">{t('No matching records')}</p>}
          <div className="grid gap-4 xl:grid-cols-2">{rows.map(row => {
            const id = row[ids[section]], account = owner(row), protectedAccount = section === 'users' && row.role === 'admin'
            const title = row.full_name || row.name || row.part_name || row.item_name || `${t(sections.find(([key]) => key === section)[1])} #${id}`
            return <article key={id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium uppercase tracking-wide text-teal-700">#{id} · {t(account?.account_field || 'Not provided')} · {t(account?.role || 'Not provided')}</p><h3 className="mt-2 break-words text-lg font-semibold">{title}</h3>
              {account && section !== 'users' && <p className="text-sm text-slate-500">{account.full_name}</p>}
              {row.price != null && <p className="mt-2 font-semibold">{row.price} {row.currency}</p>}
              {row.email && <p className="mt-2 break-all text-sm">{row.email} · {row.phone}</p>}
              {row.status && <p className="mt-2 text-sm">{t(row.status)}</p>}
              {section === 'users' && <p className="mt-2 text-sm">{t(row.is_active ? 'Active' : 'Inactive')}</p>}
              {['spare-parts', 'sale-items'].includes(section) && <p className="mt-2 text-sm">{t(row.posted_at ? 'Posted' : 'Not posted')}</p>}
              {row.photo_data && <img src={row.photo_data} alt={title} loading="lazy" className="my-3 h-40 w-full object-contain" />}
              <details className="my-4" onToggle={event => { if (event.currentTarget.open && !row.detailLoaded && !busy) openRecord(row) }}><summary className="cursor-pointer text-sm font-medium text-teal-700">{t('View details')}</summary><dl className="mt-3 space-y-2 text-sm">{Object.entries(row).filter(([key]) => !['photo_data', 'attachments_data', 'can_manage', 'owner', 'detailLoaded'].includes(key)).map(([key, value]) => <div key={key}><dt className="font-medium">{t(key.replaceAll('_', ' '))}</dt><dd className="whitespace-pre-wrap break-words text-slate-600">{value == null ? t('Not provided') : typeof value === 'object' ? Object.entries(value).map(([k, v]) => `${k}: ${v ?? ''}`).join('\n') : key === 'role' ? t(String(value)) : String(value)}</dd></div>)}</dl></details>
              {section === 'users' && !protectedAccount && <UpgradeSubscription user={row} />}
              {!protectedAccount && <div className="flex flex-wrap gap-2">
                {fields[section] && <button disabled={busy} onClick={() => openRecord(row, true)} className={button}>{t('Edit')}</button>}
                {section === 'users' && <button disabled={busy} onClick={() => action(`/admin/users/${id}/status?is_active=${!row.is_active}`, 'PUT')} className={button}>{t(row.is_active ? 'Deactivate' : 'Activate')}</button>}
                {['spare-parts', 'sale-items'].includes(section) && <button disabled={busy} onClick={() => action(`/admin/${section}/${id}/publication`, 'PATCH', { published: !row.posted_at })} className={button}>{t(row.posted_at ? 'Unpublish' : 'Publish')}</button>}
                {section === 'job-cards' && row.successful && row.status !== 'validated' && <button disabled={busy} onClick={() => action(`/admin/job-cards/${id}/validate`, 'POST')} className={button}>{t('Validate')}</button>}
                {['item-requests', 'spare-part-requests'].includes(section) && <select aria-label={`${t('Request status')} #${id}`} disabled={busy} value={row.status} onChange={event => action(section === 'item-requests' ? `/item-requests/${id}` : `/admin/spare-part-requests/${id}?status=${event.target.value}`, section === 'item-requests' ? 'PATCH' : 'PUT', section === 'item-requests' ? { status: event.target.value } : undefined)} className={button}>{(section === 'item-requests' ? ['pending', 'accepted', 'declined', 'fulfilled'] : ['new', 'contacted', 'negotiating', 'confirmed', 'ordered', 'delivered', 'completed', 'cancelled']).map(value => <option key={value} value={value}>{t(value)}</option>)}</select>}
                {section !== 'knowledge' && <button disabled={busy} className={`${button} border-red-200 text-red-700`} onClick={() => {
                  const warning = section === 'users' ? 'Delete this account and its job cards, knowledge, spare parts, sale items, requests and chats? This cannot be undone.' : 'Delete this record and its related data? This cannot be undone.'
                  if (window.confirm(`${title}\n\n${t(warning)}`)) action(`/admin/${section}/${id}`, 'DELETE')
                }}>{t('Delete')}</button>}
              </div>}
              {section === 'item-requests' && <><p className="mt-3 text-sm">{t('Commission status')}: {t(commissionStatuses[row.commission_status || 'not_started'])}</p><CommissionPanel requestId={id} admin /></>}
            </article>
          })}</div>
        </>}
  </DashboardLayout>
}
