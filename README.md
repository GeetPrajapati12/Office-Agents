# Office AI Agents 🏢

A cross-platform desktop app that visualizes and coordinates multiple AI coding agents as an animated 2D pixel-art office.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## ✨ Features

- **Visual Office Floor**: Watch AI agents move around a pixel-art office floor (SNES/Animal Crossing aesthetic)
- **Multi-Agent Coordination**: Sequential pipeline execution - Planner → Developer → Tester → Reviewer
- **Live Terminals**: Real xterm.js terminals showing each agent's work in real-time
- **God Agent Orchestrator**: Chat with "Michael" who decomposes tasks and manages the team
- **Memory System**: Persistent agent memory with cross-session search
- **HITL Approval Queue**: Human approval required for destructive operations, spend, and critical decisions
- **BYOK**: Bring your own API keys (Anthropic Claude, OpenAI, Ollama, LM Studio)
- **Local-First**: Git-based coordination, SQLite search, no cloud dependency

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Windows 11 / macOS 12+ / Linux with glibc 2.28+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd "Office AI Agents"

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Building

```bash
# Build for current platform
npm run build
npm run package

# Platform-specific builds
npm run package:win   # Windows NSIS installer + portable
npm run package:mac   # macOS universal DMG
npm run package:linux # Linux AppImage + deb
```

## 🎮 Usage

1. **Launch the app** - You'll see an empty office floor
2. **Click "+ New Agent"** to spawn your first agent terminal
3. **Configure providers** in Settings (Anthropic/OpenAI API keys or local Ollama)
4. **Chat with Michael** (God Agent) in the bottom panel
5. **Give a task** like "Build a React todo app with tests"
6. **Watch the pipeline** - Michael decomposes it into stages and routes work to specialist agents

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Renderer (React + Pixi.js)             │
│  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  Office Floor   │  │  Agent Terminal Panel    │ │
│  │  (Pixi.js)      │  │  (xterm.js)              │ │
│  └─────────────────┘  └──────────────────────────┘ │
└──────────────────────▲──────────────────────────────┘
                       │ IPC Bridge
┌──────────────────────▼──────────────────────────────┐
│              Main Process (Electron)                │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Terminal    │ │ Event Plane  │ │ Hive Layer   │ │
│  │ (node-pty)  │ │ (Hooks)      │ │ (Mailbox)    │ │
│  └─────────────┘ └──────────────┘ └──────────────┘ │
│  ┌──────────────────────────────────────────────┐  │
│  │  God Agent: Orchestrator + LLM API Client    │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Components

- **Terminal Plane**: Cross-platform PTY using `node-pty` (ConPTY on Windows)
- **Event Plane**: Hook-based telemetry capturing agent state transitions
- **Hive**: Git-based mailbox system for agent-to-agent communication (FIPA-lite)
- **God Agent**: LLM-powered orchestrator that plans pipelines and manages approval queue
- **Office Engine**: Pixi.js 2D renderer with A* pathfinding and animated sprites

## 📁 Project Structure

```
src/
├── main/           # Electron main process
│   ├── terminal/   # PTY manager and sessions
│   ├── hive/       # Mailbox router, memory, tasks
│   ├── god/        # Orchestrator and LLM client
│   └── ipc/        # IPC handlers
├── preload/        # Typed IPC bridge
├── renderer/       # React UI
│   ├── components/ # UI components
│   ├── pixi/       # Office floor engine
│   └── styles/     # SNES retro theme
└── shared/         # Shared types and constants
```

## 🎨 Design System

Inspired by **Animal Crossing**, **Earthbound**, and **SNES RPGs**:

- **Fonts**: Press Start 2P (display), Pixelify Sans (UI), VT323 (terminal)
- **Borders**: 3-layer SNES bevel effect
- **Sprites**: 24×24px pixel art with 4-frame walk cycles
- **Palette**: Cream backgrounds, pixel-snapped everything, no gradients

## 🛠️ Development Status

### ✅ Phase 1: Scaffolding & Terminal Plane (Complete)
- Electron + React + TypeScript setup
- Cross-platform PTY with xterm.js
- Typed IPC bridge

### 🚧 Phase 2: Hive Coordination (In Progress)
- [ ] FIPA mailbox router
- [ ] SQLite memory search
- [ ] Pipeline task manager

### 📋 Phase 3: God Agent (Planned)
- [ ] LLM client (Anthropic, OpenAI, Ollama)
- [ ] Task decomposition
- [ ] Approval queue modal

### 🎮 Phase 4: Pixi.js Office (Planned)
- [ ] Tile grid and pathfinding
- [ ] Animated avatars
- [ ] Station behaviors

### 🎨 Phase 5: Retro UI Polish (Planned)
- [ ] SNES component library
- [ ] Settings modal
- [ ] Agent roster configuration

### 📦 Phase 6: Packaging (Planned)
- [ ] Git worktree isolation
- [ ] Cross-platform builds
- [ ] Native dependency bundling

## 🤝 Contributing

Contributions welcome! This is an early-stage project.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

- **Architecture inspiration**: [munder-difflin](https://github.com/chaitanyagiri/munder-difflin)
- **Pixel art tileset**: LimeZu's Modern Interiors (CC license)
- **Terminal**: xterm.js
- **2D Engine**: Pixi.js

---

Built with ❤️ for developers who want to see their AI agents work together
