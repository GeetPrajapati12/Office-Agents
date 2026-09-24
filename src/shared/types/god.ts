export type ActionLogKind = 'info' | 'action' | 'result' | 'error'

export interface ActionLogEntry {
  id: string
  agentId: string
  kind: ActionLogKind
  text: string
  timestamp: number
}
