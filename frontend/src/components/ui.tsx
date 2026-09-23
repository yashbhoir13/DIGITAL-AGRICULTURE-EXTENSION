export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export function StatusBadge({ level }: { level: string }) {
  const l = level.toLowerCase()
  let cls = 'bg-orange-100 text-orange-800'
  let dot = '🟢'
  if (l.includes('medium')) {
    cls = 'bg-amber-100 text-amber-800'
    dot = '🟡'
  } else if (l.includes('high') || l.includes('surplus') && !l.includes('low')) {
    if (l.includes('high')) {
      cls = 'bg-rose-100 text-rose-800'
      dot = '🔴'
    }
  }
  if (l.includes('shortage')) {
    cls = 'bg-amber-100 text-amber-800'
    dot = '🟡'
  }
  if (l.includes('balanced') || l.includes('low')) {
    cls = 'bg-orange-100 text-orange-800'
    dot = '🟢'
  }
  if (l.includes('high risk') || l === 'high risk') {
    cls = 'bg-rose-100 text-rose-800'
    dot = '🔴'
  }
  return <span className={`badge ${cls}`}>{dot} {level}</span>
}

export function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null
  return <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">{message}</div>
}

export function Loading() {
  return <div className="card text-slate-500">Loading…</div>
}
