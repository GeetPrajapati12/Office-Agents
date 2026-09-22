import { EventEmitter } from 'events'
import { LLMClient } from './llm-client'
import { PipelineManager } from '../hive/pipeline'
import { HiveSubstrate } from '../hive/substrate'
import { GOD_SYSTEM_PROMPT, USER_TASK_PROMPT } from './prompt-templates'
import { PipelineStage } from '@shared/types/hive'

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

  async processUserTask(userMessage: string): Promise<string> {
    try {
      // Call LLM to decompose task
      const response = await this.llmClient.chat([
        { role: 'system', content: GOD_SYSTEM_PROMPT },
        { role: 'user', content: USER_TASK_PROMPT(userMessage) }
      ])

      // Try to parse JSON response
      let plan: any
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      } catch {
        return `I understand you want: "${userMessage}"\n\nHowever, I had trouble creating a structured plan. Let me try a simpler approach:\n\n${response}`
      }

      if (!plan || !plan.pipeline) {
        return response
      }

      // Check if approval needed
      if (plan.needsApproval) {
        const approved = await this.requestApproval(
          'task_execution',
          `Execute task: ${userMessage}`,
          plan.summary || 'This task requires your approval'
        )

        if (!approved) {
          return '❌ Task cancelled by user.'
        }
      }

      // Create and start pipeline
      const task = this.pipelineManager.createPipeline(
        userMessage,
        plan.summary || userMessage,
        plan.pipeline as PipelineStage[]
      )

      this.pipelineManager.startPipeline(task.id)

      return `✅ ${plan.summary}\n\n**Pipeline created** (${plan.pipeline.length} stages):\n${plan.pipeline.map((s: any, i: number) => `${i + 1}. ${s.name} → ${s.agent}`).join('\n')}\n\nStarting Stage 1...`

    } catch (error: any) {
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

      // Emit to UI
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
    // Simple chat interface
    const response = await this.llmClient.chat([
      { role: 'system', content: 'You are Michael, a friendly AI orchestrator. Keep responses concise.' },
      { role: 'user', content: message }
    ])
    return response
  }
}
