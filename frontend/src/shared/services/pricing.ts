import type { PriceCatalog } from '../types/pricing'
import { formatVND } from '../lib/format'
import { http } from '../lib/http'
import { useLoad } from './useLoad'

export const pricingApi = {
  catalog: (): Promise<PriceCatalog> => http.get<PriceCatalog>('/pricing/catalog'),
}

// Phí bảo hiểm theo giống ngựa, đã định dạng tiền; chưa tải xong thì hiện dấu '—'
export function useInsuranceFee() {
  const { data } = useLoad(pricingApi.catalog)
  return (breed: string): string => {
    const fee = data?.insurance[breed] ?? data?.insurance['Khác']
    return fee === undefined ? '—' : formatVND(fee)
  }
}
