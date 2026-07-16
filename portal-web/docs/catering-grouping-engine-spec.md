# Catering Grouping Engine — Backend Specification

> Đặc tả thuật toán gom nhóm chuyến bay + tính suất ăn cho module Catering Planner (UC-11).
> Đây là bản đặc tả để backend triển khai (Java/Python/Go/…). Bản tham chiếu (reference
> implementation) chạy ở frontend tại `src/modules/catering/grouping.ts`,
> `crewMeal.ts`, `groupCrewMeal.ts`. Field names, pseudocode và công thức giữ nguyên
> tiếng Anh để map trực tiếp sang DTO/DB.

---

## 0. TL;DR (business context)

Một nhân viên catering tại một **trạm có catering** (danh sách do config `hasCatering` quyết
định, xem §7) cần chuẩn bị đơn hàng suất ăn cho các **hành trình (rotation)** của tàu bay
khởi hành tại trạm của họ.

Chính sách uplift của VietJet:
1. Suất ăn được **nạp (uplift) MỘT lần tại điểm khởi hành (origin)** của rotation và cover
   **toàn bộ các chặng** của rotation đó.
2. Tàu bay **KHÔNG được nạp lại** khi chỉ **quá cảnh** một trạm catering khác (để đơn giản
   hoá check-in/check-out).
3. Một rotation chỉ bị **tách (split)** thành uplift mới **khi vi phạm rule cấu hình VÀ
   điểm tách là một trạm có catering** — nơi duy nhất có thể nạp mới:
   - `group_by_purser`: đổi purser **tại một chặng cất cánh từ trạm catering**.
   - `group_by_flight_hour`: tổng giờ bay tích luỹ vượt ngưỡng, **tách tại trạm catering kế tiếp**.
   - Đổi purser tại điểm quay đầu **không có catering** ⇒ **KHÔNG tách** (uplift gốc phải cover).

Gom nhóm chạy **global cho tất cả trạm catering một lần**. Mỗi group có `origin = chặng đầu
tiên .dep`. Planner tại trạm S xem các group có `origin == S`. Các chuyến không rơi vào group
nào của bất kỳ trạm catering nào (origin là sân bay không catering) là **pending** (chờ review).

**Tiền đề (bắt buộc):** trước khi gom nhóm phải **gán chuyến vào đúng ngày dịch vụ theo ngày
nạp suất** (§7.1) — một vòng bay qua đêm bị crew-list cắt ngang nửa đêm phải được gộp về một
ngày, nếu không chặng "về" sáng hôm sau sẽ mồ côi khi engine chạy theo từng ngày.

---

## 1. I/O Contract

### 1.1 Input — `RawFlight` (một dòng crew-list, trước khi group)

```
RawFlight {
  flightNo:      string          // "VJ860"
  aircraft:      string          // tail number, "VN-A525" — KHOÁ gom nhóm
  aircraftType:  string          // giữ nguyên raw, vd "A321", "Airb"
  dep:           string          // ICAO/IATA 3 ký tự, "SGN"
  arr:           string          // "ICN"
  std:           string          // giờ khởi hành local "HH:MM"
  sta:           string          // giờ đến local "HH:MM"
  purser:        string          // tên purser (cabin lead) — dùng cho rule đổi purser
  purserCode:    string          // mã NV của purser — KHOÁ so sánh đổi purser
  intl:          boolean         // chuyến quốc tế
  stdNextDay?:   boolean         // STD sang ngày kế (dấu '+' trên STD nguồn)
  staNextDay?:   boolean         // STA sang ngày kế (dấu '+' trên STA nguồn)
  premeal?:      number          // tổng suất pre-order của chuyến này
  meals?:        MealBreakdownItem[]   // breakdown theo món (chỉ món > 0)
  cockpitCrew?:  CockpitCrewMember[]   // roster buồng lái có tên
}

MealBreakdownItem { name: string; count: number }

CockpitCrewMember {
  role:    string        // "CP","FO","CP/T","FO/T","CP-Pax","FO-Pax"
  name:    string
  code:    string        // mã NV — khoá dedupe qua các chặng
  riding?: boolean       // true nếu positioning/deadhead (-Pax) — không lái chặng này
}
```

**Lưu ý xử lý giờ qua đêm:** nguồn crew-list đánh dấu `+` trên STD/STA cho ngày kế. Khi
extract, ta **bỏ dấu `+` khỏi chuỗi giờ (lưu HH:MM sạch) NHƯNG giữ lại thành 2 cờ boolean
`stdNextDay`/`staNextDay`**. Hai cờ này là **bắt buộc** cho: (a) hiển thị `+1`, (b) sắp xếp
chặng đúng thứ tự (§3, `legSortKey` — TIN cờ, KHÔNG đoán theo giờ), (c) tính duty span suất tổ
lái qua đêm (§8, `depDay`/`arrDay`). **Mọi chặng sang ngày kế PHẢI mang cờ**: `legSortKey`
không còn heuristic "trước 04:00 = ngày kế", nên một chặng ngày-kế thiếu cờ sẽ bị sắp SAI (coi
là đầu ngày thay vì cuối) và duty span qua đêm cũng tính SAI. Ngược lại, một chặng cất cánh rạng
sáng **trong chính** ngày dịch vụ (đã được day-attribution gán đúng, §7.1) đúng là **không** có
cờ và sắp đầu ngày. `legDurationMin = (sta − std + 1440) mod 1440` vẫn đúng độc lập với cờ.

### 1.2 Options — cấu hình chạy engine

```
AutoGroupOptions {
  cateringStations: Set<string>   // mã trạm có catering ĐANG enable (config) — bắt buộc
  groupByPurser:    boolean       // rule group_by_purser đang bật?
  maxHours?:        number        // từ rule group_by_flight_hour (nếu bật); absent = không cap
  quotaByFlightNo?: Map<string, { hotmeal:number; banhMi:number; traSua:number }>
}
```

Nguồn của options (xem §7):
- `cateringStations` = tập mã **airport có `hasCatering` và `status=="active"`** từ airport master-data (WP-B) — KHÔNG hardcode.
- `groupByPurser` = có rule `group_by_purser` với `enabled=true` trong version cấu hình đang active.
- `maxHours` = `maxHours` của rule `group_by_flight_hour` nếu `enabled=true`, ngược lại `undefined`.
- `quotaByFlightNo` = map `flightNo → quota` từ version inflight-quota (UC-10) đang active.

### 1.3 Output — `FlightGroup`

```
FlightGroup {
  id:            string          // "ag1","ag2"… (ổn định trong 1 lần chạy)
  aircraft:      string
  aircraftType:  string
  purser:        string          // = purser của CHẶNG ĐẦU (purser uplift gốc)
  purserCode:    string
  confidence:    "high" | "mid"  // engine đặt "high"; "mid" = cần review (hiện chưa auto-set)
  confirmed:     boolean         // false khi mới tạo
  reviewNote?:   string
  legs:          FlightLeg[]     // theo thứ tự thời gian
  premealTotal?: number          // tổng premeal các chặng (chỉ set khi > 0)
  meals?:        MealBreakdownItem[]   // breakdown theo món toàn group, desc theo count
}

FlightLeg {
  flightNo, dep, arr, std, sta: string
  intl:        boolean
  stdNextDay?: boolean           // chặng cất cánh sang ngày kế (từ dấu +)
  staNextDay?: boolean           // chặng hạ cánh sang ngày kế
  premeal?:    number
  cockpitCrew?: CockpitCrewMember[]
  salesQuota?: { hotmeal:number; banhMi:number; traSua:number }
}
```

---

## 2. Helper functions (bắt buộc chính xác)

```
// Tập trạm catering KHÔNG hardcode — DERIVED từ airport master-data (WP-B):
// airport có hasCatering=true VÀ status=='active'. Truyền set vào engine + view.
cateringStationSet(airports) = { a.code | a ∈ airports, a.hasCatering, a.status=='active' }
isCateringStation(code, set) = code ∈ set

toMinutes("HH:MM") = HH*60 + MM

// Khoá sắp xếp chặng: TIN cờ stdNextDay tường minh — KHÔNG đoán theo giờ.
// Mọi chặng thật sự sang ngày kế trong seed đều mang cờ stdNextDay (vd chặng về red-eye giữ
// ở ngày của chặng đi, §7.1). Một chặng cất cánh rạng sáng NGAY TRONG ngày dịch vụ (vd outbound
// 01:40 đã gán đúng ngày bay) KHÔNG có cờ → phải sắp ĐẦU tiên. Heuristic "h<4 = ngày kế" cũ
// đẩy nhầm chặng này xuống cuối rotation ⇒ tách nhầm group (chặng đi mồ côi, chặng về rớt pending).
legSortKey(f):                     // f có { std:"HH:MM", stdNextDay?:bool }
    (h, m) = parse(f.std)
    nextDay = (f.stdNextDay == true)
    return (nextDay ? 24 : 0) * 60 + h*60 + m

// Thời lượng bay 1 chặng (phút), xử lý qua đêm bằng modulo 1440.
legDurationMin(leg) = (toMinutes(leg.sta) - toMinutes(leg.std) + 1440) mod 1440

// Origin (trạm nạp suất) của group = điểm khởi hành của chặng đầu.
groupOrigin(group) = group.legs[0].dep    // "" nếu rỗng
```

---

## 3. Thuật toán gom nhóm — `autoGroupFlights(flights, opts) → FlightGroup[]`

```
capMin = (opts.maxHours != null AND opts.maxHours > 0) ? opts.maxHours * 60 : +Infinity

// (1) Bucket theo tàu bay (tail number).
byAircraft = groupBy(flights, f => f.aircraft)

groups = []
seq = 0

// (2) Duyệt từng tàu bay theo THỨ TỰ TÊN TĂNG DẦN (để kết quả deterministic).
for aircraft in sortAsc(keys(byAircraft)):

    // (3) Sắp các chặng của tàu bay theo thời gian trong ngày (honour cờ next-day).
    legs = byAircraft[aircraft] sortedBy(f => legSortKey(f)) ascending

    current = null          // group đang mở
    dishes  = {}            // name -> count (breakdown món của group hiện tại)
    cumMin  = 0             // tổng phút bay tích luỹ trong group hiện tại

    for f in legs:
        legMin = legDurationMin(f)

        // (4) Điều kiện TÁCH group — chỉ tách khi có thể nạp mới, tức chặng mới
        //     cất cánh từ trạm CATERING.
        purserBreak = opts.groupByPurser
                      AND current != null
                      AND current.purserCode != f.purserCode
                      AND isCateringStation(f.dep, cateringStations)

        hourBreak   = current != null
                      AND (cumMin + legMin) > capMin
                      AND isCateringStation(f.dep, cateringStations)

        // (5) Mở group mới nếu chưa có group, hoặc gặp điều kiện tách.
        if current == null OR purserBreak OR hourBreak:
            finalize(current, dishes)        // chốt group cũ (xem §5)
            seq += 1
            current = FlightGroup {
                id: "ag" + seq,
                aircraft, aircraftType: f.aircraftType,
                purser: f.purser, purserCode: f.purserCode,   // purser CHẶNG ĐẦU
                confidence: "high", confirmed: false, legs: []
            }
            dishes = {}; cumMin = 0
            groups.push(current)

        // (6) Gắn chặng vào group hiện tại + đính kèm dữ liệu tính toán.
        current.legs.push(FlightLeg {
            flightNo: f.flightNo, dep: f.dep, arr: f.arr,
            std: f.std, sta: f.sta, intl: f.intl,
            stdNextDay: f.stdNextDay, staNextDay: f.staNextDay,   // giữ cờ next-day
            premeal: f.premeal,
            cockpitCrew: f.cockpitCrew,
            salesQuota: opts.quotaByFlightNo?.get(f.flightNo)
        })
        for m in (f.meals ?? []): dishes[m.name] += m.count
        cumMin += legMin

    finalize(current, dishes)

// (7) Trả về TẤT CẢ group (không lọc theo trạm — việc lọc do tầng view làm, §6).
return groups
```

**Bất biến quan trọng:**
- Mỗi chặng (leg) thuộc **đúng một** group.
- Group chỉ tách tại **trạm catering** ⇒ mọi chặng "về" từ sân bay không-catering (cùng
  tàu) luôn nằm chung group với chặng "đi" đã nạp suất.
- `purser`/`purserCode` của group = của **chặng đầu** (người uplift gốc), kể cả khi các
  chặng sau đổi purser (miễn không tách).

---

## 4. Business rules — điều kiện tách (chi tiết)

| Rule | Bật khi | Điều kiện tách một chặng `f` (mở group mới bắt đầu từ `f`) |
|------|---------|-----------------------------------------------------------|
| **group_by_purser** | có rule `group_by_purser` `enabled` | `current.purserCode != f.purserCode` **VÀ** `isCateringStation(f.dep, cateringStations)` |
| **group_by_flight_hour** | có rule `group_by_flight_hour` `enabled` (có `maxHours`) | `cumMin + legMin > maxHours*60` **VÀ** `isCateringStation(f.dep, cateringStations)` |

Cả hai rule đều **bắt buộc** điều kiện `isCateringStation(f.dep, cateringStations)` — vì tách = nạp mới, chỉ
khả thi tại trạm có catering. Đây là điểm mấu chốt:

> Đổi purser (hoặc vượt giờ bay) tại một điểm **không** có catering **KHÔNG** tạo group mới.
> Suất cho chặng đó do lần uplift tại origin cover.

Nếu **cả hai rule tắt**: mỗi tàu bay = một group duy nhất (toàn bộ chặng trong ngày).

---

## 5. `finalize` — chốt các trường tính toán của group

```
finalize(current, dishes):
    if current == null: return
    if dishes not empty:
        current.meals = [ {name, count} for (name,count) in dishes ]
                        sortedBy(count) DESC
    total = sum(leg.premeal ?? 0 for leg in current.legs)
    if total > 0: current.premealTotal = total
```

Ngoài `meals` và `premealTotal` (chốt ngay trong engine), các trường tính toán còn lại
được suy ra **on-demand** từ `legs`:

```
groupPremeal(g)      = Σ leg.premeal
groupFlightMinutes(g)= Σ legDurationMin(leg)
groupSalesQuota(g)   = Σ leg.salesQuota theo từng field {hotmeal, banhMi, traSua}
stationsOf(g)        = [legs[0].dep, legs[0].arr, legs[1].arr, …]   // chuỗi trạm hành trình
isOvernight(g)       = tồn tại leg có stdNextDay hoặc staNextDay
```

---

## 6. Gán trạm (station) + danh sách pending

Sau khi có `groups` (global), tầng nghiệp vụ/hiển thị suy ra:

```
// Group thuộc về trạm nào = origin của nó (nếu origin là trạm catering).
groupsOfStation(S) = [ g in groups where groupOrigin(g) == S ]     // đơn hàng của planner tại S

// Pending = các chuyến KHÔNG được cover bởi bất kỳ group catering-origin nào
// (origin là sân bay không catering → không thuộc trạm nào trong 3 trạm).
// ĐỘC LẬP với trạm đang chọn — giống nhau cho SGN/HAN/CXR.
stationedFlightNos = { leg.flightNo
                       for g in groups if isCateringStation(groupOrigin(g), cateringStations)
                       for leg in g.legs }
pendingFlights = [ f in allRawFlights where f.flightNo ∉ stationedFlightNos ]
```

`allRawFlights` = danh sách chuyến gốc của ngày (giữ lại sau khi group, để suy ra pending).

---

## 7. Nguồn cấu hình (config wiring)

```
rules = activeConfigVersion(ruleConfig.versions).rules            // version status='active' (fallback: version cao nhất)
groupByPurser = ∃ r in rules: r.kind=="group_by_purser"    AND r.enabled
hourRule      = first r in rules: r.kind=="group_by_flight_hour" AND r.enabled   // có .maxHours

quotaRows = activeQuotaVersion(quotaData.versions).rows            // UC-10 inflight quota
quotaByFlightNo = map( r => [r.flightNo, {r.hotmeal, r.banhMi, r.traSua}] )

cateringStations = cateringStationSet(airports)                   // airport hasCatering+active
result = autoGroupFlights(rawFlights,
           { cateringStations, groupByPurser, maxHours: hourRule?.maxHours, quotaByFlightNo })
```

Cấu hình đang dùng: airport master-data có **9** airport `hasCatering`+active (SGN·HAN·DAD·
CXR·PQC·VCA·VII·HPH·DLI); ICN·UIH = không catering (bật/tắt `hasCatering` một airport ⇒ dropdown
+ engine đổi theo, không cần sửa code). Rule version c3: `group_by_purser` **bật**,
`group_by_flight_hour` **tắt** (`maxHours=8` nhưng disabled).

Trạm catering là **cờ `hasCatering` trên airport master-data** (WP-B, quản lý ở màn Airports),
KHÔNG hardcode: cùng một nguồn nuôi cả (a) filter chọn trạm của planner (chỉ hiện airport
`hasCatering`+active) và (b) `opts.cateringStations` của engine. Nhân viên bật/tắt catering cho
một sân bay ở màn Airports là cả hai chỗ đổi theo.

### 7.1 Day-attribution — gán chuyến vào ngày dịch vụ (tiền xử lý, KHÔNG thuộc `autoGroupFlights`)

Vì gom nhóm chạy **theo từng ngày**, mọi chặng của một rotation phải nằm **chung một ngày dịch
vụ** thì engine mới ghép được. Ngày dịch vụ của một chặng = **ngày lịch mà rotation của nó NẠP
SUẤT (uplift) tại trạm catering gốc**. Nguồn crew-list chia theo **ngày trực của tổ bay**, làm
một vòng bay qua đêm bị **cắt ngang nửa đêm** (chặng đi ở ngày N, chặng về ở ngày N+1) — phải
gộp lại. Thuật toán (segment theo tàu bay):

```
attributeServiceDays(allLegs):                 // gộp mọi roster, mỗi leg có physDate (ngày lịch STD thực)
    for aircraft in groupBy(allLegs, .aircraft):
        legs = sortedBy(physicalDepartureTimestamp)          // đa ngày, honour cờ +
        segDay = null
        for leg in legs:
            if isCateringStation(leg.dep, cateringStations):
                segDay = physicalCalendarDay(leg.dep departure)   // MỞ segment mới tại điểm nạp suất
            leg.serviceDay = segDay                                // chặng không-catering KẾ THỪA segment
            // gán lại cờ tương đối với serviceDay:
            leg.stdNextDay = (physCalendarDay(STD) >  serviceDay)
            leg.staNextDay = (physCalendarDay(STA) >  serviceDay)
```

> Một chặng **cất cánh từ trạm catering** MỞ một segment mới → ngày dịch vụ = **ngày lịch cất
> cánh THỰC** của chính nó. Các chặng sau **cất cánh từ sân bay KHÔNG catering** (chặng về, quay
> đầu) **kế thừa** ngày của segment đang mở. Cờ `stdNextDay`/`staNextDay` được tính lại tương đối
> với ngày dịch vụ đã gán.

Hệ quả (khớp seed hiện tại):
- **Chuyến đi rạng sáng** (VN-catering, dấu `+` trên STD): segment gốc là chính nó, cất cánh
  rạng sáng **ngày kế** ⇒ thuộc **ngày kế**, **xoá cờ** (nó cất cánh trong ngày dịch vụ). Vd
  VJ920 HAN→NGO `01:40⁺¹` (roster 15/7) → **ngày 16/7** hiển thị `01:40`, ghép với chặng về
  VJ921 NGO→HAN cùng ngày 16/7.
- **Chặng về từ sân bay ngoài** (không catering, quay đầu qua đêm): kế thừa ngày của chặng đi
  ⇒ thuộc **ngày HÔM TRƯỚC** (ngày đã nạp suất ở VN), **gắn cờ `+1`**. Vd VJ969 PUS→PQC `07:45`
  (roster 16/7) → **ngày 15/7** hiển thị `07:45⁺¹`, ghép chung rotation HAN→PQC→PUS→PQC — nếu
  để nguyên ở 16/7 thì mồ côi ở PUS (§11.6).
- **Biên dữ liệu:** chặng về mà segment gốc (chặng đi) nằm ở ngày CHƯA nạp (ngoài cửa sổ dữ
  liệu, vd đường bay hàng ngày có chặng về đêm hôm trước) ⇒ không có nơi kéo về, trở thành
  pending "thuộc ngày trước". Với đường bay HÀNG NGÀY, cùng số hiệu có thể xuất hiện 2 lần trong
  một ngày dịch vụ (1 chặng-về-đêm-trước mồ côi + 1 rotation trong ngày) — đây là hiệu ứng biên,
  không phải trùng lặp thật.

`nextDayCutoff` (mặc định `07:00`, còn trong dataset) là quy ước "suất chuẩn bị từ tối hôm
trước" — mang tính **thời điểm ĐẶT/CHUẨN BỊ đơn hàng**, KHÁC với bucket dữ liệu ở trên (theo
**ngày VẬN HÀNH/nạp suất**). Seed hiện tại bucket theo segment/uplift-day, nên một chuyến đi
01:40 nằm ở đúng ngày nó bay; backend có thể chọn hiển thị "chuẩn bị hôm trước" theo cutoff nếu cần.

---

## 8. Tính suất ăn tổ bay buồng lái (crew cockpit meals)

Sau khi group, mỗi group tính số suất tổ lái bằng engine UC-06 (BRule-04/26–29). **Không
bịa** — `meals = số người được tính × số khung bữa mà ca trực chạm tới`.

### 8.1 Roster của group (dedupe theo mã NV)

```
groupCockpitRoster(g):
    byCode = {}                      // code -> member
    for leg in g.legs:
        for m in (leg.cockpitCrew ?? []):
            prev = byCode[m.code]
            // Giữ bản "đang lái" nếu cùng người vừa xuất hiện dạng positioning.
            if prev == null OR (prev.riding AND NOT m.riding):
                byCode[m.code] = m
    return values(byCode)
```

Chuyển sang input simulator: member `riding` → column `"positioning"`, ngược lại `"cockpit"`.
(Nếu ngày không có roster tên: fabricate theo đếm `cockpit`/`extra` per-leg.)

### 8.2 Profile (cấu hình, theo nhóm `cockpit`)

```
CrewMealProfile {
  preStdMinutes:    number          // mở rộng ca trực TRƯỚC STD sớm nhất (vd 60)
  postStaMinutes:   number          // mở rộng SAU STA muộn nhất (vd 20)
  minOverlapMinutes:number          // overlap tối thiểu để tính trúng khung (vd 10)
  windows:          MealWindow[]     // các khung bữa
  countedColumns:   ("cockpit"|"jumpseat"|"positioning"|"cabin")[]   // cột nào được tính
  dedupeByEmployee: boolean          // gộp trùng name|code
  splitByLandingDate: boolean        // tách suất theo từng ngày lịch
}
MealWindow { id; slot: "morning"|"noon"|"evening"|"night"; start:"HH:MM"; end:"HH:MM" }
// end ≤ start ⇒ khung vắt qua nửa đêm.
```

Profile đang dùng (m2, cockpit): windows Sáng 06–08, Trưa 11–13, Chiều 17–19, Đêm 22–04;
preStd 60, postSta 20, minOverlap 10; countedColumns = {cockpit, jumpseat, positioning};
dedupeByEmployee = true; splitByLandingDate = true.

### 8.3 Thuật toán `simulateCrewMeal(rotation, profile) → meals`

```
// Thời gian tuyệt đối = day*1440 + toMinutes(HH:MM); day từ cờ stdNextDay/staNextDay.
dutyStart = min over legs( depDay*1440 + toMinutes(std) ) - profile.preStdMinutes
dutyEnd   = max over legs( arrDay*1440 + toMinutes(sta) ) + profile.postStaMinutes

firstDay = floor(dutyStart / 1440)
lastDay  = floor(dutyEnd   / 1440)

occurrences = []
for w in profile.windows:
    open  = toMinutes(w.start)
    close = toMinutes(w.end)
    span  = (close <= open) ? close + 1440 : close        // vắt qua nửa đêm
    for day in [firstDay-1 .. lastDay+1]:
        base = day * 1440
        ov = overlap([dutyStart,dutyEnd], [base+open, base+span])   // = max(0, min(ends) - max(starts))
        if ov >= profile.minOverlapMinutes:
            occurrences.push({ windowId: w.id, day })

// BRule-29
hits = profile.splitByLandingDate
       ? occurrences                                   // mỗi (khung, ngày) là 1 suất
       : dedupeBy(occurrences, o => o.windowId)         // mỗi khung tính 1 lần bất kể ngày

counted = [ c in rotation.crew if c.column ∈ profile.countedColumns ]
uniquePeople = profile.dedupeByEmployee
               ? distinctCount(counted, c => c.name + "|" + c.code)
               : count(counted)

meals = uniquePeople * length(hits)
```

---

## 9. Tính quota bán hàng (sales quota) trên chuyến

Mỗi leg mang `salesQuota` = tra cứu `quotaByFlightNo[flightNo]` (UC-10). Quota của group =
cộng dồn theo từng field:

```
groupSalesQuota(g) = {
  hotmeal: Σ leg.salesQuota.hotmeal,
  banhMi:  Σ leg.salesQuota.banhMi,
  traSua:  Σ leg.salesQuota.traSua
}
```

---

## 10. Tổng hợp đơn hàng theo ngày (order rollup)

```
aggregateDayMeals(groups):
    map = {}
    for g in groups:
        for m in (g.meals ?? []): map[m.name] += m.count
    return entries(map) sortedBy(count) DESC
```

Đơn hàng của một trạm = `aggregateDayMeals(groupsOfStation(S) đã confirm)`, join mỗi món
với mã PBML từ catalog (khớp tên không phân biệt dấu/space).

---

## 11. Test vectors (verify bằng dữ liệu 16/07)

### 11.1 VN-A525 — đổi purser tại trạm KHÔNG catering ⇒ KHÔNG tách (case trọng tâm)

Input (cùng tàu VN-A525):
```
VJ860  SGN→ICN  12:20→19:25  purser NGOC 5 TRAN THUY   premeal 35
VJ861  ICN→SGN  21:15→00:30  purser KIEU 1 TRAN THI    premeal 6
```
- Tại VJ861: `purserCode` đổi (NGOC5 ≠ KIEU1) nhưng `dep=ICN` không catering ⇒ `purserBreak=false`.
- `group_by_flight_hour` tắt ⇒ `hourBreak=false`.

Output — **một group**:
```
origin SGN · legs [SGN→ICN, ICN→SGN] · 2 legs · flight 10h20 (7h05+3h15)
purser NGOC 5 TRAN THUY · premealTotal 41 · meals = merge(VJ860, VJ861)
  vd Mì Ý 3 (=1+2), Miến xào tôm cua 4 (=3+1) …
```
✅ Chặng về không mồ côi; uplift tại SGN cover cả hai.

### 11.2 Cùng purser quá cảnh trạm catering ⇒ KHÔNG tách
```
SGN→HAN→SGN cùng 1 purser ⇒ 1 group (không nạp lại ở HAN dù HAN có catering)
```

### 11.3 Đổi purser tại trạm catering ⇒ TÁCH
```
SGN→HAN (purser A), HAN→DAD (purser B):  tại HAN đổi purser & HAN catering ⇒ 2 group
  g1 origin SGN [SGN→HAN] purser A ;  g2 origin HAN [HAN→DAD, …] purser B
```

### 11.4 Origin không catering ⇒ pending
```
NGO→HAN (origin NGO không catering) ⇒ group origin NGO ⇒ không thuộc trạm nào ⇒ pending
```

### 11.5 Số liệu tổng (seed 3 ngày sau day-attribution §7.1; group_by_purser bật, flight_hour tắt)
```
15/07: 465 chuyến → 207 groups   (SGN 89·HAN 64·DAD 17·CXR 10·HPH 5·PQC 5)   group origin-không-catering 17
16/07: 462 chuyến → 219 groups   (SGN 92·HAN 74·DAD 25·CXR 13·HPH 8·PQC 6)   group origin-không-catering  1
17/07:  13 chuyến →  13 groups   (HAN 7·SGN 4·CXR 1·DAD 1)                    group origin-không-catering  0
```
"group origin-không-catering" = số group có origin là sân bay ngoài → các chặng đó rơi vào
`pendingFlights` (§6). Con số này **giảm mạnh** so với bản 1-ngày cũ (16/7 từ ~68 xuống **1**)
nhờ day-attribution §7.1 kéo chặng-về-qua-đêm về đúng ngày rotation của nó.

### 11.6 Rotation qua đêm ở sân bay ngoài — day-attribution kéo chặng về (§7.1)

Tàu VN-A521, nguồn (2 roster):
```
VJ455  HAN→PQC  20:05→22:10            (roster 15/7)
VJ968  PQC→PUS  23:10→06:40⁺¹          (roster 15/7)
VJ969  PUS→PQC  07:45→11:10            (roster 16/7)   ← chặng về, quay đầu qua đêm ở PUS
```
- PUS **không catering** ⇒ VJ969 không thể nạp lại ở PUS; suất đã nạp ở PQC (15/7).
- **Day-attribution:** VJ969 kế thừa segment của VJ968 (dep PQC, 15/7) ⇒ gán **ngày 15/7**, cờ
  `07:45⁺¹`. (Nếu để nguyên ở 16/7: VJ969 là chặng đầu của tàu ngày 16/7, origin PUS ⇒ mồ côi.)
- **Gom nhóm ngày 15/7:** VJ455 (HAN) mở group; VJ968 (PQC, cùng purser) join; VJ969 (dep PUS
  không catering, purser đổi) `purserBreak=false` ⇒ join.

Output — **một group** origin HAN:
```
[HAN→PQC 20:05, PQC→PUS 23:10, PUS→PQC 07:45⁺¹] · 3 legs · purser (chặng đầu, VU 6 LE ANH)
```
✅ Chặng về không mồ côi; cả vòng HAN→PQC→PUS→PQC do lần uplift tại HAN/PQC (15/7) cover.

---

## 12. Tóm tắt các tham số cấu hình cần backend hỗ trợ

| Tham số | Nguồn | Mặc định hiện tại |
|---------|-------|-------------------|
| catering stations | airport master-data `hasCatering` flag (WP-B) | 9 active: SGN·HAN·DAD·CXR·PQC·VCA·VII·HPH·DLI |
| `group_by_purser.enabled` | rule config version active | bật |
| `group_by_flight_hour.enabled` / `maxHours` | rule config version active | tắt / 8h |
| `nextDayCutoff` | dataset | `07:00` (quy ước prep hôm trước; KHÁC bucket theo uplift-day §7.1) |
| crew-meal profile (`preStd`,`postSta`,`minOverlap`,`windows`,`countedColumns`,`dedupeByEmployee`,`splitByLandingDate`) | crew-meal config version active (m2) | xem §8.2 |
| `quotaByFlightNo` | inflight-quota version active (UC-10) | v6 |

> **Day-attribution (§7.1)** là bước tiền xử lý dữ liệu (không nhận param cấu hình runtime): gán
> mỗi chặng vào ngày dịch vụ theo **segment nạp-suất của tàu bay** (chặng đi rạng sáng `+` → ngày
> kế, xoá cờ; chặng về từ sân bay ngoài → kế thừa ngày chặng đi, gắn `+1`). Bắt buộc chạy trước
> `autoGroupFlights` để vòng bay qua đêm không bị mồ côi.
