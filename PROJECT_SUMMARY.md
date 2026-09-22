# Office AI Agents - Project Summary

## 🎉 Implementation Status: **Phase 1-3 Complete!**

**Date**: September 21, 2026  
**Status**: MVP functional with terminal plane, Hive coordination, and God Agent orchestrator

---

## ✅ What's Working Now

### Phase 1: Project Scaffolding & Terminal Plane ✅
- ✅ Electron + React + TypeScript + electron-vite setup
- ✅ Cross-platform terminal sessions (using Node.js `child_process` + xterm.js)
- ✅ Live terminal output with throttled IPC (16ms batching for 60fps)
- ✅ Multiple agent terminals with switching
- ✅ SNES retro aesthetic (3-layer pixel borders, VT323 terminal font)

### Phase 2: Hive Coordination System ✅
- ✅ File-based mailbox system (`<userData>/hive/agents/<id>/inbox|outbox`)
- ✅ FIPA-lite message routing (REQUEST, INFORM, QUERY, AGREE, REFUSE, DONE)
- ✅ SQLite database with sql.js (pure JS, no native dependencies)
- ✅ Agent memory persistence (`memory.md` per agent)
- ✅ Shared blackboard (`board.md`)
- ✅ Task ledger (`tasks.json`)

### Phase 3: God Agent Orchestrator ✅
- ✅ LLM client supporting Anthropic Claude, OpenAI, Ollama
- ✅ Task decomposition into sequential pipelines
- ✅ Pipeline execution engine (Plan → Dev → Test → Review)
- ✅ Human-in-the-loop approval queue
- ✅ IPC integration for chat and approvals

---

## 🚧 What's Next (Phases 4-6)

### Phase 4: Pixi.js 2D Office Floor 🚧
**Status**: Not yet implemented  
**Components needed**:
- `src/renderer/src/pixi/OfficeEngine.ts` - Main Pixi.js canvas
- `src/renderer/src/pixi/TileGrid.ts` - 32×32px tile grid
- `src/renderer/src/pixi/Pathfinding.ts` - A* algorithm
- `src/renderer/src/pixi/AvatarEntity.ts` - Animated sprites with 4-frame walk cycles
- `src/renderer/src/pixi/StationManager.ts` - Desk, file shelf, terminal rack, etc.

### Phase 5: SNES Retro UI Components 🚧
**Status**: Partial (basic panels done, need full component library)  
**Components needed**:
- Agent cards with portraits
- Settings modal for API keys
- Memory viewer panel
- Task board visualization
- Approval modal dialog

### Phase 6: Packaging & Polish 🚧
**Status**: Not yet implemented  
**Needed**:
- Git worktree isolation for parallel agents
- Icon assets (`.ico`, `.icns`, `.png`)
- electron-builder full configuration
- Native dependency bundling test

---

## 🎮 How to Use Right Now

### 1. Start the App
```bash
cd "C:\Geet\Office AI Agents"
npm run dev
```

### 2. Create an Agent Terminal
- Click **"+ New Agent"** in the bottom strip
- A PowerShell terminal spawns with live output
- Click agent cards to switch between terminals

### 3. Chat with God Agent (Michael)
**Current limitation**: UI for God chat not yet built, but backend is ready.  
**To enable**: Need to add `GodChatView.tsx` component in right panel.

### 4. Configure LLM Provider
**Current default**: Ollama at `http://localhost:11434` with model `llama3`  
**To change**: Edit settings in `src/main/index.ts` or implement Settings UI

---

## 📂 Project Architecture

```
C:\Geet\Office AI Agents\
├── src/
│   ├── main/                   # Electron main process
│   │   ├── terminal/           # ✅ PTY manager, session handling
│   │   ├── hive/               # ✅ Substrate, pipeline, mailbox
│   │   ├── god/                # ✅ Orchestrator, LLM client
│   │   ├── db/                 # ✅ SQLite (sql.js)
│   │   └── ipc/                # ✅ IPC handlers
│   ├── preload/                # ✅ Typed IPC bridge
│   ├── renderer/               # React UI
│   │   └── src/
│   │       ├── components/     # ✅ MainLayout, TitleBar, XTermWrapper
│   │       ├── pixi/           # 🚧 Office floor (not yet implemented)
│   │       └── styles/         # ✅ SNES retro CSS
│   └── shared/                 # ✅ Types, constants, utilities
└── out/                        # Build output
```

---

## 🔑 Key Design Decisions

### Why sql.js instead of better-sqlite3?
- **Reason**: `better-sqlite3` requires C++ build tools (Visual Studio on Windows)
- **Solution**: `sql.js` compiles SQLite to WebAssembly (pure JS, no native deps)
- **Trade-off**: Slightly slower, but portable and easier to install

### Why child_process instead of node-pty?
- **Reason**: `node-pty` also requires C++ compilation
- **Solution**: Native Node.js `spawn()` with shell option
- **Trade-off**: No true PTY resize support, but terminals work cross-platform

### Sequential Pipeline vs Parallel Agents
- **User requirement**: "1 by 1 agent working" with handoffs (Plan → Dev → Test)
- **Implementation**: `PipelineManager` executes stages sequentially
- **Future**: Could add parallel workers within a stage if needed

---

## 🛠️ Developer Quick Reference

### Add a New LLM Provider
Edit `src/main/god/llm-client.ts` and add a new method like `callOllama()`.

### Add a New Pipeline Stage
```typescript
const stages: PipelineStage[] = [
  { name: 'Research', agent: 'planner', inputs: { instructions: '...' } },
  { name: 'Code', agent: 'coder', inputs: { instructions: '...' } },
  { name: 'Test', agent: 'tester', inputs: { instructions: '...' } }
]
```

### Access Hive Files
Located at: `C:\Users\parth\AppData\Roaming\office-ai-agents\hive\`
- `registry.json` - Agent roster
- `board.md` - Shared blackboard
- `tasks.json` - Task ledger
- `agents/<id>/memory.md` - Agent memories
- `agents/<id>/inbox/*.json` - Pending messages

### Trigger an Approval
```typescript
const approved = await godOrchestrator.requestApproval(
  'delete_files',
  'Delete src/old-code/',
  'This action cannot be undone'
)
```

---

## 🐛 Known Issues & Limitations

1. **No PTY resize**: Terminals don't respond to window resize properly
2. **No office floor yet**: Placeholder panel instead of animated Pixi.js canvas
3. **God chat UI missing**: Backend works but no chat input component yet
4. **No settings UI**: API keys hardcoded in `src/main/index.ts`
5. **No agent sprites**: Need to integrate LimeZu tileset or generate programmatic avatars
6. **Windows-only tested**: Developed on Windows 11, needs macOS/Linux testing

---

## 🚀 Next Steps for Contributors

### Priority 1: Build God Chat UI
File: `src/renderer/src/components/god/GodChatView.tsx`
- Text input with "send" button
- Message history display
- Approval modal for pending requests

### Priority 2: Implement Pixi.js Office Floor
Files:
- `src/renderer/src/pixi/OfficeEngine.ts`
- `src/renderer/src/pixi/AvatarEntity.ts`
- Download LimeZu Modern Interiors tileset

### Priority 3: Settings Modal
File: `src/renderer/src/components/settings/SettingsModal.tsx`
- Provider selection (Anthropic, OpenAI, Ollama)
- API key input (masked)
- Model dropdown
- Test connection button

### Priority 4: Agent Cards
File: `src/renderer/src/components/agent/AgentCard.tsx`
- 200×80px card with portrait
- Status badge (idle, thinking, working, blocked)
- Current task display
- Progress dots (8-segment)

---

## 📦 Build & Package

```bash
# Development
npm run dev

# Production build
npm run build
npm run package

# Platform-specific
npm run package:win   # Windows NSIS + portable
npm run package:mac   # macOS DMG (untested)
npm run package:linux # AppImage + deb (untested)
```

---

## 📖 References

- **Architecture inspiration**: [munder-difflin](https://github.com/chaitanyagiri/munder-difflin)
- **Electron docs**: https://www.electronjs.org/docs/latest
- **Pixi.js docs**: https://pixijs.com/guides
- **xterm.js docs**: https://xtermjs.org/docs
- **LimeZu tileset**: https://limezu.itch.io/moderninteriors

---

## 🎯 Vision Statement

**Office AI Agents** lets developers visualize and orchestrate multiple AI coding agents as a charming pixel-art office team. Unlike terminal-only tools, this app shows agents "walking" between stations (desk → file shelf → terminal → conference room), sending messages to each other, and collaboratively working through sequential pipelines.

The user chats with one orchestrator (Michael) who routes work to specialists, only escalating critical decisions. Memory persists between sessions. The SNES aesthetic makes complex multi-agent systems feel approachable and fun.

---

**Built with ❤️ by the Office AI Agents team**  
*Making AI agent coordination visible, delightful, and productive*
