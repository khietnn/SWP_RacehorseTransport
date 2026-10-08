// Bảng giá: dùng chung cho trang chủ công khai và trang khách đã đăng nhập. Dùng đúng công thức báo giá thật (PRD mục 11).
import { FEED_PACKAGE, FEED_PACKAGE_IDS, WATER_PLAN, WATER_PLAN_IDS, DEMURRAGE_PER_HOUR, DEPOSIT_RATE, HORSE_BREEDS, QUOTE_VALID_HOURS, VEHICLE_CLASS, type VehicleClass } from '@shared/config/booking-rules'
import { MIN_LEAD_DAYS } from '@shared/config/business-rules'
import { formatVND } from '@shared/lib/format'
import { pricingApi } from '@shared/services/pricing'
import { useLoad } from '@shared/services/useLoad'
import s from '../home/HomePage.module.css'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

// ===== Bảng giá (cùng công thức với báo giá) =====
const CLASSES = Object.keys(VEHICLE_CLASS) as VehicleClass[]
export function PriceTable() {
  const { data: price } = useLoad(pricingApi.catalog)
  if (!price) return <p className="text-muted">Đang tải bảng giá…</p>
  return (
    <>
      <div className={s.priceGrid}>
        <div>
          <h3><i className="fa-solid fa-truck" /> Cước vận chuyển, mỗi xe</h3>
          <table className={s.priceTable}>
            <thead><tr><th>Quãng đường</th>{CLASSES.map(c => <th key={c}>{VEHICLE_CLASS[c].label} ({VEHICLE_CLASS[c].stalls})</th>)}</tr></thead>
            <tbody>{price.truck.map(r => <tr key={r.km}><td>{r.km} km</td>{CLASSES.map(c => <td key={c}>{formatVND(r.byClass[c])}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <div>
          <h3><i className="fa-solid fa-horse-head" /> Các khoản cố định khác</h3>
          <table className={s.priceTable}>
            <thead><tr><th>Hạng mục</th><th>Đơn giá</th></tr></thead>
            <tbody>
              <tr><td>Nhân sự (01 tài xế + 01 hộ tống), mỗi xe</td><td>{formatVND(price.crewPerDay)}/ngày</td></tr>
              <tr><td>Nhiên liệu và phí cầu đường, mỗi xe</td><td>{formatVND(price.fuelBotPer100Km)}/100 km</td></tr>
              <tr><td>Khoang đơn mở rộng</td><td>{formatVND(price.singleStall)}/ngựa</td></tr>
              {FEED_PACKAGE_IDS.filter(id => price.feed[id] > 0).map(id => <tr key={id}><td>Thức ăn · {FEED_PACKAGE[id].label}</td><td>{formatVND(price.feed[id])}/ngựa</td></tr>)}
              {WATER_PLAN_IDS.filter(id => price.water[id] > 0).map(id => <tr key={id}><td>Cữ nước · {WATER_PLAN[id].label}</td><td>{formatVND(price.water[id])}/ngựa</td></tr>)}
              <tr><td>Thủ tục kiểm dịch (nội địa)</td><td>{price.clearance.domestic ? formatVND(price.clearance.domestic) : 'Đã gồm trong cước'}</td></tr>
              <tr><td>Thủ tục kiểm dịch và hải quan (quốc tế)</td><td>{formatVND(price.clearance.international)}/chuyến</td></tr>
              {HORSE_BREEDS.map(b => <tr key={b}><td>Bảo hiểm Động vật Sống · {b}</td><td>{formatVND(price.insurance[b] ?? 0)}/ngựa</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className={s.priceNotes}>
        <div><i className="fa-solid fa-wallet" />Đặt cọc {DEPOSIT_RATE * 100}% để nhận vận đơn, {100 - DEPOSIT_RATE * 100}% còn lại trả vào ngày bốc ngựa.</div>
        <div><i className="fa-solid fa-calendar-check" />Đặt trước tối thiểu {MIN_LEAD_DAYS} ngày so với ngày khởi hành.</div>
        <div><i className="fa-solid fa-receipt" />Giá cố định, chưa gồm VAT, đã gồm nhiên liệu và cầu đường. Báo giá chính thức có hiệu lực {QUOTE_VALID_HOURS} giờ, không phụ thu ngoài phiếu.</div>
        <div><i className="fa-solid fa-kit-medical" />Chỉ phát sinh thêm khi có sự cố liên quan đến ngựa (thuốc, viện phí, chuồng đệm): có chứng từ và có Bảng quyết toán. Xe hỏng, tắc đường do nhà xe chịu.</div>
        <div><i className="fa-solid fa-clock" />Phí lưu xe chờ {formatVND(DEMURRAGE_PER_HOUR)}/giờ chỉ tính khi xe phải chờ do lỗi phía khách hoặc người nhận.</div>
      </div>
    </>
  )
}

// Khung Bảng giá cho trang khách đã đăng nhập (trang chủ công khai dùng PriceTable trong tab Bảng giá)
export function PriceLookup() {
  return (
    <section className={cx('wrap', s.lookup)} style={{ padding: 0 }}>
      <div className={s.lookupCard}>
        <div className={cx(s.lookupPanel, s.active)}>
          <PriceTable />
        </div>
      </div>
    </section>
  )
}
