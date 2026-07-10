import ComponentCard from './ComponentCard.jsx'

export default function ComponentGrid({ components, allCount, onAdd, onRemove, onDetails, onEdit }) {
  if (components.length === 0) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <p><strong>{allCount === 0 ? 'No components yet' : 'No matches'}</strong></p>
        <p>{allCount === 0 ? 'Add your first part to start tracking stock.' : 'Try a different search or category.'}</p>
      </div>
    )
  }
  return (
    <div className="grid">
      {components.map((c, i) => (
        <ComponentCard
          key={c.id}
          component={c}
          index={i}
          onAdd={onAdd}
          onRemove={onRemove}
          onDetails={onDetails}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
