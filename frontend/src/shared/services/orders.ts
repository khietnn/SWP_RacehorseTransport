// Đơn kiểu cũ (các trang vận hành chưa chuyển sang bookings). Chỉ gọi API của BE.
import type { Order } from '../types/order'
import { http } from '../lib/http'

// Các trường nội bộ BE không trả cho khách
const INTERNAL_KEYS = ['stage', 'inspector', 'coordinator', 'intakeAt', 'hold', 'warning', 'waitingCustomer', 'pending', 'rejectType', 'report', 'rechecked', 'review', 'task', 'papersReport', 'verification', 'recheckRequest', 'infeasible'] as const
export type CustomerOrderView = Omit<Order, (typeof INTERNAL_KEYS)[number]>

export const customerOrdersApi = {
  list: (customer: string): Promise<CustomerOrderView[]> => http.get<CustomerOrderView[]>('/customer/orders', { customer }),
  get: (customer: string, id: string) => http.getOptional<CustomerOrderView>(`/customer/orders/${id}`, { customer }),
  update: (customer: string, id: string, patch: Partial<CustomerOrderView>): Promise<CustomerOrderView> => http.patch<CustomerOrderView>(`/customer/orders/${id}`, patch, { customer }),
}

export const ordersApi = {
  list: (): Promise<Order[]> => http.get<Order[]>('/orders'),
  get: (id: string) => http.getOptional<Order>(`/orders/${id}`),
  update: (id: string, patch: Partial<Order>): Promise<Order> => http.patch<Order>(`/orders/${id}`, patch),
}
