import { useLanguage } from './language'

export default function PhotoSizeOption({ checked, onChange, disabled }) {
  const { language } = useLanguage()
  const copy = {
    en: 'Use a smaller photo for faster upload (optional). Choose this before selecting a photo; unchecked keeps the original.',
    rw: 'Koresha ifoto nto kugira ngo yoherezwe vuba (si ngombwa). Hitamo mbere yo gushyiraho ifoto; utabihisemo ifoto igumana ingano yayo.',
    fr: 'Réduire la photo pour un envoi plus rapide (facultatif). Choisissez avant de sélectionner la photo ; sinon, l’original est conservé.',
    sw: 'Tumia picha ndogo ili kupakia haraka (hiari). Chagua kabla ya kuchagua picha; bila kuchagua, picha ya asili inahifadhiwa.',
  }
  return <label className="my-3 flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} className="mt-1" />{copy[language] || copy.en}</label>
}
