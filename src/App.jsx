import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
import ComponentGrid from './components/ComponentGrid.jsx'
import ActivityLog from './components/ActivityLog.jsx'
import ComponentFormModal from './components/ComponentFormModal.jsx'
import StockModal from './components/StockModal.jsx'
import DetailsModal from './components/DetailsModal.jsx'
import CategoryManagerModal from './components/CategoryManagerModal.jsx'
import MachineFormModal from './components/MachineFormModal.jsx'
import PasswordGateModal from './components/PasswordGateModal.jsx'
import Toast from './components/Toast.jsx'
import AllComponentsPage from './pages/AllComponentsPage.jsx'
import MachinesPage from './pages/MachinesPage.jsx'
import MachineDetailPage from './pages/MachineDetailPage.jsx'
import { computeBuildable } from './utils.js'
import * as api from './api.js'

const missingConfig = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
const HOME_PREVIEW_LIMIT = 5
const AUTH_KEY = 'ns3dr_authorized'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [components, setComponents] = useState([])
  const [transactions, setTransactions] = useState([])
  const [machines, setMachines] = useState([])
  const [machineComponents, setMachineComponents] = useState([])

  const [view, setView] = useState('home') // 'home' | 'all-components' | 'machines' | 'machine-detail'
  const [selectedMachineId, setSelectedMachineId] = useState(null)

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [logVisible, setLogVisible] = useState(true)

  const [stockModal, setStockModal] = useState(null) // { mode, component }
  const [componentFormState, setComponentFormState] = useState(null) // 'new' | { component }
  const [detailsComponent, setDetailsComponent] = useState(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [machineFormOpen, setMachineFormOpen] = useState(false)

  const [authorized, setAuthorized] = useState(() => {
    try { return localStorage.getItem(AUTH_KEY) === 'true' } catch { return false }
  })
  const [passwordGate, setPasswordGate] = useState(null) // { run, cancel }

  const [toast, setToast] = useState(null)
  const serial = useMemo(() => 'NS-' + Math.floor(100000 + Math.random() * 899999), [])

  function notify(message, kind = '') {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 2600)
  }

  // Wraps a mutating action so it asks for the password once (per browser,
  // until cache/site data is cleared) before it's allowed to run.
  function guardAction(fn) {
    return (...args) => {
      if (authorized) return fn(...args)
      return new Promise((resolve, reject) => {
        setPasswordGate({
          run: async () => {
            try { resolve(await fn(...args)) } catch (err) { reject(err) }
          },
          cancel: () => reject(new Error('Password required to continue.'))
        })
      })
    }
  }

  function handlePasswordUnlocked() {
    try { localStorage.setItem(AUTH_KEY, 'true') } catch {}
    setAuthorized(true)
    const gate = passwordGate
    setPasswordGate(null)
    if (gate) gate.run()
  }

  function handlePasswordCancelled() {
    const gate = passwordGate
    setPasswordGate(null)
    if (gate) gate.cancel()
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [cats, comps, txs, machs, machComps] = await Promise.all([
        api.fetchCategories(), api.fetchComponents(), api.fetchTransactions(),
        api.fetchMachines(), api.fetchAllMachineComponents()
      ])
      setCategories(cats); setComponents(comps); setTransactions(txs)
      setMachines(machs); setMachineComponents(machComps)
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

  const homePreview = filtered.slice(0, HOME_PREVIEW_LIMIT)

  const stats = {
    total: components.length,
    units: components.reduce((s, c) => s + Number(c.quantity || 0), 0),
    low: components.filter(c => Number(c.quantity) <= Number(c.min_threshold || 0)).length,
    moves: transactions.length
  }

  // ---------- Component CRUD ----------
  async function handleSaveComponent(payload) {
    if (componentFormState && componentFormState !== 'new') {
      const existing = componentFormState.component
      const { quantity, ...rest } = payload // quantity is locked during edit, don't touch stock via this form
      const updated = await api.updateComponent(existing.id, rest)
      setComponents(prev => prev.map(c => c.id === updated.id ? updated : c))
      notify(`${updated.name} updated`, 'success')
    } else {
      const created = await api.createComponent(payload)
      setComponents(prev => [...prev, created])
      if (payload.quantity > 0) {
        const tx = await api.createTransaction({
          component_id: created.id, type: 'add', quantity: payload.quantity, note: 'Initial stock on component creation'
        })
        setTransactions(prev => [tx, ...prev])
      }
      notify(`${created.name} added to inventory`, 'success')
    }
    setComponentFormState(null)
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

  // ---------- Machines ----------
  async function handleCreateMachine(payload) {
    const created = await api.createMachine(payload)
    setMachines(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    setMachineFormOpen(false)
    setSelectedMachineId(created.id)
    setView('machine-detail')
    notify(`${created.name} created — now add its components`, 'success')
  }
  async function handleEditMachine(payload) {
    const machine = machines.find(m => m.id === selectedMachineId)
    const updated = await api.updateMachine(machine.id, payload)
    setMachines(prev => prev.map(m => m.id === updated.id ? updated : m))
    notify(`${updated.name} updated`, 'success')
  }
  async function handleDeleteMachine() {
    const machine = machines.find(m => m.id === selectedMachineId)
    if (!machine) return
    if (!window.confirm(`Delete machine "${machine.name}" and its component list?`)) return
    await api.deleteMachine(machine.id)
    setMachines(prev => prev.filter(m => m.id !== machine.id))
    setMachineComponents(prev => prev.filter(mc => mc.machine_id !== machine.id))
    setView('machines')
    notify(`${machine.name} deleted`, 'danger')
  }
  async function handleAddMachineComponent({ component_id, quantity_required }) {
    const created = await api.addMachineComponent({ machine_id: selectedMachineId, component_id, quantity_required })
    setMachineComponents(prev => [...prev, created])
  }
  async function handleUpdateMachineComponentQty(id, qty) {
    const updated = await api.updateMachineComponentQty(id, qty)
    setMachineComponents(prev => prev.map(mc => mc.id === updated.id ? updated : mc))
  }
  async function handleRemoveMachineComponent(id) {
    await api.removeMachineComponent(id)
    setMachineComponents(prev => prev.filter(mc => mc.id !== id))
  }

  const guardedSaveComponent = guardAction(handleSaveComponent)
  const guardedDeleteComponent = guardAction(handleDeleteComponent)
  const guardedStockSubmit = guardAction(handleStockSubmit)
  const guardedAddCategory = guardAction(handleAddCategory)
  const guardedRenameCategory = guardAction(handleRenameCategory)
  const guardedDeleteCategory = guardAction(handleDeleteCategory)
  const guardedCreateMachine = guardAction(handleCreateMachine)
  const guardedEditMachine = guardAction(handleEditMachine)
  const guardedDeleteMachine = guardAction(handleDeleteMachine)
  const guardedAddMachineComponent = guardAction(handleAddMachineComponent)
  const guardedUpdateMachineComponentQty = guardAction(handleUpdateMachineComponentQty)
  const guardedRemoveMachineComponent = guardAction(handleRemoveMachineComponent)

  // ---------- Navigation ----------
  function goHome() { setView('home') }
  function goAllComponents() { setView('all-components') }
  function goMachines() { setView('machines') }
  function openMachine(machine) { setSelectedMachineId(machine.id); setView('machine-detail') }

  const sharedComponentActions = {
    onAdd: c => setStockModal({ mode: 'add', component: c }),
    onRemove: c => setStockModal({ mode: 'remove', component: c }),
    onDetails: c => setDetailsComponent(c),
    onEdit: c => setComponentFormState({ component: c })
  }

  let pageContent = null

  if (view === 'all-components') {
    pageContent = (
      <AllComponentsPage
        components={components}
        categories={categories}
        onBack={goHome}
        {...sharedComponentActions}
      />
    )
  } else if (view === 'machines') {
    pageContent = (
      <MachinesPage
        machines={machines}
        machineComponents={machineComponents}
        onBack={goHome}
        onOpenMachine={openMachine}
        onNewMachine={() => setMachineFormOpen(true)}
      />
    )
  } else if (view === 'machine-detail') {
    const machine = machines.find(m => m.id === selectedMachineId)
    if (!machine) {
      pageContent = <div className="wrap"><p>Machine not found.</p></div>
    } else {
      const rows = machineComponents.filter(mc => mc.machine_id === machine.id)
      pageContent = (
        <MachineDetailPage
          machine={machine}
          rows={rows}
          allComponents={components}
          onBack={goMachines}
          onEditMachine={guardedEditMachine}
          onAddComponent={guardedAddMachineComponent}
          onUpdateQty={guardedUpdateMachineComponentQty}
          onRemoveComponent={guardedRemoveMachineComponent}
          onDeleteMachine={guardedDeleteMachine}
        />
      )
    }
  } else {
    // ---------- Home ----------
    pageContent = (
      <div className="wrap">
        <Header stats={stats} serial={serial} />

        <Toolbar
          search={search} setSearch={setSearch}
          categoryId={categoryId} setCategoryId={setCategoryId}
          categories={categories}
          onNewComponent={() => setComponentFormState('new')}
          onManageCategories={() => setShowCategoryManager(true)}
        />

        <div className="section-head">
          <h2>Component Inventory <span className="tag">{filtered.length} total</span></h2>
          <button className="btn btn-ghost btn-sm" onClick={goAllComponents}>Show all →</button>
        </div>
        <ComponentGrid
          components={homePreview}
          allCount={components.length}
          {...sharedComponentActions}
        />

        <div className="section-head">
          <h2>Machines <span className="tag">{machines.length} configured</span></h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setMachineFormOpen(true)}>+ New machine</button>
        </div>
        <div className="machine-block" onClick={goMachines}>
          <span className="count">{machines.length}</span>
          <span className="label">
            {machines.length === 0
              ? 'No machines set up yet — tap to add one'
              : 'Machines configured — tap to see how many of each you can build'}
          </span>
        </div>

        <div className="section-head">
          <h2>Activity Log <span className="tag">ALL MOVEMENTS</span></h2>
          <button className="link-btn" onClick={() => setLogVisible(v => !v)}>{logVisible ? 'Hide' : 'Show'}</button>
        </div>
        <ActivityLog transactions={transactions} components={components} visible={logVisible} />
      </div>
    )
  }

  return (
    <>
      {pageContent}

      {componentFormState && (
        <ComponentFormModal
          categories={categories}
          initial={componentFormState === 'new' ? null : componentFormState.component}
          onClose={() => setComponentFormState(null)}
          onSave={guardedSaveComponent}
        />
      )}

      {stockModal && (
        <StockModal
          mode={stockModal.mode}
          component={stockModal.component}
          onClose={() => setStockModal(null)}
          onSubmit={guardedStockSubmit}
        />
      )}

      {detailsComponent && (
        <DetailsModal
          component={detailsComponent}
          transactions={transactions}
          onClose={() => setDetailsComponent(null)}
          onDelete={guardedDeleteComponent}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerModal
          categories={categories}
          components={components}
          onClose={() => setShowCategoryManager(false)}
          onAdd={guardedAddCategory}
          onRename={guardedRenameCategory}
          onDelete={guardedDeleteCategory}
        />
      )}

      {machineFormOpen && (
        <MachineFormModal
          onClose={() => setMachineFormOpen(false)}
          onSave={guardedCreateMachine}
        />
      )}

      {passwordGate && (
        <PasswordGateModal
          onSubmit={handlePasswordUnlocked}
          onCancel={handlePasswordCancelled}
        />
      )}

      <Toast toast={toast} />
    </>
  )
}
