// Hàm tính quãng đường và cước xe theo bậc km, dùng cho báo giá thật (lib/booking.ts quoteLines).
import type { GeoPoint } from '../config/network'
import { ROAD_FACTOR } from '../config/public-pricing'

export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const rad = (x: number) => x * Math.PI / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export const roadKm = (km: number) => Math.max(10, Math.round(km * ROAD_FACTOR / 10) * 10)


