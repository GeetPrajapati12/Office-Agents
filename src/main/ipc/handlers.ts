import { ipcMain, BrowserWindow } from 'electron'
import { PtyManager } from '../terminal/pty-manager'
import { HiveSubstrate } from '../hive/substrate'
import { HiveDatabase } from '../db/sqlite'
import { PipelineManager } from '../hive/pipeline'
import { GodOrchestrator } from '../god/orchestrator'
import { IPC_CHANNELS } from '@shared/constants'
import { TerminalCreateOptions, TerminalDimensions } from '@shared/types/terminal'

export function setupIpcHandlers(
  mainWindow: BrowserWindow,
  ptyManager: PtyManager,
  substrate: HiveSubstrate,
  db: HiveDatabase,
  pipelineManager: PipelineManager,
  godOrchestrator: GodOrchestrator
): void {
  // Forward PTY data to renderer
  ptyManager.on('data', (data) => {
    mainWindow.webContents.send(IPC_CHANNELS.TERMINAL_DATA, data)
  })

  // Forward God Agent approval requests to renderer
  godOrchestrator.on('approval:pending', (approval) => {
    mainWindow.webContents.send(IPC_CHANNELS.GOD_APPROVAL_PENDING, approval)
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

      // Register agent in Hive
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
    return {
      providers: {
        ollama: { host: 'http://localhost:11434' }
      },
      godModel: 'llama3',
      theme: 'dark'
    }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, settings) => {
    // TODO: Persist settings and reinitialize God Agent
    return { success: true }
  })

  // Window controls
  ipcMain.on('window:minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow.close()
  })
}
