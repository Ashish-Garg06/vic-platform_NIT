import React, { useState } from 'react'

export function Spinner() {
  return <div className="loading-screen"><div className="spinner"/></div>
}

export function Badge({ text, type = 'gray' }) {
  const map = { Active:'green', Graduated:'blue', Pending:'amber', Rejected:'red', Open:'green', Closed:'gray', 'Closing Soon':'red',
    Approved:'green', Submitted:'blue', 'Under Review':'amber', Disbursed:'green', Draft:'gray',
    Available:'green', Licensed:'blue', 'Under Negotiation':'amber', 'Not Available':'gray',
    Confirmed:'green', Completed:'green', Cancelled:'red', 'In Progress':'blue', Assigned:'amber',
    Selected:'green', high:'red', High:'red', Urgent:'red', Medium:'amber', Low:'gray',
  }
  const cls = map[text] || type
  return <span className={`badge badge-${cls}`}>{text}</span>
}

export function TrlBadge({ level }) {
  return <span className={`trl-badge trl-${level}`}>TRL {level}</span>
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  if (!isOpen) return null
  const maxW = { sm:'380px', md:'520px', lg:'720px', xl:'900px' }[size]
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: 18, padding: '2px 8px' }}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="page-header">
      <div>
        {breadcrumb && <div className="text-muted text-small mb-2">{breadcrumb}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="text-muted mt-1" style={{ fontSize: 14 }}>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, change, icon, accent = '#1B3A6B', sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-accent" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-2">
        <div className="stat-card-label">{label}</div>
        {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
      </div>
      <div className="stat-card-value">{value}</div>
      {change && <div className={`stat-card-change ${change.startsWith('+') ? 'pos' : 'neg'}`}>{change}</div>}
      {sub && <div className="text-muted text-small mt-1">{sub}</div>}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label} {t.count !== undefined && <span className="badge badge-gray ml-1" style={{ fontSize: 10 }}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Search...', style }) {
  return (
    <div className="search-bar" style={style}>
      <input className="form-control" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 34 }} />
    </div>
  )
}

export function EmptyState({ icon = '📋', title = 'No records found', text = 'Try adjusting your filters', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-text">{text}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ProgressBar({ value, color = 'navy', showLabel = false }) {
  return (
    <div>
      {showLabel && <div className="flex justify-between text-small text-muted mb-1"><span/><span>{value}%</span></div>}
      <div className="progress">
        <div className={`progress-bar progress-${color}`} style={{ width: `${Math.min(100, value || 0)}%` }} />
      </div>
    </div>
  )
}

export function Avatar({ name = '', size = 36, bg = '#1B3A6B' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export function Alert({ type = 'info', children }) {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '❌' }
  return <div className={`alert alert-${type}`}><span>{icons[type]}</span><div>{children}</div></div>
}

export function Card({ title, children, actions, style }) {
  return (
    <div className="card" style={style}>
      {title && <div className="card-header"><span className="card-title">{title}</span>{actions && <div className="flex gap-2">{actions}</div>}</div>}
      {children}
    </div>
  )
}

export function Chip({ label }) {
  return <span className="chip">{label}</span>
}

export function FormGroup({ label, hint, required, children }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}</label>}
      {children}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  )
}

export function Select({ value, onChange, children, ...props }) {
  return (
    <select className="form-control" value={value} onChange={onChange} {...props}>{children}</select>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])
  const show = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2000 }}>
      {toasts.map(t => (
        <div key={t.id} className={`alert alert-${t.type}`} style={{ minWidth: 260, boxShadow: 'var(--shadow-lg)' }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
  return { show, ToastContainer }
}
