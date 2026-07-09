import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
import ComponentGrid from './components/ComponentGrid.jsx'
import ActivityLog from './components/ActivityLog.jsx'
import ComponentFormModal from './components/ComponentFormModal.jsx'
import StockModal from './components/StockModal.jsx'
import DetailsModal from './components/DetailsModal.jsx'
import CategoryManagerModal from './components/CategoryManagerModal.jsx'
import Toast from './components/Toast.jsx'
import * as api from './api.js'

const missingConfig = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export default function App() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [components, setComponents] = useState([])
  const [transactions, setTransactions] = useState([])

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [logVisible, setLogVisible] = useState(true)

  const [stockModal, setStockModal] = useState(null) // { mode, component }
  const [showComponentForm, setShowComponentForm] = useState(false)
  const [detailsComponent, setDetailsComponent] = useState(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  const [toast, setToast] = useState(null)
  const serial = useMemo(() => 'NS-' + Math.floor(100000 + Math.random() * 899999), [])

  function notify(message, kind = '') {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 2600)
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [cats, comps, txs] = await Promise.all([
        api.fetchCategories(), api.fetchComponents(), api.fetchTransactions()
      ])
      setCategories(cats); setComponents(comps); setTransactions(txs)
    } catch (err) {
      notify(err.message || 'Failed to load data from Supabase.', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (!missingConfig) loadAll() }, [])

  if (missingConfig) {
    return (
      <div className="wrap">
        <div className="config-warning">
          <h2>Supabase not configured</h2>
          <p>Copy <code>.env.example</code> to <code>.env</code> in the project root and add your project's:</p>
          <ul>
            <li><code>VITE_SUPABASE_URL</code></li>
            <li><code>VITE_SUPABASE_ANON_KEY</code></li>
          </ul>
          <p>Then restart the dev server (<code>npm run dev</code>). See <code>README.md</code> for the full setup guide and the SQL to create your tables.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="loading-screen">Loading inventory…</div>
  }

  const filtered = components.filter(c => {
    const inCat = !categoryId || c.category_id === categoryId
    if (!inCat) return false
    const t = search.trim().toLowerCase()
    if (!t) return true
    return (c.name || '').toLowerCase().includes(t) ||
      (c.part_no || '').toLowerCase().includes(t) ||
      (c.machine || '').toLowerCase().includes(t)
  }).sort((a, b) => a.name.localeCompare(b.name))

  const stats = {
    total: components.length,
    units: components.reduce((s, c) => s + Number(c.quantity || 0), 0),
    low: components.filter(c => Number(c.quantity) <= Number(c.min_threshold || 0)).length,
    moves: transactions.length
  }

  // ---------- Component CRUD ----------
  async function handleSaveComponent(payload) {
    const created = await api.createComponent(payload)
    setComponents(prev => [...prev, created])
    if (payload.quantity > 0) {
      const tx = await api.createTransaction({
        component_id: created.id, type: 'add', quantity: payload.quantity, note: 'Initial stock on component creation'
      })
      setTransactions(prev => [tx, ...prev])
    }
    setShowComponentForm(false)
    notify(`${created.name} added to inventory`, 'success')
  }

  async function handleDeleteComponent(component) {
    if (!window.confirm(`Delete "${component.name}"? This also removes its stock history.`)) return
    await api.deleteComponent(component.id)
    setComponents(prev => prev.filter(c => c.id !== component.id))
    setTransactions(prev => prev.filter(t => t.component_id !== component.id))
    setDetailsComponent(null)
    notify(`${component.name} deleted`, 'danger')
  }

  // ---------- Stock movements ----------
  async function handleStockSubmit({ quantity, note, performedBy }) {
    const { mode, component } = stockModal
    const newQty = mode === 'add'
      ? Number(component.quantity) + quantity
      : Number(component.quantity) - quantity
    const updated = await api.updateComponentQuantity(component.id, newQty)
    setComponents(prev => prev.map(c => c.id === updated.id ? updated : c))
    const tx = await api.createTransaction({ component_id: component.id, type: mode, quantity, note, performed_by: performedBy })
    setTransactions(prev => [tx, ...prev])
    setStockModal(null)
    notify(`${mode === 'add' ? '+' : '-'}${quantity} ${mode === 'add' ? 'added to' : 'removed from'} ${component.name}`, 'success')
  }

  // ---------- Categories ----------
  async function handleAddCategory(name) {
    const created = await api.createCategory(name)
    setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
  }
  async function handleRenameCategory(id, name) {
    const updated = await api.renameCategory(id, name)
    setCategories(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)))
  }
  async function handleDeleteCategory(id) {
    await api.deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setComponents(prev => prev.map(c => c.category_id === id ? { ...c, category_id: null, category: null } : c))
  }

  return (
    <div className="wrap">
      <Header stats={stats} serial={serial} />

      <Toolbar
        search={search} setSearch={setSearch}
        categoryId={categoryId} setCategoryId={setCategoryId}
        categories={categories}
        onNewComponent={() => setShowComponentForm(true)}
        onManageCategories={() => setShowCategoryManager(true)}
      />

      <div className="section-head">
        <h2>Component Inventory <span className="tag">{filtered.length} shown</span></h2>
      </div>
      <ComponentGrid
        components={filtered}
        allCount={components.length}
        onAdd={c => setStockModal({ mode: 'add', component: c })}
        onRemove={c => setStockModal({ mode: 'remove', component: c })}
        onDetails={c => setDetailsComponent(c)}
      />

      <div className="section-head">
        <h2>Activity Log <span className="tag">ALL MOVEMENTS</span></h2>
        <button className="link-btn" onClick={() => setLogVisible(v => !v)}>{logVisible ? 'Hide' : 'Show'}</button>
      </div>
      <ActivityLog transactions={transactions} components={components} visible={logVisible} />

      {showComponentForm && (
        <ComponentFormModal
          categories={categories}
          onClose={() => setShowComponentForm(false)}
          onSave={handleSaveComponent}
        />
      )}

      {stockModal && (
        <StockModal
          mode={stockModal.mode}
          component={stockModal.component}
          onClose={() => setStockModal(null)}
          onSubmit={handleStockSubmit}
        />
      )}

      {detailsComponent && (
        <DetailsModal
          component={detailsComponent}
          transactions={transactions}
          onClose={() => setDetailsComponent(null)}
          onDelete={handleDeleteComponent}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerModal
          categories={categories}
          components={components}
          onClose={() => setShowCategoryManager(false)}
          onAdd={handleAddCategory}
          onRename={handleRenameCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}
