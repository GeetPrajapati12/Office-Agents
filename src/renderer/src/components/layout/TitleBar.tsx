import React, { useEffect, useState } from 'react'

interface TitleBarProps {
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export const TitleBar: React.FC<TitleBarProps> = ({ onMinimize, onMaximize, onClose }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [modelTag, setModelTag] = useState('')

  useEffect(() => {
    window.api.settings.get().then((s) => {
      setTheme(s.theme)
      document.documentElement.setAttribute('data-theme', s.theme)
      setModelTag(s.godModel)
    })
  }, [])

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    await window.api.settings.update({ theme: next })
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        {modelTag && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--ink-300)'
            }}
          >
            {modelTag}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          WebkitAppRegion: 'no-drag'
        } as any}
      >
        <button
          onClick={toggleTheme}
          className="snes-button"
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          {theme === 'dark' ? '🌙' : '☀'}
        </button>
        <button
          onClick={toggleFullscreen}
          className="snes-button"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          {isFullscreen ? '⤡' : '⤢'}
        </button>
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
