export interface TerminalData {
  agentId: string
  data: string
}

export interface TerminalDimensions {
  cols: number
  rows: number
}

export interface TerminalCreateOptions {
  agentId: string
  command: string
  args: string[]
  cwd: string
  env?: Record<string, string>
  shell?: boolean
}

export type WorkerCli = 'codex' | 'claude' | 'gemini' | 'custom'

export interface HireWorkerOptions {
  name: string
  role: string
  workspace: string
  cli: WorkerCli
  customExecutable?: string
}
