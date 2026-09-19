import { useEffect, useState } from 'react'
import { useLanguage } from './language'

const androidApkUrl = 'https://github.com/simeon6969/simeon-ai-technician/releases/download/android-test-2/Simeon-test.apk'
const androidCopy = {
  en: ['Download Android APK', 'Test version · Android 7+ · 4.7 MB', 'Open the downloaded APK and allow installation when prompted. Log in with your existing account. Saved records use the live database.'],
  rw: ['Kuramo APK ya Android', 'Verisiyo yo kugerageza · Android 7+ · 4.7 MB', 'Fungura APK wakuyemo, wemere kuyishyiramo igihe ubisabwe. Injira ukoresheje konti usanzwe ufite. Ibyo ubika bijya mu bubiko busanzwe bw’amakuru.'],
  fr: ['Télécharger l’APK Android', 'Version de test · Android 7+ · 4,7 Mo', 'Ouvrez l’APK téléchargé et autorisez son installation lorsque cela est demandé. Connectez-vous avec votre compte habituel. Les données enregistrées sont ajoutées à la base réelle.'],
  sw: ['Pakua APK ya Android', 'Toleo la majaribio · Android 7+ · MB 4.7', 'Fungua APK uliyopakua na uruhusu usakinishaji ukiombwa. Ingia kwa akaunti yako iliyopo. Rekodi unazohifadhi zinaingia kwenye hifadhidata halisi.'],
}

const copy = {
  en: ['Take Simeon with you', 'Install on your phone for quick access from your home screen. An internet connection is required.', 'Install Simeon', 'On iPhone or iPad: open this website in Safari, tap Share, then Add to Home Screen. Enable Open as Web App if shown, then tap Add.', 'On Android: open this website in Chrome, open the menu and choose Install app or Add to Home screen.', 'Installation is available on the secure (HTTPS) website.', 'If the installation prompt does not appear, use your browser menu.'],
  rw: ['Gendana na Simeon', 'Shyira Simeon kuri telefoni kugira ngo uyifungure byoroshye. Interineti irakenewe.', 'Shyiramo Simeon', 'Kuri iPhone cyangwa iPad: fungura uru rubuga muri Safari, kanda Share, hanyuma Add to Home Screen. Hitamo Open as Web App niba ihari, ukande Add.', 'Kuri Android: fungura uru rubuga muri Chrome, ujye muri menu uhitemo Install app cyangwa Add to Home screen.', 'Gushyiramo birashoboka ku rubuga rwa HTTPS.', 'Niba ubutumwa bwo gushyiramo butaje, koresha menu ya mushakisha.'],
  fr: ['Emportez Simeon avec vous', 'Installez Simeon sur votre téléphone pour y accéder depuis l’écran d’accueil. Une connexion Internet est nécessaire.', 'Installer Simeon', 'Sur iPhone ou iPad : ouvrez ce site dans Safari, touchez Partager, puis Sur l’écran d’accueil. Activez Ouvrir comme app web si proposé, puis Ajouter.', 'Sur Android : ouvrez ce site dans Chrome, puis le menu et choisissez Installer l’application ou Ajouter à l’écran d’accueil.', 'L’installation est disponible sur le site sécurisé (HTTPS).', 'Si la demande d’installation ne s’affiche pas, utilisez le menu du navigateur.'],
  sw: ['Beba Simeon popote', 'Sakinisha kwenye simu ili ufungue kutoka skrini ya mwanzo. Muunganisho wa intaneti unahitajika.', 'Sakinisha Simeon', 'Kwenye iPhone au iPad: fungua tovuti hii katika Safari, gusa Share kisha Add to Home Screen. Washa Open as Web App ikionekana, kisha gusa Add.', 'Kwenye Android: fungua tovuti hii katika Chrome, fungua menyu na uchague Install app au Add to Home screen.', 'Usakinishaji unapatikana kwenye tovuti salama ya HTTPS.', 'Ikiwa ombi la usakinishaji halionekani, tumia menyu ya kivinjari.'],
}

export default function InstallApp() {
  const { language } = useLanguage()
  const words = copy[language] || copy.en
  const androidWords = androidCopy[language] || androidCopy.en
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true)
  const [busy, setBusy] = useState(false)
  const [fallback, setFallback] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const capture = (event) => { event.preventDefault(); setPrompt(event) }
    const complete = () => { setInstalled(true); setPrompt(null) }
    const display = () => setInstalled(media.matches || navigator.standalone === true)
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', complete)
    media.addEventListener('change', display)
    return () => {
      window.removeEventListener('beforeinstallprompt', capture)
      window.removeEventListener('appinstalled', complete)
      media.removeEventListener('change', display)
    }
  }, [])
  return <section id="install-app" className="border-t border-teal-100 bg-teal-50 px-6 py-8">
    <div className="mx-auto max-w-6xl"><h2 className="text-xl font-semibold text-slate-900">{words[0]}</h2><p className="mt-2 text-sm text-slate-600">{words[1]}</p>
      <div className="mt-5 rounded-2xl border border-teal-200 bg-white p-5">
        <a href={androidApkUrl} className="inline-flex rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700" aria-describedby="android-apk-details">
          {androidWords[0]}
        </a>
        <p id="android-apk-details" className="mt-3 text-sm font-medium text-teal-800">{androidWords[1]}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{androidWords[2]}</p>
      </div>
      {!installed && prompt && <button disabled={busy} onClick={async () => {
        setBusy(true)
        try { await prompt.prompt(); await prompt.userChoice }
        catch { setFallback(true) }
        finally { setPrompt(null); setBusy(false) }
      }} className="mt-4 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{words[2]}</button>}
      {fallback && <p role="status" className="mt-3 text-sm">{words[6]}</p>}
      {!window.isSecureContext && <p className="mt-3 text-sm text-amber-800">{words[5]}</p>}
      {!installed && <div className="mt-4 grid gap-4 text-sm leading-relaxed text-slate-700 md:grid-cols-2"><p>{words[3]}</p><p>{words[4]}</p></div>}
    </div>
  </section>
}
