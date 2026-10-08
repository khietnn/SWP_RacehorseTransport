// Thông báo đẩy xuống từng vai trò. BE tạo thông báo khi có sự việc (PRD mục 1.5); FE chỉ đọc và đánh dấu đã đọc.
import type { Role } from '../types/role'
import { http } from '../lib/http'

export interface Notice {
  id: string
  role: Role
  name?: string // bỏ trống = mọi người thuộc vai trò (Manager)
  title: string
  text: string
  link?: string // đường dẫn trong app của người nhận
  bookingId?: string
  at: number
  read: boolean
}

export const noticesApi = {
  list: (role: Role, name?: string): Promise<Notice[]> => http.get<Notice[]>('/notices', { role, name }),
  markRead: (id: string): Promise<void> => http.post<void>(`/notices/${id}/mark-read`),
  markAllRead: (role: Role, name?: string): Promise<void> => http.post<void>('/notices/mark-all-read', {}, { role, name }),
}
