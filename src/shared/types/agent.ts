export type AgentState =
  | 'idle'
  | 'alert'
  | 'thinking'
  | 'working'
  | 'blocked'
  | 'success'
  | 'ghost'

export type StationType =
  | 'desk'
  | 'file_shelf'
  | 'terminal_rack'
  | 'web_portal'
  | 'conference_table'
  | 'michael_office'

export interface Agent {
  id: string
  name: string
  role: string
  accentColor: string
  sprite: string
  state: AgentState
  currentStation?: StationType
  currentTask?: string
  cwd: string
  command: string
  cli?: string
  model?: string
  isGod: boolean
  pid?: number
}

export interface AgentConfig {
  name: string
  role: string
  accentColor: string
  sprite: string
  cwd: string
  command: string
  model?: string
  systemPrompt?: string
}
