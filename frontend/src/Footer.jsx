import { useLanguage } from './language'

export default function Footer() {
  const { t } = useLanguage()
  const linkStyle = 'rounded underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'

  return (
    <footer className="border-t border-slate-700 bg-slate-900 px-6 py-8 text-sm text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Simeon</p>
          <p className="mt-2">© {new Date().getFullYear()} Simeon. {t('All rights reserved.')}</p>
        </div>
        <address className="flex flex-col gap-3 not-italic">
          <a href="mailto:simeon0202@icloud.com" className={`${linkStyle} break-words`}>
            {t('Support email')}: simeon0202@icloud.com
          </a>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <a href="tel:+250786854200" className={linkStyle}>{t('Phone')}: +250 786 854 200</a>
            <a href="https://wa.me/250786854200" target="_blank" rel="noopener noreferrer" className={linkStyle}>
              WhatsApp<span className="sr-only"> — {t('Opens in a new tab')}</span>
            </a>
          </div>
        </address>
      </div>
    </footer>
  )
}
