import { useLanguage } from './language'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
      <span>{t('Language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-2 focus:outline-slate-400"
      >
        <option value="en" lang="en">English</option>
        <option value="rw" lang="rw">Kinyarwanda</option>
        <option value="fr" lang="fr">Français</option>
        <option value="sw" lang="sw">Kiswahili</option>
      </select>
    </label>
  )
}
