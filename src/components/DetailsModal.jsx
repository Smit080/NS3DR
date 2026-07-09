function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function DetailsModal({ component, transactions, onClose, onDelete }) {
  const rows = [
    ['Category', component.category?.name || '—'],
    ['Quantity in stock', `${component.quantity} ${component.unit || 'pcs'}`],
    ['Low-stock threshold', component.min_threshold],
    ['Compatible machine(s)', component.machine || '—'],
    ['Storage location', component.location || '—'],
    ['Supplier', component.supplier || '—'],
    ['Added on', fmtDate(component.created_at)],
    ['Notes', component.notes || '—'],
  ]
  const history = transactions
    .filter(t => t.component_id === component.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal wide">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>{component.name}</h3>
        <p className="modal-sub">{component.part_no ? `Part #: ${component.part_no}` : 'No part number on file'}</p>

        {rows.map(([k, v]) => (
          <div className="detail-row" key={k}><span>{k}</span><span>{v}</span></div>
        ))}

        <div className="section-head" style={{ marginTop: 18, marginBottom: 6 }}>
          <h2 style={{ fontSize: 13 }}>Component history</h2>
        </div>
        <div className="history-list">
          {history.length === 0 && <div className="log-empty">No movements recorded for this component yet.</div>}
          {history.map(t => (
            <div className="hist-row" key={t.id}>
              <div className="h-top">
                <span>
                  <span className={`log-type ${t.type}`}>{t.type === 'add' ? 'STOCK IN' : 'STOCK OUT'}</span>
                  {' '}&nbsp; {t.type === 'add' ? '+' : '-'}{t.quantity} {component.unit || 'pcs'}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono'", color: 'var(--ink-faint)' }}>{fmtDate(t.created_at)}</span>
              </div>
              {t.note && <div className="h-note">{t.note}</div>}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-remove" onClick={() => onDelete(component)}>Delete component</button>
        </div>
      </div>
    </div>
  )
}
