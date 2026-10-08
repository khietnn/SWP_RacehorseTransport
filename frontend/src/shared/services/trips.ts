// Service chuyến xe của Điều phối, Tài xế, Hộ tống (các trang vận hành cũ). Chỉ gọi API của BE.
import type { HealthLog, Order } from '../types/order'
import type { Leg, OpsTrip } from '../types/ops'
import { http } from '../lib/http'

export type TripStatus = 'pending_assessment' | 'awaiting_routing' | 'assigned' | 'in_transit' | 'done' | 'rejected_assessment'

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  pending_assessment: 'Chờ khảo sát',
  awaiting_routing: 'Đã khảo sát, chờ lập LT',
  assigned: 'Đã chốt lộ trình, chờ khởi hành',
  in_transit: 'Đang vận chuyển',
  done: 'Hoàn thành',
  rejected_assessment: 'Không khả thi, trả quản lý',
}

export interface TripView extends OpsTrip { status: TripStatus; order: Order }

// Đủ khi mọi chặng đã có xe, tài xế, hộ tống
export const assignmentComplete = (t: OpsTrip) => t.legs.length > 0 && t.legs.every(l => l.vehicleId && l.driverId && l.escortId)

export const tripsApi = {
  list: (): Promise<TripView[]> => http.get<TripView[]>('/trips'),
  get: (id: string) => http.getOptional<TripView>(`/trips/${id}`),
  assess: (id: string, feasible: boolean, note: string, by: string): Promise<void> => http.post<void>(`/trips/${id}/assess`, { feasible, note, by }),
  setVehicle: (id: string, legNo: number, vehicleId: string): Promise<void> => http.post<void>(`/trips/${id}/set-vehicle`, { legNo, vehicleId }),
  setEscort: (id: string, legNo: number, escortId: string): Promise<void> => http.post<void>(`/trips/${id}/set-escort`, { legNo, escortId }),
  splitLeg: (id: string, legNo: number, stop: string): Promise<void> => http.post<void>(`/trips/${id}/split-leg`, { legNo, stop }),
  mergeLeg: (id: string, legNo: number): Promise<void> => http.post<void>(`/trips/${id}/merge-leg`, { legNo }),
  confirmRoute: (id: string): Promise<void> => http.post<void>(`/trips/${id}/confirm-route`),
  depart: (id: string): Promise<void> => http.post<void>(`/trips/${id}/depart`),
  logActivity: (id: string, text: string): Promise<void> => http.post<void>(`/trips/${id}/log-activity`, { text }),
  checkIn: (orderId: string): Promise<void> => http.post<void>(`/trips/${orderId}/check-in`),
  deleteHealthLogs: (by: string): Promise<void> => http.post<void>(`/trips/delete-health-logs`, { by }),
  addHealthLog: (orderId: string, log: HealthLog, severe: boolean): Promise<void> => http.post<void>(`/trips/${orderId}/add-health-log`, { log, severe }),
}
export type { Leg, OpsTrip }
