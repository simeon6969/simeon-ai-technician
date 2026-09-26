import { useState } from 'react'

export function FieldIcon({ field }) {
  const paths = {
    medical: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" /></>,
    it: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4m-4-13-2 2 2 2m8-4 2 2-2 2" /></>,
    electrical: <path d="m13 2-9 12h7l-1 8 10-13h-8z" />,
    mechanical: <><circle cx="12" cy="12" r="4" /><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z" /></>,
  }
  return <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">{paths[field]}</svg>
}

export default function HomeShowcase({ c, t, onEnter }) {
  const [role, setRole] = useState('technician')
  return <div className="home-showcase">
    <div className="showcase-top"><span className="showcase-mark">S</span><div><strong>Simeon</strong><p>{c.workspace}</p></div><span aria-hidden="true" className="showcase-spark">✳︎</span></div>
    <div className="showcase-tabs" role="group" aria-label={c.how}>{['technician', 'store', 'client'].map(value => <button key={value} aria-pressed={role === value} onClick={() => setRole(value)}>{t(value)}</button>)}</div>
    <div key={role} className="showcase-content">
      <div className="showcase-orbit" aria-hidden="true"><div className="orbit-ring" /><span className="orbit-center">S</span>{['medical', 'it', 'electrical', 'mechanical'].map(field => <span key={field} className={`orbit-node orbit-${field}`}><FieldIcon field={field} /></span>)}</div>
      <div className="showcase-message"><span className="showcase-avatar">S</span><div><strong>Simeon</strong><p>{c[role]}</p></div></div>
      <button onClick={onEnter} className="showcase-action">{c.list}<span aria-hidden="true">↗︎</span></button>
    </div>
    <div className="showcase-bottom"><span aria-hidden="true">↳</span>{c.offline}</div>
  </div>
}
