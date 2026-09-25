import React, { useState, useEffect } from 'react'
import { OfficeCanvas } from '../office/OfficeCanvas'
import { XTermWrapper } from '../terminal/XTermWrapper'
import { SettingsModal } from '../settings/SettingsModal'
import { CommandCenter } from '../command-center/CommandCenter'
import { AgentCard } from '../agent/AgentCard'
import { HireWorkerDialog } from '../agents/HireWorkerDialog'
import { ApprovalDialog } from '../approval/ApprovalDialog'
import { Agent } from '@shared/types/agent'
import { ApprovalRequest } from '@shared/types/ipc'

interface MainLayoutProps {
  children?: React.ReactNode
}

const MICHAEL_AGENT: Agent = {
  id: 'michael',
  name: 'Michael',
  role: 'Orchestrator',
  accentColor: '#b197fc',
  sprite: 'michael',
  state: 'idle',
  cwd: '',
  command: '',
  isGod: true
}

type RightPanelMode = 'command' | 'ide'

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [activeAgent, setActiveAgent] = useState<string | null>('michael')
  const [agents, setAgents] = useState<Agent[]>([MICHAEL_AGENT])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hireOpen, setHireOpen] = useState(false)
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null)
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('command')

  const refreshAgents = () => {
    window.api.agent.list().then((agentList) => {
      const workers = agentList.filter((a) => a.id !== 'michael')
      setAgents([MICHAEL_AGENT, ...workers])
    })
  }

  useEffect(() => {
    let mounted = true
    window.api.agent.list().then((agentList) => {
      if (!mounted) return
      const workers = agentList.filter((a) => a.id !== 'michael')
      setAgents([MICHAEL_AGENT, ...workers])
    })
    const unsubscribeAgent = window.api.agent.onStateChanged((updated) => {
      setAgents((current) => current.map((agent) => agent.id === updated.id ? { ...agent, ...updated } : agent))
    })
    const unsubscribeApproval = window.api.god.onApprovalPending((approval) => {
      setPendingApproval(approval)
    })
    return () => {
      mounted = false
      unsubscribeAgent()
      unsubscribeApproval()
    }
  }, [])

  const focusAgent = (agentId: string) => {
    setActiveAgent(agentId)
    setRightPanelMode(agentId === 'michael' ? 'command' : 'ide')
  }

  const handleHired = (agent: Agent) => {
    setAgents((current) => [...current.filter((item) => item.id !== agent.id), agent])
    setActiveAgent(agent.id)
    setRightPanelMode('ide')
  }

  const handleDeleteAgent = async (agentId: string) => {
    const res = await window.api.agent.delete(agentId)
    if (res.success) {
      setAgents((current) => current.filter((a) => a.id !== agentId))
      if (activeAgent === agentId) {
        setActiveAgent('michael')
        setRightPanelMode('command')
      }
    }
  }

  const handleWorkersDeleted = () => {
    refreshAgents()
    if (activeAgent !== 'michael') {
      setActiveAgent('michael')
      setRightPanelMode('command')
    }
  }

  const handleApprovalResponse = async (requestId: string, approved: boolean) => {
    try {
      await window.api.god.respondToApproval(requestId, approved)
    } finally {
      setPendingApproval(null)
    }
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
          <OfficeCanvas onAvatarClick={(agentId) => {
            setActiveAgent(agentId)
            if (agentId !== 'michael') setRightPanelMode('ide')
            else setRightPanelMode('command')
          }} />
        </div>

        {/* Right: Command Center / IDE panel */}
        <div
          style={{
            width: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            margin: '8px 8px 8px 0',
            minHeight: 0
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className="snes-button"
              onClick={() => setRightPanelMode('command')}
              style={{
                flex: 1,
                fontSize: 11,
                backgroundColor: rightPanelMode === 'command' ? 'var(--coral)' : 'var(--ink-700)'
              }}
            >
              ▶ auto
            </button>
            <button
              className="snes-button"
              onClick={() => setRightPanelMode('ide')}
              style={{
                flex: 1,
                fontSize: 11,
                backgroundColor: rightPanelMode === 'ide' ? 'var(--coral)' : 'var(--ink-700)'
              }}
            >
              {'<>'} IDE
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <div style={{ display: rightPanelMode === 'command' ? 'block' : 'none', height: '100%' }}>
              <CommandCenter agents={agents} onFocusAgent={focusAgent} />
            </div>
            <div style={{ display: rightPanelMode === 'ide' ? 'block' : 'none', height: '100%' }}>
              <div
                className="snes-panel-inset"
                style={{ height: '100%', overflow: 'hidden', padding: '4px', minHeight: 0 }}
              >
                {activeAgent && activeAgent !== 'michael' ? (
                  <XTermWrapper agentId={activeAgent} />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--ink-500)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      textAlign: 'center',
                      padding: 20
                    }}
                  >
                    Select a worker agent below to view its terminal.
                    <br />
                    Michael doesn't have a raw terminal — use "auto" for the Command Center.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Agent Strip */}
      <div
        className="snes-panel"
        style={{
          height: '96px',
          margin: '0 8px 8px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          overflowX: 'auto'
        }}
      >
        <button className="snes-button snes-button-primary" onClick={() => setHireOpen(true)} style={{ flexShrink: 0 }}>
          + Hire worker
        </button>

        <button className="snes-button" onClick={() => setSettingsOpen(true)} style={{ flexShrink: 0 }}>
          ⚙ Settings
        </button>

        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            active={activeAgent === agent.id}
            onClick={() => {
              setActiveAgent(agent.id)
              if (agent.id !== 'michael') setRightPanelMode('ide')
              else setRightPanelMode('command')
            }}
            onDelete={!agent.isGod ? () => handleDeleteAgent(agent.id) : undefined}
            onTalk={
              agent.isGod
                ? () => {
                    setActiveAgent(agent.id)
                    setRightPanelMode('command')
                  }
                : undefined
            }
          />
        ))}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onWorkersDeleted={handleWorkersDeleted}
      />
      <HireWorkerDialog isOpen={hireOpen} onClose={() => setHireOpen(false)} onHired={handleHired} />
      <ApprovalDialog request={pendingApproval} onRespond={handleApprovalResponse} />
    </div>
  )
}
