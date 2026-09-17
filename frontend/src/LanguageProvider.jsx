import { useEffect, useState } from 'react'
import { LanguageContext } from './language'
import { translate } from './translations'

const languages = ['en', 'rw', 'fr', 'sw']

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('simeon_language')
      return languages.includes(saved) ? saved : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem('simeon_language', language)
    } catch {
      // Switching remains available when browser storage is disabled.
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: (key) => translate(language, key) }}>
      {children}
    </LanguageContext.Provider>
  )
}
