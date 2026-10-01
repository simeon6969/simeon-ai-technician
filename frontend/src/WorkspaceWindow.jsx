import { useEffect, useId, useRef } from 'react'
import { useLanguage } from './language'

export default function WorkspaceWindow({ title, onClose, children }) {
  const { t } = useLanguage()
  const dialogRef = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return <dialog ref={dialogRef} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    className="fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-300 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60">
    <div className="flex max-h-[94dvh] flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b p-4 sm:px-6">
        <h2 id={titleId} className="text-xl font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="shrink-0 rounded-lg border px-4 py-2 font-semibold">{t('Close')}</button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
    </div>
  </dialog>
}
