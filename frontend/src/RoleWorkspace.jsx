import InventorySimeon from './InventorySimeon'
import MySubscription from './MySubscription'
import AccountRecovery from './AccountRecovery'
import FastDelivery from './FastDelivery'
import { useEffect, useState } from 'react'
import { useLanguage } from './language'
import LanguageSwitcher from './LanguageSwitcher'
import StoreConversation from './StoreConversation'
import SaleItems from './SaleItems'
import SparePartPosts, { PostSparePartButton } from './SparePartPosts'
import SparePartPrice from './SparePartPrice'
import OfflineStatus from './OfflineStatus'
import ItemMarket from './ItemMarket'
import { getMySpareParts, deleteSparePart } from './api'

export default function RoleWorkspace({ account, onHome, onLogout }) {
  const { t } = useLanguage()
  const [recording, setRecording] = useState(false)
  const [parts, setParts] = useState([])
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (account.role !== 'store') return
    let active = true
    getMySpareParts().then(rows => { if (active) { setParts(rows); setError('') } }).catch(failure => { if (active) setError(failure.message) })
    const refresh = event => { if (event.detail.userId === String(account.user_id)) setRevision(value => value + 1) }
    window.addEventListener('simeon-synced', refresh)
    return () => { active = false; window.removeEventListener('simeon-synced', refresh) }
  }, [account.user_id, account.role, revision])
  if (recording) return <StoreConversation kind="part" account={account} onClose={() => setRecording(false)} onSaved={() => setRevision(value => value + 1)} />
  return <div className="min-h-screen bg-slate-100">
    <header className="bg-slate-900 p-6 text-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">{account.full_name}</h1><p>{t(account.account_field)} · {t(account.role)}</p></div>
      <LanguageSwitcher /><button onClick={onHome}>{t('Home')}</button><button onClick={onLogout}>{t('Logout')}</button>
    </div></header>
    <main className="mx-auto max-w-6xl p-6"><MySubscription subscription={account.subscription} /><InventorySimeon account={account} />
      {account.role === 'store' && account.account_field === 'medical' && <SaleItems medical />}
      {account.role === 'store' && <><OfflineStatus account={account} /><button onClick={() => setRecording(true)} className="rounded-xl bg-teal-700 px-5 py-3 text-white">{t('Store Spare Part')}</button>
        <section className="my-6 rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">{t('My Spare Parts')}</h2><button onClick={() => setRevision(value => value + 1)}>{t('Refresh')}</button>
          {error && <p role="alert" className="text-red-700">{t(error)}</p>}
          <div className="mt-4 grid gap-4 md:grid-cols-2">{parts.map(part => <article key={part.spare_part_id} className="rounded-xl border p-4"><h3 className="font-semibold">{part.part_name}</h3><SparePartPrice part={part} /><p>{part.description}</p>{part.photo_data && <img src={part.photo_data} alt={part.part_name} className="my-3 max-h-40 object-contain" />}<PostSparePartButton part={part} onPosted={() => setRevision(value => value + 1)} /><button disabled={busy} className="text-red-700" onClick={async () => {
            if (!window.confirm(t('Delete this spare part? Existing requests for it will also be removed.'))) return
            setBusy(true)
            try { await deleteSparePart(part.spare_part_id); setRevision(value => value + 1) } catch (failure) { setError(failure.message) } finally { setBusy(false) }
          }}>{t('Delete')}</button><FastDelivery name={part.part_name} /></article>)}</div><SparePartPosts />
        </section>{account.account_field !== 'medical' && <SaleItems />}</>}
      <AccountRecovery setup /><ItemMarket />
    </main>
  </div>
}
