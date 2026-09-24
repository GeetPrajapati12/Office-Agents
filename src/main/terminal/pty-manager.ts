import { PtySession } from './pty-session'
import { TerminalCreateOptions, TerminalDimensions } from '@shared/types/terminal'
import { EventEmitter } from 'events'

export class PtyManager extends EventEmitter {
  private sessions = new Map<string, PtySession>()
  private dataThrottle = new Map<string, { buffer: string; timer: NodeJS.Timeout | null }>()
  private readonly throttleMs = 16 // ~60fps

  createSession(options: TerminalCreateOptions): PtySession {
    if (this.sessions.has(options.agentId)) {
      throw new Error(`Terminal session already exists for agent ${options.agentId}`)
    }

    const session = new PtySession(
      options.agentId,
      options.command,
      options.args,
      options.cwd,
      options.env || {},
      options.shell ?? true
    )

    // Set up throttled data forwarding
    session.on('data', (data: string) => {
      this.throttleData(options.agentId, data)
    })

    session.on('exit', ({ exitCode, signal }) => {
      this.emit('session-exit', {
        agentId: options.agentId,
        exitCode,
        signal
      })
      this.cleanupSession(options.agentId)
    })

    this.sessions.set(options.agentId, session)
    session.start()

    return session
  }

  private throttleData(agentId: string, data: string): void {
    let throttle = this.dataThrottle.get(agentId)

    if (!throttle) {
      throttle = { buffer: '', timer: null }
      this.dataThrottle.set(agentId, throttle)
    }

    throttle.buffer += data

    if (!throttle.timer) {
      throttle.timer = setTimeout(() => {
        const bufferedData = throttle!.buffer
        throttle!.buffer = ''
        throttle!.timer = null

        this.emit('data', {
          agentId,
          data: bufferedData
        })
      }, this.throttleMs)
    }
  }

  getSession(agentId: string): PtySession | undefined {
    return this.sessions.get(agentId)
  }

  writeToSession(agentId: string, data: string): void {
    const session = this.sessions.get(agentId)
    if (!session) {
      throw new Error(`No terminal session found for agent ${agentId}`)
    }
    session.write(data)
  }

  resizeSession(agentId: string, dimensions: TerminalDimensions): void {
    const session = this.sessions.get(agentId)
    if (!session) {
      throw new Error(`No terminal session found for agent ${agentId}`)
    }
    session.resize(dimensions)
  }

  killSession(agentId: string): void {
    const session = this.sessions.get(agentId)
    if (session) {
      session.kill()
      this.cleanupSession(agentId)
    }
  }

  private cleanupSession(agentId: string): void {
    this.sessions.delete(agentId)

    const throttle = this.dataThrottle.get(agentId)
    if (throttle?.timer) {
      clearTimeout(throttle.timer)
    }
    this.dataThrottle.delete(agentId)
  }

  getAllSessions(): Map<string, PtySession> {
    return new Map(this.sessions)
  }

  killAll(): void {
    for (const [agentId] of this.sessions) {
      this.killSession(agentId)
    }
  }
}
