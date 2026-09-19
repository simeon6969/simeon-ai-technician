import { useLanguage } from './language'

const androidApkUrl = 'https://github.com/simeon6969/simeon-ai-technician/releases/download/android-test-2/Simeon-test.apk'
const windowsInstallerUrl = import.meta.env.DEV
  ? '/downloads/Simeon-Setup.exe'
  : 'https://github.com/simeon6969/simeon-ai-technician/releases/download/windows-v1.0.0/Simeon-Setup.exe'
const copy = {
  en: ['download android app', 'download app for windows', 'Install app'],
  rw: ['Kuramo porogaramu ya Android', 'Kuramo porogaramu ya Windows', 'Shyiramo porogaramu'],
  fr: ['Télécharger l’application Android', 'Télécharger l’application pour Windows', 'Installer l’application'],
  sw: ['Pakua programu ya Android', 'Pakua programu ya Windows', 'Sakinisha programu'],
}

export default function InstallApp() {
  const { language } = useLanguage()
  const words = copy[language] || copy.en
  const buttonStyle = 'inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700'
  return <section id="install-app" aria-label={words[2]} className="border-t border-teal-100 bg-teal-50 px-6 py-8">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a href={androidApkUrl} className={buttonStyle}>{words[0]}</a>
      <a href={windowsInstallerUrl} className={buttonStyle}>{words[1]}</a>
    </div>
  </section>
}
