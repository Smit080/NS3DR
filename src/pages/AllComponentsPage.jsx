import { useState } from 'react'
import ComponentGrid from '../components/ComponentGrid.jsx'

export default function AllComponentsPage({
  components, categories, onBack, onAdd, onRemove, onDetails, onEdit
}) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowOnly, setLowOnly] = useState(false)

  const filtered = components.filter(c => {
    if (categoryId && c.category_id !== categoryId) return false
    if (lowOnly && !(Number(c.quantity) <= Number(c.min_threshold || 0))) return false
    const t = search.trim().toLowerCase()
    if (!t) return true
    return (c.name || '').toLowerCase().includes(t) ||
      (c.part_no || '').toLowerCase().includes(t) ||
      (c.machine || '').toLowerCase().includes(t)
  }).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="wrap">
      <button className="link-btn back-btn" onClick={onBack}>← Back to home</button>

      <div className="section-head" style={{ marginTop: 18 }}>
        <h2>All Components <span className="tag">{filtered.length} of {components.length}</span></h2>
      </div>

      <div className="toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, part number, or machine…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="cat-filter" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="low-toggle">
          <input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div style={{ marginTop: 18 }}>
        <ComponentGrid
          components={filtered}
          allCount={components.length}
          onAdd={onAdd}
          onRemove={onRemove}
          onDetails={onDetails}
          onEdit={onEdit}
        />
      </div>
    </div>
  )
}
