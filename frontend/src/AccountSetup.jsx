import { useState } from 'react'
import AccountChoices from './AccountChoices'
import { accountRequest } from './api'
import { useLanguage } from './language'
import LanguageSwitcher from './LanguageSwitcher'

export default function AccountSetup({ account, onDone, onLogout }) {
  const { t } = useLanguage()
  const [field, setField] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <main className="mx-auto max-w-xl p-6"><LanguageSwitcher />
    <h1 className="my-4 text-2xl font-bold">{account.full_name}</h1>
    <p className="mb-6">{t('Choose your field and role to continue. Your existing records will be kept.')}</p>
    <p className="mb-6 text-sm text-slate-600">{t('Sync pending job cards before choosing Store or Client. Only technicians can submit job cards.')}</p>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('')
      try { onDone(await accountRequest('/users/account-setup', 'PUT', { account_field: field, role })) }
      catch (failure) { setError(failure.message) }
      finally { setBusy(false) }
    }}>
      <AccountChoices field={field} role={role} onField={setField} onRole={setRole} />
      <button disabled={busy} className="rounded-xl bg-teal-700 px-5 py-3 text-white">{t(busy ? 'Saving...' : 'Continue')}</button>
      {error && <p role="alert" className="mt-3 text-red-700">{t(error)}</p>}
    </form>
    <button onClick={onLogout} className="mt-5 underline">{t('Logout')}</button>
  </main>
}
