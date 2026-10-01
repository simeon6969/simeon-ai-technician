import itPaired from './assets/fields/it-paired.jpg'
import mechanicalPaired from './assets/fields/mechanical-paired.jpg'
import { useState } from 'react'

const fieldPhotos = { medical: '/field-images/medical.jpg', it: itPaired, electrical: '/field-images/electrical.jpg', mechanical: mechanicalPaired }

export default function HomeShowcase({ c, t, onEnter }) {
  const [role, setRole] = useState('technician')
  return <div className="home-showcase">
    <div className="showcase-top"><span className="showcase-mark">S</span><div><strong>S</strong><p>{c.workspace}</p></div></div>
    <div className="showcase-tabs" role="group" aria-label={c.how}>{['technician', 'store', 'client'].map(value => <button key={value} aria-pressed={role === value} onClick={() => setRole(value)}>{t(value)}</button>)}</div>
    <div key={role} className="showcase-content">
      <div className="showcase-orbit" aria-hidden="true"><div className="orbit-ring" /><span className="orbit-center">S</span>{['medical', 'it', 'electrical', 'mechanical'].map(field => <span key={field} className={`orbit-node orbit-${field}`}><img src={fieldPhotos[field]} alt="" width="900" height="600" decoding="async" /></span>)}</div>
      <div className="showcase-message"><span className="showcase-avatar">S</span><div><strong>S</strong><p>{c[role]}</p></div></div>
      <button onClick={onEnter} className="showcase-action">{c.list}<span aria-hidden="true">↗︎</span></button>
    </div>
    <div className="showcase-bottom"><span aria-hidden="true">↳</span>{c.offline}</div>
  </div>
}
