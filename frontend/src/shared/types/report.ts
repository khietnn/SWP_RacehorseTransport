// Số liệu báo cáo do BE tính (PRD mục 15); FE chỉ hiển thị.
import type { Booking } from './booking'

export interface OrderFinance {
  id: string; customer: string; at: number // at = ngày đặt cọc
  revenue: number; cost: number; profit: number; collected: number
  status: Booking['status']
}
export interface ReportSummary {
  revenue: number; cost: number; profit: number; margin: number; collected: number; orders: number
  trips: number; delivered: number; completionRate: number; onTimeRate: number; incidentRate: number; avgHours: number; avgRating: number
}
export interface DayPoint { label: string; at: number; revenue: number; cost: number; trips: number }
export interface RevenueReport { current: ReportSummary; previous: ReportSummary; series: DayPoint[]; orders: OrderFinance[] }

// Mức thay đổi so với kỳ trước, tính bằng %; kỳ trước bằng 0 thì không so được (chỉ để hiển thị)
export const changePct = (now: number, before: number) => (before ? ((now - before) / before) * 100 : undefined)
