import { useState } from 'react'
import { computeBuildable } from '../utils.js'
import MachineFormModal from '../components/MachineFormModal.jsx'

export default function MachineDetailPage({
  machine, rows, allComponents,
  onBack, onEditMachine, onAddComponent, onUpdateQty, onRemoveComponent, onDeleteMachine
}) {
  const [showEdit, setShowEdit] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState('')
  const [qtyToAdd, setQtyToAdd] = useState(1)
  const [addError, setAddError] = useState('')
  const [editingRowId, setEditingRowId] = useState(null)
  const [editQty, setEditQty] = useState(1)

  const usedIds = new Set(rows.map(r => r.component_id))
  const available = allComponents.filter(c => !usedIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  const buildable = computeBuildable(rows)

  async function handleAdd(e) {
    e.preventDefault()
    if (!selectedComponent) { setAddError('Choose a component.'); return }
    const q = Number(qtyToAdd)
    if (!q || q <= 0) { setAddError('Quantity must be greater than zero.'); return }
    setAddError('')
    try {
      await onAddComponent({ component_id: selectedComponent, quantity_required: q })
      setSelectedComponent(''); setQtyToAdd(1)
    } catch (err) {
      setAddError(err.message || 'Could not add component.')
    }
  }

  function startEditQty(row) { setEditingRowId(row.id); setEditQty(row.quantity_required) }
  async function saveEditQty(row) {
    const q = Number(editQty)
    if (!q || q <= 0) return
    await onUpdateQty(row.id, q)
    setEditingRowId(null)
  }

  return (
    <div className="wrap">
      <button className="link-btn back-btn" onClick={onBack}>← Back to machines</button>

      <div className="machine-header">
        <div>
          <h2 className="machine-title">{machine.name}</h2>
          {machine.description && <p className="machine-desc">{machine.description}</p>}
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>Edit machine</button>
          <button className="btn btn-remove btn-sm" onClick={onDeleteMachine}>Delete machine</button>
        </div>
      </div>

      <div className="buildable-hero">
        <span className="num">{buildable}</span>
        <span className="lbl">machine{buildable === 1 ? '' : 's'} of "{machine.name}" can be built from current stock</span>
      </div>

      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>Bill of materials <span className="tag">{rows.length} component{rows.length === 1 ? '' : 's'}</span></h2>
      </div>

      <table className="log-table">
        <thead>
          <tr><th>Component</th><th>Qty per machine</th><th>Current stock</th><th>Builds from this part</th><th></th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} className="log-empty">No components added yet — add the first one below.</td></tr>
          )}
          {rows.map(row => {
            const need = Number(row.quantity_required) || 0
            const have = Number(row.component?.quantity ?? 0)
            const partBuild = need > 0 ? Math.floor(have / need) : 0
            return (
              <tr key={row.id}>
                <td>{row.component?.name || '(deleted component)'}</td>
                <td style={{ fontFamily: "'IBM Plex Mono'" }}>
                  {editingRowId === row.id ? (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="number" min="1" value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)' }}
                      />
                      <button className="btn btn-sm btn-primary" onClick={() => saveEditQty(row)}>Save</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditingRowId(null)}>Cancel</button>
                    </span>
                  ) : (
                    <>{row.quantity_required} {row.component?.unit || 'pcs'}</>
                  )}
                </td>
                <td style={{ fontFamily: "'IBM Plex Mono'" }}>{have} {row.component?.unit || 'pcs'}</td>
                <td style={{ fontFamily: "'IBM Plex Mono'" }}>{partBuild}</td>
                <td>
                  {editingRowId !== row.id && (
                    <span style={{ display: 'flex', gap: 10 }}>
                      <button className="detail-link" onClick={() => startEditQty(row)}>Edit</button>
                      <button className="detail-link" style={{ color: 'var(--danger)' }} onClick={() => onRemoveComponent(row.id)}>Remove</button>
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="add-bom-row">
        <h3 className="add-bom-title">Add a component to this machine</h3>
        {addError && <div className="form-error">{addError}</div>}
        <form onSubmit={handleAdd} className="add-bom-form">
          <select value={selectedComponent} onChange={e => setSelectedComponent(e.target.value)}>
            <option value="">Select component…</option>
            {available.map(c => <option key={c.id} value={c.id}>{c.name}{c.part_no ? ` (${c.part_no})` : ''}</option>)}
          </select>
          <input type="number" min="1" value={qtyToAdd} onChange={e => setQtyToAdd(e.target.value)} placeholder="Qty per machine" />
          <button type="submit" className="btn btn-primary btn-sm">+ Add</button>
        </form>
        {available.length === 0 && rows.length > 0 && (
          <p className="hint-text">All existing components are already part of this machine's build list.</p>
        )}
      </div>

      {showEdit && (
        <MachineFormModal
          initial={machine}
          onClose={() => setShowEdit(false)}
          onSave={async (payload) => { await onEditMachine(payload); setShowEdit(false) }}
        />
      )}
    </div>
  )
}
