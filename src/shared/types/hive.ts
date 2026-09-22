export type FipaPerformative =
  | 'REQUEST'
  | 'INFORM'
  | 'QUERY'
  | 'AGREE'
  | 'REFUSE'
  | 'PROPOSE'
  | 'DONE'

export interface FipaMessage {
  id: string
  performative: FipaPerformative
  sender: string
  receiver: string
  replyWith?: string
  inReplyTo?: string
  timestamp: number
  content: Record<string, any>
}

export interface HiveRegistry {
  agents: Record<string, {
    id: string
    name: string
    role: string
    station: string
    status: 'active' | 'idle' | 'offline'
    lastSeen: number
  }>
  godId: string
}

export interface TaskDefinition {
  id: string
  title: string
  description: string
  pipeline: PipelineStage[]
  status: 'pending' | 'active' | 'completed' | 'failed'
  currentStage?: number
  assignedTo?: string
  createdAt: number
  updatedAt: number
}

export interface PipelineStage {
  name: string
  agent: string
  inputs: Record<string, any>
  outputs?: Record<string, any>
  status: 'pending' | 'active' | 'completed' | 'failed'
}
