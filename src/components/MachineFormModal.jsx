import { useState } from 'react'

export default function MachineFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Machine name is required.'); return }
    setError('')
    setSaving(true)
    try {
      await onSave({ name: name.trim(), description: description.trim() })
    } catch (err) {
      setError(err.message || 'Could not save machine.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>{isEdit ? 'Edit machine' : 'New machine'}</h3>
        <p className="modal-sub">{isEdit ? 'Update the machine name or description.' : 'Add a machine model. You\'ll add its components on the next screen.'}</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Machine name <span className="req">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NS3DR-1325" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional — model notes, size, spec, etc." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create machine')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
