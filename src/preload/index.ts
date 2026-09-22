import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/constants'
import { IpcApi } from '@shared/types/ipc'

const api: IpcApi = {
  terminal: {
    create: (options) => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_CREATE, options),
    write: (agentId, data) => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_INPUT, agentId, data),
    resize: (agentId, dimensions) => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_RESIZE, agentId, dimensions),
    kill: (agentId) => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_KILL, agentId),
    onData: (callback) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.TERMINAL_DATA, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_DATA, handler)
    }
  },

  agent: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_LIST),
    create: (config) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_CREATE, config),
    update: (id, updates) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_UPDATE, id, updates),
    onStateChanged: (callback) => {
      const handler = (_: any, agent: any) => callback(agent)
      ipcRenderer.on(IPC_CHANNELS.AGENT_STATE_CHANGED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.AGENT_STATE_CHANGED, handler)
    }
  },

  hive: {
    getRegistry: () => ipcRenderer.invoke(IPC_CHANNELS.HIVE_REGISTRY),
    getMemory: (agentId) => ipcRenderer.invoke(IPC_CHANNELS.HIVE_MEMORY, agentId),
    getMessages: (agentId, limit) => ipcRenderer.invoke(IPC_CHANNELS.HIVE_MESSAGES, agentId, limit),
    getTasks: () => ipcRenderer.invoke(IPC_CHANNELS.HIVE_TASKS)
  },

  god: {
    chat: (message) => ipcRenderer.invoke(IPC_CHANNELS.GOD_CHAT, message),
    onApprovalPending: (callback) => {
      const handler = (_: any, approval: any) => callback(approval)
      ipcRenderer.on(IPC_CHANNELS.GOD_APPROVAL_PENDING, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.GOD_APPROVAL_PENDING, handler)
    },
    respondToApproval: (requestId, approved) =>
      ipcRenderer.invoke(IPC_CHANNELS.GOD_APPROVAL_RESPOND, requestId, approved)
  },

  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings)
  }
}

contextBridge.exposeInMainWorld('api', api)
