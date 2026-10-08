import type { FeedPackageId, VehicleClass, WaterPlanId } from '../config/booking-rules'

// Biểu giá do BE trả (PRD mục 11); FE chỉ hiển thị bảng giá, không tự tính báo giá.
export interface PriceCatalog {
  truck: { km: number; byClass: Record<VehicleClass, number> }[] // cước mỗi xe tại các mốc km mẫu
  crewPerDay: number // 01 Driver + 01 Escort, mỗi xe mỗi ngày
  fuelBotPer100Km: number
  singleStall: number // khoang đơn mở rộng, mỗi ngựa
  feed: Record<FeedPackageId, number> // phí mỗi ngựa
  water: Record<WaterPlanId, number>
  clearance: { domestic: number; international: number }
  insurance: Record<string, number> // phí bảo hiểm theo giống
}
