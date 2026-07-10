import { useState } from 'react'

export default function PasswordGateModal({ onSubmit, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (password === 'NS3DR123') {
      setError('')
      onSubmit()
    } else {
      setError('Incorrect password. Try again.')
    }
  }

  return (
    <div className="overlay" style={{ zIndex: 300 }} onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <button className="modal-close" onClick={onCancel}>&times;</button>
        <h3>🔒 Authorization required</h3>
        <p className="modal-sub">Enter the password to add, edit, or remove anything in inventory, machines, or categories.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Password <span className="req">*</span></label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Unlock</button>
          </div>
        </form>
      </div>
    </div>
  )
}
