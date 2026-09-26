import { useSyncExternalStore } from 'react'
import { subscribe, getPending } from './requestActivity'
import { useLanguage } from './language'

export function Spinner() {
  return <span aria-hidden="true" className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
}

export default function LoadingStatus() {
  const pending = useSyncExternalStore(subscribe, getPending)
  const { language } = useLanguage()
  if (!pending) return null
  const labels = { en: 'Please wait… Processing your request.', rw: 'Tegereza… Turimo gutunganya ubusabe bwawe.', fr: 'Veuillez patienter… Traitement de votre demande.', sw: 'Tafadhali subiri… Tunashughulikia ombi lako.' }
  return <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-50 flex w-max max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-xl"><Spinner />{labels[language] || labels.en}</div>
}
