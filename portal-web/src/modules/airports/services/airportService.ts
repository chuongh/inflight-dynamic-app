import type { Airport } from '../types'

export interface AirportService {
  listAirports(): Promise<Airport[]>
  getAirport(code: string): Promise<Airport | null>
  saveAirports(airports: Airport[]): Promise<void>
}
