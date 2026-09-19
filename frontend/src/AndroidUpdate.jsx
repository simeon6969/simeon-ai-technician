import { useState } from 'react'
import { useLanguage } from './language'
import { newestAndroidUpdate, releasesUrl } from './androidUpdates'

const copy = {
  en: ['Update to newest version', 'Checking for updates...', 'Download update', 'You have the newest version.', 'Could not check for updates. Check your internet connection and try again.', 'After downloading, open the APK and choose Install or Update. Your account stays the same.'],
  rw: ['Vugurura porogaramu', 'Turareba niba hari ivugurura...', 'Kuramo ivugurura', 'Ufite porogaramu iheruka.', 'Ntitwashoboye kureba ivugurura. Reba interineti wongere ugerageze.', 'Nyuma yo kuyikuramo, fungura APK uhitemo Install cyangwa Update. Konti yawe ntihinduka.'],
  fr: ['Mettre à jour l’application', 'Recherche de mises à jour...', 'Télécharger la mise à jour', 'Vous avez la dernière version.', 'Impossible de vérifier les mises à jour. Vérifiez votre connexion et réessayez.', 'Après le téléchargement, ouvrez le fichier APK et choisissez Installer ou Mettre à jour. Votre compte reste le même.'],
  sw: ['Sasisha programu', 'Inatafuta sasisho...', 'Pakua sasisho', 'Una toleo jipya zaidi.', 'Imeshindwa kutafuta sasisho. Angalia intaneti na ujaribu tena.', 'Baada ya kupakua, fungua APK na uchague Install au Update. Akaunti yako haibadiliki.'],
}

export default function AndroidUpdate({ website = false }) {
  const { language } = useLanguage()
  const words = copy[language] || copy.en
  const [status, setStatus] = useState('idle')
  const [update, setUpdate] = useState(null)
  async function check() {
    setStatus('checking')
    setUpdate(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(releasesUrl, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } })
      if (!response.ok) throw new Error('Update check failed')
      // Browsers cannot read the version installed on a phone; offer the latest APK.
      const latest = newestAndroidUpdate(await response.json(), website ? 0 : Number(import.meta.env.VITE_ANDROID_BUILD_NUMBER))
      if (website && !latest) throw new Error('No Android download available')
      setUpdate(latest)
      setStatus(latest ? 'available' : 'current')
    } catch {
      setStatus('error')
    } finally {
      clearTimeout(timeout)
    }
  }
  const style = 'rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white disabled:opacity-60'
  return <section className={website ? 'max-w-md' : 'border-t border-teal-100 bg-teal-50 px-6 py-6'}>
    <div className="mx-auto max-w-6xl">
      <button type="button" onClick={check} disabled={status === 'checking'} className={style}>{words[status === 'checking' ? 1 : 0]}</button>
      <div role="status" aria-live="polite" className="mt-3 text-sm text-slate-700">
        {status === 'current' && words[3]}
        {status === 'error' && words[4]}
        {update && <><a className={`${style} inline-block`} href={update.url}>{words[2]}</a><p className="mt-3">{words[5]}</p></>}
      </div>
    </div>
  </section>
}
