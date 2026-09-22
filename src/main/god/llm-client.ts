interface LLMProvider {
  name: string
  apiKey?: string
  host?: string
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class LLMClient {
  constructor(
    private provider: LLMProvider,
    private model: string
  ) {}

  async chat(messages: LLMMessage[]): Promise<string> {
    const { provider, model } = this

    if (provider.name === 'anthropic') {
      return this.callAnthropic(messages)
    } else if (provider.name === 'openai') {
      return this.callOpenAI(messages)
    } else if (provider.name === 'ollama') {
      return this.callOllama(messages)
    } else {
      throw new Error(`Unsupported LLM provider: ${provider.name}`)
    }
  }

  private async callAnthropic(messages: LLMMessage[]): Promise<string> {
    const { apiKey } = this.provider

    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          messages: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
          })),
          system: messages.find(m => m.role === 'system')?.content
        })
      })

      const data = await response.json()
      return data.content?.[0]?.text || 'No response from Claude'
    } catch (error: any) {
      return `Error calling Anthropic API: ${error.message}`
    }
  }

  private async callOpenAI(messages: LLMMessage[]): Promise<string> {
    const { apiKey } = this.provider

    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'No response from OpenAI'
    } catch (error: any) {
      return `Error calling OpenAI API: ${error.message}`
    }
  }

  private async callOllama(messages: LLMMessage[]): Promise<string> {
    const host = this.provider.host || 'http://localhost:11434'

    try {
      const response = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: false
        })
      })

      const data = await response.json()
      return data.message?.content || 'No response from Ollama'
    } catch (error: any) {
      return `Error calling Ollama: ${error.message}. Is Ollama running at ${host}?`
    }
  }
}
