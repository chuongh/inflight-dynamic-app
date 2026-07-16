# OPP-016 — Use case & Business rule (Mobile · Purser / Cabin Crew)

**Phạm vi:** Dynamic Seatmap + Catering/suất ăn–hàng hóa trên **mobile app**.  
**Vai trò:** Purser · Cabin Crew.  
**Nguồn wiki (v0.2, đông cứng 2026-07-03):** Use Case Spec · BRD · SRS (meeting 2026-07-02).  
**Đối chiếu prototype:** `index.html` (cập nhật 2026-07-13).  
**Nguồn mock suất ăn / ca trực:** [meal-data-sources.md](./meal-data-sources.md) (GC-SGN + Crew List 08 Jul).

---

## 0. Ranh giới quan trọng

| Việc | Ai làm | Nền tảng |
|------|--------|----------|
| Tính / duyệt / chốt suất cần chuẩn bị (UC-06, UC-18, UC-10) | Vận hành suất ăn · Cung ứng · Commercial | **Web Portal** |
| Tra cứu HK, phục vụ, nạp offline (UC-03) | Purser · Cabin Crew | **Mobile** |
| Nhận & đối chiếu số suất đã chuẩn bị theo nhóm uplift | Purser · Cabin Crew | **Mobile** (đọc từ Portal) |
| Khai báo hàng bán · Purser xác nhận · sync 1 người (UC-07) | Cabin → Purser | **Mobile** |
| VIP/SkyBoss notif + **tạo request** (UC-17) | **Back office / Supply** | **Web Portal** (không tạo trên mobile crew) |

→ App crew **không** thay UC-06. App crew **nhận kết quả** + seatmap + bán hàng.

---

## 1. Dynamic Seatmap — Use case cần đạt (mobile)

| ID | Việc | Actor |
|----|------|--------|
| UC-03 / BR-004 | Tra cứu HK: sơ đồ ghế · scan boarding pass · ghế/tên | Cả hai |
| UC-03 / FR-M2-8 | Unified Passenger Profile: tên · ghế · PNR · **DOB** · SSR · **pre-meal** · **merchandise** · **nối chuyến** | Cả hai (PII theo quyền) |
| UC-03 / FR-M2-11 | Seatmap grid; tô ghế SSR / pre-meal; chạm ghế → hồ sơ | Cả hai |
| UC-03 A1 / FR-M2-9 | Tổng quan chuyến: sĩ số · danh sách SSR · tổng suất ăn | **Purser** |
| UC-03 bước 4 | Đánh dấu đã phục vụ (offline) | Cả hai |
| FR-M2-2 + BRule-06 | Còn mạng → nạp/reload manifest theo chuyến/nhóm trước cất cánh | Cả hai |
| FR-M2-10 | Hạ cánh có wifi → đồng bộ trạng thái **per-leg** | Cả hai |
| UC-03 E1 | Chưa nạp → chặn tra cứu, báo chưa có dữ liệu offline | Cả hai |

> **UC-17 / BR-018** (tạo yêu cầu bổ sung VIP/SkyBoss): **không** trên mobile crew — Back office / Portal. Notif push cho crew (nếu có) là Should riêng, chưa demo.

### Business rules (Seatmap)

| ID | Quy tắc |
|----|---------|
| BRule-01 | PII HK chỉ cho role đang phục vụ chuyến đó (demo: DOB gate `view_sensitive`) |
| BRule-06 | Offline: nạp trước cất cánh; chỉ sync khi có wifi |
| NFR | Tra cứu offline &lt; 3s; xóa cache sau chuyến |

> **BRule-15** (chống trùng VIP request) áp dụng Portal/Back office khi tạo request — không trên mobile crew.

---

## 2. Catering trên mobile — Use case cần đạt

| ID | Việc trên mobile | Actor |
|----|------------------|--------|
| *(Nhận số liệu)* / BRule-07 | Xem/đối chiếu suất theo **nhóm chặng uplift** (premeal + định mức + tổ bay) | Cả hai; Purser chịu đối soát |
| UC-07 / BR-008 | Khai báo hàng đã bán theo **trolley + từng chặng** (offline) | Cabin (từng trolley) |
| UC-07 | Tổng hợp trolley → **Purser review & xác nhận** | **Purser** |
| UC-07 / FR-M4-10 / BR-021 | 1 người (Purser/lead) export JSON toàn chuyến → upload → cả tổ nhận; cảnh báo **stock-out theo chặng** | **Purser** |
| BRule-11 / BR-015 | Bàn giao lệch số: bên bàn giao cập nhật (Crew→Supplier = tiếp viên) | Purser / Cabin khi bàn giao |
| UC-20 / BR-020 | Yêu cầu bổ sung thiết bị/vật tư catering trước chuyến | Cabin (+ Supplier) |

### Business rules (Catering · crew phải tôn trọng)

| ID | Quy tắc | Ý trên app crew |
|----|---------|-----------------|
| BRule-07 | Chuẩn bị tại sân bay có catering cho **CẢ nhóm uplift** | Xem/đối chiếu theo **nhóm**, không chỉ 1 chặng |
| BRule-04 | Suất phi công: 4 buổi 08/12/16/20 ±1h | Crew **không tính** — chỉ đọc số từ plan |
| BRule-06 | Offline nạp trước, sync sau | Áp dụng bán hàng + trạng thái phục vụ |
| BRule-11 | Bên bàn giao cập nhật khi lệch | Luồng chỉnh số sau nhận hàng |
| BRule-13 | Chốt 15:00 T-1 + Delta View không ghi đè | Portal/Supply — crew không sửa số đã chốt |
| BRule-10 | Định mức BoB có hiệu lực theo ngày | Portal; mobile bán trong định mức đã nạp |

### Không thuộc mobile Purser/Cabin

| UC | Actor | Nơi làm |
|----|--------|---------|
| UC-06 | Vận hành suất ăn | Web Portal |
| UC-10 | Commercial | Web Portal / AI ingest |
| UC-11 | Vận hành / Commercial | Web Portal dashboard bán |
| UC-18 | Cung ứng | Portal chốt + Delta View |
| UC-19 | Hệ thống → IFS | Tự đề xuất trolley |
| UC-17 (tạo request VIP/SkyBoss) | Back office / Supply | **Web Portal** |

---

## 3. Tách vai trò trên mobile

| Việc | Purser | Cabin Crew |
|------|--------|------------|
| Seatmap + hồ sơ + đánh dấu phục vụ | Có | Có |
| Tổng quan chuyến (sĩ số, SSR, tổng suất) | Có (FR-M2-9) | Không bắt buộc |
| Nạp pack/manifest offline | Có | Có |
| Khai báo bán theo trolley | Có thể | Có (chính) |
| Xác nhận tổng bán / bàn giao | **Bắt buộc** | Không |
| Sync bán hàng 1 người (JSON) | **Lead** | Nhận dữ liệu đã sync |
| VIP/SkyBoss **tạo** request | Không (Portal) | Không (Portal) |
| Tính / chốt / duyệt suất (UC-06/18) | Không | Không |

---

## 4. Checklist Must / Should (tóm tắt)

### Dynamic Seatmap — Must

1. Nạp offline trước bay; chặn nếu chưa nạp  
2. Seatmap + search ghế/tên (+ scan nếu có)  
3. Hồ sơ đủ: DOB · SSR · pre-meal · merchandise · nối chuyến  
4. Tô ghế SSR / pre-meal  
5. Đánh dấu đã phục vụ offline → sync per-leg  
6. Purser: tổng quan sĩ số / SSR / tổng suất  
7. PII đúng BRule-01  

### Catering mobile — Must / Should (M4 = Must theo scope 2026-07-02)

1. Xem/đối chiếu suất theo **nhóm uplift** (không thay UC-06)  
2. Khai báo bán theo trolley + chặng (offline)  
3. Purser xác nhận tổng  
4. Sync 1 người + cảnh báo hết hàng theo chặng  
5. ~~Notif VIP/SkyBoss + tạo request~~ → **Portal / Back office** (không Must mobile crew)  
6. (Should) Yêu cầu bổ sung trước chuyến (UC-20)  

---

## 5. Đối chiếu prototype (`index.html`)

Trạng thái:

| Ký hiệu | Nghĩa |
|---------|--------|
| ✅ | Đạt / đủ để demo đúng tinh thần UC |
| ⚠️ | Có một phần — thiếu rule hoặc sai actor |
| ❌ | Chưa có |

### 5.1 Dynamic Seatmap

| # | Checklist OPP-016 | Prototype | Ghi chú |
|---|-------------------|-----------|---------|
| 1 | Nạp offline trước bay | ✅ | **Tải gói** theo nhóm (`S.packByGroup`, strip Ca trực). |
| 2 | Chặn tra cứu nếu chưa nạp | ✅ | `SeatScreen` chặn khi pack chưa ready + CTA tải (UC-03 E1). |
| 3 | Seatmap grid | ✅ | `/crew/flight/:no/seats` — map + list. |
| 4 | Search ghế / tên / PNR | ✅ | `paxList` tìm tên, ghế, PNR. |
| 5 | Scan BP trên seatmap (crew) | ❌ | Scan BP Home = “Sắp có”; `/scan` là mặt đất. |
| 6 | Hồ sơ: tên · ghế · PNR | ✅ | `PaxDetail`. |
| 7 | Hồ sơ: DOB | ✅ | Gate `crew_ops.pax.view_sensitive` — Purser + Cabin Crew đều thấy (phục vụ chuyến). |
| 8 | Hồ sơ: SSR | ✅ | Có trên seat (tô) + pax detail + filter list. |
| 9 | Hồ sơ: pre-meal | ✅ | Trong `services` (món ăn); filter “Có suất ăn”. |
| 10 | Hồ sơ: merchandise | ✅ | Nhãn merchandise / DUTY trên pax detail. |
| 11 | Hồ sơ: nối chuyến | ✅ | Hiển thị transit trên `PaxDetail`. |
| 12 | Tô ghế SSR / pre-meal | ✅ | Class `ssr` / `svc` (+ transit). |
| 13 | Đánh dấu đã phục vụ offline | ✅ | Toggle “Đã phục vụ” trên `PaxDetail` (`S.served`). |
| 14 | Sync per-leg khi có wifi | ⚠️ | Hint offline/sync trên pax; chưa export JSON thật. |
| 15 | Purser tổng quan sĩ số / SSR / tổng suất | ⚠️ | Panel Purser trên Ca trực + flight detail; chưa 1 màn FR-M2-9 riêng. |
| 16 | VIP/SkyBoss **tạo** request (UC-17) | N/A | **Portal / Back office** — đã gỡ stub khỏi crew mobile. |

### 5.2 Catering (mobile)

| # | Checklist OPP-016 | Prototype | Ghi chú |
|---|-------------------|-----------|---------|
| 1 | Xem suất theo **nhóm uplift** | ✅ | `/crew/meals` · **chỉ ca trực** (G1) · SkyBoss Order + tổ bay; disclaimer UC-06 Portal. |
| 2 | BRule-07 nhóm (không chỉ 1 chặng) | ✅ | Toàn bộ chặng trong nhóm ca trực (không tab Nhóm 1/2). |
| 3 | BRule-04 suất phi công (đọc, không tự tính tay trên UI crew) | ✅ | Timeline cửa sổ bữa; số từ `cockpitCalc` (đúng tinh thần đọc plan). |
| 4 | Đối chiếu / xác nhận nhận hàng (BRule-11) | ✅ | Purser: khớp 1 chạm **hoặc** lệch → nhập **received** theo dòng (plan bất biến) + reason + Δ; Cabin xem. |
| 5 | UC-07 khai báo bán theo trolley + chặng | ✅ | `/crew/sales`, `/crew/sales/:flightNo` — qty theo catalog + trolley. |
| 6 | Purser xác nhận tổng bán | ✅ | Purser review + confirm per leg (`S.salesConfirm`). |
| 7 | Sync 1 người + stock-out per-leg (FR-M4-10) | ⚠️ | Nút sync demo + banner stock-out; chưa export JSON thật. |
| 8 | UC-20 yêu cầu bổ sung trước chuyến | ❌ | — |
| 9 | Tách Purser vs Cabin trên catering UI | ✅ | Ca trực panel khác nhau; strip/meals/sales label & action theo role. |

### 5.3 Ngoài phạm vi checklist nhưng ảnh hưởng demo

| Vấn đề | Mức | Ghi chú |
|--------|-----|---------|
| CREW_2 (assign station, voyage sign, BoB) chưa UI | P2 | Perm có trên Purser; chưa màn. |
| Registration theo nhóm (G1 `VN-A202` / G2 `VN-A521`) | ✅ | Crew List 08 Jul · tách theo nhóm uplift. |
| Back flight detail → `/crew` | ✅ | Đã sửa. |
| `/crew/flights` orphan, chủ yếu G1 | P1 IA | Trùng Ca trực. |

---

## 6. Ưu tiên đóng gap (đề xuất)

### P0 — lệch Must OPP-016 — **đã đóng (demo)**

1. ~~Chặn seatmap khi chưa tải gói~~ ✅  
2. ~~Gate DOB / PII~~ ✅  
3. ~~Đánh dấu đã phục vụ~~ ✅ (sync hint ⚠️)  
4. ~~Hồ sơ merchandise · nối chuyến~~ ✅  

### P1 — Catering mobile / role — **đã đóng (demo)**

5. ~~Đối chiếu / xác nhận nhận suất~~ ✅  
6. ~~UC-07 khai báo + Purser confirm~~ ✅  
7. ~~Tách UI Purser vs Cabin~~ ✅  

### P2 — Should / polish (còn lại)

8. Scan BP trong ngữ cảnh seatmap (crew), tách rõ với `/scan` mặt đất.  
9. UC-20 / FR-M4-10 export JSON thật khi chốt.  
10. CREW_2 UI (assign station, voyage sign, BoB).  
11. (Portal) UC-17 tạo VIP request + BRule-15 — ngoài phạm vi mobile crew.  

---

## 7. Tham chiếu nhanh route prototype

| Route | Màn | Liên quan OPP-016 |
|-------|-----|-------------------|
| `/crew` | Ca trực | Panel Purser/Cabin · nạp pack · meals · sales · seatmap |
| `/crew/meals` | Suất ăn cần chuẩn bị | Nhận số UC-06 + Purser ack (BRule-11) |
| `/crew/sales` | Hub hàng bán | UC-07 list theo chặng |
| `/crew/sales/:flightNo` | Khai báo / xác nhận bán | Cabin declare · Purser confirm |
| `/crew/flight/:no` | Chi tiết chặng | Sĩ số · SSR · vào seats · pack chặng |
| `/crew/flight/:no/seats` | Seatmap / list | UC-03 (chặn nếu chưa pack) |
| `/crew/flight/:no/pax/:seat` | Chi tiết HK | UC-03 profile · served · DOB gate (BRule-01) |
| `/crew/flights` | (orphan) | Không dùng trong luồng Ca trực chính |

---

*Tài liệu này phục vụ BA/UX đối chiếu MVP mobile. Khi wiki OPP-016 lên bản mới hơn v0.2, cập nhật mục 1–4 trước, rồi chỉnh lại mục 5.*
