import CommissionPanel from './CommissionPanel'
import { useState } from 'react'
import { accountRequest } from './api'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'

const labels = { en: 'Request', rw: 'Saba', fr: 'Demander', sw: 'Omba' }

export default function HomeItemRequest({ item, loggedIn, onLogin }) {
  const { t, language } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  return <div>
    <button type="button" disabled={busy || sent || item.availability_status === 'unavailable'}
      onClick={async () => {
        if (!loggedIn) { onLogin(); return }
        setBusy(true); setError('')
        try {
          const result = await accountRequest('/item-requests/', 'POST', { item_type: item.item_type, item_id: item.item_id })
          setSent(result.request_id)
        } catch (failure) { setError(failure.message) }
        finally { setBusy(false) }
      }} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
      {busy && <Spinner />}{sent ? t('Request saved') : labels[language] || labels.en}
    </button>
    {sent && <CommissionPanel requestId={sent} />}
    {sent && <p role="status" className="mt-2 text-sm text-teal-700">{t('Request saved')}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{t(error)}</p>}
  </div>
}
