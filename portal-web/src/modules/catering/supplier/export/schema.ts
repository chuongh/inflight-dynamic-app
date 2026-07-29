import type { EcoCells, SbbCells, SbbRouteSheet } from '../types'

export interface ExportColumn<TField extends string> {
  letter: string
  productCode: string
  header: string
  field?: TField
  identity?: 'operatingDate' | 'flightNo' | 'dep' | 'arr' | 'amenityLabel'
}

export function excelColumnLetter(columnNumber: number): string {
  let value = columnNumber
  let letter = ''
  while (value > 0) {
    value -= 1
    letter = String.fromCharCode(65 + (value % 26)) + letter
    value = Math.floor(value / 26)
  }
  return letter
}

type ColumnDefinition<TField extends string> = Omit<
  ExportColumn<TField>,
  'letter'
>

function withLetters<TField extends string>(
  definitions: readonly ColumnDefinition<TField>[],
): readonly ExportColumn<TField>[] {
  return definitions.map((definition, index) => ({
    letter: excelColumnLetter(index + 1),
    ...definition,
  }))
}

const ecoDefinitions: readonly ColumnDefinition<keyof EcoCells>[] = [
  { productCode: '', header: 'STT/No' },
  { productCode: '', header: 'Ngày/Date', identity: 'operatingDate' },
  { productCode: '', header: 'A/C' },
  { productCode: '', header: 'Amenity', identity: 'amenityLabel' },
  { productCode: '', header: 'Type' },
  { productCode: '', header: 'FLT NO', identity: 'flightNo' },
  { productCode: '', header: 'DEP', identity: 'dep' },
  { productCode: '', header: 'ARR', identity: 'arr' },
  { productCode: '', header: 'STD/STA' },
  { productCode: 'HM9', header: 'Mì Ý', field: 'spaghetti' },
  { productCode: 'HM5', header: 'Miến xào', field: 'glassNoodles' },
  { productCode: 'HM8', header: 'Bánh chưng', field: 'banhChung' },
  { productCode: 'HM6', header: 'Bún xào', field: 'stirFriedNoodles' },
  { productCode: 'HM7', header: 'Cơm chiên Thái', field: 'thaiFriedRice' },
  { productCode: 'HM2', header: 'Xôi mặn', field: 'savoryStickyRice' },
  { productCode: 'HM1', header: 'Xôi khúc', field: 'khucStickyRice' },
  { productCode: 'HM4', header: 'Cơm bò', field: 'beefRice' },
  { productCode: 'HM3', header: 'Cơm dừa Malaysia', field: 'coconutRice' },
  { productCode: '40000294', header: 'Bánh mì', field: 'bread' },
  {
    productCode: 'HM14',
    header: 'Khoai viên chay Ấn + Paratha',
    field: 'indianPotatoParatha',
  },
  { productCode: 'HM12', header: 'Cơm cà ri gà', field: 'chickenCurry' },
  { productCode: 'HM15', header: 'Cơm cà ri cá', field: 'fishCurry' },
  {
    productCode: 'HM11',
    header: 'Cơm chiên Dương Châu chay',
    field: 'vegetarianYangzhouRice',
  },
  {
    productCode: 'HM13',
    header: 'Cơm Basmati cà ri chay',
    field: 'vegetarianBasmatiCurry',
  },
  {
    productCode: '',
    header: 'Thịt bò + rau tươi',
    field: 'australiaBeefFreshVegetables',
  },
  {
    productCode: '',
    header: 'Rau ăn mỳ/phở Úc',
    field: 'australiaNoodleVegetables',
  },
  {
    productCode: '',
    header: 'Rau ăn bánh mì Úc',
    field: 'australiaBreadVegetables',
  },
  { productCode: '', header: 'Thịt bò + rau SGN–ADL' },
  { productCode: '', header: 'Set bánh mì tách thành phần SGN–ADL' },
  { productCode: '', header: 'Trứng luộc', field: 'boiledEggs' },
  { productCode: '', header: 'Trứng SkyBoss', field: 'skybossEggs' },
  { productCode: '', header: 'Tổng Trứng', field: 'totalEggs' },
  {
    productCode: '',
    header: 'Yogurt Sky Úc',
    field: 'australiaSkybossYogurt',
  },
  { productCode: '', header: 'Tổng cộng hotmeal đặt', field: 'hotmealTotal' },
  { productCode: 'DC07', header: 'Tương cà', field: 'ketchup' },
  { productCode: 'DC06', header: 'Tương ớt', field: 'chiliSauce' },
  { productCode: 'DC08', header: 'Xì dầu', field: 'soySauce' },
  { productCode: 'DC10', header: 'Muối tiêu đường Ấn', field: 'indianSaltPepper' },
  {
    productCode: '',
    header: 'Bộ thìa, dĩa, tăm theo hotmeal',
    field: 'hotmealUtensils',
  },
  {
    productCode: '',
    header: 'Bộ thìa, dĩa, tăm dự phòng',
    field: 'reserveUtensils',
  },
  {
    productCode: '',
    header: 'Tổng bộ thìa, dĩa, tăm',
    field: 'totalUtensils',
  },
  { productCode: '', header: 'Skyboss', field: 'skyboss' },
  { productCode: '', header: 'Prebook', field: 'prebook' },
  { productCode: '', header: 'Macca nho khô Skyboss' },
  { productCode: '', header: 'Macca muối KAZ' },
  { productCode: '', header: 'Snack khoai tây/trái cây sấy' },
  { productCode: '', header: 'Rượu vang' },
  { productCode: '', header: 'Chăn C Skyboss' },
  {
    productCode: '',
    header: 'Bánh mì tròn + bơ lạc',
    field: 'australiaRoundBread',
  },
  { productCode: '', header: 'Chăn 3in1 Prebook' },
  { productCode: '', header: 'Suối 350ml Skyboss + Prebook' },
  { productCode: '', header: 'Hạt điều Prebook', field: 'prebookCashews' },
  { productCode: '', header: 'Macca thường' },
  { productCode: '', header: 'Xoài muối ớt GDS/DELUXE' },
  { productCode: '', header: 'Bia + khô gà + snack chả giò' },
  { productCode: '', header: 'Soda dâu + Macca' },
  {
    productCode: '',
    header: 'Suối tổ bay 1.5L',
    field: 'reserveCrewWater',
  },
  { productCode: 'DC02', header: 'Thùng xốp nhỏ', field: 'smallIceBox' },
  { productCode: 'DC01', header: 'Thùng xốp lớn', field: 'largeIceBox' },
  { productCode: 'DC09', header: 'Đá ướt kg', field: 'wetIceKg' },
  { productCode: 'DC03', header: 'Đá khô kg', field: 'dryIceKg' },
  { productCode: '', header: 'Duty Free', field: 'dutyFree' },
  { productCode: 'HL', header: 'Xe highlift', field: 'highlift' },
  { productCode: 'TO', header: 'Xe tải nhỏ', field: 'smallTruck' },
  { productCode: 'TOL', header: 'Top-up giờ chót', field: 'lastMinuteTopUp' },
  { productCode: '', header: 'Ghi chú' },
]

export const ECO_COLUMNS = withLetters(ecoDefinitions)

function sbbColumn(
  productCode: string,
  header: string,
  field?: keyof SbbCells,
  identity?: ExportColumn<keyof SbbCells>['identity'],
): ColumnDefinition<keyof SbbCells> {
  return { productCode, header, field, identity }
}

const commonSbb = [
  sbbColumn('', 'Ngày', undefined, 'operatingDate'),
  sbbColumn('', 'Số hiệu CB', undefined, 'flightNo'),
  sbbColumn('', 'STD'),
  sbbColumn('', 'Số khách SBB', 'businessPax'),
] as const

export const SBB_COLUMNS: Record<
  SbbRouteSheet,
  readonly ExportColumn<keyof SbbCells>[]
> = {
  'VIET-HAN-NHAT': withLetters([
    ...commonSbb,
    sbbColumn('SBB7', 'Phở bò', 'pho'),
    sbbColumn('SBB5', 'Miến gà'),
    sbbColumn('SBB11', 'Xôi mặn', 'stickyRice'),
    sbbColumn('SBB12', 'Bánh mì', 'bread'),
    sbbColumn('SBB1', 'Díp cuốn'),
    sbbColumn('SBB21', 'Trứng cuốn quốc tế'),
    sbbColumn('SBB20', 'Trái cây'),
    sbbColumn('SBB10', 'Rau câu dừa'),
    sbbColumn('SBB9', 'Bánh mì tròn & bơ truyền thống'),
    sbbColumn('', 'Bánh sừng bò thanh long'),
    sbbColumn('SBB18', 'Ngũ cốc'),
    sbbColumn('SBB22', 'Bánh sừng bò quốc tế'),
    sbbColumn('SBB29', 'Yogurt quốc tế'),
    sbbColumn('SBB2', 'Nước ép cà rốt'),
    sbbColumn('SBB3', 'Dưa hấu'),
    sbbColumn('SBB4', 'Nước mía'),
    sbbColumn('SBB14', 'Cafe đen 480ml'),
    sbbColumn('', 'Lá chuối 18×18, túi 5 lá'),
    sbbColumn('SBB-VHN-PEPPER', 'Muối tiêu'),
    sbbColumn('SBB34', 'Trang trí cocktail'),
    sbbColumn('', 'Cocktail', 'cocktail'),
    sbbColumn('', 'Macca nho khô', 'maccaRaisins'),
    sbbColumn('', 'Chăn SBB BH≥4h', 'blanket'),
    sbbColumn('', 'Gối tựa đầu SBB BH≥4h', 'pillow'),
    sbbColumn('', 'Ghi chú'),
  ]),
  'CHAY(VIỆT-HÀN-NHẬT)': withLetters([
    ...commonSbb.map((column, index) => (
      index === 3 ? sbbColumn('', 'Tổng khách chay', 'businessPax') : column
    )),
    sbbColumn('SBB25', 'Bún xào chay thường'),
    sbbColumn('SBB40', 'Cơm chiên Dương Châu chay'),
    sbbColumn('SBB42', 'Cơm cà ri Ấn chay'),
    sbbColumn('SBB43', 'Khoai viên + Paratha'),
    sbbColumn('SBB44', 'Díp cuốn chay'),
    sbbColumn('SBB45', 'Salad chay'),
    sbbColumn('SBB46', 'Salad đậu kiểu Ấn'),
    sbbColumn('SBB29', 'Yogurt'),
    sbbColumn('SBB20', 'Set hoa quả 3 miếng'),
  ]),
  'ẤN': withLetters([
    ...commonSbb,
    sbbColumn('SBB41', 'Cơm cà ri gà', 'chickenGravy'),
    sbbColumn('SBB42', 'Cơm cà ri Ấn chay'),
    sbbColumn('SBB-IN-BUN-XAO', 'Bún xào Singapore SBB'),
    sbbColumn('SBB44', 'Diếp cuốn chay'),
    sbbColumn('SBB20', 'Set hoa quả'),
    sbbColumn('SBB9', 'Bánh mì & bơ', 'bread'),
    sbbColumn('', 'Bánh sừng bò thanh long'),
    sbbColumn('SBB18', 'Ngũ cốc'),
    sbbColumn('SBB22', 'Bánh sừng bò quốc tế'),
    sbbColumn('SBB29', 'Yogurt'),
    sbbColumn('SBB2', 'Nước ép cà rốt'),
    sbbColumn('SBB3', 'Dưa hấu'),
    sbbColumn('SBB4', 'Nước mía'),
    sbbColumn('SBB14', 'Cafe đen'),
    sbbColumn('SBB47', 'Lá chuối 18×18'),
    sbbColumn('SBB34', 'Trang trí cocktail'),
    sbbColumn('', 'Cocktail', 'cocktail'),
    sbbColumn('', 'Macca nho', 'maccaRaisins'),
    sbbColumn('', 'Chăn SBB', 'blanket'),
    sbbColumn('', 'Gối tựa đầu SBB', 'pillow'),
    sbbColumn('', 'Ghi chú'),
  ]),
  'ÚC&KAZ': withLetters([
    ...commonSbb,
    sbbColumn('', 'Meal box thường'),
    sbbColumn('', 'Meal box chay'),
    sbbColumn('SBB5', 'Miến gà'),
    sbbColumn('SBB12', 'Bánh mì', 'bread'),
    sbbColumn('SBB39', 'Bánh chưng'),
    sbbColumn('SBB23', 'Cá Basa', 'basa'),
    sbbColumn('SBB7', 'Phở bò', 'pho'),
    sbbColumn('SBB37', 'Bún bò Huế', 'bunBo'),
    sbbColumn('SBB11', 'Xôi mặn', 'stickyRice'),
    sbbColumn('SBB24', 'Gà Gravy', 'chickenGravy'),
    sbbColumn('', 'Sandwich phô mai'),
    sbbColumn('', 'Burger'),
    sbbColumn('SBB27', 'Salad rau củ tôm'),
    sbbColumn('SBB1', 'Díp cuốn'),
    sbbColumn('SBB9', 'Bánh mì tròn & bơ'),
    sbbColumn('SBB22', 'Bánh sừng bò'),
    sbbColumn('', 'Bánh sừng bò thanh long'),
    sbbColumn('SBB10', 'Rau câu dừa'),
    sbbColumn('SBB49', 'Bánh mousse dừa'),
    sbbColumn('SBB28', 'Bánh mochi'),
    sbbColumn('SBB29', 'Yogurt'),
    sbbColumn('SBB30', 'Trái cây 600g/khay'),
    sbbColumn('SBB20', 'Trái cây 90g'),
    sbbColumn('SBB31', 'Quýt kg'),
    sbbColumn('SBB36', 'Táo Rockit ống'),
    sbbColumn('SBB32', 'Nho xanh Úc kg'),
    sbbColumn('SBB2', 'Nước ép cà rốt'),
    sbbColumn('SBB3', 'Dưa hấu'),
    sbbColumn('SBB4', 'Nước mía'),
    sbbColumn('SBB33', 'Finger food/khay'),
    sbbColumn('SBB14', 'Cafe đen'),
    sbbColumn('SBB47', 'Lá chuối 18×18'),
    sbbColumn('SBB48', 'Lá chuối 9×9'),
    sbbColumn('SBB-AUKAZ-PEPPER', 'Muối tiêu'),
    sbbColumn('SBB34', 'Trang trí cocktail'),
    sbbColumn('', 'Cocktail', 'cocktail'),
    sbbColumn('', 'Macca nho khô', 'maccaRaisins'),
    sbbColumn('', 'Hạt điều'),
    sbbColumn('', 'Hạt Macca đen'),
    sbbColumn('', 'Bộ dụng cụ ăn SBB', 'utensils'),
    sbbColumn('', 'Bộ kit SBB', 'kit'),
    sbbColumn('', 'Chăn SBB', 'blanket'),
    sbbColumn('', 'Gối tựa đầu SBB', 'pillow'),
    sbbColumn('', 'Tấm trải nệm ghế', 'mattress'),
    sbbColumn('', 'Ghi chú'),
  ]),
}

export const SBB_EXPORTED_FIELDS_BY_SHEET: Record<
  SbbRouteSheet,
  readonly (keyof SbbCells)[]
> = {
  'VIET-HAN-NHAT': [
    'businessPax',
    'pho',
    'stickyRice',
    'bread',
    'cocktail',
    'maccaRaisins',
    'blanket',
    'pillow',
  ],
  'CHAY(VIỆT-HÀN-NHẬT)': ['businessPax'],
  'ẤN': [
    'businessPax',
    'chickenGravy',
    'bread',
    'cocktail',
    'maccaRaisins',
    'blanket',
    'pillow',
  ],
  'ÚC&KAZ': [
    'businessPax',
    'bread',
    'basa',
    'pho',
    'bunBo',
    'stickyRice',
    'chickenGravy',
    'cocktail',
    'maccaRaisins',
    'utensils',
    'kit',
    'blanket',
    'pillow',
    'mattress',
  ],
}

export const ECO_SUPPORT_SHEETS = {
  A321: [
    ['Package', 'Điều kiện'],
    [1, 'Vật tư theo tàu, cấp đầu ngày'],
    [2, 'Cặp chuyến quốc nội, block ≤ 1h15'],
    [3, 'Cặp chuyến quốc nội, block > 1h15'],
    [4, 'Quốc tế < 4h'],
    [5, 'Quốc tế ≥ 4h'],
    [6, 'Charter China full meal'],
    [7, 'Russia'],
    [8, 'Ferry/Cargo'],
    [9, 'Nightstop'],
  ],
  A330: [
    ['Package', 'Điều kiện'],
    [10, 'Vật tư theo tàu, cấp đầu ngày'],
    [11, 'Quốc nội'],
    [12, 'Quốc tế Hàn/Nhật/Ấn'],
    [13, 'Kazakhstan'],
    [14, 'Russia'],
    [15, 'Australia'],
    [16, 'Ferry/Cargo'],
    [17, 'Nightstop'],
  ],
} as const

export const REFERENCE_PROVENANCE =
  'Cleaned schema from QUY_TAC_DIEN_SO_LUONG_ECO_SKYBOSS_BUSINESS.md, checked 08/07/2026; historical operational rows intentionally omitted.'
