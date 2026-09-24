import { EventEmitter } from 'events'
import { LLMClient } from './llm-client'
import { PipelineManager } from '../hive/pipeline'
import { HiveSubstrate } from '../hive/substrate'
import { GOD_SYSTEM_PROMPT, USER_TASK_PROMPT } from './prompt-templates'
import { PipelineStage } from '@shared/types/hive'
import { ActionLogEntry, ActionLogKind } from '@shared/types/god'

interface OrchestratorConfig {
  provider: { name: string; apiKey?: string; host?: string }
  model: string
}

export class GodOrchestrator extends EventEmitter {
  private llmClient: LLMClient
  private approvalQueue: Array<{ id: string; action: string; description: string; resolve: (approved: boolean) => void }> = []

  constructor(
    private config: OrchestratorConfig,
    private pipelineManager: PipelineManager,
    private substrate: HiveSubstrate
  ) {
    super()
    this.llmClient = new LLMClient(config.provider, config.model)
  }

  updateConfig(provider: OrchestratorConfig['provider'], model: string): void {
    this.config = { provider, model }
    this.llmClient.updateConfig(provider, model)
  }

  /** Emits a live line into the Command Center's terminal tab (renderer listens via god.onLog) */
  private emitLog(text: string, kind: ActionLogKind = 'info', agentId: string = 'michael'): void {
    const entry: ActionLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      kind,
      text,
      timestamp: Date.now()
    }
    this.emit('log', entry)
  }

  async processUserTask(userMessage: string): Promise<string> {
    const startedAt = Date.now()
    this.emitLog(`> ${userMessage}`, 'info')

    try {
      this.emitLog('Calling LLM to decompose task into a pipeline...', 'action')

      const response = await this.llmClient.chat([
        { role: 'system', content: GOD_SYSTEM_PROMPT },
        { role: 'user', content: USER_TASK_PROMPT(userMessage) }
      ])

      let plan: any
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      } catch {
        this.emitLog('Could not parse a structured plan — falling back to raw response.', 'error')
        return `I understand you want: "${userMessage}"\n\nHowever, I had trouble creating a structured plan. Let me try a simpler approach:\n\n${response}`
      }

      if (!plan || !plan.pipeline) {
        this.emitLog('No pipeline needed — replying directly.', 'result')
        this.emitLog(response, 'result')
        return response
      }

      this.emitLog(
        `Plan ready: ${plan.pipeline.length}-stage pipeline — ${plan.pipeline.map((s: any) => s.name).join(' → ')}`,
        'result'
      )

      if (plan.needsApproval) {
        this.emitLog(`Escalating for approval: ${plan.summary || 'this task requires your approval'}`, 'action')

        const approved = await this.requestApproval(
          'task_execution',
          `Execute task: ${userMessage}`,
          plan.summary || 'This task requires your approval'
        )

        if (!approved) {
          this.emitLog('Task cancelled by user.', 'error')
          return '❌ Task cancelled by user.'
        }
        this.emitLog('Approved — continuing.', 'result')
      }

      const task = this.pipelineManager.createPipeline(
        userMessage,
        plan.summary || userMessage,
        plan.pipeline as PipelineStage[]
      )

      this.pipelineManager.startPipeline(task.id)
      this.emitLog(`Pipeline "${task.title}" started (${plan.pipeline.length} stages).`, 'action')

      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
      this.emitLog(`Baked for ${elapsedSec}s`, 'info')

      const reply = `✅ ${plan.summary}\n\n**Pipeline created** (${plan.pipeline.length} stages):\n${plan.pipeline.map((s: any, i: number) => `${i + 1}. ${s.name} → ${s.agent}`).join('\n')}\n\nStarting Stage 1...`
      this.emitLog(reply, 'result')
      return reply

    } catch (error: any) {
      this.emitLog(`Error: ${error.message}`, 'error')
      return `Error processing task: ${error.message}`
    }
  }

  private async requestApproval(action: string, description: string, reason: string): Promise<boolean> {
    return new Promise((resolve) => {
      const requestId = `approval_${Date.now()}`

      this.approvalQueue.push({
        id: requestId,
        action,
        description,
        resolve
      })

      this.emit('approval:pending', {
        id: requestId,
        agentId: 'michael',
        action,
        description,
        reason,
        timestamp: Date.now()
      })
    })
  }

  respondToApproval(requestId: string, approved: boolean): void {
    const index = this.approvalQueue.findIndex(req => req.id === requestId)
    if (index !== -1) {
      const request = this.approvalQueue[index]
      request.resolve(approved)
      this.approvalQueue.splice(index, 1)
    }
  }

  async chat(message: string): Promise<string> {
    this.emitLog(`> ${message}`, 'info')
    this.emitLog('Thinking...', 'action')

    const response = await this.llmClient.chat([
      { role: 'system', content: 'You are Michael, a friendly AI orchestrator. Keep responses concise.' },
      { role: 'user', content: message }
    ])

    this.emitLog(response, 'result')
    return response
  }
}
