// Lịch giữ xe / Driver / Escort do BE tính (PRD mục 10.2): đơn nào đang giữ, và lý do khóa nếu không chọn được.
export interface Booked { order: string; departAt: number; route: string; trip: string }
export interface ResourceSlot {
  booked: Booked[] // các đơn khác đang giữ
  clash?: Booked // đơn gây trùng lịch (chỉ xe)
  locked?: string // lý do BE khóa: trùng lịch, thiếu giấy, đã giao việc cho đơn khác
}
export type ResourceSlots = Record<string, ResourceSlot>
export interface ResourceSchedules { vehicles: ResourceSlots; drivers: ResourceSlots; escorts: ResourceSlots }

// Xe đang chở những ngựa nào của đơn nào (trang Đội xe của Điều phối viên)
export interface VehicleLoad { order: string; trip: string; driver: string; departAt: number; horses: string[] }
