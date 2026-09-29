import itPaired from './assets/fields/it-paired.jpg'
import mechanicalPaired from './assets/fields/mechanical-paired.jpg'
import { useState } from 'react'
import { useLanguage } from './language'

const photos = { medical: '/field-images/medical.jpg', it: itPaired, electrical: '/field-images/electrical.jpg', mechanical: mechanicalPaired }

const fields = ['medical', 'it', 'electrical', 'mechanical']
const controls = {
  en: ['Pause movement', 'Resume movement'],
  rw: ['Hagarika kugenda', 'Komeza kugenda'],
  fr: ['Suspendre le défilement', 'Reprendre le défilement'],
  sw: ['Sitisha mwendo', 'Endeleza mwendo'],
}

export default function FieldCarousel({ t, onSelect }) {
  const { language } = useLanguage()
  const [paused, setPaused] = useState(false)
  return <div className="field-carousel" data-paused={paused}>
    <div className="mb-3 flex justify-end"><button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} className="field-motion-control rounded-lg border px-3 py-2 text-sm">{controls[language]?.[paused ? 1 : 0] || controls.en[paused ? 1 : 0]}</button></div>
    <div className="field-window"><div className="field-track">
      {[0, 1].map(copy => <div key={copy} className="field-cycle" aria-hidden={copy === 1 ? true : undefined}>
        {fields.map(value => <button type="button" key={value} tabIndex={copy === 1 ? -1 : 0} onClick={() => onSelect(value)} className="field-tile rounded-2xl border bg-white p-6 text-left">
          <img src={photos[value]} alt="" width="900" height="600" loading="lazy" decoding="async" className="field-photo" />
          <span className="field-photo-label flex items-center justify-between gap-3 font-semibold">{t(value)}<span aria-hidden="true" className="text-teal-700">↗</span></span>
        </button>)}
      </div>)}
    </div></div>
  </div>
}
