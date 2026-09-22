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

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Calculate grid size based on container
    const gridCols = Math.max(16, Math.floor(width / 32))
    const gridRows = Math.max(12, Math.floor(height / 32))

    const engine = new OfficeEngine(canvasRef.current, {
      width,
      height,
      gridCols,
      gridRows
    })

    engine.init().then(() => {
      engineRef.current = engine
      setIsInitialized(true)

      // Spawn Michael (God agent) at his office
      engine.spawnAvatar('michael', 'Michael', 0xb197fc, 2 * 32 + 16, 2 * 32 + 16)
      engine.updateAvatarState('michael', 'idle')
    })

    // Handle window resize
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

  // Listen for agent state changes from IPC
  useEffect(() => {
    if (!isInitialized) return

    const unsubscribe = window.api.agent.onStateChanged((agent) => {
      if (engineRef.current && agent.state) {
        engineRef.current.updateAvatarState(agent.id, agent.state)

        // Move to station based on state
        if (agent.state === 'working' && agent.currentStation) {
          engineRef.current.moveAvatarToStation(agent.id, agent.currentStation)
        }
      }
    })

    return unsubscribe
  }, [isInitialized])

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
    </div>
  )
}
