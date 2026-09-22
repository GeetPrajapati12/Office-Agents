import React from 'react'

interface TitleBarProps {
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export const TitleBar: React.FC<TitleBarProps> = ({ onMinimize, onMaximize, onClose }) => {
  return (
    <div
      style={{
        height: '32px',
        backgroundColor: 'var(--paper-200)',
        borderBottom: '2px solid var(--ink-900)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        WebkitAppRegion: 'drag'
      } as any}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '8px',
          color: 'var(--cream-100)',
          letterSpacing: '1px'
        }}
      >
        OFFICE AI AGENTS
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          WebkitAppRegion: 'no-drag'
        } as any}
      >
        <button
          onClick={onMinimize}
          className="snes-button"
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          _
        </button>
        <button
          onClick={onMaximize}
          className="snes-button"
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          □
        </button>
        <button
          onClick={onClose}
          className="snes-button"
          style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: 'var(--coral)' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
