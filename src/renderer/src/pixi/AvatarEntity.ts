import * as PIXI from 'pixi.js'
import { TILE_SIZE, AVATAR_SIZE, AVATAR_SCALE } from '@shared/constants'

type AvatarState = 'idle' | 'alert' | 'thinking' | 'working' | 'blocked' | 'success' | 'ghost'

export class AvatarEntity {
  public container: PIXI.Container
  private sprite: PIXI.Graphics // Placeholder until we have sprite sheets
  private badge: PIXI.Graphics | null = null
  private nameLabel: PIXI.Text
  private stateLabelContainer: PIXI.Container
  private state: AvatarState = 'idle'
  private path: Array<{ x: number; y: number }> = []
  private pathIndex = 0
  private speed = 80 // pixels per second
  private animFrame = 0
  private animTimer = 0
  private readonly frameDuration = 0.125 // 8fps

  constructor(
    public id: string,
    public name: string,
    private color: number,
    public x: number,
    public y: number,
    onClick?: (agentId: string) => void
  ) {
    this.container = new PIXI.Container()
    this.container.x = x
    this.container.y = y

    // Create simple placeholder sprite (colored circle)
    this.sprite = new PIXI.Graphics()
    this.drawSprite()
    this.container.addChild(this.sprite)

    // Name label
    this.nameLabel = new PIXI.Text({
      text: name,
      style: {
        fontFamily: 'Pixelify Sans, sans-serif',
        fontSize: 10,
        fill: 0xfff8e7
      }
    })
    this.nameLabel.anchor.set(0.5, 0)
    this.nameLabel.y = AVATAR_SIZE * AVATAR_SCALE + 4
    this.container.addChild(this.nameLabel)

    // NEW: floating status bubble above the avatar's head, mirrors real setState() calls
    this.stateLabelContainer = new PIXI.Container()
    this.container.addChild(this.stateLabelContainer)
    this.drawStateLabel()

    this.container.interactive = true
    this.container.cursor = 'pointer'
    this.container.on('pointertap', () => onClick?.(this.id))
  }

  private drawSprite(): void {
    this.sprite.clear()

    // Body (simple circle for now - would be pixel art sprite sheet)
    const radius = (AVATAR_SIZE * AVATAR_SCALE) / 2
    this.sprite.circle(0, 0, radius)
    this.sprite.fill(this.color)
    this.sprite.stroke({ width: 2, color: 0x1a1320 })

    // Eyes (two dots)
    this.sprite.circle(-6, -2, 2)
    this.sprite.fill(0x1a1320)
    this.sprite.circle(6, -2, 2)
    this.sprite.fill(0x1a1320)

    // Simple walk animation indicator
    if (this.state === 'thinking' || this.state === 'working') {
      const bobOffset = Math.sin(this.animFrame * Math.PI) * 2
      this.sprite.y = bobOffset
    } else {
      this.sprite.y = 0
    }
  }

  /** Small rounded label above the avatar showing its current state, e.g. "Working" */
  private drawStateLabel(): void {
    this.stateLabelContainer.removeChildren()

    const label = this.state.charAt(0).toUpperCase() + this.state.slice(1)
    const text = new PIXI.Text({
      text: label,
      style: {
        fontFamily: 'Pixelify Sans, sans-serif',
        fontSize: 9,
        fill: 0x1a1320
      }
    })
    text.anchor.set(0.5)

    const paddingX = 6
    const paddingY = 3
    const w = text.width + paddingX * 2
    const h = text.height + paddingY * 2

    const bg = new PIXI.Graphics()
    bg.roundRect(-w / 2, -h / 2, w, h, 4)
    bg.fill(0xfff8e7)
    bg.stroke({ width: 1, color: 0x1a1320 })

    this.stateLabelContainer.addChild(bg)
    this.stateLabelContainer.addChild(text)
    this.stateLabelContainer.y = -(AVATAR_SIZE * AVATAR_SCALE) / 2 - 18
    this.stateLabelContainer.visible = this.state !== 'ghost'
  }

  setState(state: AvatarState): void {
    this.state = state
    this.updateBadge()
    this.drawStateLabel()
  }

  private updateBadge(): void {
    if (this.badge) {
      this.container.removeChild(this.badge)
      this.badge = null
    }

    if (this.state === 'blocked') {
      this.badge = new PIXI.Graphics()
      this.badge.circle(0, -34, 8)
      this.badge.fill(0xff6b6b)

      const text = new PIXI.Text({
        text: '!',
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xffffff,
          fontWeight: 'bold'
        }
      })
      text.anchor.set(0.5)
      text.y = -34
      this.badge.addChild(text)

      this.container.addChild(this.badge)
    } else if (this.state === 'thinking') {
      this.badge = new PIXI.Graphics()
      for (let i = 0; i < 3; i++) {
        this.badge.circle(-8 + i * 8, -34, 2)
        this.badge.fill(0x4ecdc4)
      }
      this.container.addChild(this.badge)
    } else if (this.state === 'success') {
      this.badge = new PIXI.Graphics()
      this.badge.star(0, -34, 4, 6, 0)
      this.badge.fill(0x6bcf7f)
      this.container.addChild(this.badge)
    }
  }

  setPath(path: Array<{ x: number; y: number }>): void {
    this.path = path
    this.pathIndex = 0
  }

  update(deltaTime: number): void {
    this.animTimer += deltaTime
    if (this.animTimer >= this.frameDuration) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 4
      this.drawSprite()
    }

    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex]
      const targetX = target.x * TILE_SIZE + TILE_SIZE / 2
      const targetY = target.y * TILE_SIZE + TILE_SIZE / 2

      const dx = targetX - this.container.x
      const dy = targetY - this.container.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 2) {
        this.pathIndex++
        if (this.pathIndex >= this.path.length) {
          this.path = []
          this.pathIndex = 0
          this.setState('idle')
        }
      } else {
        const moveDistance = this.speed * deltaTime
        const ratio = Math.min(moveDistance / distance, 1)
        this.container.x += dx * ratio
        this.container.y += dy * ratio

        this.x = this.container.x
        this.y = this.container.y
      }
    }
  }
}
