import { useLanguage } from './language'

export default function SparePartPrice({ part }) {
  const { t, language } = useLanguage()
  return <p className="my-2 font-semibold text-teal-800">{part.price != null
    ? new Intl.NumberFormat(language, { style: 'currency', currency: part.currency || 'RWF' }).format(Number(part.price))
    : t('Price not provided')}</p>
}
