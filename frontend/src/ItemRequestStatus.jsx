import { useLanguage } from './language'
export default function ItemRequestStatus({ item }) {
  const { t } = useLanguage()
  if (!item.request_status) return null
  const requested = item.request_status === 'requested'
  return <p className={`my-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${requested ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
    {t(requested ? 'Requested' : 'Non-requested')}{requested && ` (${item.active_request_count})`}
  </p>
}
