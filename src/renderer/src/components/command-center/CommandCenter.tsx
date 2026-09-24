import React, { useEffect, useRef, useState } from 'react'
import { ActionLogEntry } from '@shared/types/god'
import { Agent } from '@shared/types/agent'
import { TaskDefinition } from '@shared/types/hive'

type TabKey =
  | 'terminal'
  | 'monitor'
  | 'tasks'
  | 'ask'
  | 'triggers'
  | 'memory'
  | 'graph'
  | 'activity'
  | 'commands'
  | 'workers'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'terminal', label: 'terminal' },
  { key: 'monitor', label: 'monitor' },
  { key: 'tasks', label: 'tasks' },
  { key: 'ask', label: 'ask me' },
  { key: 'triggers', label: 'triggers' },
  { key: 'memory', label: 'memory' },
  { key: 'graph', label: 'graph' },
  { key: 'activity', label: 'activity' },
  { key: 'commands', label: 'commands' },
  { key: 'workers', label: 'workers' }
]

const PLACEHOLDER_TABS: TabKey[] = ['monitor', 'ask', 'triggers', 'graph', 'activity', 'commands']

interface CommandCenterProps {
  agents: Agent[]
  onFocusAgent?: (agentId: string) => void
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ agents, onFocusAgent }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('terminal')
  const [logs, setLogs] = useState<ActionLogEntry[]>([])
  const [queueText, setQueueText] = useState('')
  const [sending, setSending] = useState(false)
  const [tasks, setTasks] = useState<TaskDefinition[]>([])
  const [memoryAgentId, setMemoryAgentId] = useState('michael')
  const [memoryText, setMemoryText] = useState('')
  const [providerLabel, setProviderLabel] = useState('')
  // Local-only UI toggle — not wired to any real permission gate on the backend.
  // Shown for visual parity with the reference; see CHANGES.md.
  const [bypassPermissions, setBypassPermissions] = useState(true)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = window.api.god.onLog((entry) => {
      setLogs((prev) => [...prev.slice(-199), entry])
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, activeTab])

  useEffect(() => {
    if (activeTab === 'tasks') {
      let mounted = true
      const refresh = () => window.api.hive.getTasks().then((nextTasks) => { if (mounted) setTasks(nextTasks) })
      refresh()
      const timer = window.setInterval(refresh, 1500)
      return () => { mounted = false; window.clearInterval(timer) }
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'memory') {
      window.api.hive.getMemory(memoryAgentId).then(setMemoryText)
    }
  }, [activeTab, memoryAgentId])

  useEffect(() => {
    window.api.settings.get().then((s) => {
      const providerName = s.providers.anthropic?.apiKey
        ? 'anthropic'
        : s.providers.openai?.apiKey
        ? 'openai'
        : 'ollama'
      setProviderLabel(`${providerName} · ${s.godModel}`)
    })
  }, [])

  const handleSend = async () => {
    const text = queueText.trim()
    if (!text || sending) return
    setQueueText('')
    setSending(true)
    setActiveTab('terminal')
    try {
      await window.api.god.chat(text)
    } finally {
      setSending(false)
    }
  }

  const logColor = (kind: ActionLogEntry['kind']): string => {
    switch (kind) {
      case 'action':
        return 'var(--mint)'
      case 'result':
        return 'var(--sky)'
      case 'error':
        return 'var(--coral)'
      default:
        return 'var(--cream-200)'
    }
  }

  const logPrefix = (kind: ActionLogEntry['kind']): string => {
    switch (kind) {
      case 'action':
        return '●'
      case 'result':
        return '✓'
      case 'error':
        return '✕'
      default:
        return '›'
    }
  }

  return (
    <div
      className="snes-panel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, minHeight: 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            background: 'var(--lilac)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0
          }}
        >
          🎩
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--mint)' }}>
            COMMAND CENTER
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-300)' }}>Michael runs the floor</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10, flexShrink: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="snes-button"
            style={{
              fontSize: 10,
              padding: '4px 8px',
              backgroundColor: activeTab === tab.key ? 'var(--coral)' : 'var(--ink-700)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="snes-panel-inset"
        style={{ flex: 1, overflowY: 'auto', padding: 10, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {activeTab === 'terminal' && (
          <>
            {providerLabel && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--ink-300)',
                  paddingBottom: 8,
                  marginBottom: 8,
                  borderBottom: '1px dashed var(--ink-700)',
                  flexShrink: 0
                }}
              >
                ■ live · {providerLabel}
              </div>
            )}

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.5, flex: 1 }}>
              {logs.length === 0 && (
                <div style={{ color: 'var(--ink-300)' }}>No activity yet — send Michael a task below.</div>
              )}
              {logs.map((entry) => (
                <div key={entry.id} style={{ marginBottom: 8, color: logColor(entry.kind) }}>
                  {logPrefix(entry.kind)} {entry.text}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-300)',
                paddingTop: 8,
                marginTop: 8,
                borderTop: '1px dashed var(--ink-700)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <span>{logs.length} lines this session</span>
              <button
                onClick={() => setBypassPermissions((v) => !v)}
                title="UI-only toggle — not enforced by the backend yet"
                style={{
                  background: 'none',
                  border: 'none',
                  color: bypassPermissions ? 'var(--mint)' : 'var(--ink-300)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                ▸▸ bypass permissions {bypassPermissions ? 'on' : 'off'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'tasks' && (
          <div style={{ fontSize: 13 }}>
            {tasks.length === 0 && <div style={{ color: 'var(--ink-300)' }}>No tasks yet.</div>}
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--ink-700)'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-300)' }}>
                  {t.status} · stage {(t.currentStage ?? 0) + 1}/{t.pipeline.length}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'workers' && (
          <div style={{ fontSize: 13 }}>
            {agents.length === 0 && <div style={{ color: 'var(--ink-300)' }}>No workers yet.</div>}
            {agents.map((a) => (
              <button key={a.id} className="command-worker" onClick={() => onFocusAgent?.(a.id)}>
                <span className="command-worker-dot" style={{ background: `var(--status-${a.state})` }} />
                <span className="command-worker-info">
                  <strong>{a.name}</strong><span>{a.role} · {a.state}</span>
                  {a.currentTask && <small>{a.currentTask}</small>}
                </span>
                <span className="command-worker-focus">focus ›</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div>
            <select
              className="snes-panel-inset"
              value={memoryAgentId}
              onChange={(e) => setMemoryAgentId(e.target.value)}
              style={{ marginBottom: 10, padding: 4 }}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {memoryText || 'No memory recorded yet.'}
            </pre>
          </div>
        )}

        {PLACEHOLDER_TABS.includes(activeTab) && (
          <div style={{ color: 'var(--ink-300)', fontSize: 13 }}>
            🚧 Coming soon — this tab needs its own subsystem (see CHANGES.md for what's still
            deliberately unbuilt).
          </div>
        )}
      </div>

      {/* Queue */}
      <div style={{ marginTop: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-300)', marginBottom: 4 }}>QUEUE</div>
        <textarea
          className="snes-panel-inset command-composer"
          value={queueText}
          onChange={(e) => setQueueText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Message Michael"
          style={{
            width: '100%',
            height: 60,
            padding: 8,
            resize: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            userSelect: 'text'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="snes-button" disabled title="Coming soon — file attachments aren't wired up yet" style={{ fontSize: 11, opacity: 0.5, cursor: 'not-allowed' }}>
              + files
            </button>
            <button className="snes-button" disabled title="Coming soon — voice input isn't wired up yet" style={{ fontSize: 11, opacity: 0.5, cursor: 'not-allowed' }}>
              🎙 voice
            </button>
          </div>
          <button className="snes-button snes-button-primary" onClick={handleSend} disabled={sending}>
            {sending ? 'sending...' : 'send →'}
          </button>
        </div>
      </div>
    </div>
  )
}
