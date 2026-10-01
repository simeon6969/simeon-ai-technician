import { useState } from 'react'
import { listingPhotoUrl } from './api'
import { useLanguage } from './language'

export default function ListingPhoto({ item, expanded = false }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState('')
  const src = item.photo_data || listingPhotoUrl(item, open || expanded)
  if (!(item.has_photo || item.photo_data) || failed === src) {
    return <div className="flex h-full min-h-40 items-center justify-center text-slate-500">{t('Photo not available')}</div>
  }
  return <button type="button" className="block h-full w-full" aria-label={item.name} aria-expanded={open || expanded} onClick={() => setOpen(!open)}>
    <img src={src} alt={item.name} loading="lazy" decoding="async" onError={() => setFailed(src)} className={`w-full object-contain p-3 ${open || expanded ? 'max-h-[70vh]' : 'h-full max-h-80'}`} />
  </button>
}
