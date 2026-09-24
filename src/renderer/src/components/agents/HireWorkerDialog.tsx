import React, { useState } from 'react'
import { Agent } from '@shared/types/agent'
import { HireWorkerOptions, WorkerCli } from '@shared/types/terminal'

interface HireWorkerDialogProps {
  isOpen: boolean
  onClose: () => void
  onHired: (agent: Agent) => void
}

export const HireWorkerDialog: React.FC<HireWorkerDialogProps> = ({ isOpen, onClose, onHired }) => {
  const [name, setName] = useState('')
  const [role, setRole] = useState('Developer')
  const [workspace, setWorkspace] = useState('')
  const [cli, setCli] = useState<WorkerCli>('codex')
  const [customExecutable, setCustomExecutable] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const hire = async () => {
    setSaving(true)
    setError('')
    try {
      const options: HireWorkerOptions = { name, role, workspace, cli, customExecutable: cli === 'custom' ? customExecutable : undefined }
      const agent = await window.api.agent.hire(options)
      onHired(agent)
      setName('')
      setRole('Developer')
      setWorkspace('')
      setCustomExecutable('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: 7, margin: '4px 0 12px', color: 'var(--cream-100)' }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="snes-panel hire-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>HIRE WORKER</h2>
        <label>Worker name<input className="snes-panel-inset" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
        <label>Role<input className="snes-panel-inset" style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} /></label>
        <label>Workspace path<input className="snes-panel-inset" style={inputStyle} value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="Absolute path to an existing folder" /></label>
        <label>CLI
          <select className="snes-panel-inset" style={inputStyle} value={cli} onChange={(e) => setCli(e.target.value as WorkerCli)}>
            <option value="codex">OpenAI Codex</option>
            <option value="claude">Claude Code</option>
            <option value="gemini">Gemini CLI</option>
            <option value="custom">Trusted custom executable</option>
          </select>
        </label>
        {cli === 'custom' && <label>Executable path<input className="snes-panel-inset" style={inputStyle} value={customExecutable} onChange={(e) => setCustomExecutable(e.target.value)} placeholder="Absolute path to .exe or executable" /></label>}
        {error && <div role="alert" className="hire-error">{error}</div>}
        <div className="hire-actions">
          <button className="snes-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="snes-button snes-button-primary" onClick={hire} disabled={saving}>{saving ? 'Hiring…' : '+ Hire worker'}</button>
        </div>
      </section>
    </div>
  )
}
