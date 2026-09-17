import { useEffect, useState } from 'react'
import { getPublicSaleItems } from './api'
import { useLanguage } from './language'
import LanguageSwitcher from './LanguageSwitcher'
import { homeCopy } from './homeCopy'

export default function HomePage({ loggedIn, onEnter, onRegister }) {
  const { language, t } = useLanguage()
  const c = homeCopy[language] || homeCopy.en
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    getPublicSaleItems(query, offset, controller.signal).then((data) => {
      if (controller.signal.aborted) return
      setItems((previous) => offset ? [...previous, ...data.items.filter((item) => !previous.some((old) => old.listing_key === item.listing_key))] : data.items)
      setTotal(data.total)
      setError(false)
    }).catch((failure) => {
      if (failure.name !== 'AbortError' && !controller.signal.aborted) setError(true)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [query, offset, retry])

  useEffect(() => {
    const refresh = () => { setLoading(true); setOffset(0); setRetry((value) => value + 1) }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const primary = 'rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 disabled:opacity-50'
  const secondary = 'rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600'

  return <div id="home" className="min-h-screen bg-[#f8faf9] text-slate-900">
    <a href="#sales-board" className="sr-only focus:not-sr-only">{c.board}</a>
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-5">
        <a href="#home" className="flex items-center gap-3 text-2xl font-bold tracking-tight"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">S</span>Simeon<span className="text-teal-700">.</span></a>
        <nav aria-label={c.home} className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-600"><a href="#home" className="hover:text-teal-700">{c.home}</a><a href="#sales-board" className="hover:text-teal-700">{c.board}</a><a href="#how-it-works" className="hover:text-teal-700">{c.how}</a></nav>
        <div className="flex flex-wrap items-center gap-3"><LanguageSwitcher /><button onClick={onEnter} className={primary}>{loggedIn ? c.enter : c.login} <span aria-hidden="true">↗</span></button></div>
      </div>
    </header>
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div><p className="mb-6 text-xs font-bold uppercase tracking-widest text-teal-700">{c.eyebrow}</p><h1 className="whitespace-pre-line text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{c.title}</h1><p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{c.intro}</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={onEnter} className={primary}>{c.enter} →</button><a href="#sales-board" className={secondary}>{c.browse}</a></div><p className="mt-7 text-xs font-medium text-slate-500">{c.languages}</p></div>
        <div className="rounded-3xl border border-teal-100 bg-teal-50 p-5 sm:p-8">
          <div className="rounded-2xl bg-white p-6 shadow-xl shadow-teal-900/5"><div className="flex items-center gap-3 border-b border-slate-100 pb-5"><span aria-hidden="true" className="rounded-xl bg-teal-700 px-3 py-2 font-bold text-white">S</span><div><p className="font-semibold">Simeon</p><p className="text-xs text-slate-500">{c.preview}</p></div></div><p className="mt-6 mr-6 rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-sm leading-relaxed">{c.question}</p><p className="mt-4 ml-6 rounded-2xl rounded-tr-sm bg-teal-700 p-4 text-sm leading-relaxed text-white">{c.answer}</p><p className="mt-4 mr-6 rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-sm">{c.follow}</p><p className="mt-5 text-center text-xs text-slate-400">{c.example}</p></div>
        </div>
      </section>
      <section id="how-it-works" className="scroll-mt-8 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14"><h2 className="mb-8 text-2xl font-semibold tracking-tight">{c.how}</h2><div className="grid gap-8 md:grid-cols-3">{[1, 2, 3].map((number) => <article key={number}><p className="mb-4 text-sm font-bold text-teal-700">0{number}</p><h3 className="text-lg font-semibold">{c[`feature${number}`]}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{c[`detail${number}`]}</p></article>)}</div></div>
      </section>
      <section id="sales-board" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-teal-700">{c.board}</p><h2 className="text-3xl font-semibold tracking-tight">{c.boardIntro}</h2><p className="mt-3 max-w-2xl text-slate-600">{c.boardDetail}</p></div><button onClick={loggedIn ? onEnter : onRegister} className={secondary}>{c.list} +</button></div>
        <form className="my-8 flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); setItems([]); setTotal(0); setLoading(true); setError(false); setOffset(0); setQuery(search.trim()); setRetry((value) => value + 1) }}><label htmlFor="public-search" className="sr-only">{c.search}</label><input id="public-search" type="search" maxLength={200} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={c.search} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-teal-600" /><button className={primary}>{t('Search')}</button></form>
        {error && <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5"><p>{c.error}</p><button disabled={loading} onClick={() => { setLoading(true); setError(false); setRetry((value) => value + 1) }} className="mt-3 font-semibold underline">{c.retry}</button></div>}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.listing_key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg hover:shadow-slate-200/50"><div className="aspect-[4/3] bg-slate-100"><>{item.photo_data ? <img src={item.photo_data} alt={item.name} loading="lazy" className="h-full w-full object-contain p-3" /> : <div className="flex h-full items-center justify-center text-slate-500">{t("Spare Part")}</div>}</></div><div className="p-5">{item.availability_status && <p className="mb-2 text-xs font-semibold text-teal-700">{t(item.availability_status)}</p>}<p className="text-xs text-slate-500">{c.seller} {item.seller_name}</p><h3 className="mt-2 break-words text-lg font-semibold">{item.name}</h3><p className="mt-3 text-xl font-bold text-teal-800">{item.price != null && item.currency ? new Intl.NumberFormat(language, { style: 'currency', currency: item.currency }).format(Number(item.price)) : t('Price not provided')}</p><p id={`listing-${item.listing_key}`} className={`mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 ${expanded === item.listing_key ? '' : 'line-clamp-2'}`}>{item.description}</p><button aria-expanded={expanded === item.listing_key} aria-controls={`listing-${item.listing_key}`} onClick={() => setExpanded(expanded === item.listing_key ? null : item.listing_key)} className="mt-4 text-sm font-semibold text-teal-700 hover:underline">{expanded === item.listing_key ? c.close : c.details} →</button></div></article>)}</div>
        {loading && <p role="status" className="py-8 text-center text-slate-500">{c.loading}</p>}
        {!loading && !error && !items.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><h3 className="text-lg font-semibold">{c.empty}</h3><p className="mt-2 text-sm text-slate-500">{c.emptyDetail}</p></div>}
        {!error && items.length < total && <div className="mt-8 text-center"><button disabled={loading} onClick={() => { setLoading(true); setOffset(items.length) }} className={secondary}>{c.more}</button></div>}
      </section>
      <section className="bg-teal-900 px-6 py-14 text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6"><div><h2 className="max-w-2xl text-3xl font-semibold tracking-tight">{c.cta}</h2><p className="mt-4 text-teal-100">{c.ctaDetail}</p></div><button onClick={loggedIn ? onEnter : onRegister} className="rounded-xl bg-white px-6 py-3 font-semibold text-teal-900 hover:bg-teal-50">{loggedIn ? c.enter : c.join} →</button></div></section>
    </main>
  </div>
}
