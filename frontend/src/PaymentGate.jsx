import { useLanguage } from './language'
import { useEffect, useState } from 'react'

export default function PaymentGate() {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  useEffect(() => {
    const blocked = event => setMessage(event.detail)
    window.addEventListener('simeon-payment-required', blocked)
    return () => window.removeEventListener('simeon-payment-required', blocked)
  }, [])
  if (!message) return null
  return <div role="dialog" aria-modal="true" aria-label={t("Payment required")} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-6 text-white"><div className="max-w-lg"><h1 className="mb-4 text-2xl font-bold">{t("Payment confirmation required")}</h1><p>{t(message)}</p><button className="mt-5 rounded-lg bg-teal-600 px-4 py-3" onClick={() => window.location.reload()}>{t("Check again")}</button><button className="ml-4" onClick={() => {
    for (const key of ['access_token', 'user_id', 'user_role']) localStorage.removeItem(key)
    window.location.hash = 'login'; window.location.reload()
  }}>{t("Back to login")}</button></div></div>
}
