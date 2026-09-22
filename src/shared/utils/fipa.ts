import { FipaMessage, FipaPerformative } from './types/hive'

export function createMessage(
  performative: FipaPerformative,
  sender: string,
  receiver: string,
  content: Record<string, any>,
  inReplyTo?: string
): FipaMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    performative,
    sender,
    receiver,
    inReplyTo,
    timestamp: Date.now(),
    content
  }
}

export function validateMessage(msg: any): msg is FipaMessage {
  return (
    typeof msg === 'object' &&
    typeof msg.id === 'string' &&
    typeof msg.sender === 'string' &&
    typeof msg.receiver === 'string' &&
    typeof msg.performative === 'string' &&
    typeof msg.timestamp === 'number' &&
    typeof msg.content === 'object'
  )
}
