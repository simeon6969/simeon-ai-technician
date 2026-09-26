import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage } from './language'

export default function DashboardLayout({ account, sections, section, onNavigate, onHome, onLogout, children }) {
  const { t } = useLanguage()
  const field = { medical: 'Medical', it: 'IT', electrical: 'Electrical', mechanical: 'Mechanical' }[account.account_field] || 'Simeon'
  return <div className="min-h-screen bg-[#f3f6f3] text-slate-900">
    <header className="border-b border-teal-900/10 bg-white px-4 py-4 sm:px-8"><div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-950 text-2xl font-bold text-lime-200">S</span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">{t(field)} · {t(account.role)}</p><h1 className="break-words text-xl font-bold">{account.full_name}</h1></div></div><div className="flex flex-wrap items-center gap-4 text-sm"><LanguageSwitcher /><button onClick={onHome}>{t('Home')}</button><button onClick={onLogout}>{t('Logout')}</button></div></div></header>
    <div className="mx-auto grid max-w-screen-2xl gap-6 p-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-8">
      <nav aria-label={t('Workspace navigation')} className="flex gap-2 overflow-x-auto rounded-2xl bg-teal-950 p-3 text-white lg:sticky lg:top-4 lg:h-fit lg:flex-col">{sections.map(([key, label], index) => <button key={key} onClick={() => onNavigate(key)} aria-current={section === key ? 'page' : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${section === key ? 'bg-lime-200 font-semibold text-teal-950' : 'hover:bg-white/10'}`}><span className="text-xs opacity-60">{String(index + 1).padStart(2, '0')}</span>{t(label)}</button>)}</nav>
      <main className="min-w-0"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">{t(field)} · {t('Workspace')}</p><h2 className="mt-2 text-3xl font-bold tracking-tight">{t(sections.find(([key]) => key === section)?.[1] || 'Overview')}</h2></div>{children}</main>
    </div>
  </div>
}

export function DashboardOverview({ actions, children }) {
  const { t } = useLanguage()
  return <><section className="rounded-2xl bg-teal-950 p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-lime-200">{t('Your workspace, at a glance')}</p><h3 className="mt-3 text-2xl font-semibold">{t('What would you like to do today?')}</h3><p className="mt-3 text-sm leading-relaxed text-teal-100">{t('Choose a task. Simeon is here to help you along the way.')}</p><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{actions.map(({ label, description, onClick }) => <button key={label} onClick={onClick} className="rounded-xl border border-white/20 bg-white/10 p-4 text-left transition hover:bg-white/20"><strong className="block">{t(label)} →</strong><span className="mt-2 block text-sm text-teal-100">{t(description)}</span></button>)}</div></section><div className="mt-5">{children}</div></>
}
