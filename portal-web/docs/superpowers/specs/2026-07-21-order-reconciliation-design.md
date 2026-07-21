# Đối soát suất ăn theo phiên bản & chuyến bay (Order reconciliation)

- **Ngày:** 2026-07-21
- **Trạng thái:** Design — chờ review
- **Module:** `src/modules/catering`, `src/pages/catering/orders`, `src/pages/catering/grouping`
- **Liên quan:** UC-11 Supplier orders, UC-10 sales quota, UC-06 crew meal

## 1. Vấn đề

Người chuẩn bị suất ăn nhìn vào order detail (VD `ORD-SGN-20260715`, 26 dòng, 4.192 suất) và cần **chắc chắn số suất từng món là đúng** trước khi gửi nhà cung cấp. Hiện order chỉ hiển thị **tổng theo món** — không truy được con số đến từ đâu, cũng không thấy nó **thay đổi bao nhiêu, ở chuyến nào** giữa các lần chỉnh.

## 2. Nghiệp vụ thật (nguồn gốc của "lệch")

"Lệch" **phần lớn không phải AI sai** mà là sự kiện nghiệp vụ hợp lệ:

1. Order `v1` được tạo từ các nhóm đã confirm (aggregate premeal từ crew-list).
2. Sau khi tạo, **khách book thêm suất** trên một số chuyến cụ thể.
3. User nhận request → **sửa số suất trực tiếp ở chuyến bị ảnh hưởng** → hệ thống tạo **version mới** (`v2`).

⇒ Cái cần "đối soát" là **delta giữa hai version, quy về từng chuyến bay**. Ngoài ra, lần đối soát `v1 ↔ nguồn crew-list` còn dùng để bắt **sai số gốc** (VD bug rollup ở mục 11).

## 3. Quyết định thiết kế (đã chốt)

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | **Chuyến bay là nguồn sự thật.** User sửa số suất per-chuyến-per-món; order line = **roll-up dẫn xuất** | Chọn "sửa trực tiếp từng chuyến" |
| D2 | Đối soát = **so sánh version (delta)**, mở dạng **drawer bên phải** từ Version History | Approach B |
| D3 | Drill sâu nhất **tới chuyến bay** (không xuống mã PBML per chuyến) | |
| D4 | **Chỉ hiện dòng có thay đổi**; dòng không đổi gộp/ẩn. **Không tag "khớp"**, chỉ chip delta `+`/`−` | "báo ngoại lệ, không trang trí cái bình thường" |
| D5 | **Không gate chặn gửi, không bắt nhập lý do.** Bản thân danh sách delta là bước review | |
| D6 | Xuất **CSV** bảng đối soát để bàn giao | |

## 4. Mô hình dữ liệu

### Hiện trạng (gap)

- `CateringOrderLine` = `{ name, category, pbmlCodes, suggested, qty }` — **chỉ tổng theo món** (`orderTypes.ts`).
- `FlightLeg` có `premeal?` (tổng) **nhưng không có breakdown theo món** (`groupingTypes.ts`).
- Per-dish theo chuyến chỉ tồn tại ở `RawFlight.meals`; khi group, `autoGroupFlights` **gộp lên cấp nhóm** (`FlightGroup.meals`) → **mất chi tiết per-chuyến** (`grouping.ts:251`, `grouping.ts:305`).

⇒ Không thể quy delta về chuyến, cũng không truy được order line → chuyến.

### Thay đổi cần thiết

1. **Giữ per-dish ở cấp leg:** thêm `meals?: MealBreakdownItem[]` vào `FlightLeg`. `autoGroupFlights` khi push leg thì copy `f.meals` vào leg (song song với rollup nhóm hiện có).
2. **Snapshot vào version:** thêm vào `CateringOrder` một breakdown bất biến:

   ```ts
   interface OrderSourceCell {
     category: OrderCategory      // prebook | crew | sales
     name: string                // dish name / crew|sales key
     groupId: string
     flightNo: string
     dep: string; arr: string
     qty: number
   }
   interface CateringOrder {
     // …hiện có…
     breakdown: OrderSourceCell[] // ảnh chụp nguồn tại thời điểm tạo version
   }
   ```

3. **`lines` trở thành dẫn xuất** từ `breakdown` (aggregate theo `name`). `buildOrderLines` (`orders.ts:63`) refactor để phát ra **cả** `breakdown` lẫn `lines` (đổi tên → `buildOrderSnapshot`).

> Snapshot này phục vụ **cả hai**: (a) truy vết order line → chuyến, (b) tính delta giữa version. Vì bất biến nên delta luôn ổn định kể cả khi nhóm nguồn thay đổi sau đó.

## 5. Luồng chỉnh sửa (D1 — flight as source of truth)

- Order line `qty` trong `OrderDetailPage` chuyển **read-only (dẫn xuất)** — bỏ stepper chỉnh trực tiếp (vì không thể sửa tổng mà không biết quy vào chuyến nào).
- Thêm surface **sửa suất theo chuyến**: từ order (hoặc từ Flight grouping) user chọn chuyến bị ảnh hưởng → chỉnh số theo món. Lưu → tạo `CateringOrder` version mới với `breakdown` cập nhật; `lines` tự re-derive.
- Delta = `breakdown(vN) − breakdown(vN‑1)` theo `(name, flightNo)`.

## 6. UX — Drawer đối soát

**Điểm vào:** Version History (rail phải order detail) → mỗi version có affordance "Đối soát" → mở drawer phải (antd `Drawer`, ~460px, overlay lên rail, đóng để quay lại).

**Nội dung drawer** (xem mockup đã duyệt):
- Header: `Đối soát phiên bản` · "v2 (mới) so với **v1 ▾**" (đổi mốc so sánh; v1 mặc định so với **nguồn crew-list**).
- Summary strip: `Δ +19 suất · 3 dòng thay đổi · 23 dòng giữ nguyên`.
- **Danh sách chỉ dòng thay đổi**, mỗi dòng: `cũ → mới` + chip delta (**+ xanh / − đỏ**). Bung ra → **delta theo chuyến**: `VJ627 SGN→PQC · nhóm #12 · 40→48 · +8`.
- Dòng không đổi gộp 1 hàng mờ "23 dòng không đổi · ẩn".
- Footer: `Δ ròng +19 suất` + **Xuất CSV**.

**Danh sách order chính:** để trơn, **không tag khớp**; chỉ dòng có delta so với version trước mang chip `+/−` nhỏ + viền trái màu. Thanh completeness ở đầu trang cảnh báo **nhóm chưa confirm → suất chưa vào order** (lỗi âm thầm).

## 7. Đối soát v1 ↔ nguồn

Với `v1` (chưa có version trước), mốc so sánh mặc định = **breakdown dựng lại từ crew-list/nhóm confirm hiện tại**. Chênh lệch ở đây = sai số gốc (thiếu nhóm confirm, hoặc bug rollup mục 11) → cùng UI delta.

## 8. Xuất CSV (D6)

`reconcileCsv(orderVersionNew, base)` → hàng = một `(dòng món, chuyến)` có thay đổi, cột: `Món, PBML, Nhóm, Chuyến, Chặng, SL cũ, SL mới, Delta`. Header có `Order id, Station, Service date, v?, người/mốc thời gian`. Tải file `.csv` (UTF-8 BOM cho tiếng Việt).

## 9. Kiến trúc & ranh giới

| Đơn vị | Trách nhiệm |
|---|---|
| `modules/catering/orderTypes.ts` | +`OrderSourceCell`, `breakdown` trên `CateringOrder` |
| `modules/catering/orderSnapshot.ts` *(mới)* | `buildOrderSnapshot(groups,…)`, `deriveLines(breakdown)`, `deltaByFlightDish(a,b)`, `changedLines(delta)` — thuần, test được |
| `modules/catering/groupingTypes.ts` / `grouping.ts` | +`FlightLeg.meals`; `autoGroupFlights` copy per-leg |
| `pages/catering/orders/ReconcileDrawer.tsx` *(mới)* | Drawer delta (đọc) |
| Flight meal editor *(mới / mở rộng grouping)* | Sửa suất per-chuyến → version mới |
| `modules/catering/reconcileCsv.ts` *(mới)* | Xuất CSV |
| `OrderDetailPage.tsx` | Version History → nút Đối soát; line qty read-only |

## 10. Phân kỳ

- **P0 (guard, gần độc lập):** chống double/under-count sau `split/merge/moveLeg` (mục 11). Bản **guard** (không nhân đôi rollup) ship ngay được; nhưng **fix đúng theo chuyến cần `FlightLeg.meals` của P1** — nên P0 = chặn tạm, P1 = bản đúng.
- **P1 (data model):** `FlightLeg.meals` + `breakdown` snapshot + `deriveLines`; lines dẫn xuất; seed/migrate. Có test `orderSnapshot`.
- **P2 (drawer đọc):** delta list + bung theo chuyến, mở từ Version History. Chỉ hiện dòng đổi.
- **P3 (sửa theo chuyến):** tạo version mới bằng cách chỉnh suất per-chuyến.
- **P4 (CSV).**

## 11. Ngoài phạm vi / follow-up

- **Bug rollup cũ (nên fix sớm, độc lập):** `splitGroupAt`/`mergeGroups`/`moveLeg` (`grouping.ts`) **không tính lại** `group.meals` (spread `...g` giữ rollup cũ). `buildOrderLines → aggregateDayMeals` đọc `group.meals` ⇒ split → **đếm gấp đôi**, merge → **thiếu**. Làm số pre-book sai *ngay cả khi chưa có màn đối soát*. Fix **đúng** cần per-dish ở cấp leg (P1); trước đó chỉ nên **guard** để không nhân đôi/bỏ sót.
- Delta chi tiết cho **crew** (theo phi công/cữ ăn) và **sales** (theo quota chuyến) — bản này chỉ cần tổng; có thể mở rộng sau bằng cùng cơ chế snapshot.
- Đối soát đa ngày / phía nhà cung cấp — ngoài phạm vi.

## 12. Câu hỏi mở

- Surface "sửa suất theo chuyến" (P3) đặt trong **Flight grouping** hay một editor riêng mở từ order? (nghiêng về mở từ order để giữ ngữ cảnh).
- Có cần lưu **ai/khi nào** cho từng ô delta (audit per-cell) hay chỉ ở cấp version là đủ? (mặc định: cấp version).
