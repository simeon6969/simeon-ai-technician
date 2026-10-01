import { useEffect, useState } from 'react'
import { accountRequest } from './api'
import { preparePhoto } from './preparePhoto'
import { useLanguage } from './language'
import { Spinner } from './LoadingStatus'

export default function ProfileImage() {
  const { t } = useLanguage()
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    let active = true
    accountRequest('/users/me/branding').then(data => { if (active) setImage(data.image_data) }).catch(failure => { if (active) setError(failure.message) }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])
  async function save(file) {
    setBusy(true); setError(''); setSaved(false)
    try {
      if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) throw new Error('Choose a valid JPEG, PNG, or WebP image up to 5 MB.')
      const result = await accountRequest('/users/me/branding', file ? 'PUT' : 'DELETE', file ? { image_data: await preparePhoto(file) } : undefined)
      setImage(result.image_data); setSaved(true)
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  return <section className="mb-6 rounded-xl border bg-white p-5">
    <h2 className="text-xl font-bold">{t('Profile picture or company logo')}</h2>
    <p className="my-3 text-sm text-slate-600">{t('Your image appears above the heading on downloaded job cards.')}</p>
    {image && <img src={image} alt={t('Profile picture or company logo')} className="my-4 h-32 w-40 rounded-lg border object-contain p-2" />}
    <label className="block">{t('Upload image')}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="mt-2 block w-full" onChange={event => { const file = event.target.files[0]; event.target.value = ''; if (file) save(file) }} /></label>
    {image && <button type="button" disabled={busy} onClick={() => save(null)} className="mt-4 rounded-lg border px-4 py-2 text-red-700">{t('Remove image')}</button>}
    {busy && <p role="status" className="mt-3"><Spinner />{t('Loading...')}</p>}
    {saved && <p role="status" className="mt-3">{t('Changes saved')}</p>}
    {error && <p role="alert" className="mt-3 text-red-700">{t(error)}</p>}
  </section>
}
