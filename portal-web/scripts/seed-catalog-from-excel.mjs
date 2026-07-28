import ExcelJS from 'exceljs'
import fs from 'fs'

const xlsxPath =
  'c:/Users/thao.nguyen.th/OneDrive - Galaxy Technology Services JSC/Documents/In-Flight Dynamic Apps/Resources/Master_Data_Mon_An_Hang_Hoa_Do_Dung.xlsx'
const meals = JSON.parse(fs.readFileSync('src/mock-data/catering/meals.json', 'utf8')).meals

const SHEET_CATEGORY = {
  'Món chính ECO': 'eco_main',
  'Món chính SBB': 'sbb_main',
  'Khai vị': 'appetizer',
  'Tráng miệng': 'dessert',
  'Bánh mì-Bánh ngọt': 'bread',
  'Đồ uống': 'drink',
  'Đồ ăn nhẹ': 'snack',
  'Gia vị': 'condiment',
}

const COMBO_EXCEL_NAMES = new Set([
  'set banh mi tach tp sgn adl',
  'meal box chay',
  'meal box thuong',
  'set hoa qua 3 mieng',
])

/** Approved display name → Excel product code. */
const ALIAS_MAP = {
  'Bánh chưng chà bông': 'HM8',
  'Bánh mì Việt Nam': 'SBB12',
  'Bún xào Singapore': 'HM6',
  'Bún xào chay Business': 'SBB25',
  'Cơm basmati cà ri chay Business': 'HM13',
  'Miến xào tôm cua': 'HM5',
  'Xôi khúc chả chiên': 'HM1',
}

const COMBO_PBML = [
  'Happy meal (Mỳ ý + Bánh que + Coca)',
  'Combo snack',
  'Combo Miến xào cua và nước suối (free for China)',
  'Bia + Khô gà + snack chả giò',
  'Soda Dâu + Macca',
  'VCS Vegetarian meal box',
]

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
function slug(s) {
  return norm(s).replace(/\s+/g, '-').slice(0, 48) || 'item'
}
function cabinFor(category) {
  if (category === 'eco_main') return ['ECO']
  if (category === 'sbb_main' || category === 'appetizer' || category === 'dessert' || category === 'bread')
    return ['SBB']
  if (category === 'condiment' || category === 'drink' || category === 'snack') return ['ECO', 'SBB']
  return ['ECO']
}

const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(xlsxPath)

const mealItems = []
const excelCombos = []
const byCode = new Map()
const byNormName = new Map()

for (const [sheet, category] of Object.entries(SHEET_CATEGORY)) {
  const ws = wb.getWorksheet(sheet)
  for (let r = 2; r <= ws.rowCount; r++) {
    const codeRaw = ws.getRow(r).getCell(2).value
    const nameRaw = ws.getRow(r).getCell(3).value
    const unitRaw = ws.getRow(r).getCell(4).value
    if (!nameRaw) continue
    const name = String(nameRaw).trim()
    const productCode = codeRaw != null && String(codeRaw).trim() ? String(codeRaw).trim() : null
    const unit = unitRaw != null && String(unitRaw).trim() ? String(unitRaw).trim() : null
    const n = norm(name)

    if (COMBO_EXCEL_NAMES.has(n) || /^set /i.test(name) || /^meal box/i.test(name)) {
      let kind = 'set'
      if (/meal box/i.test(name)) kind = 'meal_box'
      excelCombos.push({
        id: `combo-${productCode ? productCode.toLowerCase() : slug(name)}`,
        name: { vi: name },
        description: '',
        kind,
        productCode,
        active: true,
      })
      continue
    }

    const id = productCode ? `sku-${productCode.toLowerCase()}` : `meal-${slug(name)}`
    const item = {
      id,
      productCode,
      name: { vi: name },
      unit,
      category,
      cabinScopes: cabinFor(category),
      active: true,
      needsCode: !productCode,
    }
    mealItems.push(item)
    if (productCode) byCode.set(productCode.toUpperCase(), item)
    const existing = byNormName.get(n)
    if (!existing) {
      byNormName.set(n, item)
    } else {
      const preferNew =
        (item.productCode?.startsWith('HM') && !existing.productCode?.startsWith('HM')) ||
        (!existing.productCode && item.productCode)
      if (preferNew) byNormName.set(n, item)
    }
  }
}

// Prefer FlightView / prebook display names when exact name match exists.
for (const m of meals) {
  if (COMBO_PBML.includes(m.name) || ALIAS_MAP[m.name]) continue
  const item = byNormName.get(norm(m.name))
  if (!item) continue
  item.name.vi = m.name
}

for (const [pbmlName, code] of Object.entries(ALIAS_MAP)) {
  const item = byCode.get(code.toUpperCase())
  if (!item) {
    console.error('MISSING SKU', code, pbmlName)
    continue
  }
  item.name.vi = pbmlName
}

const combos = [...excelCombos]
for (const name of COMBO_PBML) {
  const m = meals.find((x) => x.name === name)
  let kind = 'prebook_combo'
  if (/happy meal/i.test(name)) kind = 'happy_meal'
  if (/meal box/i.test(name)) kind = 'meal_box'
  combos.push({
    id: `combo-${slug(name)}`,
    name: { vi: name },
    description: m?.description || '',
    kind,
    productCode: null,
    active: true,
  })
}

const cws = wb.getWorksheet('Combo Charter (Tham chiếu)')
for (let r = 2; r <= cws.rowCount; r++) {
  const nm = cws.getRow(r).getCell(2).value
  const desc = cws.getRow(r).getCell(3).value
  if (!nm) continue
  combos.push({
    id: `combo-charter-${r - 1}`,
    name: { vi: String(nm).trim() },
    description: desc ? String(desc).trim() : '',
    kind: 'charter',
    productCode: null,
    active: true,
  })
}

const amenity = []
const aws = wb.getWorksheet('Vật dụng-Đồ dùng')
for (let r = 2; r <= aws.rowCount; r++) {
  const codeRaw = aws.getRow(r).getCell(2).value
  const nameRaw = aws.getRow(r).getCell(3).value
  const unitRaw = aws.getRow(r).getCell(4).value
  if (!nameRaw) continue
  const name = String(nameRaw).trim()
  const productCode = codeRaw != null && String(codeRaw).trim() ? String(codeRaw).trim() : null
  amenity.push({
    id: productCode ? `amn-${productCode.toLowerCase()}` : `amn-${slug(name)}`,
    productCode,
    name: { vi: name },
    unit: unitRaw != null && String(unitRaw).trim() ? String(unitRaw).trim() : null,
    active: true,
    needsCode: !productCode,
  })
}

const meta = {
  seedVersion: '2026-07-28-catalog-v3',
}
const mealDataset = {
  ...meta,
  versions: [
    {
      id: 'm1',
      version: 1,
      status: 'active',
      effectiveFrom: '28/07/2026',
      updatedBy: 'System',
      updatedAt: '28/07/2026',
      note: 'Seeded from Master_Data + approved display names',
      items: mealItems,
    },
  ],
}
const comboDataset = {
  ...meta,
  versions: [
    {
      id: 'c1',
      version: 1,
      status: 'active',
      effectiveFrom: '28/07/2026',
      updatedBy: 'System',
      updatedAt: '28/07/2026',
      items: combos,
    },
  ],
}
const amenityDataset = {
  ...meta,
  versions: [
    {
      id: 'a1',
      version: 1,
      status: 'active',
      effectiveFrom: '28/07/2026',
      updatedBy: 'System',
      updatedAt: '28/07/2026',
      items: amenity,
    },
  ],
}

fs.mkdirSync('src/mock-data/catering/catalog', { recursive: true })
fs.writeFileSync('src/mock-data/catering/catalog/meal-item-catalog.json', JSON.stringify(mealDataset, null, 2) + '\n')
fs.writeFileSync('src/mock-data/catering/catalog/combo-catalog.json', JSON.stringify(comboDataset, null, 2) + '\n')
fs.writeFileSync(
  'src/mock-data/catering/catalog/amenity-item-catalog.json',
  JSON.stringify(amenityDataset, null, 2) + '\n',
)

console.log({
  meals: mealItems.length,
  combos: combos.length,
  amenity: amenity.length,
  withProductCode: mealItems.filter((i) => i.productCode).length,
})
