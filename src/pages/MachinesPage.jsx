import { computeBuildable } from '../utils.js'

export default function MachinesPage({ machines, machineComponents, onBack, onOpenMachine, onNewMachine }) {
  return (
    <div className="wrap">
      <button className="link-btn back-btn" onClick={onBack}>← Back to home</button>

      <div className="section-head" style={{ marginTop: 18 }}>
        <h2>Machines <span className="tag">{machines.length} configured</span></h2>
        <button className="btn btn-primary btn-sm" onClick={onNewMachine}>+ New machine</button>
      </div>

      {machines.length === 0 ? (
        <div className="empty-state">
          <p><strong>No machines set up yet</strong></p>
          <p>Add a machine and list the components it uses to track how many you can build.</p>
        </div>
      ) : (
        <div className="grid">
          {machines.map(m => {
            const rows = machineComponents.filter(mc => mc.machine_id === m.id)
            const buildable = computeBuildable(rows)
            return (
              <div className="card machine-card" key={m.id} onClick={() => onOpenMachine(m)}>
                <div className="card-top">
                  <div>
                    <h3>{m.name}</h3>
                    <div className="part-no">{rows.length} component{rows.length === 1 ? '' : 's'} in build list</div>
                  </div>
                </div>
                {m.description && <div className="meta-line">{m.description}</div>}
                <div className="buildable-badge">
                  <span className="num">{buildable}</span>
                  <span className="lbl">machine{buildable === 1 ? '' : 's'} buildable from current stock</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
