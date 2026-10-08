// Kiểu dữ liệu của các trang vận hành cũ (chuyến, sự cố, báo cáo chuyến đi).
export interface Leg { no: number; from: string; to: string; vehicleId: string; driverId: string; escortId: string }
export interface OpsTrip {
  id: string
  orderId: string
  feasible?: boolean // kết quả khảo sát (chưa có = chờ khảo sát)
  assessNote: string
  assessedAt?: number
  legs: Leg[]
  activity: { time: number; text: string }[] // nhật ký hiện trường (ảnh chặng) ở trang Giám sát
}

export type IncidentStatus = 'open' | 'proposed' | 'approved' | 'rejected' // open: chờ điều phối đề xuất · proposed: chờ Manager
export interface Incident {
  id: string
  tripId: string
  orderId: string
  leg: string
  time: number
  severity: 'emergency' | 'medium' | 'low'
  type: string
  desc: string
  status: IncidentStatus
  proposal: string
  report?: string // báo cáo chi tiết của điều phối viên
  cost?: number // chi phí phát sinh dự kiến (VND)
  bearer?: 'company' | 'customer'
  claim?: string // khả năng claim bảo hiểm
  attachments?: string[]
  directive?: string // chỉ đạo của Manager khi duyệt
  rejectReason?: string
}

export interface ReportLeg { title: string; kind: 'ground' | 'gate'; meta: string; route: string; planned: [string, string]; actual: [string, string] }
export interface TripReport {
  id: string // mã đơn
  tripId: string
  customer: string
  route: string
  type: string
  horses: string
  escort: string
  completedAt: number
  plannedAt: number
  otd: 'on_time' | 'early' | 'late'
  otdMinutes: number
  incidentCost: number
  incidentNote: string
  totalTime: string
  legs: ReportLeg[]
  health: [time: string, event: string, ok: boolean][]
  events: [time: string, event: string, ok: boolean][]
  rating: number
  feedback: string
}
