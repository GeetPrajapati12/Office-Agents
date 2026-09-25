import React, { useEffect, useState } from 'react'
import { AppSettings } from '@shared/types/ipc'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onWorkersDeleted?: () => void
}

const DEFAULTS: AppSettings = {
  providers: {
    omniroute: { apiKey: '', baseUrl: 'http://localhost:20128/v1' },
    ollama: { host: 'http://localhost:11434' }
  },
  godModel: 'auto/best-coding',
  theme: 'dark'
}

type ProviderType = 'omniroute' | 'anthropic' | 'openai' | 'ollama'

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onWorkersDeleted }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)
  const [provider, setProvider] = useState<ProviderType>('omniroute')
  const [saving, setSaving] = useState(false)
  const [deletingWorkers, setDeletingWorkers] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDeleteMessage('')
      window.api.settings.get().then((s) => {
        setSettings(s)
        if (s.providers.omniroute?.apiKey || s.providers.omniroute?.baseUrl) setProvider('omniroute')
        else if (s.providers.anthropic?.apiKey) setProvider('anthropic')
        else if (s.providers.openai?.apiKey) setProvider('openai')
        else setProvider('ollama')
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    const payload: Partial<AppSettings> = {
      godModel: settings.godModel,
      theme: settings.theme,
      providers: {
        omniroute: provider === 'omniroute' ? settings.providers.omniroute : undefined,
        anthropic: provider === 'anthropic' ? settings.providers.anthropic : undefined,
        openai: provider === 'openai' ? settings.providers.openai : undefined,
        ollama: provider === 'ollama' ? settings.providers.ollama : settings.providers.ollama
      }
    }
    await window.api.settings.update(payload)
    setSaving(false)
    onClose()
  }

  const handleDeleteAllWorkers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL hired workers? This will terminate their sessions and erase their files.')) {
      return
    }
    setDeletingWorkers(true)
    try {
      const res = await window.api.agent.deleteAllWorkers()
      if (res.success) {
        setDeleteMessage(`Deleted ${res.deletedCount} worker(s).`)
        if (onWorkersDeleted) onWorkersDeleted()
      } else {
        setDeleteMessage(`Error: ${res.error}`)
      }
    } catch (err: any) {
      setDeleteMessage(`Error: ${err.message}`)
    } finally {
      setDeletingWorkers(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        className="snes-panel"
        style={{ width: 440, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            color: 'var(--mint)',
            marginBottom: 16
          }}
        >
          SETTINGS &amp; PROVIDERS
        </div>

        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Provider</label>
        <select
          className="snes-panel-inset"
          value={provider}
          onChange={(e) => {
            const p = e.target.value as ProviderType
            setProvider(p)
            if (p === 'omniroute' && !settings.godModel) {
              setSettings({ ...settings, godModel: 'auto/best-coding' })
            }
          }}
          style={{ width: '100%', marginBottom: 12, padding: 6 }}
        >
          <option value="omniroute">OmniRoute (Proxy / Local Port 20128)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic Claude</option>
          <option value="ollama">Ollama (local)</option>
        </select>

        {provider === 'omniroute' && (
          <>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>OmniRoute Base URL</label>
            <input
              className="snes-panel-inset"
              style={{ width: '100%', marginBottom: 12, padding: 6 }}
              value={settings.providers.omniroute?.baseUrl ?? 'http://localhost:20128/v1'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  providers: {
                    ...settings.providers,
                    omniroute: {
                      ...(settings.providers.omniroute || { apiKey: '' }),
                      baseUrl: e.target.value
                    }
                  }
                })
              }
              placeholder="http://localhost:20128/v1"
            />
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              OmniRoute API Key (or env OMNIROUTE_API_KEY)
            </label>
            <input
              type="password"
              className="snes-panel-inset"
              style={{ width: '100%', marginBottom: 12, padding: 6 }}
              value={settings.providers.omniroute?.apiKey || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  providers: {
                    ...settings.providers,
                    omniroute: {
                      ...(settings.providers.omniroute || { baseUrl: 'http://localhost:20128/v1' }),
                      apiKey: e.target.value
                    }
                  }
                })
              }
              placeholder="omniroute-key-..."
            />
          </>
        )}

        {provider === 'anthropic' && (
          <>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Anthropic API Key
            </label>
            <input
              type="password"
              className="snes-panel-inset"
              style={{ width: '100%', marginBottom: 12, padding: 6 }}
              value={settings.providers.anthropic?.apiKey || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  providers: { ...settings.providers, anthropic: { apiKey: e.target.value } }
                })
              }
              placeholder="sk-ant-..."
            />
          </>
        )}

        {provider === 'openai' && (
          <>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>OpenAI API Key</label>
            <input
              type="password"
              className="snes-panel-inset"
              style={{ width: '100%', marginBottom: 12, padding: 6 }}
              value={settings.providers.openai?.apiKey || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  providers: { ...settings.providers, openai: { apiKey: e.target.value } }
                })
              }
              placeholder="sk-..."
            />
          </>
        )}

        {provider === 'ollama' && (
          <>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Ollama Host</label>
            <input
              className="snes-panel-inset"
              style={{ width: '100%', marginBottom: 12, padding: 6 }}
              value={settings.providers.ollama?.host || 'http://localhost:11434'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  providers: { ...settings.providers, ollama: { host: e.target.value } }
                })
              }
            />
          </>
        )}

        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Model</label>
        <input
          className="snes-panel-inset"
          style={{ width: '100%', marginBottom: 16, padding: 6 }}
          value={settings.godModel}
          onChange={(e) => setSettings({ ...settings, godModel: e.target.value })}
          placeholder="auto/best-coding / claude-3-5-sonnet-20241022 / gpt-4o / llama3"
        />

        {/* Worker Management / Reset Section */}
        <div
          className="snes-panel-inset"
          style={{
            marginBottom: 16,
            padding: 10,
            border: '1px solid var(--coral)',
            backgroundColor: 'rgba(255, 107, 107, 0.08)'
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              color: 'var(--coral)',
              marginBottom: 6
            }}
          >
            MANAGE WORKERS
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-300)', margin: '0 0 8px 0' }}>
            Delete all hired worker agents and reset their terminals and memory.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <button
              className="snes-button"
              onClick={handleDeleteAllWorkers}
              disabled={deletingWorkers}
              style={{
                backgroundColor: 'var(--ink-700)',
                color: 'var(--coral)',
                borderColor: 'var(--coral)',
                fontSize: 11,
                padding: '4px 8px'
              }}
            >
              {deletingWorkers ? 'Deleting...' : '🗑 Delete All Workers'}
            </button>
            {deleteMessage && (
              <span style={{ fontSize: 11, color: 'var(--lemon)' }}>{deleteMessage}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="snes-button" onClick={onClose}>
            Cancel
          </button>
          <button className="snes-button snes-button-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
