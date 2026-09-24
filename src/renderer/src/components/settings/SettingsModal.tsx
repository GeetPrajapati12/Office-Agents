import React, { useEffect, useState } from 'react'
import { AppSettings } from '@shared/types/ipc'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const DEFAULTS: AppSettings = {
  providers: { ollama: { host: 'http://localhost:11434' } },
  godModel: 'llama3',
  theme: 'dark'
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)
  const [provider, setProvider] = useState<'ollama' | 'anthropic' | 'openai'>('ollama')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      window.api.settings.get().then((s) => {
        setSettings(s)
        if (s.providers.anthropic?.apiKey) setProvider('anthropic')
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
        ollama: settings.providers.ollama,
        anthropic: provider === 'anthropic' ? settings.providers.anthropic : undefined,
        openai: provider === 'openai' ? settings.providers.openai : undefined
      }
    }
    await window.api.settings.update(payload)
    setSaving(false)
    onClose()
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
        style={{ width: 420, padding: 20 }}
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
          SETTINGS
        </div>

        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Provider</label>
        <select
          className="snes-panel-inset"
          value={provider}
          onChange={(e) => setProvider(e.target.value as any)}
          style={{ width: '100%', marginBottom: 12, padding: 6 }}
        >
          <option value="ollama">Ollama (local)</option>
          <option value="anthropic">Anthropic Claude</option>
          <option value="openai">OpenAI</option>
        </select>

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

        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Model</label>
        <input
          className="snes-panel-inset"
          style={{ width: '100%', marginBottom: 20, padding: 6 }}
          value={settings.godModel}
          onChange={(e) => setSettings({ ...settings, godModel: e.target.value })}
          placeholder="llama3 / claude-3-5-sonnet-20241022 / gpt-4o"
        />

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
