export const APP_NAME = 'Office AI Agents'
export const APP_ID = 'com.officeaiagents.app'

// Tile and grid constants
export const TILE_SIZE = 32
export const AVATAR_SIZE = 24
export const AVATAR_SCALE = 2

// Agent states
export const AGENT_STATES = {
  IDLE: 'idle',
  ALERT: 'alert',
  THINKING: 'thinking',
  WORKING: 'working',
  BLOCKED: 'blocked',
  SUCCESS: 'success',
  GHOST: 'ghost'
} as const

// Station types
export const STATIONS = {
  DESK: 'desk',
  FILE_SHELF: 'file_shelf',
  TERMINAL_RACK: 'terminal_rack',
  WEB_PORTAL: 'web_portal',
  CONFERENCE_TABLE: 'conference_table',
  MICHAEL_OFFICE: 'michael_office'
} as const

// FIPA performatives
export const FIPA_ACTS = {
  REQUEST: 'REQUEST',
  INFORM: 'INFORM',
  QUERY: 'QUERY',
  AGREE: 'AGREE',
  REFUSE: 'REFUSE',
  PROPOSE: 'PROPOSE',
  DONE: 'DONE'
} as const

// IPC channels
export const IPC_CHANNELS = {
  // Terminal
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_INPUT: 'terminal:input',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_KILL: 'terminal:kill',

  // Agent
  AGENT_LIST: 'agent:list',
  AGENT_CREATE: 'agent:create',
  AGENT_HIRE: 'agent:hire',
  AGENT_UPDATE: 'agent:update',
  AGENT_STATE_CHANGED: 'agent:state-changed',

  // Hive
  HIVE_REGISTRY: 'hive:registry',
  HIVE_MEMORY: 'hive:memory',
  HIVE_MESSAGES: 'hive:messages',
  HIVE_TASKS: 'hive:tasks',

  // God
  GOD_CHAT: 'god:chat',
  GOD_LOG: 'god:log',
  GOD_APPROVAL_PENDING: 'god:approval-pending',
  GOD_APPROVAL_RESPOND: 'god:approval-respond',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close'
} as const
