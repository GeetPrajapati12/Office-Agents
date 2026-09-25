import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { AppSettings } from '@shared/types/ipc'

const DEFAULT_SETTINGS: AppSettings = {
  providers: {
    omniroute: { apiKey: '', baseUrl: 'http://localhost:20128/v1' },
    ollama: { host: 'http://localhost:11434' }
  },
  godModel: 'auto/best-coding',
  theme: 'dark'
}

export class SettingsStore {
  private filePath: string
  private settings: AppSettings

  constructor(storageDir: string) {
    if (!existsSync(storageDir)) {
      mkdirSync(storageDir, { recursive: true })
    }
    this.filePath = join(storageDir, 'settings.json')
    this.settings = this.load()
  }

  private load(): AppSettings {
    if (existsSync(this.filePath)) {
      try {
        const raw = JSON.parse(readFileSync(this.filePath, 'utf-8'))
        return {
          ...DEFAULT_SETTINGS,
          ...raw,
          providers: { ...DEFAULT_SETTINGS.providers, ...raw.providers }
        }
      } catch {
        return { ...DEFAULT_SETTINGS }
      }
    }
    return { ...DEFAULT_SETTINGS }
  }

  get(): AppSettings {
    return this.settings
  }

  update(partial: Partial<AppSettings>): AppSettings {
    this.settings = {
      ...this.settings,
      ...partial,
      providers: {
        ...this.settings.providers,
        ...(partial.providers ?? {})
      }
    }
    writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2))
    return this.settings
  }
}

export function resolveProviderConfig(settings: AppSettings): {
  provider: { name: string; apiKey?: string; host?: string; baseUrl?: string }
  model: string
} {
  if (settings.providers.omniroute?.apiKey || settings.providers.omniroute?.baseUrl) {
    return {
      provider: {
        name: 'omniroute',
        apiKey: settings.providers.omniroute.apiKey || process.env.OMNIROUTE_API_KEY || '',
        baseUrl: settings.providers.omniroute.baseUrl || 'http://localhost:20128/v1'
      },
      model: settings.godModel || 'auto/best-coding'
    }
  }
  if (settings.providers.anthropic?.apiKey) {
    return {
      provider: { name: 'anthropic', apiKey: settings.providers.anthropic.apiKey },
      model: settings.godModel
    }
  }
  if (settings.providers.openai?.apiKey) {
    return {
      provider: { name: 'openai', apiKey: settings.providers.openai.apiKey, baseUrl: settings.providers.openai.baseUrl },
      model: settings.godModel
    }
  }
  return {
    provider: { name: 'ollama', host: settings.providers.ollama?.host || 'http://localhost:11434' },
    model: settings.godModel || 'llama3'
  }
}
