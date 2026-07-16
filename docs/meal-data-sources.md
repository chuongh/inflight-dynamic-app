# Nguồn dữ liệu suất ăn & ca trực (prototype)

Đối chiếu mock `index.html` với file từ Catering / Crew Planning.

---

## 1. Menu món — `full-crew-meal-16-7.xlsx`

**Sheet:** `rpCrewListNew` · hàng 6 (cột P→AL) = danh mục món / combo dùng cho **uplift** trước bay.

| Mã mock | Tên (hàng 6) | Nhóm |
|---------|--------------|------|
| CM01–CM10 | Mì Ý · Miến xào tôm cua · Bánh chưng chà bông · Bún xào Singapore · Cơm chiên Thái · Xôi mặn · Xôi khúc chả chiên · Cơm bò · Cơm dừa Malaysia · Bánh mì Viêt Nam | Món chính |
| CM11–CM17 | Khoai viên chay… · Cơm cà ri gà/cá · Cơm chiên dương châu chay · Cơm Basmati… · Bún/Cơm basmati chay Business | Suất chay |
| CM18–CM23 | Combo snack · Combo miến cua… · VCS veg box · Bia+khô gà… · Soda dâu… · Happy meal | Combo |

**Qty thật:** map từ tàu `VN-A202` (16 Jul: VJ447/440/441/442) → ca demo G1 `VJ127…VJ645` theo thứ tự chặng.  
`VN-A521` / VJ969 → demo `VJ895`.

**Trên mobile:** màn **Suất ăn cần chuẩn bị** (`/crew/meals`) — hiện đúng tên món hàng 6 + qty Crew List. Không dùng menu này cho UC-07 chốt bán (để sau).

Constant: `CREW_MEAL_CATALOG` · `CATERING_UPLIFT_BY_FLIGHT` trong `index.html`.

---

## 2. Crew List duty (08 Jul — lịch ca demo)

Vẫn dùng Crew List 08 Jul cho **route / đăng ký / tổ bay** demo (`VN-A202` G1, `VN-A521` G2).  
Menu món lấy từ file **16 Jul** như trên (cùng đuôi số đăng ký).

Login demo Purser: `purser` → ca G1 (`VN-A202`).

---

## 3. UI `/crew/meals` — Suất ăn cần chuẩn bị

| Section | Nội dung |
|---------|----------|
| ① | **Suất theo chặng** — món từ hàng 6 Excel + qty crew list |
| ② | Suất tổ bay (cockpit theo giờ trực) |

UC-07 Chốt trolley (bán/tồn) — **tạm ẩn trên Ca trực / Home**; route `/crew/sales` còn trong code để làm sau.
