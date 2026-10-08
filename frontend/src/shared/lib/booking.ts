// Hàm thuần của luồng đặt đơn → duyệt báo giá → đặt cọc (Flow 1). Khớp docs/PRD.md mục 2, 10, 11.
import {
  BORDER_WINDOW, DOCS_CUTOFF_HOUR, HORSE_DOC, HORSE_DOC_TYPES, DELAY_ALERT_MINUTES, TARGET_LEG_HOURS, VEHICLE_CLASS, type BookingStatus, type IncidentAction, type IncidentKind, type HorseDocType, type VehicleClass } from '../config/booking-rules'
import { DAY, MIN_LEAD_DAYS } from '../config/business-rules'
import { COUNTRY_LOCATIONS, GATES, PLACES, TRANSIT_STATIONS, type GeoPoint, type Gate } from '../config/network'
import { AVG_SPEED_KMH, BORDER_HOURS, DRIVE_HOURS_PER_DAY } from '../config/public-pricing'
import type { Booking, Checkpoint, Clearance, HorseProfile, PlaceRef, RestStop, RouteLeg, RoutePlan, TripRun, VehicleTrip, WelfareLog } from '../types/booking'
import { atHour, dayKey, startOfDay } from './dates'
import { haversineKm, roadKm } from './pricing'

// ===== Ngày khởi hành =====
// Ngày sớm nhất được chọn: hôm nay + 30 ngày (00:00)
export function earliestDeparture(now = Date.now()) {
  const d = startOfDay(now)
  d.setDate(d.getDate() + MIN_LEAD_DAYS)
  return d.getTime()
}
export const toIsoDay = (t: number) => dayKey(new Date(t))
export const fromIsoDay = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime() }
export const isDepartureAllowed = (departAt: number, now = Date.now()) => departAt >= earliestDeparture(now)
// 18:00 ngày D-1: mốc cảnh báo giấy tờ chưa xong
export const docsDueAt = (departAt: number) => atHour(new Date(departAt - DAY), DOCS_CUTOFF_HOUR)


// ===== Hồ sơ ngựa =====
// Đủ 3 giấy và còn hiệu lực tại mốc `at` (mặc định: hôm nay; khi đặt đơn: ngày khởi hành)
export function horseReadiness(h: HorseProfile, at = startOfDay(Date.now()).getTime()) {
  const missing: HorseDocType[] = HORSE_DOC_TYPES.filter(t => !h.docs[t])
  const expired: HorseDocType[] = HORSE_DOC_TYPES.filter(t => {
    const d = h.docs[t]
    return !!d && HORSE_DOC[t].hasExpiry && (d.expiresAt === undefined || d.expiresAt < at)
  })
  return { ok: !missing.length && !expired.length, missing, expired }
}

export const ageOf = (h: Pick<HorseProfile, 'birthYear'>, now = Date.now()) => new Date(now).getFullYear() - h.birthYear

// ===== Hạng xe =====
export const vehicleClassOf = (capacity: number): VehicleClass => (capacity <= VEHICLE_CLASS.light.maxStalls ? 'light' : capacity <= VEHICLE_CLASS.medium.maxStalls ? 'medium' : 'heavy')

// ===== Tuyến, quãng đường =====
// Điểm nhận / giao khi đặt đơn; bảng giá công khai còn nhận cả các thành phố trong PLACES
export const findLocation = (id: string) => Object.values(COUNTRY_LOCATIONS).flat().find(l => l.id === id) ?? PLACES.find(p => p.id === id)

export function routeKm(origin: PlaceRef, dest: PlaceRef, gate?: string) {
  const a = findLocation(origin.id)
  const b = findLocation(dest.id)
  if (!a || !b) return 0
  const g = gate ? GATES.find(x => x.name === gate) : undefined
  return roadKm(g ? haversineKm(a, g) + haversineKm(g, b) : haversineKm(a, b))
}
// Cửa khẩu Coordinator được chọn: của nước đến (hoặc nước đi nếu chiều về Việt Nam). Tuyến nội địa không có.
export function gatesFor(origin: PlaceRef, dest: PlaceRef): Gate[] {
  const country = dest.country !== 'VN' ? dest.country : origin.country
  return country === 'VN' ? [] : GATES.filter(g => g.country === country)
}
// Gợi ý cửa khẩu có tổng quãng đường ngắn nhất
export function suggestGate(origin: PlaceRef, dest: PlaceRef): string | undefined {
  const gates = gatesFor(origin, dest)
  return [...gates].sort((a, b) => routeKm(origin, dest, a.name) - routeKm(origin, dest, b.name))[0]?.name
}
// Gợi ý trạm nghỉ: chia đều đường đi (điểm đón → cửa khẩu → điểm trả), mỗi điểm chia lấy trạm gần nhất chưa dùng
export function suggestTransitStations(origin: PlaceRef, dest: PlaceRef, gate: string | undefined, count: number): string[] {
  const a = findLocation(origin.id), b = findLocation(dest.id)
  if (!a || !b || count <= 0) return []
  const g = gate ? GATES.find(x => x.name === gate) : undefined
  const pts = g ? [a, g, b] : [a, b]
  const seg = pts.slice(1).map((p, i) => haversineKm(pts[i], p))
  const total = seg.reduce((t, x) => t + x, 0)
  const used = new Set<string>()
  return Array.from({ length: count }, (_, i) => {
    let d = (total * (i + 1)) / (count + 1)
    let k = 0
    while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++ }
    const f = seg[k] ? d / seg[k] : 0
    const at = { lat: pts[k].lat + (pts[k + 1].lat - pts[k].lat) * f, lng: pts[k].lng + (pts[k + 1].lng - pts[k].lng) * f }
    const best = TRANSIT_STATIONS.filter(s => !used.has(s.name)).sort((x, y) => haversineKm(at, x) - haversineKm(at, y))[0]
    used.add(best.name)
    return best.name
  })
}
// Xếp các trạm theo thứ tự xe đi qua: chiếu từng trạm lên đường đi điểm đón → (cửa khẩu) → điểm trả,
// rồi sắp theo quãng đường dọc đường đi. Trả về trạm đã xếp và các điểm để vẽ đường (có cửa khẩu chen đúng chỗ).
export function routeOutline<T extends GeoPoint>(origin: GeoPoint, gate: GeoPoint | undefined, dest: GeoPoint, stations: T[]): { stations: T[]; path: GeoPoint[] } {
  const pts = gate ? [origin, gate, dest] : [origin, dest]
  const kx = Math.cos((origin.lat * Math.PI) / 180) * 111, ky = 111 // km trên mỗi độ, đủ chính xác cho vài trăm km
  const flat = (p: GeoPoint) => ({ x: (p.lng - origin.lng) * kx, y: (p.lat - origin.lat) * ky })
  const seg = pts.slice(1).map((p, i) => { const a = flat(pts[i]), b = flat(p); return { a, b, len: Math.hypot(b.x - a.x, b.y - a.y) } })
  const progress = (s: GeoPoint) => {
    const q = flat(s)
    let best = { d: Infinity, at: 0 }, before = 0
    seg.forEach(({ a, b, len }) => {
      const t = len ? Math.max(0, Math.min(1, ((q.x - a.x) * (b.x - a.x) + (q.y - a.y) * (b.y - a.y)) / (len * len))) : 0
      const d = Math.hypot(q.x - (a.x + (b.x - a.x) * t), q.y - (a.y + (b.y - a.y) * t))
      if (d < best.d) best = { d, at: before + t * len }
      before += len
    })
    return best.at
  }
  const ordered = stations.map(s => ({ s, at: progress(s) })).sort((x, y) => x.at - y.at)
  const gateAt = gate ? seg[0].len : Infinity
  const path: GeoPoint[] = [origin, ...ordered.filter(x => x.at < gateAt).map(x => x.s), ...(gate ? [gate] : []), ...ordered.filter(x => x.at >= gateAt).map(x => x.s), dest]
  return { stations: ordered.map(x => x.s), path }
}

export const travelHours = (km: number, international: boolean) => km / AVG_SPEED_KMH + (international ? BORDER_HOURS : 0)
export const tripDays = (km: number, international: boolean) => Math.max(1, Math.ceil(travelHours(km, international) / DRIVE_HOURS_PER_DAY))















export const clearanceProgress = (c: Clearance) => ({ done: c.items.filter(i => i.status === 'done').length, total: c.items.length })



// ===== Nhóm đơn cho khách (Đơn của tôi) =====
export type OrderGroup = 'new' | 'approved' | 'supplement' | 'moving' | 'settle' | 'closed' | 'done'
// Thứ tự hiển thị trên thanh dọc bên trái
export const ORDER_GROUPS: Record<OrderGroup, { label: string; icon: string; hint: string }> = {
  new: { label: 'Vừa đặt', icon: 'fa-paper-plane', hint: 'Đã gửi, đang chờ tiếp nhận, thẩm định và lập báo giá' },
  approved: { label: 'Đã duyệt', icon: 'fa-circle-check', hint: 'Đã có báo giá, đặt cọc, làm giấy tờ, chờ xe đón ngựa' },
  supplement: { label: 'Yêu cầu bổ sung', icon: 'fa-file-circle-exclamation', hint: 'Kiểm dịch viên cần bạn bổ sung hồ sơ ngựa' },
  moving: { label: 'Đang di chuyển', icon: 'fa-truck-fast', hint: 'Xe đang đến điểm đón hoặc đang chở ngựa' },
  settle: { label: 'Chờ quyết toán', icon: 'fa-receipt', hint: 'Ngựa đã giao, đang đối soát chi phí hoặc chờ bạn thanh toán và đánh giá' },
  closed: { label: 'Hết hạn / hủy / từ chối', icon: 'fa-ban', hint: 'Báo giá hết hạn, đơn đã hủy hoặc nhà xe từ chối đơn' },
  done: { label: 'Đã hoàn thành', icon: 'fa-flag-checkered', hint: 'Ngựa đã được giao' },
}
export function orderGroupOf(b: { status: BookingStatus; medical?: { status: string } }): OrderGroup {
  if (b.medical?.status === 'resubmit' && b.status === 'under_review') return 'supplement'
  switch (b.status) {
    case 'pending_intake': case 'under_review': case 'pending_commercial': return 'new'
    case 'awaiting_payment': case 'waybill_issued': case 'clearance_in_progress': case 'clearance_done': case 'ready_for_pickup': return 'approved'
    case 'en_route_to_pickup': case 'in_transit': case 'incident_reported': case 'pending_emergency_approval': case 'emergency_plan_active': return 'moving'
    case 'delivered_pending_settlement': case 'expenses_submitted': case 'settlement_issued': case 'payment_overdue': return 'settle'
    case 'completed': return 'done'
    case 'quote_expired': case 'cancelled': case 'rejected': return 'closed'
  }
}

// Tab của "Đơn hàng của tôi" (khách): mỗi đơn đúng một tab, xếp theo thứ tự các giai đoạn
export type OrderTab = 'confirm' | 'supplement' | 'pay' | 'prepare' | 'moving' | 'settle' | 'done' | 'closed'
export function orderTabOf(b: Pick<Booking, 'status' | 'medical' | 'balance' | 'settlement'>): OrderTab {
  switch (b.status) {
    case 'pending_intake': case 'under_review': return b.medical?.status === 'resubmit' && b.status === 'under_review' ? 'supplement' : 'confirm'
    case 'pending_commercial': return 'confirm'
    case 'awaiting_payment': return 'pay'
    case 'waybill_issued': case 'clearance_in_progress': case 'clearance_done': return 'prepare'
    case 'ready_for_pickup': return b.balance ? 'prepare' : 'pay'
    case 'en_route_to_pickup': return b.balance ? 'moving' : 'pay'
    case 'in_transit': case 'incident_reported': case 'pending_emergency_approval': case 'emergency_plan_active': return 'moving'
    case 'delivered_pending_settlement': case 'expenses_submitted': return 'settle'
    case 'settlement_issued': case 'payment_overdue': return b.settlement?.total ? 'pay' : 'settle'
    case 'completed': return 'done'
    case 'quote_expired': case 'cancelled': case 'rejected': return 'closed'
  }
}

// Cột của bảng Kanban trên trang Tổng quan của Manager: mỗi đơn đang chạy đúng một cột (đơn đã đóng không hiện)
export type BoardCol = 'intake' | 'review' | 'quote' | 'deposit' | 'prepare' | 'moving' | 'settle' | 'done'
export function managerBoardOf(s: BookingStatus): BoardCol | undefined {
  switch (s) {
    case 'pending_intake': return 'intake'
    case 'under_review': return 'review'
    case 'pending_commercial': return 'quote'
    case 'awaiting_payment': return 'deposit'
    case 'waybill_issued': case 'clearance_in_progress': case 'clearance_done': case 'ready_for_pickup': case 'en_route_to_pickup': return 'prepare'
    case 'in_transit': case 'incident_reported': case 'pending_emergency_approval': case 'emergency_plan_active': return 'moving'
    case 'delivered_pending_settlement': case 'expenses_submitted': case 'settlement_issued': case 'payment_overdue': return 'settle'
    case 'completed': return 'done'
    case 'quote_expired': case 'cancelled': case 'rejected': return undefined
  }
}

// Ngày giờ đến nơi dự kiến = giờ đến của chặng cuối; chưa có lộ trình thì chưa biết
export const arrivalOf = (route?: Pick<RoutePlan, 'legs'>) => route?.legs.length ? route.legs[route.legs.length - 1].arriveAt : undefined

// Số đơn đang chờ Manager (menu và trang Tổng quan). `moving` chỉ để theo dõi, không phải việc cần xử lý.
export const managerCounts = (list: Pick<Booking, 'status' | 'incidents' | 'medical'>[]) => ({
  intake: list.filter(b => b.status === 'pending_intake').length,
  quote: list.filter(b => b.status === 'pending_commercial').length,
  incident: list.reduce((n, b) => n + (b.incidents ?? []).filter(i => i.status === 'pending_approval').length, 0),
  audit: list.filter(b => b.status === 'expenses_submitted').length, // đối soát chi phí, làm ở trang Tiến độ đơn
  moving: list.filter(b => orderGroupOf(b) === 'moving').length,
})

// Nhóm Đã duyệt chia nhỏ theo việc khách cần làm về thanh toán
export type ApprovedSub = 'await_deposit' | 'deposited' | 'pay_at_pickup' | 'ready'
export const APPROVED_SUBS: Record<ApprovedSub, { label: string; icon: string; hint: string }> = {
  await_deposit: { label: 'Chờ đặt cọc', icon: 'fa-credit-card', hint: 'Bạn cần đặt cọc 30% trong 48 giờ để nhận vận đơn' },
  deposited: { label: 'Đã cọc, nhà xe chuẩn bị', icon: 'fa-file-signature', hint: 'Nhà xe làm giấy kiểm dịch, hải quan và chuẩn bị xe. Bạn không cần làm gì thêm' },
  pay_at_pickup: { label: 'Thanh toán lúc bốc ngựa', icon: 'fa-wallet', hint: 'Xe đã sẵn sàng. Trả 70% còn lại vào ngày bốc ngựa để xe được xuất bến' },
  ready: { label: 'Sẵn sàng đón ngựa', icon: 'fa-circle-check', hint: 'Đã thanh toán đủ. Chuẩn bị bản gốc hồ sơ ngựa để giao cho tài xế' },
}
export function approvedSubOf(b: { status: BookingStatus; balance?: unknown }): ApprovedSub | undefined {
  if (b.status === 'awaiting_payment') return 'await_deposit'
  if (b.status === 'waybill_issued' || b.status === 'clearance_in_progress' || b.status === 'clearance_done') return 'deposited'
  if (b.status === 'ready_for_pickup') return b.balance ? 'ready' : 'pay_at_pickup'
  return undefined
}


// ===== Lộ trình chi tiết (Flow 3, PRD mục 4.2) =====
const placeName = (n: string) => n.split(' — ')[0]
const MIN = 60_000

// Chia chặng đều nhau theo danh sách trạm nghỉ. Ngựa không đi liên tục quá 3–4 giờ.
export function layoutLegs(from: string, to: string, etd: number, rests: Pick<RestStop, 'name' | 'minutes'>[], driveHours: number): RouteLeg[] {
  const n = rests.length + 1
  const legMs = (driveHours / n) * 60 * MIN
  const names = [placeName(from), ...rests.map(r => r.name || `Trạm nghỉ ${rests.indexOf(r) + 1}`), placeName(to)]
  const legs: RouteLeg[] = []
  let t = etd
  for (let i = 0; i < n; i++) {
    legs.push({ no: i + 1, from: names[i], to: names[i + 1], departAt: Math.round(t), arriveAt: Math.round(t + legMs) })
    t += legMs + (rests[i]?.minutes ?? 0) * MIN
  }
  return legs
}

// Giờ xe tới cửa khẩu: ước lượng ở khoảng 60% hành trình
export function estimateBorderEta(legs: RouteLeg[]) {
  if (!legs.length) return undefined
  const start = legs[0].departAt, end = legs[legs.length - 1].arriveAt
  return Math.round(start + (end - start) * 0.6)
}

// Phương án mặc định cho Coordinator chỉnh: chia chặng vừa đủ, trạm nghỉ gợi ý theo cửa khẩu, mỗi trạm dừng 45 phút
export function buildRoutePlan(b: Pick<Booking, 'type' | 'origin' | 'dest' | 'gate'>, etd: number): RoutePlan {
  const international = b.type === 'international'
  const driveHours = routeKm(b.origin, b.dest, b.gate) / AVG_SPEED_KMH
  const n = Math.max(1, Math.ceil(driveHours / TARGET_LEG_HOURS))
  const names = suggestTransitStations(b.origin, b.dest, b.gate, n - 1)
  const rests: RestStop[] = names.map((name, i) => ({ afterLeg: i + 1, name, minutes: 45 }))
  const legs = layoutLegs(b.origin.name, b.dest.name, etd, rests, driveHours)
  return { legs, rests, borderEta: international ? estimateBorderEta(legs) : undefined }
}

const minutesOfDay = (t: number) => new Date(t).getHours() * 60 + new Date(t).getMinutes()
export const borderOutsideWindow = (t: number) => minutesOfDay(t) < BORDER_WINDOW.open || minutesOfDay(t) > BORDER_WINDOW.close


// ===== Lệnh điều xe (Trip Manifest, PRD mục 4.3) =====
// Chứng từ nhà xe cấp cho tài xế mang theo, và bản gốc tài xế phải thu của khách tại điểm đón
export function manifestDocuments(b: Pick<Booking, 'type'>) {
  const intl = b.type === 'international'
  return {
    system: [
      'Bản in Lệnh điều xe',
      'Vận đơn',
      'Giấy kiểm dịch, tờ khai, giấy ủy quyền áp tải nhà xe đã làm (bản in)',
      ...(intl ? ['Giấy phép vận tải liên vận quốc tế CLV / song phương (bản gốc kèm xe)'] : []),
      'Sổ đăng kiểm xe chuyên dụng và Bảo hiểm trách nhiệm dân sự còn hiệu lực',
      '02 bản "Biên bản Giao nhận Động vật sống & Chứng từ gốc" (ký tay với người gửi)',
      '02 bản "Biên bản Bàn giao & Hoàn tất chuyến đi" (ký tay với người nhận)',
    ],
    originals: [
      'Hộ chiếu ngựa bản gốc (FEI / National Passport)',
      'Sổ tiêm phòng',
      'Phiếu xét nghiệm EIA/EVA, bản gốc kèm 02 bản sao công chứng',
    ],
  }
}


// Mốc đang chờ làm: mốc đầu tiên chưa hoàn tất
export const currentCheckpoint = (t: { run?: TripRun }) => t.run?.checkpoints.find(c => !c.doneAt)
export const checkpointState = (cp: Checkpoint, current?: Checkpoint): 'done' | 'current' | 'locked' => (cp.doneAt ? 'done' : cp === current ? 'current' : 'locked')
// Mốc nhỏ của bước Vận chuyển: các mốc (đón, trạm nghỉ, cửa khẩu, giao) đã xong / tổng và mốc hiện tại
export function transitProgress(t: { run?: TripRun }): { done: number; total: number; current?: string } | undefined {
  const cps = t.run?.checkpoints
  if (!cps?.length) return undefined
  return { done: cps.filter(c => c.doneAt).length, total: cps.length, current: currentCheckpoint(t)?.label }
}
// "In Transit - Leg N": số trạm nghỉ đã qua + 1
export const legNumber = (t: { run?: TripRun }) => (t.run?.checkpoints.filter(c => c.type === 'rest' && c.doneAt).length ?? 0) + 1

// Thông quan xong mà Driver chưa bấm tiếp tục hành trình (xe còn ở cửa khẩu). Mốc sau đã check-in rồi (dữ liệu cũ) thì coi như đã rời.
export function pendingDeparture(t: { run?: TripRun }): Checkpoint | undefined {
  const cps = t.run?.checkpoints
  if (!cps || t.run?.deliveredAt) return undefined
  const i = cps.findIndex(c => c.type === 'customs' && c.doneAt && !c.leftAt)
  return i >= 0 && !cps.slice(i + 1).some(c => c.arrivedAt) ? cps[i] : undefined
}
// Xe đang ở đâu theo các xác nhận thủ công của Driver (không dùng GPS): đang dừng tại một mốc, hoặc đang chạy giữa hai mốc
export type VehicleSpot = { kind: 'at'; index: number } | { kind: 'between'; from: number; to: number }
export function vehicleSpot(t: { run?: TripRun }): VehicleSpot {
  const cps = t.run?.checkpoints
  if (!cps?.length) return { kind: 'at', index: 0 }
  let i = -1
  cps.forEach((c, k) => { if (c.arrivedAt) i = k })
  if (i < 0) return { kind: 'at', index: 0 }
  const c = cps[i], next = cps[i + 1]
  const left = c.type === 'delivery' ? false : c.type === 'border' ? !!next?.doneAt || !!cps[i + 2]?.arrivedAt : c.type === 'customs' ? !!c.leftAt || !!next?.arrivedAt : !!c.doneAt
  return left && next ? { kind: 'between', from: i, to: i + 1 } : { kind: 'at', index: i }
}
export function spotLabel(t: { run?: TripRun; departedAt?: number }): string {
  const cps = t.run?.checkpoints, spot = vehicleSpot(t)
  if (!cps?.length) return t.departedAt ? 'Đang trên đường tới điểm đón' : 'Chưa xuất phát'
  if (!cps[0].arrivedAt) return 'Đang trên đường tới điểm đón'
  const name = (c: Checkpoint) => (c.type === 'rest' ? c.place.replace(/^Trạm nghỉ /, 'trạm ') : c.type === 'pickup' ? 'điểm đón' : c.type === 'delivery' ? 'điểm giao' : `cửa khẩu ${c.place}`)
  if (spot.kind === 'at') return t.run?.deliveredAt ? 'Đã giao ngựa tại điểm giao' : `Đang ở ${name(cps[spot.index])}`
  return `Đang trên đường từ ${name(cps[spot.from])} tới ${name(cps[spot.to])}`
}
// Toạ độ của một mốc trên bản đồ: điểm đón, trạm nghỉ, cửa khẩu, điểm giao
export function checkpointPoint(b: Pick<Booking, 'origin' | 'dest'>, cp: Checkpoint): GeoPoint | undefined {
  if (cp.type === 'pickup') return findLocation(b.origin.id)
  if (cp.type === 'delivery') return findLocation(b.dest.id)
  if (cp.type === 'rest') return TRANSIT_STATIONS.find(s => s.name === cp.place)
  return GATES.find(g => g.name === cp.place)
}
// Vị trí xe để vẽ: dừng tại mốc thì đúng chỗ đó, đang đi thì ở giữa hai mốc
export function vehiclePoint(b: Pick<Booking, 'origin' | 'dest'>, t: { run?: TripRun }): GeoPoint | undefined {
  const spot = vehicleSpot(t), cps = t.run?.checkpoints
  if (!cps?.length) return findLocation(b.origin.id)
  if (spot.kind === 'at') return checkpointPoint(b, cps[spot.index])
  const a = checkpointPoint(b, cps[spot.from]), z = checkpointPoint(b, cps[spot.to])
  return a && z ? { lat: (a.lat + z.lat) / 2, lng: (a.lng + z.lng) / 2 } : a ?? z
}

// Mốc chưa check-in mà đã quá giờ dự kiến từ 30 phút: Delayed Check-in cho Coordinator
export function delayedCheckpoint(t: { run?: TripRun }, now = Date.now()) {
  if (!t.run?.startedAt || t.run.deliveredAt) return undefined
  const cp = currentCheckpoint(t)
  const waiting = cp && !cp.arrivedAt && cp.type !== 'customs'
  return waiting && now - cp.plannedAt >= DELAY_ALERT_MINUTES * 60_000 ? cp : undefined
}
export const lastWelfare = (t: { run?: TripRun }): WelfareLog | undefined => t.run?.welfare[t.run.welfare.length - 1]
export const needsAttention = (w?: WelfareLog) => !!w && w.condition !== 'normal'


// ===== Sự cố và quyết toán (Flow 5, 6; PRD mục 6, 7, 11.5) =====
export const openIncidentOf = (b: Pick<Booking, 'incidents'>, tripId: string) => b.incidents?.find(i => i.tripId === tripId && i.status !== 'resolved')
// Mỗi nhóm sự cố có đúng một cách xử lý, lập trên bản đồ
export function incidentActionsFor(kind: IncidentKind): IncidentAction[] {
  return kind === 'horse_health' ? ['to_station'] : kind === 'vehicle_breakdown' ? ['rescue_and_station'] : ['reroute']
}
// Sức khỏe ngựa và xe gặp sự cố đều đưa ngựa tới trạm nghỉ, nên Escort phải xác nhận ngựa đủ sức mới đi tiếp; tắc đường thì không
export const needsFitCheck = (kind: IncidentKind) => kind !== 'traffic_jam'

// ----- Bản đồ sự cố: điểm gần nhất, đường đi còn lại, vị trí xe -----
export function nearestTo<T extends GeoPoint>(from: GeoPoint, list: T[], n = list.length): (T & { km: number })[] {
  return list.map(x => ({ ...x, km: haversineKm(from, x) })).sort((a, z) => a.km - z.km).slice(0, n)
}
// Chiếu một điểm lên đường gấp khúc: trả về đoạn gần nhất (chỉ số điểm đầu đoạn) và quãng đường tính từ điểm đầu đường
export function projectOnPath(path: GeoPoint[], p: GeoPoint): { segment: number; at: number } {
  const kx = Math.cos((path[0].lat * Math.PI) / 180) * 111, ky = 111
  const flat = (q: GeoPoint) => ({ x: (q.lng - path[0].lng) * kx, y: (q.lat - path[0].lat) * ky })
  const q = flat(p)
  let best = { d: Infinity, segment: 0, at: 0 }, before = 0
  for (let i = 0; i < path.length - 1; i++) {
    const a = flat(path[i]), b = flat(path[i + 1]), len = Math.hypot(b.x - a.x, b.y - a.y)
    const t = len ? Math.max(0, Math.min(1, ((q.x - a.x) * (b.x - a.x) + (q.y - a.y) * (b.y - a.y)) / (len * len))) : 0
    const d = Math.hypot(q.x - (a.x + (b.x - a.x) * t), q.y - (a.y + (b.y - a.y) * t))
    if (d < best.d) best = { d, segment: i, at: before + t * len }
    before += len
  }
  return { segment: best.segment, at: best.at }
}
// Các điểm xe còn phải đi qua kể từ vị trí hiện tại (điểm kế tiếp, các trạm, cửa khẩu, điểm trả)
export const pointsAhead = <T extends GeoPoint>(path: T[], p: GeoPoint): T[] => path.slice(projectOnPath(path, p).segment + 1)
// Điểm nằm ở tỷ lệ f (0 – 1) quãng đường dọc đường gấp khúc
export function pointAlong(path: GeoPoint[], f: number): GeoPoint {
  const lens = path.slice(1).map((p, i) => haversineKm(path[i], p))
  let want = lens.reduce((t, x) => t + x, 0) * Math.max(0, Math.min(1, f))
  for (let i = 0; i < lens.length; i++) {
    if (want <= lens[i] || i === lens.length - 1) { const k = lens[i] ? Math.min(1, want / lens[i]) : 0; return { lat: path[i].lat + (path[i + 1].lat - path[i].lat) * k, lng: path[i].lng + (path[i + 1].lng - path[i].lng) * k } }
    want -= lens[i]
  }
  return path[0]
}
// Đường đi đã lập của đơn: điểm đón → trạm đã chọn → cửa khẩu → điểm trả
export function bookingPath(b: Pick<Booking, 'origin' | 'dest' | 'gate' | 'route'>): GeoPoint[] {
  const a = findLocation(b.origin.id), z = findLocation(b.dest.id)
  if (!a || !z) return []
  const gate = b.gate ? GATES.find(g => g.name === b.gate) : undefined
  const stations = (b.route?.rests ?? []).flatMap(r => TRANSIT_STATIONS.filter(s => s.name === r.name))
  return routeOutline(a, gate, z, stations).path
}
// Vị trí xe lúc báo sự cố (bản thử, mô phỏng): giữa mốc vừa qua và mốc kế tiếp của hành trình. Có app thật thì lấy từ GPS.
export function incidentLocation(b: Pick<Booking, 'origin' | 'dest' | 'gate' | 'route'>, trip: VehicleTrip): GeoPoint {
  const path = bookingPath(b)
  if (path.length < 2) return findLocation(b.origin.id) ?? { lat: 10.78, lng: 106.7 }
  const p = transitProgress(trip)
  const f = p && p.total ? (p.done + 0.5) / p.total : 0.5
  return pointAlong(path, Math.max(0.08, Math.min(0.92, f)))
}

// Hạng xe theo số ngựa (chỉ để hiển thị gợi ý; BE/Coordinator chọn xe thật)
export const classForHorses = (n: number): VehicleClass => vehicleClassOf(n)
