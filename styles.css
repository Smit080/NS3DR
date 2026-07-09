function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function ActivityLog({ transactions, components, visible }) {
  if (!visible) return null
  return (
    <table className="log-table">
      <thead>
        <tr><th>Date &amp; time</th><th>Component</th><th>Action</th><th>Qty</th><th>By</th><th>Details</th></tr>
      </thead>
      <tbody>
        {transactions.length === 0 && (
          <tr><td colSpan={6} className="log-empty">No stock movements recorded yet.</td></tr>
        )}
        {transactions.map(t => {
          const comp = components.find(c => c.id === t.component_id)
          return (
            <tr key={t.id}>
              <td style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: 'var(--ink-soft)' }}>{fmtDate(t.created_at)}</td>
              <td>{comp ? comp.name : '(deleted component)'}</td>
              <td><span className={`log-type ${t.type}`}>{t.type === 'add' ? 'STOCK IN' : 'STOCK OUT'}</span></td>
              <td style={{ fontFamily: "'IBM Plex Mono'" }}>{t.type === 'add' ? '+' : '-'}{t.quantity}</td>
              <td>{t.performed_by || '—'}</td>
              <td className="log-note">{t.note || '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
