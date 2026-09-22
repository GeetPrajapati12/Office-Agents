import * as PIXI from 'pixi.js'
import { AvatarEntity } from './AvatarEntity'
import { StationManager } from './StationManager'
import { Pathfinder } from './Pathfinding'
import { TILE_SIZE, AGENT_STATES } from '@shared/constants'

export interface OfficeConfig {
  width: number
  height: number
  gridCols: number
  gridRows: number
}

export class OfficeEngine {
  private app: PIXI.Application
  private avatars = new Map<string, AvatarEntity>()
  private stationManager: StationManager
  private pathfinder: Pathfinder
  private floorLayer: PIXI.Container
  private entityLayer: PIXI.Container
  private overlayLayer: PIXI.Container

  constructor(private canvas: HTMLCanvasElement, private config: OfficeConfig) {
    // Initialize Pixi.js application with pixel-perfect settings
    this.app = new PIXI.Application()

    this.floorLayer = new PIXI.Container()
    this.entityLayer = new PIXI.Container()
    this.overlayLayer = new PIXI.Container()

    this.stationManager = new StationManager()
    this.pathfinder = new Pathfinder(config.gridCols, config.gridRows)
  }

  async init(): Promise<void> {
    await this.app.init({
      canvas: this.canvas,
      width: this.config.width,
      height: this.config.height,
      backgroundColor: 0x2c2738,
      antialias: false,
      resolution: window.devicePixelRatio,
      autoDensity: true
    })

    // Set pixel-perfect rendering
    PIXI.TextureSource.defaultOptions.scaleMode = 'nearest'

    // Add layers
    this.app.stage.addChild(this.floorLayer)
    this.app.stage.addChild(this.entityLayer)
    this.app.stage.addChild(this.overlayLayer)

    // Draw the floor grid
    this.drawFloorGrid()

    // Place stations
    this.placeStations()

    // Start game loop
    this.app.ticker.add(() => this.update())
  }

  private drawFloorGrid(): void {
    const graphics = new PIXI.Graphics()

    // Checkerboard floor pattern
    for (let row = 0; row < this.config.gridRows; row++) {
      for (let col = 0; col < this.config.gridCols; col++) {
        const x = col * TILE_SIZE
        const y = row * TILE_SIZE

        // Alternating wood floor tiles
        const isLight = (row + col) % 2 === 0
        const color = isLight ? 0x3d3446 : 0x32283d

        graphics.rect(x, y, TILE_SIZE, TILE_SIZE)
        graphics.fill(color)

        // Grid lines for debug
        graphics.rect(x, y, TILE_SIZE, TILE_SIZE)
        graphics.stroke({ width: 1, color: 0x241f2f, alpha: 0.3 })
      }
    }

    this.floorLayer.addChild(graphics)
  }

  private placeStations(): void {
    // Michael's office (top-left)
    this.stationManager.addStation('michael_office', 2, 2, 'michael_office')
    this.pathfinder.setObstacle(2, 2)

    // Desks in a row (center)
    const deskRow = Math.floor(this.config.gridRows / 2)
    for (let i = 0; i < 6; i++) {
      const col = 2 + i * 3
      this.stationManager.addStation(`desk_${i + 1}`, col, deskRow, 'desk')
      this.pathfinder.setObstacle(col, deskRow)
    }

    // File shelf (right side)
    this.stationManager.addStation('file_shelf', this.config.gridCols - 4, 3, 'file_shelf')
    this.pathfinder.setObstacle(this.config.gridCols - 4, 3)

    // Terminal rack (right side)
    this.stationManager.addStation('terminal_rack', this.config.gridCols - 4, 6, 'terminal_rack')
    this.pathfinder.setObstacle(this.config.gridCols - 4, 6)

    // Conference table (bottom center)
    const confCol = Math.floor(this.config.gridCols / 2)
    this.stationManager.addStation('conference_table', confCol, this.config.gridRows - 4, 'conference_table')
    this.pathfinder.setObstacle(confCol, this.config.gridRows - 4)

    // Draw station sprites
    this.drawStations()
  }

  private drawStations(): void {
    for (const station of this.stationManager.getAllStations()) {
      const graphics = new PIXI.Graphics()
      const x = station.gridX * TILE_SIZE
      const y = station.gridY * TILE_SIZE

      // Simple colored rectangles as placeholder for station sprites
      const colors: Record<string, number> = {
        desk: 0x6b5878,
        file_shelf: 0x8a7090,
        terminal_rack: 0x4ecdc4,
        conference_table: 0x6bcf7f,
        michael_office: 0xb197fc
      }

      graphics.rect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8)
      graphics.fill(colors[station.type] || 0x6b5878)
      graphics.stroke({ width: 2, color: 0x1a1320 })

      this.floorLayer.addChild(graphics)
    }
  }

  spawnAvatar(agentId: string, name: string, color: number, startX: number, startY: number): void {
    if (this.avatars.has(agentId)) {
      console.warn(`Avatar ${agentId} already exists`)
      return
    }

    const avatar = new AvatarEntity(agentId, name, color, startX, startY)
    this.avatars.set(agentId, avatar)
    this.entityLayer.addChild(avatar.container)
  }

  moveAvatarToStation(agentId: string, stationType: string): void {
    const avatar = this.avatars.get(agentId)
    if (!avatar) return

    const station = this.stationManager.getStationByType(stationType)
    if (!station) return

    const path = this.pathfinder.findPath(
      Math.floor(avatar.x / TILE_SIZE),
      Math.floor(avatar.y / TILE_SIZE),
      station.gridX,
      station.gridY
    )

    if (path.length > 0) {
      avatar.setPath(path)
      avatar.setState('thinking')
    }
  }

  updateAvatarState(agentId: string, state: string): void {
    const avatar = this.avatars.get(agentId)
    if (!avatar) return
    avatar.setState(state as any)
  }

  removeAvatar(agentId: string): void {
    const avatar = this.avatars.get(agentId)
    if (avatar) {
      this.entityLayer.removeChild(avatar.container)
      this.avatars.delete(agentId)
    }
  }

  private update(): void {
    // Update all avatars (movement, animation)
    for (const avatar of this.avatars.values()) {
      avatar.update(this.app.ticker.deltaMS / 1000)
    }

    // Sort entities by Y coordinate (pseudo-depth)
    this.entityLayer.children.sort((a, b) => a.y - b.y)
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height)
  }

  destroy(): void {
    this.app.destroy(true, { children: true })
  }

  getApp(): PIXI.Application {
    return this.app
  }
}
