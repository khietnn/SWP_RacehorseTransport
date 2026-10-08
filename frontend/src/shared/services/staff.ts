import type { StaffMember } from '../types/staff'
import { http } from '../lib/http'

export const staffApi = {
  list: (): Promise<StaffMember[]> => http.get<StaffMember[]>('/staff'),
  update: (id: string, patch: Partial<StaffMember>): Promise<StaffMember> => http.patch<StaffMember>(`/staff/${id}`, patch),
  create: (data: Pick<StaffMember, 'name' | 'phone' | 'role'>): Promise<StaffMember> => http.post<StaffMember>('/staff', data),
}
