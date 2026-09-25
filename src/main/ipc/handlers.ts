import { ipcMain, BrowserWindow } from 'electron'
import { PtyManager } from '../terminal/pty-manager'
import { HiveSubstrate } from '../hive/substrate'
import { HiveDatabase } from '../db/sqlite'
import { PipelineManager } from '../hive/pipeline'
import { GodOrchestrator } from '../god/orchestrator'
import { SettingsStore, resolveProviderConfig } from '../settings/settings-store'
import { IPC_CHANNELS } from '@shared/constants'
import { TerminalCreateOptions, TerminalDimensions } from '@shared/types/terminal'
import { HireWorkerOptions } from '@shared/types/terminal'
import { AppSettings } from '@shared/types/ipc'
import { ActionLogEntry } from '@shared/types/god'
import { randomUUID } from 'crypto'
import { constants as fsConstants, existsSync, statSync, accessSync } from 'fs'
import { extname, isAbsolute, resolve } from 'path'

export function setupIpcHandlers(
  mainWindow: BrowserWindow,
  ptyManager: PtyManager,
  substrate: HiveSubstrate,
  db: HiveDatabase,
  pipelineManager: PipelineManager,
  godOrchestrator: GodOrchestrator,
  settingsStore: SettingsStore
): void {
  // Forward PTY data to renderer
  ptyManager.on('data', (data) => {
    mainWindow.webContents.send(IPC_CHANNELS.TERMINAL_DATA, data)
  })

  // Forward God Agent approval requests to renderer
  godOrchestrator.on('approval:pending', (approval) => {
    mainWindow.webContents.send(IPC_CHANNELS.GOD_APPROVAL_PENDING, approval)
  })

  // NEW: stream the orchestrator's narrated action log to the Command Center terminal tab
  godOrchestrator.on('log', (entry: ActionLogEntry) => {
    mainWindow.webContents.send(IPC_CHANNELS.GOD_LOG, entry)
  })

  // Forward pipeline events to renderer
  pipelineManager.on('task:created', (task) => {
    mainWindow.webContents.send('task:created', task)
  })

  pipelineManager.on('stage:started', (data) => {
    mainWindow.webContents.send('stage:started', data)
  })

  pipelineManager.on('task:completed', (task) => {
    mainWindow.webContents.send('task:completed', task)
  })

  // Terminal handlers
  ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE, async (_, options: TerminalCreateOptions) => {
    try {
      ptyManager.createSession(options)

      substrate.ensureAgentDirs(options.agentId, 'Worker')
      db.upsertAgent({
        id: options.agentId,
        name: options.agentId,
        role: 'Worker',
        accentColor: '#4ecdc4',
        sprite: 'default',
        cwd: options.cwd,
        command: options.command,
        isGod: false
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_INPUT, async (_, agentId: string, data: string) => {
    try {
      ptyManager.writeToSession(agentId, data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, async (_, agentId: string, dimensions: TerminalDimensions) => {
    try {
      ptyManager.resizeSession(agentId, dimensions)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_KILL, async (_, agentId: string) => {
    try {
      ptyManager.killSession(agentId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Agent handlers
  ipcMain.handle(IPC_CHANNELS.AGENT_LIST, async () => {
    return db.getAgents()
  })

  ipcMain.handle(IPC_CHANNELS.AGENT_HIRE, async (_, options: HireWorkerOptions) => {
    const name = typeof options?.name === 'string' ? options.name.trim() : ''
    const role = typeof options?.role === 'string' ? options.role.trim() : ''
    if (!name || name.length > 60) throw new Error('Worker name must be 1–60 characters.')
    if (!role || role.length > 80) throw new Error('Worker role must be 1–80 characters.')

    const workspaceInput = typeof options.workspace === 'string' ? options.workspace.trim() : ''
    if (!workspaceInput || !isAbsolute(workspaceInput)) throw new Error('Workspace must be an absolute path.')
    const workspace = resolve(workspaceInput)
    if (!existsSync(workspace) || !statSync(workspace).isDirectory()) {
      throw new Error('Workspace must be an existing directory.')
    }

    let command: string
    let shell: boolean
    let cli: string
    switch (options.cli) {
      case 'codex': command = 'codex'; shell = true; cli = 'OpenAI Codex'; break
      case 'claude': command = 'claude'; shell = true; cli = 'Claude Code'; break
      case 'gemini': command = 'gemini'; shell = true; cli = 'Gemini CLI'; break
      case 'custom': {
        const executable = typeof options.customExecutable === 'string' ? resolve(options.customExecutable.trim()) : ''
        if (!executable || !existsSync(executable) || !statSync(executable).isFile()) {
          throw new Error('Choose an existing executable file for the custom CLI.')
        }
        if (process.platform === 'win32') {
          if (!['.exe', '.com'].includes(extname(executable).toLowerCase())) {
            throw new Error('On Windows, custom CLIs must be .exe or .com files.')
          }
        } else {
          try { accessSync(executable, fsConstants.X_OK) } catch { throw new Error('Custom file is not executable.') }
        }
        command = executable
        shell = false
        cli = 'Custom CLI'
        break
      }
      default: throw new Error('Choose a supported CLI.')
    }

    const id = `worker-${randomUUID()}`
    const agent = {
      id, name, role, accentColor: '#4ecdc4', sprite: 'default', state: 'idle' as const,
      cwd: workspace, command, cli, isGod: false
    }
    ptyManager.createSession({ agentId: id, command, args: [], cwd: workspace, shell })
    substrate.ensureAgentDirs(id, role)
    db.upsertAgent(agent)
    return agent
  })

  ipcMain.handle(IPC_CHANNELS.AGENT_DELETE, async (_, agentId: string) => {
    try {
      if (agentId === 'michael') {
        throw new Error('Cannot delete Michael (God Agent).')
      }
      ptyManager.killSession(agentId)
      substrate.deleteAgentDirs(agentId)
      db.deleteAgent(agentId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.AGENT_DELETE_ALL, async () => {
    try {
      const agents = db.getAgents().filter(a => !a.isGod)
      for (const a of agents) {
        ptyManager.killSession(a.id)
      }
      substrate.deleteAllWorkerDirs()
      const deletedIds = db.deleteAllWorkers()
      return { success: true, deletedCount: deletedIds.length }
    } catch (error: any) {
      return { success: false, deletedCount: 0, error: error.message }
    }
  })

  // Hive handlers
  ipcMain.handle(IPC_CHANNELS.HIVE_REGISTRY, async () => {
    const agents = db.getAgents()
    return {
      agents: Object.fromEntries(
        agents.map(a => [a.id, {
          id: a.id,
          name: a.name,
          role: a.role,
          station: a.currentStation || 'desk',
          status: 'active',
          lastSeen: Date.now()
        }])
      ),
      godId: 'michael'
    }
  })

  ipcMain.handle(IPC_CHANNELS.HIVE_MEMORY, async (_, agentId: string) => {
    return substrate.getAgentMemory(agentId)
  })

  ipcMain.handle(IPC_CHANNELS.HIVE_MESSAGES, async (_, agentId: string, limit?: number) => {
    return substrate.readInbox(agentId)
  })

  ipcMain.handle(IPC_CHANNELS.HIVE_TASKS, async () => {
    return pipelineManager.getAllTasks()
  })

  // God Agent handlers
  ipcMain.handle(IPC_CHANNELS.GOD_CHAT, async (_, message: string) => {
    try {
      const response = await godOrchestrator.processUserTask(message)
      return response
    } catch (error: any) {
      return `Error: ${error.message}`
    }
  })

  ipcMain.handle(IPC_CHANNELS.GOD_APPROVAL_RESPOND, async (_, requestId: string, approved: boolean) => {
    godOrchestrator.respondToApproval(requestId, approved)
    return { success: true }
  })

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return settingsStore.get()
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, settings: Partial<AppSettings>) => {
    try {
      const updated = settingsStore.update(settings)
      const { provider, model } = resolveProviderConfig(updated)
      godOrchestrator.updateConfig(provider, model)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Window controls
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow.close()
  })
}
