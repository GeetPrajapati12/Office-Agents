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
  private decorLayer: PIXI.Container
  private entityLayer: PIXI.Container
  private overlayLayer: PIXI.Container

  constructor(
    private canvas: HTMLCanvasElement,
    private config: OfficeConfig,
    private onAvatarClick?: (agentId: string) => void
  ) {
    this.app = new PIXI.Application()

    this.floorLayer = new PIXI.Container()
    this.decorLayer = new PIXI.Container()
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

    PIXI.TextureSource.defaultOptions.scaleMode = 'nearest'

    this.app.stage.addChild(this.floorLayer)
    this.app.stage.addChild(this.decorLayer)
    this.app.stage.addChild(this.entityLayer)
    this.app.stage.addChild(this.overlayLayer)

    this.drawFloorGrid()
    this.placeStations()
    this.drawDecor()

    this.app.ticker.add(() => this.update())
  }

  private drawFloorGrid(): void {
    const graphics = new PIXI.Graphics()

    for (let row = 0; row < this.config.gridRows; row++) {
      for (let col = 0; col < this.config.gridCols; col++) {
        const x = col * TILE_SIZE
        const y = row * TILE_SIZE

        const isLight = (row + col) % 2 === 0
        const color = isLight ? 0x3d3446 : 0x32283d

        graphics.rect(x, y, TILE_SIZE, TILE_SIZE)
        graphics.fill(color)

        graphics.rect(x, y, TILE_SIZE, TILE_SIZE)
        graphics.stroke({ width: 1, color: 0x241f2f, alpha: 0.3 })
      }
    }

    this.floorLayer.addChild(graphics)
  }

  /** NEW: purely decorative furniture accents — potted plants + a proper meeting table with chairs */
  private drawDecor(): void {
    const graphics = new PIXI.Graphics()

    // Potted plants near the corners (matches the reference floor's plant placements)
    const plantSpots = [
      { x: 1, y: this.config.gridRows - 2 },
      { x: this.config.gridCols - 2, y: this.config.gridRows - 2 },
      { x: Math.floor(this.config.gridCols / 3), y: 1 },
      { x: Math.floor((this.config.gridCols * 2) / 3), y: 1 }
    ]

    for (const spot of plantSpots) {
      const cx = spot.x * TILE_SIZE + TILE_SIZE / 2
      const cy = spot.y * TILE_SIZE + TILE_SIZE / 2

      // Pot
      graphics.rect(cx - 6, cy - 2, 12, 10)
      graphics.fill(0x8a5a44)
      graphics.stroke({ width: 1, color: 0x1a1320 })

      // Leaves
      graphics.circle(cx, cy - 10, 8)
      graphics.fill(0x6bcf7f)
      graphics.circle(cx - 6, cy - 6, 5)
      graphics.fill(0x5cb86e)
      graphics.circle(cx + 6, cy - 6, 5)
      graphics.fill(0x5cb86e)
    }

    // Meeting table (visually spans ~3x1 tiles; obstacle grid still only marks the station's own tile,
    // this is a cosmetic footprint only — see CHANGES.md)
    const conference = this.stationManager.getStationByType('conference_table')
    if (conference) {
      const cx = conference.gridX * TILE_SIZE + TILE_SIZE / 2
      const cy = conference.gridY * TILE_SIZE + TILE_SIZE / 2
      const tableW = TILE_SIZE * 2.6
      const tableH = TILE_SIZE * 0.9

      graphics.roundRect(cx - tableW / 2, cy - tableH / 2, tableW, tableH, 6)
      graphics.fill(0x6b4a3a)
      graphics.stroke({ width: 2, color: 0x1a1320 })

      // Chairs around the table
      const chairOffsets = [-tableW / 2 + 10, -tableW / 6, tableW / 6, tableW / 2 - 10]
      for (const offset of chairOffsets) {
        graphics.rect(cx + offset - 4, cy - tableH / 2 - 10, 8, 8)
        graphics.fill(0xb197fc)
        graphics.rect(cx + offset - 4, cy + tableH / 2 + 2, 8, 8)
        graphics.fill(0xb197fc)
      }
    }

    this.decorLayer.addChild(graphics)
  }

  private placeStations(): void {
    this.stationManager.addStation('michael_office', 2, 2, 'michael_office')
    this.pathfinder.setObstacle(2, 2)

    const deskRow = Math.floor(this.config.gridRows / 2)
    for (let i = 0; i < 6; i++) {
      const col = 2 + i * 3
      this.stationManager.addStation(`desk_${i + 1}`, col, deskRow, 'desk')
      this.pathfinder.setObstacle(col, deskRow)
    }

    this.stationManager.addStation('file_shelf', this.config.gridCols - 4, 3, 'file_shelf')
    this.pathfinder.setObstacle(this.config.gridCols - 4, 3)

    this.stationManager.addStation('terminal_rack', this.config.gridCols - 4, 6, 'terminal_rack')
    this.pathfinder.setObstacle(this.config.gridCols - 4, 6)

    const confCol = Math.floor(this.config.gridCols / 2)
    this.stationManager.addStation('conference_table', confCol, this.config.gridRows - 4, 'conference_table')
    this.pathfinder.setObstacle(confCol, this.config.gridRows - 4)

    this.drawStations()
  }

  private drawStations(): void {
    for (const station of this.stationManager.getAllStations()) {
      // Meeting table gets its own richer rendering in drawDecor(); skip the generic block here
      if (station.type === 'conference_table') continue

      const graphics = new PIXI.Graphics()
      const x = station.gridX * TILE_SIZE
      const y = station.gridY * TILE_SIZE

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

    const avatar = new AvatarEntity(agentId, name, color, startX, startY, this.onAvatarClick)
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
    for (const avatar of this.avatars.values()) {
      avatar.update(this.app.ticker.deltaMS / 1000)
    }

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
