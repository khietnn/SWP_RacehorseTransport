import type { CrewMember, Vehicle } from '../types/fleet'
import type { VehicleLoad } from '../types/scheduling'
import { http } from '../lib/http'

export const vehiclesApi = {
  list: (): Promise<Vehicle[]> => http.get<Vehicle[]>('/vehicles'),
  create: (data: Omit<Vehicle, 'id'>): Promise<Vehicle> => http.post<Vehicle>('/vehicles', data),
  update: (id: string, patch: Partial<Vehicle>): Promise<Vehicle> => http.patch<Vehicle>(`/vehicles/${id}`, patch),
  remove: (id: string): Promise<void> => http.del<void>(`/vehicles/${id}`),
  // Các đơn đang giữ từng xe (theo mã xe)
  loads: (): Promise<Record<string, VehicleLoad[]>> => http.get<Record<string, VehicleLoad[]>>('/vehicles/loads'),
}

export const crewApi = {
  list: (): Promise<CrewMember[]> => http.get<CrewMember[]>('/crew'),
  create: (data: Pick<CrewMember, 'name' | 'phone' | 'role'>): Promise<CrewMember> => http.post<CrewMember>('/crew', data),
}

export type { CrewMember, Vehicle }
