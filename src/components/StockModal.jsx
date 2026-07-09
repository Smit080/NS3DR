import { useState } from 'react'

// mode: 'add' | 'remove'
export default function StockModal({ mode, component, onClose, onSubmit }) {
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdd = mode === 'add'

  async function handleSubmit(e) {
    e.preventDefault()
    const q = Number(qty)
    if (!q || q <= 0) { setError('Enter a quantity greater than zero.'); return }
    if (!isAdd && q > Number(component.quantity)) {
      setError(`Only ${component.quantity} ${component.unit || 'pcs'} in stock — can't remove ${q}.`)
      return
    }
    if (!isAdd && !note.trim()) {
      setError('Please note which machine or job this stock is used for.')
      return
    }
    if (!performedBy.trim()) {
      setError('Please enter your name.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSubmit({ quantity: q, note: note.trim(), performedBy: performedBy.trim() })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>{isAdd ? 'Add stock' : 'Remove stock'}</h3>
        <p className="modal-sub">
          {isAdd
            ? `Record incoming units for "${component.name}".`
            : 'Every removal needs a reason — which machine or job it went to.'}
        </p>
        <div className="stock-preview">
          <span>Current stock</span>
          <b>{component.quantity} {component.unit || 'pcs'}</b>
        </div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Quantity to {isAdd ? 'add' : 'remove'} <span className="req">*</span></label>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div className="field">
            <label>{isAdd ? 'Added by' : 'Removed by'} <span className="req">*</span></label>
            <input
              type="text"
              value={performedBy}
              onChange={e => setPerformedBy(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label>{isAdd ? 'Source / reference note' : 'Used for / machine'} {!isAdd && <span className="req">*</span>}</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={isAdd ? 'e.g. Purchase order #, supplier delivery' : 'e.g. NS3DR-1325 unit #4 — spindle repair'}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn ${isAdd ? 'btn-primary' : 'btn-danger-solid'}`} disabled={saving}>
              {saving ? 'Saving…' : (isAdd ? 'Add to stock' : 'Remove from stock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
