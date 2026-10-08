// Service đơn đặt chuyến (Flow 1–4). Chỉ gọi API của BE; mọi nghiệp vụ và chuyển trạng thái nằm ở BE.
// Quy ước URL xem docs/API-CONTRACT.md.
import type { ClearanceDocType, ExpenseCategory, IncidentAction, IncidentKind, Payer, WelfareCondition } from '../config/booking-rules'
import type { Adjustment, Booking, Incident, IncidentPlan, Quote, QuoteLine, Rating, RoutePlan, StaffRef, VehicleTrip } from '../types/booking'
import type { ResourceSchedules } from '../types/scheduling'
import { http } from '../lib/http'

// Khách chỉ thấy diễn biến sự cố (nhóm, bước xử lý, ETA mới); chi phí chỉ hiện trong bảng quyết toán
export type CustomerTrip = Omit<VehicleTrip, 'driverPack' | 'acks'>
export type CustomerIncident = Pick<Incident, 'id' | 'kind' | 'status' | 'reportedAt' | 'resolvedAt'> & { newEta?: number }
export type CustomerBookingView = Omit<Booking, 'intake' | 'history' | 'plan' | 'trips' | 'incidents'> & { trips?: CustomerTrip[]; incidents?: CustomerIncident[] }

// Thông tin từng xe của đơn cho khách: biển số, tài xế, hộ tống, ngựa trên xe.
export interface TripTeam {
  tripId: string
  horseNames: string[]
  vehicle: { plate: string; kind: string; stalls: number }
  driver: { name: string; phone: string }
  escort: { name: string; phone: string }
}

// Tra cứu công khai: mã đơn + 4 số cuối SĐT người gửi.
export interface PublicTracking {
  route: string
  depart: number
  step: number
  done?: boolean
  status: string
  tone?: 'warn' | 'done' | 'bad'
  now?: { place: string; at: number; eta: number }
  note?: string
}

export interface NewBookingInput {
  type: Booking['type']
  origin: Booking['origin']
  dest: Booking['dest']
  departAt: number
  consignor: Booking['consignor']
  consignee: Booking['consignee']
  horses: Booking['horses']
}

// Công khai: không cần đăng nhập. null = không tìm thấy hoặc SĐT không khớp.
export const publicBookingsApi = {
  track: (code: string, phoneLast4: string): Promise<PublicTracking | null> => http.get<PublicTracking | null>(`/public/bookings/track`, { code, phoneLast4 }),
}

// Dành cho app khách
export const customerBookingsApi = {
  list: (customer: string): Promise<CustomerBookingView[]> => http.get<CustomerBookingView[]>(`/customer/bookings`, { customer }),
  get: (customer: string, id: string) => http.getOptional<CustomerBookingView>(`/customer/bookings/${id}`, { customer }),
  create: (customer: string, input: NewBookingInput): Promise<CustomerBookingView> => http.post<CustomerBookingView>(`/customer/bookings`, input, { customer }),
  team: (customer: string, id: string): Promise<TripTeam[]> => http.get<TripTeam[]>(`/customer/bookings/${id}/team`, { customer }),
  rejectQuote: (customer: string, id: string, reason: string): Promise<CustomerBookingView> => http.post<CustomerBookingView>(`/customer/bookings/${id}/reject-quote`, { reason }, { customer }),
  cancel: (customer: string, id: string, reason: string): Promise<CustomerBookingView> => http.post<CustomerBookingView>(`/customer/bookings/${id}/cancel`, { reason }, { customer }),
  resubmit: (customer: string, id: string): Promise<CustomerBookingView> => http.post<CustomerBookingView>(`/customer/bookings/${id}/resubmit`, {}, { customer }),
  payDeposit: (customer: string, id: string): Promise<CustomerBookingView> => http.post<CustomerBookingView>(`/customer/bookings/${id}/pay-deposit`, {}, { customer }),
  payBalance: (customer: string, id: string): Promise<CustomerBookingView> => http.post<CustomerBookingView>(`/customer/bookings/${id}/pay-balance`, {}, { customer }),
  settle: (customer: string, id: string, rating: Omit<Rating, 'at'>): Promise<CustomerBookingView> => http.post<CustomerBookingView>(`/customer/bookings/${id}/settle`, { rating }, { customer }),
}

// Dành cho nhân viên nội bộ
export const bookingsApi = {
  list: (): Promise<Booking[]> => http.get<Booking[]>(`/bookings`),
  get: (id: string) => http.getOptional<Booking>(`/bookings/${id}`),
  activate: (id: string, by: string, specialist: StaffRef, coordinator: StaffRef): Promise<Booking> => http.post<Booking>(`/bookings/${id}/activate`, { by, specialist, coordinator }),
  managerCancel: (id: string, by: string, reason: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/manager-cancel`, { by, reason }),
  rejectOrder: (id: string, by: string, role: 'manager' | 'coordinator', reason: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/reject-order`, { by, role, reason }),
  approveMedical: (id: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/approve-medical`, { by }),
  requestResubmission: (id: string, by: string, reason: string, items: { horseId: string; doc: 'passport' | 'vaccine' | 'lab' }[]): Promise<Booking> => http.post<Booking>(`/bookings/${id}/request-resubmission`, { by, reason, items }),
  confirmPlan: (id: string, by: string, input: { trips: Pick<VehicleTrip, 'vehicleId' | 'horseIds'>[]; route: Pick<RoutePlan, 'legs' | 'rests' | 'borderEta'>; gate?: string; note: string }): Promise<Booking> => http.post<Booking>(`/bookings/${id}/confirm-plan`, { by, input }),
  sendBack: (id: string, by: string, to: 'specialist' | 'coordinator', reason: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/send-back`, { by, to, reason }),
  assignCrew: (id: string, by: string, picks: { tripId: string; driverId: string; escortId: string }[]): Promise<Booking> => http.post<Booking>(`/bookings/${id}/assign-crew`, { by, picks }),
  quoteDraft: (id: string): Promise<{ lines: QuoteLine[]; km: number; days: number }> => http.get<{ lines: QuoteLine[]; km: number; days: number }>(`/bookings/${id}/quote-draft`),
  // Xem trước báo giá sau khi Manager thêm phụ phí / chiết khấu (BE tính tổng, cọc 30%, số dư 70%)
  quotePreview: (id: string, adjustments: Adjustment[]): Promise<Quote> => http.post<Quote>(`/bookings/${id}/quote-preview`, { adjustments }),
  // Lịch giữ xe, Driver, Escort của các đơn khác và lý do khóa (trùng lịch, thiếu giấy, đã giao việc)
  resources: (id: string): Promise<ResourceSchedules> => http.get<ResourceSchedules>(`/bookings/${id}/resources`),
  sendQuote: (id: string, by: string, adjustments: Adjustment[]): Promise<Booking> => http.post<Booking>(`/bookings/${id}/send-quote`, { by, adjustments }),
  acceptWaybill: (id: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/accept-waybill`, { by }),
  updateClearanceItem: (id: string, by: string, type: ClearanceDocType, patch: { note?: string; photos?: string[] }): Promise<Booking> => http.post<Booking>(`/bookings/${id}/update-clearance-item`, { by, type, patch }),
  addClearanceItem: (id: string, by: string, type: ClearanceDocType): Promise<Booking> => http.post<Booking>(`/bookings/${id}/add-clearance-item`, { by, type }),
  markHorseCleared: (id: string, by: string, horseId: string, cleared: boolean): Promise<Booking> => http.post<Booking>(`/bookings/${id}/mark-horse-cleared`, { by, horseId, cleared }),
  completeClearance: (id: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/complete-clearance`, { by }),
  setDriverPack: (id: string, tripId: string, by: string, items: string[]): Promise<Booking> => http.post<Booking>(`/bookings/${id}/set-driver-pack`, { tripId, by, items }),
  acknowledgeTrip: (id: string, tripId: string, who: 'driver' | 'escort', by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/acknowledge-trip`, { tripId, who, by }),
  departToPickup: (id: string, tripId: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/depart-to-pickup`, { tripId, by }),
  arriveAtPickup: (id: string, tripId: string, by: string, photo: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/arrive-at-pickup`, { tripId, by, photo }),
  scanChip: (id: string, tripId: string, by: string, chip: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/scan-chip`, { tripId, by, chip }),
  collectOriginals: (id: string, tripId: string, by: string, items: string[]): Promise<Booking> => http.post<Booking>(`/bookings/${id}/collect-originals`, { tripId, by, items }),
  uploadHandover: (id: string, tripId: string, by: string, photo: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/upload-handover`, { tripId, by, photo }),
  startJourney: (id: string, tripId: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/start-journey`, { tripId, by }),
  arriveCheckpoint: (id: string, tripId: string, by: string, photo: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/arrive-checkpoint`, { tripId, by, photo }),
  submitWelfare: (id: string, tripId: string, by: string, data: { condition: WelfareCondition; waterLiters: number; hay: boolean; photo: string; note: string }): Promise<Booking> => http.post<Booking>(`/bookings/${id}/submit-welfare`, { tripId, by, data }),
  continueJourney: (id: string, tripId: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/continue-journey`, { tripId, by }),
  customsCleared: (id: string, tripId: string, by: string, stampPhotos: string[]): Promise<Booking> => http.post<Booking>(`/bookings/${id}/customs-cleared`, { tripId, by, stampPhotos }),
  completeDelivery: (id: string, tripId: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/complete-delivery`, { tripId, by }),
  reportIncident: (id: string, tripId: string, by: string, kind: IncidentKind, photo: string, note: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/report-incident`, { tripId, by, kind, photo, note }),
  planIncident: (id: string, incidentId: string, by: string, input: { action: IncidentAction; note: string; newEta: number } & Pick<IncidentPlan, 'station' | 'restMinutes' | 'rescue' | 'rescueLine' | 'toStation' | 'detour'>): Promise<Booking> => http.post<Booking>(`/bookings/${id}/plan-incident`, { incidentId, by, input }),
  rejectIncident: (id: string, incidentId: string, by: string, reason: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/reject-incident`, { incidentId, by, reason }),
  approveIncident: (id: string, incidentId: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/approve-incident`, { incidentId, by }),
  addIncidentExpense: (id: string, incidentId: string, by: string, input: { category: ExpenseCategory; label: string; photo: string; amount: number }): Promise<Booking> => http.post<Booking>(`/bookings/${id}/add-incident-expense`, { incidentId, by, input }),
  confirmFit: (id: string, incidentId: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/confirm-fit`, { incidentId, by }),
  resumeJourney: (id: string, incidentId: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/resume-journey`, { incidentId, by }),
  submitExpenses: (id: string, by: string): Promise<Booking> => http.post<Booking>(`/bookings/${id}/submit-expenses`, { by }),
  issueSettlement: (id: string, by: string, payers: Record<string, Payer> = {}): Promise<Booking> => http.post<Booking>(`/bookings/${id}/issue-settlement`, { by, payers }),
}
