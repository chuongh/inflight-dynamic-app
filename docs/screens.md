# Inflight Dynamic App — Danh sách màn hình

Nguồn: `index.html` (router `buildView`).

Tổng cộng khoảng **20 màn thật**. Một số module trên Trang chủ chỉ có tên, chưa có route.

**OPP-016 (Purser / Cabin · Seatmap + Catering):** xem [opp-016-crew-catering-seatmap.md](./opp-016-crew-catering-seatmap.md) — use case, business rule, và đối chiếu checklist với prototype.

**Nguồn mock suất ăn / ca trực:** [meal-data-sources.md](./meal-data-sources.md) — GC-SGN + Crew List 08 Jul.

---

## Auth

| Route | Màn |
| --- | --- |
| `/login` | Đăng nhập |
| `/forgot` | Quên mật khẩu |
| `/unlock` | Mở khóa Face ID |

---

## Tab chính (sau đăng nhập)

| Route | Màn |
| --- | --- |
| `/home` | Trang chủ (launcher module) |
| `/crew` | Ca trực (crew dashboard) |
| `/work` | Công việc thiết bị (equipment dashboard) |
| `/notifications` | Thông báo |
| `/profile` | Hồ sơ |

Tab **Ca trực** chỉ hiện với crew; tab **Công việc** chỉ hiện với equipment manager.

---

## Tổ bay (crew)

| Route | Màn |
| --- | --- |
| `/crew/flight/:flightNo` | Chi tiết chuyến |
| `/crew/flight/:flightNo/seats` | Seatmap · zone Cabin / overview Purser · Scan BP |
| `/crew/flight/:flightNo/pax/:seat` | Chi tiết HK · CTA theo context · bán tại ghế |
| `/crew/flight/:flightNo/scan` | Scan BP / nhập PNR trên chặng |
| `/crew/meals` | Suất ăn cần chuẩn bị (món Crew List 16 Jul hàng 6 · đối chiếu trước bay) |
| `/crew/sell-meal` | **Bán tại ghế** · chọn chuyến |
| `/crew/sell-meal/:flight` | Chọn ghế trên chặng |
| `/crew/sell-meal/:flight/:seat` | Chọn món + nhận/trả lại FX |
| `/crew/sales` | **Chốt trolley** (UC-07) — hub theo chặng |
| `/crew/sales/:flightNo` | Khai báo (Cabin) / xác nhận (Purser) |
| `/crew/scan-pick` | Scan BP crew · chọn chuyến |
| `/crew/flights` | Redirect → tab Ca trực |

Login demo: `purser` (Cửa L1 · Tuyet 1 · Nguyễn Thị Cam) vs `cabincrew` (Cửa R1 · Hang 32 · Võ Thu Hằng).

---

## Mặt đất (ground)

| Route | Màn |
| --- | --- |
| `/scan` | Quét boarding pass |
| `/passenger` | Hồ sơ hành khách (sau quét) |

---

## Thiết bị (equipment)

| Route | Màn |
| --- | --- |
| `/equipment/base` | Chọn base airport |
| `/equipment/not-service` | Chờ gửi sửa |
| `/equipment/register` | Đăng ký trolley mới |
| `/equipment/:code` | Chi tiết thiết bị |

---

## Khác

| Route | Màn |
| --- | --- |
| (không khớp) | `404` NotFound |

---

## Module trên Trang chủ (chưa có màn / route)

Các ô launcher đã đặt tên nhưng `route: null`:

| ID | Tiêu đề | Vai trò |
| --- | --- | --- |
| `scan_bp` | Scan Boarding Pass | Tổ bay |
| `call_ride` | Gọi xe | Tổ bay |
| `airport_map` | Xem bản đồ sân bay | Tổ bay |
| `ops_ride` | Xe vận hành | Ramp driver |
| `catering_ops` | Suất ăn & Hàng hoá | Catering |
| `devices` | Thiết bị | Engineer |

Ngoài ra còn các placeholder chung (`ph_1` … `ph_3`) hiện dạng “Tính năng N”.

### Module đã có route thật

| ID | Tiêu đề | Route |
| --- | --- | --- |
| `ground_ops` | Mặt đất · Quét thẻ | `/scan` |
| `equipment` | Quản lý thiết bị | `/equipment/base` |
