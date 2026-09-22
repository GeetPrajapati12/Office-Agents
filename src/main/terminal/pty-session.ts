import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { TerminalDimensions } from '@shared/types/terminal'

export class PtySession extends EventEmitter {
  private process: ChildProcess | null = null
  private outputBuffer: string[] = []
  private readonly maxBufferLines = 5000

  constructor(
    public readonly agentId: string,
    private command: string,
    private args: string[],
    private cwd: string,
    private env: Record<string, string>
  ) {
    super()
  }

  start(): void {
    if (this.process) {
      throw new Error(`Process already started for agent ${this.agentId}`)
    }

    // Merge environment variables
    const processEnv = {
      ...process.env,
      ...this.env,
      FORCE_COLOR: '1',
      COLORTERM: 'truecolor'
    }

    this.process = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: processEnv,
      shell: true,
      windowsHide: false
    })

    if (this.process.stdout) {
      this.process.stdout.on('data', (data: Buffer) => {
        this.handleData(data.toString('utf8'))
      })
    }

    if (this.process.stderr) {
      this.process.stderr.on('data', (data: Buffer) => {
        this.handleData(`\x1b[31m${data.toString('utf8')}\x1b[0m`)
      })
    }

    this.process.on('exit', (code, signal) => {
      this.emit('exit', { exitCode: code || 0, signal: signal || undefined })
    })

    this.process.on('error', (error) => {
      this.handleData(`\x1b[31mError: ${error.message}\x1b[0m\r\n`)
    })
  }

  private handleData(data: string): void {
    // Add to circular buffer
    const lines = data.split('\n')
    this.outputBuffer.push(...lines)

    // Keep buffer size limited
    if (this.outputBuffer.length > this.maxBufferLines) {
      this.outputBuffer = this.outputBuffer.slice(-this.maxBufferLines)
    }

    // Emit data event
    this.emit('data', data)
  }

  write(data: string): void {
    if (!this.process || !this.process.stdin) {
      throw new Error(`Process not started for agent ${this.agentId}`)
    }
    this.process.stdin.write(data)
  }

  resize(_dimensions: TerminalDimensions): void {
    // No-op for basic child_process (PTY would support this)
  }

  getBuffer(): string {
    return this.outputBuffer.join('\n')
  }

  kill(): void {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }

  get pid(): number | undefined {
    return this.process?.pid
  }

  get isAlive(): boolean {
    return this.process !== null && !this.process.killed
  }
}
