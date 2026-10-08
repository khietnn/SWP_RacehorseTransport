// Service Hồ sơ ngựa của khách. Gọi /api/horses.
import type { HorseProfile } from '../types/booking'
import { http } from '../lib/http'

export type NewHorse = Omit<HorseProfile, 'id' | 'owner' | 'completedTrips' | 'createdAt'>

export const horsesApi = {
  list: (owner: string): Promise<HorseProfile[]> => http.get<HorseProfile[]>('/horses', { owner }),
  get: (owner: string, id: string) => http.getOptional<HorseProfile>(`/horses/${id}`, { owner }),
  // Nhân viên (Specialist) xem hồ sơ ngựa của khách bất kỳ theo mã ngựa trong đơn
  byId: (id: string) => http.getOptional<HorseProfile>(`/horses/${id}`),
  create: (owner: string, data: NewHorse): Promise<HorseProfile> => http.post<HorseProfile>('/horses', data, { owner }),
  // Microchip là khóa định danh: BE từ chối sửa sau khi lưu lần đầu
  update: (owner: string, id: string, patch: Partial<NewHorse>): Promise<HorseProfile> => http.patch<HorseProfile>(`/horses/${id}`, patch, { owner }),
}
