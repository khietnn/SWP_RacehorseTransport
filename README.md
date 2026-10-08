# Racehorse Transport

```
backend/    Spring Boot (N-layer, SQL Server): xem backend/README.md
frontend/   React + Vite: chỉ giao diện, dữ liệu lấy từ /api
docs/       PRD.md (nghiệp vụ gốc), API-CONTRACT.md (hợp đồng API giữa FE và BE)
```

## Chạy
1. Backend: làm theo `backend/README.md` (cổng 8080).
2. Frontend:
   ```bash
   cd frontend && npm install && npm run dev
   ```
   Mở http://localhost:5173. Vite chuyển `/api` sang `http://localhost:8080`.

Giao diện không còn dữ liệu mẫu: màn hình nào chưa có API tương ứng sẽ báo lỗi cho tới khi BE làm xong.
