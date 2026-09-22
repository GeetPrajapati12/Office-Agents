import React, { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'

interface XTermWrapperProps {
  agentId: string
  onResize?: (cols: number, rows: number) => void
}

export const XTermWrapper: React.FC<XTermWrapperProps> = ({ agentId, onResize }) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    // Create terminal with retro theme
    const terminal = new Terminal({
      fontFamily: "'VT323', 'Cascadia Code', monospace",
      fontSize: 16,
      lineHeight: 1.2,
      theme: {
        background: '#181825',
        foreground: '#fff8e7',
        cursor: '#6bcf7f',
        black: '#1a1320',
        red: '#ff6b6b',
        green: '#6bcf7f',
        yellow: '#ffd93d',
        blue: '#4ecdc4',
        magenta: '#b197fc',
        cyan: '#4ecdc4',
        white: '#fff8e7',
        brightBlack: '#3d2e4a',
        brightRed: '#ffb4b4',
        brightGreen: '#a6e3a1',
        brightYellow: '#ffec99',
        brightBlue: '#89dceb',
        brightMagenta: '#d9b3ff',
        brightCyan: '#89dceb',
        brightWhite: '#fffdf5'
      },
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      allowProposedApi: true
    })

    // Add fit addon
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    // Add WebGL addon for performance
    try {
      const webglAddon = new WebglAddon()
      terminal.loadAddon(webglAddon)
    } catch (e) {
      console.warn('WebGL addon failed to load, using canvas renderer')
    }

    // Open terminal
    terminal.open(terminalRef.current)
    fitAddon.fit()

    termRef.current = terminal
    fitAddonRef.current = fitAddon

    // Listen to terminal data
    const unsubscribe = window.api.terminal.onData((data) => {
      if (data.agentId === agentId) {
        terminal.write(data.data)
      }
    })

    // Handle user input
    terminal.onData((data) => {
      window.api.terminal.write(agentId, data)
    })

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      if (onResize) {
        onResize(terminal.cols, terminal.rows)
      }
      window.api.terminal.resize(agentId, {
        cols: terminal.cols,
        rows: terminal.rows
      })
    })
    resizeObserver.observe(terminalRef.current)

    return () => {
      unsubscribe()
      resizeObserver.disconnect()
      terminal.dispose()
    }
  }, [agentId, onResize])

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    />
  )
}
