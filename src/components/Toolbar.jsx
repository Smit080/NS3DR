export default function Toolbar({
  search, setSearch,
  categoryId, setCategoryId,
  categories,
  onNewComponent,
  onManageCategories
}) {
  return (
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
      <button className="btn btn-ghost" onClick={onManageCategories}>Manage categories</button>
      <button className="btn btn-primary" onClick={onNewComponent}>+ New Component</button>
    </div>
  )
}
