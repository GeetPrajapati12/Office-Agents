import React, { useState, useEffect } from 'react'
import { OfficeCanvas } from '../office/OfficeCanvas'
import { XTermWrapper } from '../terminal/XTermWrapper'

interface MainLayoutProps {
  children?: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activeAgent, setActiveAgent] = useState<string | null>('michael')
  const [agents, setAgents] = useState<Array<{ id: string; name: string; state: string }>>([
    { id: 'michael', name: 'Michael (God)', state: 'idle' }
  ])

  useEffect(() => {
    // Load agents from backend
    window.api.agent.list().then((agentList) => {
      if (agentList.length > 0) {
        setAgents(agentList.map(a => ({
          id: a.id,
          name: a.name,
          state: a.state || 'idle'
        })))
      }
    })
  }, [])

  const handleCreateAgent = () => {
    const agentId = `agent-${Date.now()}`
    const agentName = `Agent ${agents.length}`

    // Create terminal session
    window.api.terminal.create({
      agentId,
      command: 'powershell.exe',
      args: ['-NoExit', '-Command', `Write-Host "🤖 ${agentName} Terminal Ready" -ForegroundColor Green; Write-Host "Type commands or 'exit' to close" -ForegroundColor Cyan`],
      cwd: 'C:\\Geet\\Office AI Agents'
    })

    setAgents([...agents, { id: agentId, name: agentName, state: 'idle' }])
    setActiveAgent(agentId)
  }

  const getStateColor = (state: string): string => {
    const colors: Record<string, string> = {
      idle: 'var(--status-idle)',
      thinking: 'var(--status-thinking)',
      working: 'var(--status-working)',
      blocked: 'var(--status-blocked)',
      success: 'var(--status-success)'
    }
    return colors[state] || 'var(--ink-500)'
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}
      >
        {/* Left: Office Canvas with Pixi.js */}
        <div
          className="snes-panel"
          style={{
            flex: 1,
            display: 'flex',
            margin: '8px',
            minWidth: 0,
            overflow: 'hidden',
            padding: '4px'
          }}
        >
          <OfficeCanvas onAvatarClick={(agentId) => setActiveAgent(agentId)} />
        </div>

        {/* Right: Agent Detail Panel */}
        <div
          style={{
            width: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            margin: '8px 8px 8px 0'
          }}
        >
          {/* Agent Info */}
          <div className="snes-panel" style={{ padding: '12px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                color: 'var(--mint)',
                marginBottom: '8px'
              }}
            >
              {activeAgent ? agents.find(a => a.id === activeAgent)?.name || activeAgent : 'No Agent'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-300)' }}>
              {activeAgent === 'michael'
                ? '🎩 Orchestrator - Routes tasks to specialist agents'
                : activeAgent
                ? 'Live terminal - type commands below'
                : 'Click an avatar on the floor or create a new agent'
              }
            </div>
          </div>

          {/* Terminal */}
          <div
            className="snes-panel-inset"
            style={{
              flex: 1,
              overflow: 'hidden',
              padding: '4px',
              minHeight: 0
            }}
          >
            {activeAgent && activeAgent !== 'michael' ? (
              <XTermWrapper agentId={activeAgent} />
            ) : activeAgent === 'michael' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '20px',
                  color: 'var(--cream-100)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '14px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎩</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Michael's Office</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-300)', marginBottom: '16px' }}>
                  God Agent Orchestrator
                </div>
                <div style={{ fontSize: '12px', maxWidth: '300px' }}>
                  Michael decomposes your tasks into sequential pipelines and routes work to specialist agents.
                  Chat UI coming in Phase 5!
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--ink-500)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px'
                }}
              >
                No terminal session active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Agent Strip */}
      <div
        className="snes-panel"
        style={{
          height: '84px',
          margin: '0 8px 8px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          overflowX: 'auto'
        }}
      >
        <button
          className="snes-button snes-button-primary"
          onClick={handleCreateAgent}
        >
          + New Agent
        </button>

        {agents.map(agent => (
          <div
            key={agent.id}
            onClick={() => setActiveAgent(agent.id)}
            style={{
              minWidth: '140px',
              padding: '8px 12px',
              cursor: 'pointer',
              backgroundColor: activeAgent === agent.id ? 'var(--coral)' : 'var(--ink-700)',
              border: '2px solid var(--ink-900)',
              color: 'var(--cream-100)',
              fontSize: '12px',
              fontFamily: 'var(--font-ui)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{agent.name}</div>
            <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getStateColor(agent.state)
                }}
              />
              {agent.state}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
