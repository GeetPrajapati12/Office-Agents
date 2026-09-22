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
}
