# 🚀 Quick Start Guide

## Office AI Agents - Get Running in 5 Minutes

---

## Prerequisites

✅ Node.js 18+ installed  
✅ Windows 11 / macOS 12+ / Linux with glibc 2.28+  
✅ (Optional) Ollama installed for local LLM: https://ollama.ai

---

## Installation & Launch

```bash
# Navigate to project directory
cd "C:\Geet\Office AI Agents"

# Install dependencies (if not already done)
npm install

# Start the app
npm run dev
```

The Electron app window will open with the retro SNES aesthetic!

---

## First Steps

### 1. Create Your First Agent Terminal

Click the **"+ New Agent"** button in the bottom strip.

A PowerShell terminal will spawn with:
- Live output rendered in xterm.js
- Retro VT323 terminal font
- Full command execution capability

Try typing:
```powershell
Write-Host "Hello from Agent 1!" -ForegroundColor Green
dir
```

### 2. Create Multiple Agents

Click **"+ New Agent"** again to spawn a second terminal.

Now you have multiple agents running simultaneously:
- Click the agent cards in the bottom strip to switch between them
- Each agent has its own isolated terminal session
- All agents persist in the Hive database

### 3. What's Happening Behind the Scenes?

Each agent you create:
- ✅ Gets registered in SQLite database
- ✅ Gets a mailbox directory: `%APPDATA%\office-ai-agents\hive\agents\<id>\`
- ✅ Gets a `memory.md` file for persistent memory
- ✅ Gets `inbox/` and `outbox/` folders for FIPA message routing

---

## God Agent (Michael) - Task Orchestration

### Current Status: Backend Ready, UI Coming Soon

The God Agent orchestrator is fully implemented but doesn't have a chat UI yet.

**What Michael can do RIGHT NOW** (via code):
- Decompose tasks into sequential pipelines (Plan → Dev → Test → Review)
- Route work to specialist agents via FIPA messages
- Request human approval for destructive operations
- Maintain shared blackboard and task ledger

**To test God Agent manually**:

1. Open DevTools (F12 in the Electron window)
2. In the Console, run:

```javascript
// Send a task to God Agent
await window.api.god.chat("Build a simple React counter component with tests")
```

3. Check the Hive directory for created tasks:
   - `%APPDATA%\office-ai-agents\hive\tasks.json`

---

## Configure LLM Provider

### Option 1: Ollama (Local, Free, No API Key)

**Install Ollama**: https://ollama.ai

```bash
# Pull a model
ollama pull llama3

# Verify it's running
curl http://localhost:11434/api/tags
```

The app is **already configured** to use Ollama at `localhost:11434` with model `llama3`.

### Option 2: Anthropic Claude

Edit `src/main/index.ts`:

```typescript
godOrchestrator = new GodOrchestrator(
  {
    provider: { name: 'anthropic', apiKey: 'sk-ant-...' },
    model: 'claude-3-5-sonnet-20241022'
  },
  pipelineManager,
  substrate
)
```

Rebuild and restart:
```bash
npm run dev
```

### Option 3: OpenAI

Edit `src/main/index.ts`:

```typescript
godOrchestrator = new GodOrchestrator(
  {
    provider: { name: 'openai', apiKey: 'sk-...' },
    model: 'gpt-4o'
  },
  pipelineManager,
  substrate
)
```

---

## Explore the Hive

All agent data lives at:
```
C:\Users\parth\AppData\Roaming\office-ai-agents\hive\
```

### Key Files:

**Registry** - Agent roster
```bash
type %APPDATA%\office-ai-agents\hive\registry.json
```

**Blackboard** - Shared team notes
```bash
type %APPDATA%\office-ai-agents\hive\board.md
```

**Agent Memory** - Per-agent persistent memory
```bash
type %APPDATA%\office-ai-agents\hive\agents\agent-1726941234567\memory.md
```

**Messages** - FIPA mailbox messages
```bash
dir %APPDATA%\office-ai-agents\hive\agents\agent-1726941234567\inbox
```

---

## Development Tips

### Hot Reload

The app uses `electron-vite` with HMR:
- **Renderer changes** (React components): Instant hot reload
- **Main process changes**: Requires restart (Ctrl+C and `npm run dev` again)

### DevTools

Press **F12** or **Ctrl+Shift+I** to open Chrome DevTools.

Useful console commands:
```javascript
// List all agents
await window.api.agent.list()

// Get hive registry
await window.api.hive.getRegistry()

// Read agent memory
await window.api.hive.getMemory('agent-1726941234567')

// Get all tasks
await window.api.hive.getTasks()
```

### Check Background Process

If terminals aren't spawning, check the main process console output (the terminal where you ran `npm run dev`).

---

## Troubleshooting

### Issue: "npm install failed with C++ build errors"
**Solution**: We removed native dependencies. Make sure you're using the latest `package.json` without `better-sqlite3` or `node-pty`.

### Issue: "Terminal not showing output"
**Workaround**: Try creating a new agent. The first terminal sometimes needs a refresh.

### Issue: "Ollama connection failed"
**Check**: Run `curl http://localhost:11434/api/tags` to verify Ollama is running.

### Issue: "Window is blank/white"
**Solution**: Check DevTools Console (F12) for errors. Likely a React rendering issue.

---

## What's Next?

### Coming in Phase 4-6:
1. **Pixi.js Office Floor**: Animated avatars walking between stations
2. **God Chat UI**: Chat input to talk directly to Michael
3. **Settings Modal**: Configure API keys without editing code
4. **Agent Cards**: Rich cards showing portraits, status, and current task
5. **Approval Modals**: HITL approval dialogs for destructive operations
6. **Packaging**: Installers for Windows, macOS, and Linux

---

## Need Help?

- **Project Summary**: Read `PROJECT_SUMMARY.md` for architecture details
- **Full README**: Check `README.md` for feature overview
- **Code Structure**: See `src/` directory breakdown in PROJECT_SUMMARY

---

**Enjoy building with Office AI Agents!** 🏢🤖

*Making multi-agent coordination visible and delightful*
