# API Contract — FE ⇄ BE

> Hợp đồng giữa giao diện (`frontend/`) và backend (`backend/`). Sinh từ `frontend/src/shared/services/*.ts`: mỗi hàm `xxxApi.hàm` của FE gọi đúng một endpoint dưới đây. Khi đổi chữ ký hàm ở FE hoặc làm xong endpoint ở BE, cập nhật file này.

## Quy ước

- Base URL: `/api` (Vite proxy sang `http://localhost:8080` khi dev).
- Mọi response bọc trong `ApiResponse<T>`: `{ "success": true, "data": T, "message": null, "errors": [] }`. Lỗi: `success=false`, `message` là chữ hiển thị cho người dùng, `errors` là danh sách lỗi từng trường.
- Mã lỗi: `400` lỗi nghiệp vụ hoặc dữ liệu sai, `404` không thấy (các hàm `get` của FE coi 404 là `undefined`), `401/403` chưa đăng nhập hoặc không đủ quyền.
- Xác thực: `Authorization: Bearer <JWT>`; token do `POST /api/auth/login` trả về.
- Thời gian là số mili-giây epoch (`number`). Tiền là số nguyên VNĐ.
- Kiểu dữ liệu (`Booking`, `HorseProfile`, ...) xem `frontend/src/shared/types/*.ts`. Id trong FE là chuỗi (ví dụ `H-001`, `ORD-2026-0001`); BE có thể dùng số rồi trả dạng chuỗi.
- Tham số FE dạng `owner` / `customer` là định danh người dùng đang gọi (hiện là tên/email). BE nên lấy từ JWT, bỏ tham số này khi nối xong xác thực.
- `by` / `actor` trong body là tên người thao tác; BE nên lấy từ JWT.
- Hành động chuyển trạng thái đơn: `POST /api/bookings/{id}/{hành-động}`; BE kiểm tra điều kiện chuyển trạng thái theo `docs/PRD.md` mục 13 và trả đơn sau khi cập nhật.

**Module đã có sẵn ở BE làm mẫu:** `Horse` (`/api/horses`). Trả `HorseResponse` (Long `id`, `sex` dạng `STALLION|MARE|GELDING`); FE đang dùng `stallion|mare|gelding` và `id` chuỗi, nhóm BE thống nhất lại khi nối.

## Tài khoản và đăng nhập (`accountsApi`, `accounts.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/accounts` |  |  | `Account[]` |
| `authenticate` | POST | `/api/auth/login` | `{ email, password, portal }` |  | `AuthResult` |
| `create` | POST | `/api/accounts` | `{ ...input, actor }` |  | `{ account: Account; password: string }` |
| `update` | PATCH | `/api/accounts/{id}` | `{ ...patch, actor }` |  | `Account` |
| `setLocked` | POST | `/api/accounts/{id}/set-locked` | `{ locked, actor, reason }` |  | `Account` |
| `resetPassword` | POST | `/api/accounts/{id}/reset-password` | `{ actor }` |  | `string` |

## Tra cứu công khai (`publicBookingsApi`, `bookings.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `track` | GET | `/api/public/bookings/track` |  | `{ code, phoneLast4 }` | `PublicTracking \| null` |

## Đơn của khách (`customerBookingsApi`, `bookings.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/customer/bookings` |  | `{ customer }` | `CustomerBookingView[]` |
| `get` | GET | `/api/customer/bookings/{id}` |  | `{ customer }` | `void` |
| `create` | POST | `/api/customer/bookings` | `input` | `{ customer }` | `CustomerBookingView` |
| `team` | GET | `/api/customer/bookings/{id}/team` |  | `{ customer }` | `TripTeam[]` |
| `rejectQuote` | POST | `/api/customer/bookings/{id}/reject-quote` | `{ reason }` | `{ customer }` | `CustomerBookingView` |
| `cancel` | POST | `/api/customer/bookings/{id}/cancel` | `{ reason }` | `{ customer }` | `CustomerBookingView` |
| `resubmit` | POST | `/api/customer/bookings/{id}/resubmit` | `{}` | `{ customer }` | `CustomerBookingView` |
| `payDeposit` | POST | `/api/customer/bookings/{id}/pay-deposit` | `{}` | `{ customer }` | `CustomerBookingView` |
| `payBalance` | POST | `/api/customer/bookings/{id}/pay-balance` | `{}` | `{ customer }` | `CustomerBookingView` |
| `settle` | POST | `/api/customer/bookings/{id}/settle` | `{ rating }` | `{ customer }` | `CustomerBookingView` |

## Đơn (nhân viên nội bộ) (`bookingsApi`, `bookings.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/bookings` |  |  | `Booking[]` |
| `get` | GET | `/api/bookings/{id}` |  |  | `void` |
| `activate` | POST | `/api/bookings/{id}/activate` | `{ by, specialist, coordinator }` |  | `Booking` |
| `managerCancel` | POST | `/api/bookings/{id}/manager-cancel` | `{ by, reason }` |  | `Booking` |
| `rejectOrder` | POST | `/api/bookings/{id}/reject-order` | `{ by, role, reason }` |  | `Booking` |
| `approveMedical` | POST | `/api/bookings/{id}/approve-medical` | `{ by }` |  | `Booking` |
| `requestResubmission` | POST | `/api/bookings/{id}/request-resubmission` | `{ by, reason, items }` |  | `Booking` |
| `confirmPlan` | POST | `/api/bookings/{id}/confirm-plan` | `{ by, input }` |  | `Booking` |
| `sendBack` | POST | `/api/bookings/{id}/send-back` | `{ by, to, reason }` |  | `Booking` |
| `assignCrew` | POST | `/api/bookings/{id}/assign-crew` | `{ by, picks }` |  | `Booking` |
| `quoteDraft` | GET | `/api/bookings/{id}/quote-draft` |  |  | `{ lines: QuoteLine[]; km: number; days: number }` |
| `quotePreview` | POST | `/api/bookings/{id}/quote-preview` | `{ adjustments }` |  | `Quote` |
| `resources` | GET | `/api/bookings/{id}/resources` |  |  | `ResourceSchedules` |
| `sendQuote` | POST | `/api/bookings/{id}/send-quote` | `{ by, adjustments }` |  | `Booking` |
| `acceptWaybill` | POST | `/api/bookings/{id}/accept-waybill` | `{ by }` |  | `Booking` |
| `updateClearanceItem` | POST | `/api/bookings/{id}/update-clearance-item` | `{ by, type, patch }` |  | `Booking` |
| `addClearanceItem` | POST | `/api/bookings/{id}/add-clearance-item` | `{ by, type }` |  | `Booking` |
| `markHorseCleared` | POST | `/api/bookings/{id}/mark-horse-cleared` | `{ by, horseId, cleared }` |  | `Booking` |
| `completeClearance` | POST | `/api/bookings/{id}/complete-clearance` | `{ by }` |  | `Booking` |
| `setDriverPack` | POST | `/api/bookings/{id}/set-driver-pack` | `{ tripId, by, items }` |  | `Booking` |
| `acknowledgeTrip` | POST | `/api/bookings/{id}/acknowledge-trip` | `{ tripId, who, by }` |  | `Booking` |
| `departToPickup` | POST | `/api/bookings/{id}/depart-to-pickup` | `{ tripId, by }` |  | `Booking` |
| `arriveAtPickup` | POST | `/api/bookings/{id}/arrive-at-pickup` | `{ tripId, by, photo }` |  | `Booking` |
| `scanChip` | POST | `/api/bookings/{id}/scan-chip` | `{ tripId, by, chip }` |  | `Booking` |
| `collectOriginals` | POST | `/api/bookings/{id}/collect-originals` | `{ tripId, by, items }` |  | `Booking` |
| `uploadHandover` | POST | `/api/bookings/{id}/upload-handover` | `{ tripId, by, photo }` |  | `Booking` |
| `startJourney` | POST | `/api/bookings/{id}/start-journey` | `{ tripId, by }` |  | `Booking` |
| `arriveCheckpoint` | POST | `/api/bookings/{id}/arrive-checkpoint` | `{ tripId, by, photo }` |  | `Booking` |
| `submitWelfare` | POST | `/api/bookings/{id}/submit-welfare` | `{ tripId, by, data }` |  | `Booking` |
| `continueJourney` | POST | `/api/bookings/{id}/continue-journey` | `{ tripId, by }` |  | `Booking` |
| `customsCleared` | POST | `/api/bookings/{id}/customs-cleared` | `{ tripId, by, stampPhotos }` |  | `Booking` |
| `completeDelivery` | POST | `/api/bookings/{id}/complete-delivery` | `{ tripId, by }` |  | `Booking` |
| `reportIncident` | POST | `/api/bookings/{id}/report-incident` | `{ tripId, by, kind, photo, note }` |  | `Booking` |
| `planIncident` | POST | `/api/bookings/{id}/plan-incident` | `{ incidentId, by, input }` |  | `Booking` |
| `rejectIncident` | POST | `/api/bookings/{id}/reject-incident` | `{ incidentId, by, reason }` |  | `Booking` |
| `approveIncident` | POST | `/api/bookings/{id}/approve-incident` | `{ incidentId, by }` |  | `Booking` |
| `addIncidentExpense` | POST | `/api/bookings/{id}/add-incident-expense` | `{ incidentId, by, input }` |  | `Booking` |
| `confirmFit` | POST | `/api/bookings/{id}/confirm-fit` | `{ incidentId, by }` |  | `Booking` |
| `resumeJourney` | POST | `/api/bookings/{id}/resume-journey` | `{ incidentId, by }` |  | `Booking` |
| `submitExpenses` | POST | `/api/bookings/{id}/submit-expenses` | `{ by }` |  | `Booking` |
| `issueSettlement` | POST | `/api/bookings/{id}/issue-settlement` | `{ by, payers }` |  | `Booking` |

## Xe (`vehiclesApi`, `fleet.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/vehicles` |  |  | `Vehicle[]` |
| `create` | POST | `/api/vehicles` | `data` |  | `Vehicle` |
| `update` | PATCH | `/api/vehicles/{id}` | `patch` |  | `Vehicle` |
| `remove` | DEL | `/api/vehicles/{id}` |  |  | `void` |
| `loads` | GET | `/api/vehicles/loads` |  |  | `Record<string, VehicleLoad[]>` |

## Tài xế, hộ tống (`crewApi`, `fleet.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/crew` |  |  | `CrewMember[]` |
| `create` | POST | `/api/crew` | `data` |  | `CrewMember` |

## Hồ sơ ngựa (`horsesApi`, `horses.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/horses` |  | `{ owner }` | `HorseProfile[]` |
| `get` | GET | `/api/horses/{id}` |  | `{ owner }` | `void` |
| `byId` | GET | `/api/horses/{id}` |  |  | `void` |
| `create` | POST | `/api/horses` | `data` | `{ owner }` | `HorseProfile` |
| `update` | PATCH | `/api/horses/{id}` | `patch` | `{ owner }` | `HorseProfile` |

## Sự cố (trang cũ) (`incidentsApi`, `incidents.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/incidents` |  |  | `Incident[]` |
| `update` | PATCH | `/api/incidents/{id}` | `patch` |  | `Incident` |
| `create` | POST | `/api/incidents` | `data` |  | `Incident` |

## Thông báo đẩy (`noticesApi`, `notices.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/notices` |  | `{ role, name }` | `Notice[]` |
| `markRead` | POST | `/api/notices/{id}/mark-read` |  |  | `void` |
| `markAllRead` | POST | `/api/notices/mark-all-read` | `{}` | `{ role, name }` | `void` |

## Đơn kiểu cũ — khách (`customerOrdersApi`, `orders.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/customer/orders` |  | `{ customer }` | `CustomerOrderView[]` |
| `get` | GET | `/api/customer/orders/{id}` |  | `{ customer }` | `void` |
| `update` | PATCH | `/api/customer/orders/{id}` | `patch` | `{ customer }` | `CustomerOrderView` |

## Đơn kiểu cũ — nhân viên (`ordersApi`, `orders.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/orders` |  |  | `Order[]` |
| `get` | GET | `/api/orders/{id}` |  |  | `void` |
| `update` | PATCH | `/api/orders/{id}` | `patch` |  | `Order` |

## Biểu giá (`pricingApi`, `pricing.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `catalog` | GET | `/api/pricing/catalog` |  |  | `PriceCatalog` |

## Báo cáo (`reportsApi`, `reports.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/reports/trips` |  |  | `TripReport[]` |
| `revenue` | GET | `/api/reports/revenue` |  | `{ from, to }` | `RevenueReport` |

## Nhân viên (Specialist, Coordinator) (`staffApi`, `staff.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/staff` |  |  | `StaffMember[]` |
| `update` | PATCH | `/api/staff/{id}` | `patch` |  | `StaffMember` |
| `create` | POST | `/api/staff` | `data` |  | `StaffMember` |

## Chuyến xe (trang vận hành cũ) (`tripsApi`, `trips.ts`)

| Hàm FE | Method | URL | Body | Query | Trả về |
|---|---|---|---|---|---|
| `list` | GET | `/api/trips` |  |  | `TripView[]` |
| `get` | GET | `/api/trips/{id}` |  |  | `void` |
| `assess` | POST | `/api/trips/{id}/assess` | `{ feasible, note, by }` |  | `void` |
| `setVehicle` | POST | `/api/trips/{id}/set-vehicle` | `{ legNo, vehicleId }` |  | `void` |
| `setEscort` | POST | `/api/trips/{id}/set-escort` | `{ legNo, escortId }` |  | `void` |
| `splitLeg` | POST | `/api/trips/{id}/split-leg` | `{ legNo, stop }` |  | `void` |
| `mergeLeg` | POST | `/api/trips/{id}/merge-leg` | `{ legNo }` |  | `void` |
| `confirmRoute` | POST | `/api/trips/{id}/confirm-route` |  |  | `void` |
| `depart` | POST | `/api/trips/{id}/depart` |  |  | `void` |
| `logActivity` | POST | `/api/trips/{id}/log-activity` | `{ text }` |  | `void` |
| `checkIn` | POST | `/api/trips/{orderId}/check-in` |  |  | `void` |
| `deleteHealthLogs` | POST | `/api/trips/delete-health-logs` | `{ by }` |  | `void` |
| `addHealthLog` | POST | `/api/trips/{orderId}/add-health-log` | `{ log, severe }` |  | `void` |
## Trường BE phải tự tính và trả sẵn trong `Booking`

FE không còn tính các giá trị này (đã xóa khỏi `shared/lib`), chỉ đọc từ payload đơn:

| Trường | Ý nghĩa | PRD |
|---|---|---|
| `cancelInfo` | `{ allowed, refundIfCustomer, refundIfManager }`: còn hủy được không (đã cọc, xe chưa nhận ngựa) và tiền hoàn theo bên hủy | 8.3 |
| `clearanceOverdue` | Quá 18:00 D-1 mà giấy chưa `Clearance Done` | 3.4 |
| `clearanceBlocker` | Lý do chưa đóng được thủ tục (`null` = đóng được): hạng mục chưa nộp, ngựa chưa có cờ thông quan | 3.2, 3.5 |

## Endpoint thay logic đã xóa khỏi FE

| Endpoint | Thay cho | Ghi chú |
|---|---|---|
| `GET /api/pricing/catalog` | hằng số giá trong `config` | Biểu giá hiển thị: cước theo mốc km và hạng xe, nhân sự, nhiên liệu/BOT, khoang đơn, gói thức ăn, cữ nước, phí thủ tục, phí bảo hiểm theo giống. Kiểu `PriceCatalog` |
| `GET /api/bookings/{id}/quote-draft` | `quoteLines` | `{ lines, km, days }` |
| `POST /api/bookings/{id}/quote-preview` | `finalizeQuote` | Body `{ adjustments }`; trả `Quote` (tổng, cọc 30%, số dư 70%) |
| `GET /api/bookings/{id}/resources` | `schedulesOf`, `clashOf`, `vehicleDocsOk` | `ResourceSchedules`: lịch giữ và `locked` (lý do khóa) cho từng xe / Driver / Escort |
| `GET /api/vehicles/loads` | `HOLDING` + lọc đơn | `Record<vehicleId, VehicleLoad[]>` |
| `GET /api/reports/revenue?from&to` | `summarize`, `series`, `orderFinance` | `RevenueReport` gồm kỳ này, kỳ trước, chuỗi theo ngày, danh sách đơn |
| `POST /api/auth/login` | đăng nhập giả theo từ khóa email | Trả `{ ok, account, token }` hoặc `{ ok:false, reason }` |

## Luật nghiệp vụ BE phải thực thi (FE không còn kiểm tra)

- **Báo giá:** cước theo km/hạng xe, nhân sự theo ngày, nhiên liệu + BOT + dự phòng 5%, biên lợi nhuận 5% gộp đơn giá, phí khoang/ăn/nước, phí thủ tục, bảo hiểm 2% theo giống (PRD 11, 14.1). Hạn giữ 48 giờ, hết hạn tự chuyển `Quote Expired`.
- **Khóa lịch:** xe cách ngày đi dưới 3 ngày bị khóa; Driver/Escort đã giao việc cho đơn chưa kết thúc thì khóa; xe thiếu đăng kiểm (và giấy phép liên vận với tuyến quốc tế) bị khóa; không chọn trùng trong cùng một đơn (PRD 10.2).
- **Xác nhận phương án xe và lộ trình (`confirmPlan`):** kiểm tra sức chứa, ETA cửa khẩu trong 07:30–16:30, nghỉ tối thiểu 30 phút, chặng lái tối đa 3–4 giờ, cửa khẩu hợp lệ (PRD 4.2). FE chỉ hiện thông báo lỗi BE trả về.
- **Sinh mã:** mã đơn `ORD-YYYY-nnnn`, mã chuyến `TRP-xxxx-i`, mã vận đơn `VD-xxxx`.
- **Trạng thái đơn:** suy từ các chuyến (`deriveStatus`) theo PRD mục 13; tạo danh sách mốc hành trình (`checkpoints`) khi bắt đầu hành trình; cổng 70% trước `Start Journey`.
- **Hủy đơn và hoàn tiền:** theo bảng PRD 8.3.
- **Sự cố và quyết toán:** bên chịu chi phí mặc định theo PRD 11.5, bảng quyết toán, `Payment Overdue` sau 24 giờ (PRD 7, 8.2).
- **Thông báo đẩy:** BE tạo thông báo theo bảng PRD 1.5; FE chỉ đọc và đánh dấu đã đọc.
- **Hết hạn và tự động:** báo giá hết hạn, đơn tự đóng sau khi giao, cảnh báo quá 18:00 D-1 (trước đây là `applySystemRules` phía FE).

## Còn lại ở FE, cần BE cung cấp sau

- **Danh mục địa điểm, cửa khẩu, trạm nghỉ, điểm cứu hộ:** hiện là dữ liệu tĩnh (số mẫu) ở `frontend/src/shared/config/network.ts`, dùng đồng bộ cho bản đồ và gợi ý lộ trình. Nên có `GET /api/network` rồi chuyển FE sang tải từ API.
- **Tải tệp/ảnh:** `FileField`, `CaptureField` hiện chỉ lưu tên tệp / ảnh tạm trong phiên. Cần endpoint tải lên (ví dụ `POST /api/files`) trả URL, để Hồ sơ ngựa, ảnh check-in, biên bản, chứng từ chi phí lưu thật.
- **Hồ sơ ngựa:** trường `docs` (hộ chiếu, sổ tiêm, xét nghiệm) và `completedTrips` chưa có ở module mẫu `Horse`.
- **Bảng điều khoản** `/terms` đọc tệp ở `frontend/public/policies` (bản mẫu).
