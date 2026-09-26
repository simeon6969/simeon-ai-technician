import { useLanguage } from './language'

export default function AccountChoices({ field, role, onField, onRole }) {
  const { t } = useLanguage()
  const style = 'mb-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3'
  return <>
    <label htmlFor="account-field" className="mb-2 block font-medium">{t('Account field')}</label>
    <select id="account-field" required value={field} onChange={event => onField(event.target.value)} className={style}>
      <option value="" disabled>{t('Choose your field')}</option>
      {['medical', 'it', 'electrical', 'mechanical'].map(value => <option key={value} value={value}>{t(value)}</option>)}
    </select>
    <label htmlFor="account-role" className="mb-2 block font-medium">{t('Account role')}</label>
    <select id="account-role" required value={role} onChange={event => onRole(event.target.value)} className={style}>
      <option value="" disabled>{t('Choose your role')}</option>
      {['technician', 'store', 'client'].map(value => <option key={value} value={value}>{t(value)}</option>)}
    </select>
    {role && <p className="mb-4 text-sm text-slate-600">{t(role === 'technician' ? 'Maintenance, job cards, inventory and item requests.' : role === 'store' ? 'Manage inventory, post items and handle item requests.' : 'Browse posted items and send requests to sellers.')}</p>}
  </>
}
