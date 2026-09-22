interface PathNode {
  x: number
  y: number
  g: number // Cost from start
  h: number // Heuristic to goal
  f: number // Total cost
  parent: PathNode | null
}

export class Pathfinder {
  private obstacles: Set<string>

  constructor(private gridWidth: number, private gridHeight: number) {
    this.obstacles = new Set()
  }

  setObstacle(x: number, y: number): void {
    this.obstacles.add(`${x},${y}`)
  }

  removeObstacle(x: number, y: number): void {
    this.obstacles.delete(`${x},${y}`)
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return false
    }
    return !this.obstacles.has(`${x},${y}`)
  }

  findPath(startX: number, startY: number, goalX: number, goalY: number): Array<{ x: number; y: number }> {
    const openSet: PathNode[] = []
    const closedSet = new Set<string>()

    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, goalX, goalY),
      f: 0,
      parent: null
    }
    startNode.f = startNode.g + startNode.h
    openSet.push(startNode)

    while (openSet.length > 0) {
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()!

      // Goal reached
      if (current.x === goalX && current.y === goalY) {
        return this.reconstructPath(current)
      }

      closedSet.add(`${current.x},${current.y}`)

      // Check neighbors (4-directional)
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ]

      for (const neighbor of neighbors) {
        if (!this.isWalkable(neighbor.x, neighbor.y)) continue
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue

        const g = current.g + 1
        const h = this.heuristic(neighbor.x, neighbor.y, goalX, goalY)
        const f = g + h

        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)
        if (!existingNode) {
          openSet.push({
            x: neighbor.x,
            y: neighbor.y,
            g,
            h,
            f,
            parent: current
          })
        } else if (g < existingNode.g) {
          existingNode.g = g
          existingNode.f = g + h
          existingNode.parent = current
        }
      }
    }

    // No path found
    return []
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
  }

  private reconstructPath(node: PathNode): Array<{ x: number; y: number }> {
    const path: Array<{ x: number; y: number }> = []
    let current: PathNode | null = node

    while (current) {
      path.unshift({ x: current.x, y: current.y })
      current = current.parent
    }

    return path
  }
}
