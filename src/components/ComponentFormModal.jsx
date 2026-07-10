import { useState } from 'react'

const UNITS = ['pcs', 'sets', 'meters', 'rolls', 'boxes', 'pairs']

const empty = {
  name: '', category_id: '', part_no: '', quantity: 0, unit: 'pcs',
  min_threshold: 2, location: '', machine: '', supplier: '', notes: ''
}

export default function ComponentFormModal({ categories, initial, onClose, onSave }) {
  const isEdit = !!initial
  const [form, setForm] = useState(() => isEdit ? {
    name: initial.name || '',
    category_id: initial.category_id || '',
    part_no: initial.part_no || '',
    quantity: initial.quantity ?? 0,
    unit: initial.unit || 'pcs',
    min_threshold: initial.min_threshold ?? 2,
    location: initial.location || '',
    machine: initial.machine || '',
    supplier: initial.supplier || '',
    notes: initial.notes || ''
  } : empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Component name is required.'); return }
    if (!form.category_id) { setError('Please choose a category.'); return }
    setError('')
    setSaving(true)
    try {
      await onSave({
        ...form,
        quantity: Number(form.quantity) || 0,
        min_threshold: Number(form.min_threshold) || 0
      })
    } catch (err) {
      setError(err.message || 'Could not save component.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>{isEdit ? 'Edit component' : 'New component'}</h3>
        <p className="modal-sub">{isEdit ? 'Update this component\'s details.' : 'Add a part to inventory.'} Fields marked <span className="req">*</span> are required.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Component name <span className="req">*</span></label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. NEMA 23 Stepper Motor" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Category <span className="req">*</span></label>
              <select value={form.category_id} onChange={e => update('category_id', e.target.value)}>
                <option value="">Select…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Part / SKU number</label>
              <input type="text" value={form.part_no} onChange={e => update('part_no', e.target.value)} placeholder="e.g. STP-N23-08" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>{isEdit ? 'Quantity in stock' : 'Starting quantity'} <span className="req">*</span></label>
              <input type="number" min="0" value={form.quantity} onChange={e => update('quantity', e.target.value)} disabled={isEdit} />
              {isEdit && <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 }}>Use "Add stock" / "Remove" on the card to change quantity, so it stays logged.</div>}
            </div>
            <div className="field">
              <label>Unit</label>
              <select value={form.unit} onChange={e => update('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Low-stock threshold</label>
              <input type="number" min="0" value={form.min_threshold} onChange={e => update('min_threshold', e.target.value)} />
            </div>
            <div className="field">
              <label>Storage location / bin</label>
              <input type="text" value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Rack B-3" />
            </div>
          </div>
          <div className="field">
            <label>Compatible machine(s)</label>
            <input type="text" value={form.machine} onChange={e => update('machine', e.target.value)} placeholder="e.g. NS3DR-1325, NS3DR-2040" />
          </div>
          <div className="field">
            <label>Supplier</label>
            <input type="text" value={form.supplier} onChange={e => update('supplier', e.target.value)} placeholder="e.g. Huanyang Electric" />
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Specs, voltage, size, anything worth noting…" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Save component')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
