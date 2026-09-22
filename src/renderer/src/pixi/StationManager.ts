export interface Station {
  id: string
  type: string
  gridX: number
  gridY: number
}

export class StationManager {
  private stations = new Map<string, Station>()

  addStation(id: string, gridX: number, gridY: number, type: string): void {
    this.stations.set(id, { id, type, gridX, gridY })
  }

  getStation(id: string): Station | undefined {
    return this.stations.get(id)
  }

  getStationByType(type: string): Station | undefined {
    for (const station of this.stations.values()) {
      if (station.type === type) {
        return station
      }
    }
    return undefined
  }

  getAllStations(): Station[] {
    return Array.from(this.stations.values())
  }

  removeStation(id: string): void {
    this.stations.delete(id)
  }
}
