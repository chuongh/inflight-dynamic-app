/**
 * Seed Crew-List-New Excel → flight-groups.json ungroupedFlights days.
 *
 * SSRS exports use prefixed SpreadsheetML (`x:workbook`) that ExcelJS rejects,
 * so this script reads OOXML (JSZip + sharedStrings/sheet XML) directly.
 *
 * Usage:
 *   node scripts/seed-crew-list-ungrouped.mjs [path1.xlsx] [path2.xlsx] ...
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const JSZip = require('jszip')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'src/mock-data/catering/flight-groups.json')

/** VN domestic IATA set (matches existing seed intl flags). */
const VN_DOMESTIC = new Set([
  'BMV', 'CXR', 'DAD', 'DLI', 'HAN', 'HPH', 'HUI', 'PQC', 'PXU', 'SGN',
  'TBB', 'THD', 'UIH', 'VCA', 'VCL', 'VDH', 'VII', 'VCS', 'VKG', 'CAH',
])

/** Header labels that are pax/meta totals — not dish breakdown lines. */
const META_MEAL_HEADERS = new Set([
  'skyboss',
  'sboss business',
  'fmlr',
  'prebook meal',
  'um & ypta',
  'children',
  'co',
  'wi',
  'happy meal',
])

const WEEKDAY_VI = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
]

const DEFAULT_FILES = [
  'C:/Users/thao.nguyen.th/Downloads/20260729132827_Crew-List-New-28-07.xlsx',
  'C:/Users/thao.nguyen.th/Downloads/20260729132248_Crew-List-New-29-07.xlsx',
]

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function colLettersToNum(col) {
  let n = 0
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n
}

function parseSharedStrings(xml) {
  const shared = []
  for (const si of xml.matchAll(/<(\w+:)?si\b[^>]*>([\s\S]*?)<\/\1?si>/g)) {
    const texts = [...si[2].matchAll(/<(\w+:)?t\b[^>]*>([\s\S]*?)<\/\1?t>/g)].map((m) =>
      decodeXml(m[2]),
    )
    shared.push(texts.join(''))
  }
  return shared
}

function parseSheetRows(sheetXml, shared) {
  const rows = new Map()
  for (const row of sheetXml.matchAll(/<(\w+:)?row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/\1?row>/g)) {
    const r = Number(row[2])
    const cells = new Map()
    for (const c of row[3].matchAll(
      /<(\w+:)?c\b([^>]*)>([\s\S]*?)<\/\1?c>|<(\w+:)?c\b([^>]*)\/>/g,
    )) {
      const attrs = c[2] || c[5] || ''
      const body = c[3] || ''
      const ref = /r="([A-Z]+)(\d+)"/.exec(attrs)
      if (!ref) continue
      const col = colLettersToNum(ref[1])
      const t = /\bt="([^"]+)"/.exec(attrs)?.[1]
      let val = ''
      if (t === 's') {
        const v = /<(\w+:)?v>(\d+)<\/\1?v>/.exec(body)
        val = shared[Number(v?.[2] ?? -1)] ?? ''
      } else if (t === 'inlineStr') {
        const texts = [...body.matchAll(/<(\w+:)?t\b[^>]*>([\s\S]*?)<\/\1?t>/g)].map((m) =>
          decodeXml(m[2]),
        )
        val = texts.join('')
      } else if (t === 'str') {
        const v = /<(\w+:)?v>([\s\S]*?)<\/\1?v>/.exec(body)
        val = v ? decodeXml(v[2]) : ''
      } else {
        const v = /<(\w+:)?v>([\s\S]*?)<\/\1?v>/.exec(body)
        val = v ? decodeXml(v[2]) : ''
      }
      if (val !== '') cells.set(col, val)
    }
    rows.set(r, cells)
  }
  return rows
}

function cell(rows, r, c) {
  return String(rows.get(r)?.get(c) ?? '').trim()
}

function parseClock(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return { time: '', nextDay: false }
  const nextDay = s.includes('+')
  const cleaned = s.replace(/\+/g, '').trim()
  const m = cleaned.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return { time: '', nextDay: false }
  return { time: `${m[1].padStart(2, '0')}:${m[2]}`, nextDay }
}

function parsePurser(raw) {
  const first =
    String(raw ?? '')
      .split(/[|\n\r]/)
      .map((s) => s.trim())
      .find(Boolean) ?? ''
  const codeMatch = first.match(/\((\d+)\)\s*$/)
  const code = codeMatch?.[1] ?? ''
  const name = first.replace(/\s*\(\d+\)\s*$/, '').trim()
  return { purser: name, purserCode: code }
}

function parseCockpit(raw) {
  const text = String(raw ?? '').replace(/\r?\n/g, ' | ')
  const members = []
  const re = /\((CP(?:\/T)?|FO(?:\/T)?|CP-Pax|FO-Pax)\)\s*([^(]+?)\s*\((\d+)\)/gi
  let m
  while ((m = re.exec(text)) !== null) {
    const role = m[1]
    members.push({
      role,
      name: m[2].replace(/\s+/g, ' ').trim(),
      code: m[3],
      riding: /-Pax$/i.test(role),
    })
  }
  return members
}

function excelSerialToDate(serial) {
  // Excel serial day → JS Date (UTC noon to avoid TZ flip)
  const ms = (Number(serial) - 25569) * 86400 * 1000
  return new Date(ms)
}

function formatServiceDate(d) {
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

function weekdayVi(serviceDate) {
  const [d, m, y] = serviceDate.split('/').map(Number)
  return WEEKDAY_VI[new Date(y, m - 1, d).getDay()]
}

function normalizeHeader(h) {
  return String(h ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isMetaMealHeader(name) {
  return META_MEAL_HEADERS.has(normalizeHeader(name).toLowerCase())
}

function findHeaderRow(rows) {
  for (const [r, cells] of rows) {
    const a = String(cells.get(1) ?? '').toUpperCase()
    const c = String(cells.get(3) ?? '').toUpperCase()
    if (a.includes('A/C') && c.includes('FLIGHT')) return r
  }
  return null
}

function serviceDateFromRows(rows) {
  for (const [, cells] of rows) {
    for (const [, raw] of cells) {
      const t = String(raw).trim()
      if (/^\d{5}$/.test(t)) {
        // Excel serial date (e.g. 46231 = 2026-07-28)
        const n = Number(t)
        if (n > 40000 && n < 60000) return formatServiceDate(excelSerialToDate(n))
      }
      const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
      const dmy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      if (dmy) return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`
    }
  }
  return null
}

function toInt(raw) {
  const n = Number(String(raw ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? Math.round(n) : 0
}

async function parseCrewList(path) {
  const zip = await JSZip.loadAsync(readFileSync(path))
  const ssFile = zip.file('xl/sharedStrings.xml')
  const sheetFile = zip.file('xl/worksheets/sheet1.xml')
  if (!sheetFile) throw new Error(`No sheet1.xml in ${path}`)

  const shared = ssFile ? parseSharedStrings(await ssFile.async('string')) : []
  const rows = parseSheetRows(await sheetFile.async('string'), shared)

  const serviceDate = serviceDateFromRows(rows)
  if (!serviceDate) throw new Error(`No service date in ${path}`)

  const headerRow = findHeaderRow(rows)
  if (headerRow == null) throw new Error(`No header row in ${path}`)

  const headerCells = rows.get(headerRow) ?? new Map()
  /** @type {{ col: number, name: string, kind: 'dish' | 'skyboss' | 'business' | 'prebook' }[]} */
  const mealCols = []
  for (const [col, rawName] of headerCells) {
    if (col < 15) continue
    const name = normalizeHeader(rawName)
    if (!name) continue
    const key = name.toLowerCase()
    if (key === 'skyboss') mealCols.push({ col, name, kind: 'skyboss' })
    else if (key === 'sboss business') mealCols.push({ col, name, kind: 'business' })
    else if (key === 'prebook meal') mealCols.push({ col, name, kind: 'prebook' })
    else if (!isMetaMealHeader(name)) mealCols.push({ col, name, kind: 'dish' })
  }

  const flights = []
  const maxRow = Math.max(...rows.keys())
  for (let r = headerRow + 1; r <= maxRow; r++) {
    const aircraft = cell(rows, r, 1).replace(/\s+/g, ' ').trim()
    const aircraftType = cell(rows, r, 2).trim()
    const flightNo = cell(rows, r, 3).replace(/\s+/g, '').toUpperCase()
    const dep = cell(rows, r, 4).toUpperCase()
    const arr = cell(rows, r, 5).toUpperCase()
    if (!flightNo || !dep || !arr || !aircraft) continue
    if (!/^VJ/i.test(flightNo)) continue

    const std = parseClock(cell(rows, r, 6))
    const sta = parseClock(cell(rows, r, 7))
    if (!std.time || !sta.time) continue

    const { purser, purserCode } = parsePurser(cell(rows, r, 9))
    const cockpitCrew = parseCockpit(cell(rows, r, 8))
    const intl = !(VN_DOMESTIC.has(dep) && VN_DOMESTIC.has(arr))

    /** @type {{ name: string, count: number }[]} */
    const meals = []
    let skybossEco = null
    let businessPax = null
    let prebookFromCol = null
    for (const mc of mealCols) {
      const qty = toInt(cell(rows, r, mc.col))
      if (mc.kind === 'dish') {
        if (qty > 0) meals.push({ name: mc.name, count: qty })
      } else if (mc.kind === 'skyboss') skybossEco = qty
      else if (mc.kind === 'business') businessPax = qty
      else if (mc.kind === 'prebook') prebookFromCol = qty
    }

    // Dish breakdown drives premeal total (same convention as 15–17/07 seed).
    // Fall back to Excel "Prebook Meal" when no dish qty is present on the row.
    const mealSum = meals.reduce((s, m) => s + m.count, 0)
    const premeal =
      mealSum > 0 ? mealSum : prebookFromCol != null && prebookFromCol > 0 ? prebookFromCol : undefined

    /** @type {Record<string, unknown>} */
    const flight = {
      flightNo,
      aircraft,
      aircraftType: aircraftType || 'A321',
      dep,
      arr,
      std: std.time,
      sta: sta.time,
      purser,
      purserCode,
      intl,
    }
    if (std.nextDay) flight.stdNextDay = true
    if (sta.nextDay) flight.staNextDay = true
    if (premeal != null) flight.premeal = premeal
    if (meals.length) flight.meals = meals
    if (cockpitCrew.length) flight.cockpitCrew = cockpitCrew

    const supplier = {}
    if (skybossEco != null && skybossEco > 0) supplier.skybossEco = skybossEco
    if (businessPax != null && businessPax > 0) supplier.businessPax = businessPax
    if (Object.keys(supplier).length) flight.supplier = supplier

    flights.push(flight)
  }

  return {
    serviceDate,
    serviceWeekday: weekdayVi(serviceDate),
    status: 'ungrouped',
    groups: [],
    ungroupedFlights: flights,
  }
}

const files = process.argv.slice(2)
const paths = files.length ? files : DEFAULT_FILES

const dataset = JSON.parse(readFileSync(outPath, 'utf8'))
const newDays = []
for (const p of paths) {
  const day = await parseCrewList(p)
  const withMeals = day.ungroupedFlights.filter((f) => (f.meals?.length ?? 0) > 0).length
  const withSky = day.ungroupedFlights.filter((f) => f.supplier?.skybossEco).length
  console.log(
    `${p.split(/[/\\]/).pop()}: ${day.serviceDate} → ${day.ungroupedFlights.length} flights (meals=${withMeals}, skyboss=${withSky})`,
  )
  newDays.push(day)
}

const byDate = new Map(dataset.days.map((d) => [d.serviceDate, d]))
for (const day of newDays) byDate.set(day.serviceDate, day)

dataset.days = [...byDate.values()].sort((a, b) => {
  const [da, ma, ya] = a.serviceDate.split('/').map(Number)
  const [db, mb, yb] = b.serviceDate.split('/').map(Number)
  return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db)
})

dataset.seedVersion = '2026-07-28-29-crew-list-full'
writeFileSync(outPath, `${JSON.stringify(dataset, null, 2)}\n`)
console.log('Wrote', outPath)
console.log(
  'Days:',
  dataset.days.map((d) => `${d.serviceDate} ${d.status} n=${d.ungroupedFlights?.length ?? 0}`),
)
console.log('seedVersion', dataset.seedVersion)
