# Backend — Racehorse Transport

Spring Boot 3 (Java 21), Maven, kiến trúc N-layer, SQL Server.

## Yêu cầu
- JDK 21, Maven (hoặc dùng `./mvnw`)
- SQL Server cài sẵn (không dùng Docker). Tạo DB một lần: `CREATE DATABASE RacehorseTransport;`

## Chạy
```bash
export DB_URL="jdbc:sqlserver://localhost:1433;databaseName=RacehorseTransport;encrypt=true;trustServerCertificate=true"
export DB_USERNAME=sa
export DB_PASSWORD='...'
export JWT_SECRET='chuoi-bi-mat-it-nhat-32-ky-tu-xxxxxxxx'
./mvnw spring-boot:run
```
- Thiếu `DB_URL` hoặc `JWT_SECRET` thì app dừng với lỗi `Could not resolve placeholder ...`.
- Swagger: http://localhost:8080/swagger-ui.html
- Test dùng H2 (profile `test`), không cần SQL Server: `./mvnw test`

## Cấu trúc (`com.swp.racehorse`)
| Lớp | Việc |
|---|---|
| `controller` | Nhận request, trả `ApiResponse<T>` |
| `service` / `service.impl` | Nghiệp vụ (interface + cài đặt) |
| `repository` | Spring Data JPA |
| `entity` | Bảng DB |
| `dto.request` / `dto.response` | Dữ liệu vào/ra, validate bằng Bean Validation |
| `mapper` | Entity ⇄ DTO |
| `config` | CORS, Security, JWT, OpenAPI |
| `exception` | `BusinessException` (400), `NotFoundException` (404), `GlobalExceptionHandler` |
| `common` | `ApiResponse` |

## Thêm module mới theo mẫu Horse
entity → repository → dto → mapper → service + impl → controller → test. Xem `HorseServiceImpl` và `HorseServiceTest`.

## Lưu ý
- Profile `dev` dùng `ddl-auto=update` cho tiện; khi lên môi trường thật đổi sang script SQL + `validate`.
- `SecurityConfig` hiện mở mọi `/api/**`; `JwtService` mới là khung, chưa có filter và đăng nhập. Làm cùng module Account.
- Module Horse chưa có giấy tờ đính kèm (hộ chiếu, sổ tiêm, xét nghiệm); làm cùng module Document.
- Hợp đồng API cho FE: `../docs/API-CONTRACT.md`. Nghiệp vụ gốc: `../docs/PRD.md`.
