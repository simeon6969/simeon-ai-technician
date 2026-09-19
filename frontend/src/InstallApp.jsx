import { useLanguage } from './language'
import AndroidUpdate from './AndroidUpdate'
import { useState } from 'react'

const androidCopy = {
  en: ['Android app', 'Update to newest version Android app'],
  rw: ['Porogaramu ya Android', 'Vugurura porogaramu ya Android'],
  fr: ['Application Android', 'Mettre à jour l’application Android'],
  sw: ['Programu ya Android', 'Sasisha programu ya Android'],
}

const androidApkUrl = 'https://github.com/simeon6969/simeon-ai-technician/releases/download/android-test-5/Simeon-test.apk'
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
  const androidWords = androidCopy[language] || androidCopy.en
  const [androidAction, setAndroidAction] = useState('')
  function selectAndroidAction(event) {
    const action = event.target.value
    if (action === 'download') {
      setAndroidAction('')
      window.location.assign(androidApkUrl)
    } else {
      setAndroidAction(action)
    }
  }
  const buttonStyle = 'inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700'
  return <section id="install-app" aria-label={words[2]} className="border-t border-teal-100 bg-teal-50 px-6 py-8">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap">
      <div className="flex flex-col items-start gap-3">
        <label htmlFor="android-app-action" className="font-semibold text-slate-800">{androidWords[0]}</label>
        <select id="android-app-action" value={androidAction} onChange={selectAndroidAction} className="w-full max-w-md rounded-xl border border-teal-300 bg-white px-4 py-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-700">
          <option value="" disabled>{androidWords[0]}</option>
          <option value="download">{words[0]}</option>
          <option value="update">{androidWords[1]}</option>
        </select>
        {androidAction === 'update' && <AndroidUpdate website />}
      </div>
      <a href={windowsInstallerUrl} className={`${buttonStyle} self-start`}>{words[1]}</a>
    </div>
  </section>
}
