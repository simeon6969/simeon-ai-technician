import { useEffect, useState } from 'react'
import { getSparePartPosts, postSparePart } from './api'
import { useLanguage } from './language'
import SparePartPrice from './SparePartPrice'

export function PostSparePartButton({ part, onPosted }) {
  const { t } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  return <div className="mb-4">
    {part.posted_at && <a href="#sales-board" className="mb-2 block text-sm font-medium text-teal-700 underline">{t('View on homepage')}</a>}
    <button disabled={busy || !!part.posted_at} onClick={async () => {
      setBusy(true); setError(false)
      try { onPosted(await postSparePart(part.spare_part_id)) }
      catch { setError(true) }
      finally { setBusy(false) }
    }} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{t(part.posted_at ? 'Posted' : busy ? 'Posting...' : 'Post spare part')}</button>
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{t('Unable to post spare part.')}</p>}
  </div>
}

export default function SparePartPosts() {
  const { t, language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  async function load(offset = 0) {
    setBusy(true); setError(false)
    try {
      const data = await getSparePartPosts(offset)
      setPosts((previous) => offset ? [...previous, ...data.posts.filter((post) => !previous.some((item) => item.spare_part_id === post.spare_part_id))] : data.posts)
      setTotal(data.total)
    } catch { setError(true) }
    finally { setBusy(false) }
  }
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [open])
  return <section className="mt-6">
    <button aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white">{t(open ? 'Hide posts' : 'View posts')}</button>
    {open && <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-semibold">{t('Spare-part board')}</h3><button disabled={busy} onClick={() => load()}>{t('Refresh')}</button></div>
      {error && <p role="alert" className="mt-3 text-red-600">{t('Unable to load posts.')}</p>}
      {busy && <p role="status" className="mt-3">{t('Loading posts...')}</p>}
      {!busy && !error && !posts.length && <p className="mt-3 text-slate-500">{t('No spare parts have been posted yet.')}</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">{posts.map((post) => <article key={post.spare_part_id} className="rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold">{post.part_name}</h4>
        <SparePartPrice part={post} />
        <p className="mt-1 text-sm text-slate-500">{t('Technician')}: {post.technician_name} · {new Date(post.posted_at + (/Z|[+-]\d\d:\d\d$/.test(post.posted_at) ? '' : 'Z')).toLocaleString(language)}</p>
        <p className="my-2 text-sm font-medium">{t(post.availability_status)}</p>
        {post.photo_data && <img src={post.photo_data} alt={post.part_name} className="mb-3 max-h-48 rounded-lg object-contain" />}
        <dl className="space-y-2 text-sm">{[['part_number', 'Part Number'], ['manufacturer', 'Manufacturer'], ['compatibility', 'Compatible equipment'], ['specifications', 'Specifications'], ['description', 'Description']].map(([key, label]) => <div key={key}><dt className="font-medium">{t(label)}</dt><dd className="whitespace-pre-wrap break-words text-slate-600">{post[key] || t('Not provided')}</dd></div>)}</dl>
      </article>)}</div>
      {posts.length < total && <button disabled={busy} onClick={() => load(posts.length)} className="mt-4 rounded-xl border border-slate-300 px-4 py-2">{t('Load more')}</button>}
    </div>}
  </section>
}
