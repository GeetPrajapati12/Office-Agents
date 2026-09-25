import { Agent } from './agent'
import { TerminalData, TerminalDimensions, TerminalCreateOptions, HireWorkerOptions } from './terminal'
import { FipaMessage, HiveRegistry, TaskDefinition } from './hive'
import { ActionLogEntry } from './god'

export interface IpcApi {
  // Terminal
  terminal: {
    create: (options: TerminalCreateOptions) => Promise<void>
    write: (agentId: string, data: string) => Promise<void>
    resize: (agentId: string, dimensions: TerminalDimensions) => Promise<void>
    kill: (agentId: string) => Promise<void>
    onData: (callback: (data: TerminalData) => void) => () => void
  }

  // Agent
  agent: {
    list: () => Promise<Agent[]>
    create: (config: any) => Promise<Agent>
    hire: (config: HireWorkerOptions) => Promise<Agent>
    update: (id: string, updates: Partial<Agent>) => Promise<void>
    delete: (id: string) => Promise<{ success: boolean; error?: string }>
    deleteAllWorkers: () => Promise<{ success: boolean; deletedCount: number; error?: string }>
    onStateChanged: (callback: (agent: Agent) => void) => () => void
  }

  // Hive
  hive: {
    getRegistry: () => Promise<HiveRegistry>
    getMemory: (agentId: string) => Promise<string>
    getMessages: (agentId: string, limit?: number) => Promise<FipaMessage[]>
    getTasks: () => Promise<TaskDefinition[]>
  }

  // God
  god: {
    chat: (message: string) => Promise<string>
    onLog: (callback: (entry: ActionLogEntry) => void) => () => void
    onApprovalPending: (callback: (approval: ApprovalRequest) => void) => () => void
    respondToApproval: (requestId: string, approved: boolean) => Promise<void>
  }

  // Settings
  settings: {
    get: () => Promise<AppSettings>
    update: (settings: Partial<AppSettings>) => Promise<void>
  }

  // Window
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
}

export interface ApprovalRequest {
  id: string
  agentId: string
  action: string
  description: string
  reason: string
  costEstimate?: number
  timestamp: number
}

export interface AppSettings {
  providers: {
    omniroute?: { apiKey: string; baseUrl?: string }
    anthropic?: { apiKey: string }
    openai?: { apiKey: string; baseUrl?: string }
    ollama?: { host: string }
  }
  godModel: string
  theme: 'light' | 'dark'
}
