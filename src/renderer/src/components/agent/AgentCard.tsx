import React from 'react'
import { Agent } from '@shared/types/agent'

interface AgentCardProps {
  agent: Agent
  active: boolean
  onClick: () => void
  onTalk?: () => void
  onDelete?: () => void
}

const STATE_COLORS: Record<string, string> = {
  idle: 'var(--status-idle)',
  alert: 'var(--status-blocked)',
  thinking: 'var(--status-thinking)',
  working: 'var(--status-working)',
  blocked: 'var(--status-blocked)',
  success: 'var(--status-success)',
  ghost: 'var(--ink-500)'
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, active, onClick, onTalk, onDelete }) => {
  const initial = agent.name.trim().charAt(0).toUpperCase() || '?'
  const stateColor = STATE_COLORS[agent.state] || 'var(--ink-500)'

  return (
    <div
      onClick={onClick}
      className="snes-panel-inset"
      style={{
        minWidth: 170,
        padding: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        backgroundColor: active ? 'var(--ink-700)' : 'var(--paper-100)',
        border: active ? '2px solid var(--coral)' : '2px solid var(--ink-900)',
        flexShrink: 0,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: agent.accentColor || 'var(--ink-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            color: 'var(--ink-900)',
            flexShrink: 0
          }}
        >
          {agent.isGod ? '🎩' : initial}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: 'var(--cream-100)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 80
              }}
            >
              {agent.name}
            </div>
            {agent.isGod ? (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-900)',
                  backgroundColor: 'var(--lemon)',
                  padding: '1px 4px',
                  borderRadius: 3
                }}
              >
                GOD
              </span>
            ) : (
              onDelete && (
                <button
                  className="snes-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  title={`Delete worker ${agent.name}`}
                  style={{
                    padding: '0 4px',
                    fontSize: 10,
                    lineHeight: '14px',
                    backgroundColor: 'transparent',
                    color: 'var(--coral)',
                    borderColor: 'var(--coral)',
                    boxShadow: 'none'
                  }}
                >
                  ✖
                </button>
              )
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              color: 'var(--ink-300)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 120
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: stateColor,
                flexShrink: 0
              }}
            />
            {agent.currentTask || agent.state}
          </div>
        </div>
      </div>

      {agent.isGod && onTalk && (
        <button
          className="snes-button"
          onClick={(e) => {
            e.stopPropagation()
            onTalk()
          }}
          style={{ fontSize: 10, padding: '3px 6px' }}
        >
          🎙 talk
        </button>
      )}
    </div>
  )
}
