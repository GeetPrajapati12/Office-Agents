import React, { useEffect, useRef, useState } from 'react'
import { OfficeEngine } from '../../pixi/OfficeEngine'

interface OfficeCanvasProps {
  onAvatarClick?: (agentId: string) => void
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = ({ onAvatarClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<OfficeEngine | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [modelLabel, setModelLabel] = useState<string>('')

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const gridCols = Math.max(16, Math.floor(width / 32))
    const gridRows = Math.max(12, Math.floor(height / 32))

    const engine = new OfficeEngine(canvasRef.current, {
      width,
      height,
      gridCols,
      gridRows
    }, onAvatarClick)

    engine.init().then(() => {
      engineRef.current = engine
      setIsInitialized(true)

      engine.spawnAvatar('michael', 'Michael', 0xb197fc, 2 * 32 + 16, 2 * 32 + 16)
      engine.updateAvatarState('michael', 'idle')
    })

    const handleResize = () => {
      if (engineRef.current && containerRef.current) {
        const newWidth = containerRef.current.clientWidth
        const newHeight = containerRef.current.clientHeight
        engineRef.current.resize(newWidth, newHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (engineRef.current) {
        engineRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (!isInitialized) return

    const unsubscribe = window.api.agent.onStateChanged((agent) => {
      if (engineRef.current && agent.state) {
        engineRef.current.updateAvatarState(agent.id, agent.state)

        if (agent.state === 'working' && agent.currentStation) {
          engineRef.current.moveAvatarToStation(agent.id, agent.currentStation)
        }
      }
    })

    return unsubscribe
  }, [isInitialized])

  // NEW: real provider/model chip, mirrors the reference's bottom-left info chip
  useEffect(() => {
    window.api.settings.get().then((s) => {
      const providerName = s.providers.anthropic?.apiKey
        ? 'anthropic'
        : s.providers.openai?.apiKey
        ? 'openai'
        : 'ollama'
      setModelLabel(`${providerName} · ${s.godModel}`)
    })
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'pixelated'
        }}
      />

      {!isInitialized && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--cream-100)',
            fontFamily: 'var(--font-ui)',
            fontSize: '14px'
          }}
        >
          Loading office floor...
        </div>
      )}

      {isInitialized && modelLabel && (
        <div
          className="snes-panel-inset"
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            padding: '4px 10px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--cream-200)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span style={{ color: 'var(--mint)' }}>●</span> {modelLabel}
        </div>
      )}
    </div>
  )
}
