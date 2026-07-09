import { useState } from 'react'

export default function CategoryManagerModal({ categories, components, onClose, onAdd, onRename, onDelete }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function countFor(catId) {
    return components.filter(c => c.category_id === catId).length
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setError(''); setBusy(true)
    try {
      await onAdd(newName)
      setNewName('')
    } catch (err) {
      setError(err.message?.includes('duplicate') ? 'That category already exists.' : (err.message || 'Could not add category.'))
    } finally {
      setBusy(false)
    }
  }

  function startEdit(cat) { setEditingId(cat.id); setEditValue(cat.name); setError('') }

  async function saveEdit(cat) {
    if (!editValue.trim()) return
    setBusy(true); setError('')
    try {
      await onRename(cat.id, editValue)
      setEditingId(null)
    } catch (err) {
      setError(err.message || 'Could not rename category.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(cat) {
    const count = countFor(cat.id)
    const msg = count > 0
      ? `"${cat.name}" is used by ${count} component${count > 1 ? 's' : ''}. Deleting it will set those components to Uncategorized. Continue?`
      : `Delete category "${cat.name}"?`
    if (!window.confirm(msg)) return
    setBusy(true); setError('')
    try {
      await onDelete(cat.id)
    } catch (err) {
      setError(err.message || 'Could not delete category.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Manage categories</h3>
        <p className="modal-sub">Add, rename, or remove component categories.</p>
        {error && <div className="form-error">{error}</div>}

        <div className="cat-list">
          {categories.length === 0 && <div className="log-empty">No categories yet — add one below.</div>}
          {categories.map(cat => (
            <div className="cat-row" key={cat.id}>
              {editingId === cat.id ? (
                <>
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                  <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => saveEdit(cat)}>Save</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{cat.name}</span>
                  <span className="count">{countFor(cat.id)} item{countFor(cat.id) === 1 ? '' : 's'}</span>
                  <button type="button" className="btn-icon" title="Rename" onClick={() => startEdit(cat)}>✎</button>
                  <button type="button" className="btn-icon" title="Delete" onClick={() => handleDelete(cat)}>🗑</button>
                </>
              )}
            </div>
          ))}
        </div>

        <form className="cat-add-row" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="New category name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>+ Add</button>
        </form>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
