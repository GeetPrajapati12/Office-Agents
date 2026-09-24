import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { PtyManager } from './terminal/pty-manager'
import { HiveDatabase } from './db/sqlite'
import { HiveSubstrate } from './hive/substrate'
import { PipelineManager } from './hive/pipeline'
import { GodOrchestrator } from './god/orchestrator'
import { setupIpcHandlers } from './ipc/handlers'
import { SettingsStore, resolveProviderConfig } from './settings/settings-store'

let mainWindow: BrowserWindow | null = null
const ptyManager = new PtyManager()

const storageDir = app.getPath('userData')
const hiveDb = new HiveDatabase(storageDir)
const substrate = new HiveSubstrate(storageDir, hiveDb)
const pipelineManager = new PipelineManager(substrate)
const settingsStore = new SettingsStore(storageDir)

let godOrchestrator: GodOrchestrator | null = null

async function initializeHive() {
  await hiveDb.init()

  const { provider, model } = resolveProviderConfig(settingsStore.get())
  godOrchestrator = new GodOrchestrator(
    { provider, model },
    pipelineManager,
    substrate
  )

  substrate.ensureAgentDirs('michael', 'Orchestrator')

  console.log('✅ Hive initialized at:', storageDir)
  console.log('✅ God Agent provider:', provider.name, '| model:', model)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Office AI Agents',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: false,
    backgroundColor: '#1a1921'
  })

  setupIpcHandlers(mainWindow, ptyManager, substrate, hiveDb, pipelineManager, godOrchestrator!, settingsStore)

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await initializeHive()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  ptyManager.killAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  ptyManager.killAll()
})
