export default function ComponentCard({ component, onAdd, onRemove, onDetails, index }) {
  const low = Number(component.quantity) <= Number(component.min_threshold || 0)
  return (
    <div className={`card ${low ? 'low' : ''}`} style={{ animationDelay: `${index * 0.03}s` }}>
      <div className="card-top">
        <div>
          <h3>{component.name}</h3>
          <div className="part-no">{component.part_no || 'NO PART #'}</div>
        </div>
        <span className="category-pill">{component.category?.name || 'Uncategorized'}</span>
      </div>
      <div className="qty-row">
        <span className="qty">{component.quantity}</span>
        <span className="unit">{component.unit || 'pcs'}</span>
        {low && <span className="low-badge">LOW STOCK</span>}
      </div>
      {component.machine && <div className="meta-line"><b>Fits:</b> {component.machine}</div>}
      {component.location && <div className="meta-line"><b>Location:</b> {component.location}</div>}
      <div className="card-actions">
        <button className="btn btn-sm btn-add" onClick={() => onAdd(component)}>+ Add stock</button>
        <button className="btn btn-sm btn-remove" onClick={() => onRemove(component)}>− Remove</button>
      </div>
      <div className="card-foot">
        <button className="detail-link" onClick={() => onDetails(component)}>View details &amp; history →</button>
      </div>
    </div>
  )
}
