import type { RevenueReport } from '../types/report'
import type { TripReport } from '../types/ops'
import { http } from '../lib/http'

export const reportsApi = {
  list: (): Promise<TripReport[]> => http.get<TripReport[]>('/reports/trips'),
  // Doanh thu, chi phí, hiệu suất trong [from, to) và kỳ liền trước cùng độ dài; đơn đã đặt cọc, mới nhất trước
  revenue: (from: number, to: number): Promise<RevenueReport> => http.get<RevenueReport>('/reports/revenue', { from, to }),
}
export type { TripReport }
