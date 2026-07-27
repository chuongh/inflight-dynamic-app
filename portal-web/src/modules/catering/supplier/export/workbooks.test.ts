import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import ecoRouteRulesJson from '@/mock-data/catering/supplier/eco-route-rules.json'
import supplierFlightsJson from '@/mock-data/catering/supplier/flights-2026-07-08.json'
import sbbLookupsJson from '@/mock-data/catering/supplier/sbb-lookups.json'
import { buildEcoSupplierRow } from '../ecoBuilder'
import { buildSbbSupplierRow } from '../sbbBuilder'
import type {
  EcoRouteRuleDataset,
  EcoSupplierInput,
  SbbLookupDataset,
  SupplierFlightInput,
} from '../types'
import { buildEcoWorkbook } from './ecoWorkbook'
import {
  ECO_REFERENCE_PAIRS,
  SBB_REFERENCE_LAST_COLUMNS,
  SBB_REFERENCE_PAIRS,
} from './referenceSchema.fixture'
import {
  buildSbbWorkbook,
  buildSbbWorkbookFromInputs,
} from './sbbWorkbook'

const ecoRules = ecoRouteRulesJson as EcoRouteRuleDataset
const sbbLookups = sbbLookupsJson as SbbLookupDataset
const flights = supplierFlightsJson as SupplierFlightInput[]
const vj81 = flights.find((flight) => flight.flightNo === 'VJ081')!

async function readWorkbook(bytes: Uint8Array) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer)
  return workbook
}

function exportableEcoRow() {
  return buildEcoSupplierRow({
    ...vj81,
    workbookReferenceBread: null,
    quotaCommercial: 1,
    hotmealItems: vj81.hotmealItems ?? {},
    boiledEggs: vj81.boiledEggs ?? null,
    reserveUtensils: vj81.reserveUtensils ?? null,
    totalPrebook: vj81.totalPrebook ?? null,
    skybossEco: vj81.skybossEco ?? null,
    australiaBeefFreshVegetables: 4,
    australiaBreadVegetables: 5,
  } satisfies EcoSupplierInput, ecoRules)
}

describe('ECO XLSX workbook', () => {
  it('round-trips the reference schema, typed values, totals, and support sheets', async () => {
    const workbook = await readWorkbook(await buildEcoWorkbook([exportableEcoRow()]))

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'NEW',
      'A321',
      'A330',
      'LIST ĐƯỜNG BAY THEO GIỜ',
      'PROVENANCE',
    ])
    const sheet = workbook.getWorksheet('NEW')!
    expect(ECO_REFERENCE_PAIRS).toHaveLength(66)
    expect(sheet.actualColumnCount).toBe(66)
    expect(sheet.getRow(1).values).toEqual([
      undefined,
      ...ECO_REFERENCE_PAIRS.map(([productCode]) => productCode),
    ])
    expect(sheet.getRow(2).values).toEqual([
      undefined,
      ...ECO_REFERENCE_PAIRS.map(([, header]) => header),
    ])
    expect(sheet.getCell('B3').value).toBeInstanceOf(Date)
    expect(sheet.getCell('F3').value).toBe('VJ81')
    expect(sheet.getCell('S3').value).toBe(283)
    expect(sheet.getCell('AH3').value).toBe(316)
    expect(sheet.getCell('AQ3').value).toBe(282)
    expect(sheet.getCell('AH4').value).toEqual({ formula: 'SUM(AH3:AH3)' })
    expect(sheet.autoFilter).toBe('A2:BN3')
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 2 })
    expect(workbook.getWorksheet('PROVENANCE')?.state).toBe('hidden')
    expect(workbook.getWorksheet('PROVENANCE')?.getCell('A2').value).toBe(
      '2026-07-08|VJ81|SGN|MEL',
    )
  })

  it('writes unknown values as blank cells, never numeric zero', async () => {
    const row = exportableEcoRow()
    row.cells.skyboss = { value: null, source: row.cells.skyboss.source }

    const workbook = await readWorkbook(await buildEcoWorkbook([row]))

    expect(workbook.getWorksheet('NEW')?.getCell('AP3').value).toBe('')
    expect(workbook.getWorksheet('NEW')?.getCell('AP3').value).not.toBe(0)
  })

  it('records provenance value and source columns', async () => {
    const workbook = await readWorkbook(await buildEcoWorkbook([exportableEcoRow()]))
    const provenance = workbook.getWorksheet('PROVENANCE')!
    expect(provenance.getRow(1).values).toEqual([
      undefined,
      'Flight key',
      'Product/sheet',
      'Field',
      'Column',
      'Effective value',
      'Source',
    ])
    const breadRow = provenance
      .getRows(2, provenance.rowCount - 1)
      ?.find((row) => row.getCell(3).value === 'bread')
    expect(breadRow?.getCell(5).value).toBe(283)
    expect(String(breadRow?.getCell(6).value)).toContain('quotaCommercial + totalPrebook')
  })
})

describe('SBB XLSX workbook', () => {
  it('round-trips reference sheets, column orders, mapped VJ81 values, and provenance', async () => {
    const row = buildSbbSupplierRow(vj81, sbbLookups)!
    const bytes = await buildSbbWorkbook([row], sbbLookups)
    expect(bytes).not.toBeNull()
    const workbook = await readWorkbook(bytes!)

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'VIET-HAN-NHAT',
      'CHAY(VIỆT-HÀN-NHẬT)',
      'ẤN',
      'ÚC&KAZ',
      'QUY TẮC C',
      'QUY TẮC C ÚC&KAZ',
      'QUY TẮC SGN-PQC',
      'PROVENANCE',
    ])
    const sheet = workbook.getWorksheet('ÚC&KAZ')!
    expect(sheet.actualColumnCount).toBe(49)
    expect(sheet.getCell('D3').value).toBe(11)
    expect(sheet.getCell('H3').value).toBe(5)
    expect(sheet.getCell('AN3').value).toBe(22)
    expect(sheet.getCell('AR3').value).toBe(39)
    expect(workbook.getWorksheet('PROVENANCE')?.getCell('B2').value).toBe(
      'ÚC&KAZ',
    )
  })

  it('matches every independent reference sheet schema and terminal column', async () => {
    const row = buildSbbSupplierRow(vj81, sbbLookups)!
    const workbook = await readWorkbook((await buildSbbWorkbook([row], sbbLookups))!)

    for (const [sheetName, pairs] of Object.entries(SBB_REFERENCE_PAIRS)) {
      const sheet = workbook.getWorksheet(sheetName)!
      expect(sheet.actualColumnCount).toBe(pairs.length)
      expect(sheet.getColumn(pairs.length).letter).toBe(
        SBB_REFERENCE_LAST_COLUMNS[
          sheetName as keyof typeof SBB_REFERENCE_LAST_COLUMNS
        ],
      )
      expect(sheet.getRow(1).values).toEqual([
        undefined,
        ...pairs.map(([productCode]) => productCode),
      ])
      expect(sheet.getRow(2).values).toEqual([
        undefined,
        ...pairs.map(([, header]) => header),
      ])
    }
  })

  it('returns null from zero-business-pax source inputs', async () => {
    expect(await buildSbbWorkbookFromInputs([
      { ...vj81, businessPax: 0 },
    ], sbbLookups)).toBeNull()
  })

  it('freezes, filters, sizes, and applies VietJet header styling to every SBB sheet', async () => {
    const row = buildSbbSupplierRow(vj81, sbbLookups)!
    const workbook = await readWorkbook((await buildSbbWorkbook([row], sbbLookups))!)

    for (const [sheetName, pairs] of Object.entries(SBB_REFERENCE_PAIRS)) {
      const sheet = workbook.getWorksheet(sheetName)!
      const endRow = sheetName === 'ÚC&KAZ' ? 3 : 2
      expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 2 })
      expect(sheet.autoFilter).toBe(`A2:${SBB_REFERENCE_LAST_COLUMNS[
        sheetName as keyof typeof SBB_REFERENCE_LAST_COLUMNS
      ]}${endRow}`)
      expect(sheet.getColumn(1).width).toBeGreaterThanOrEqual(10)
      expect(sheet.getColumn(pairs.length).width).toBeGreaterThanOrEqual(10)
      expect(sheet.getCell('A1').fill).toEqual(expect.objectContaining({
        type: 'pattern',
        fgColor: { argb: 'FFF02823' },
      }))
      expect(sheet.getCell('A2').fill).toEqual(expect.objectContaining({
        type: 'pattern',
        fgColor: { argb: 'FFFFDD32' },
      }))
      expect(sheet.getCell('A2').font).toEqual(expect.objectContaining({
        bold: true,
      }))
    }
  })

  it('exports fully populated rows for all four destination-specific schemas', async () => {
    const lookup: SbbLookupDataset = {
      ...sbbLookups,
      sheets: {
        'VIET-HAN-NHAT': [{
          businessPax: 1,
          items: { bread: 4, pho: 2, stickyRice: 3, blanket: 7 },
        }],
        'CHAY(VIỆT-HÀN-NHẬT)': [{
          businessPax: 1,
          items: {},
        }],
        'ẤN': [{
          businessPax: 1,
          items: { bread: 3, chickenGravy: 2, blanket: 6 },
        }],
        'ÚC&KAZ': sbbLookups.sheets['ÚC&KAZ'],
      },
    }
    const rows = [
      buildSbbSupplierRow({
        operatingDate: '08/07/2026',
        flightNo: 'VJ100',
        dep: 'SGN',
        arr: 'HAN',
        businessPax: 1,
        sbbCocktail: 5,
        sbbMaccaRaisins: 6,
        sbbPillow: 8,
        sbbUtensils: 7,
        sbbKit: 7,
        sbbMattress: 8,
      }, lookup)!,
      buildSbbSupplierRow({
        operatingDate: '08/07/2026',
        flightNo: 'VJ101',
        dep: 'SGN',
        arr: 'NRT',
        businessPax: 1,
        sbbMealType: 'vegetarian',
      }, lookup)!,
      buildSbbSupplierRow({
        operatingDate: '08/07/2026',
        flightNo: 'VJ102',
        dep: 'SGN',
        arr: 'DEL',
        businessPax: 1,
        sbbCocktail: 4,
        sbbMaccaRaisins: 5,
        sbbPillow: 7,
        sbbUtensils: 6,
        sbbKit: 6,
        sbbMattress: 7,
      }, lookup)!,
      buildSbbSupplierRow(vj81, lookup)!,
    ]

    const workbook = await readWorkbook((await buildSbbWorkbook(rows, lookup))!)

    const viet = workbook.getWorksheet('VIET-HAN-NHAT')!
    expect([
      viet.getCell('D3').value,
      viet.getCell('E3').value,
      viet.getCell('G3').value,
      viet.getCell('H3').value,
      viet.getCell('Y3').value,
      viet.getCell('Z3').value,
      viet.getCell('AA3').value,
      viet.getCell('AB3').value,
    ]).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(workbook.getWorksheet('CHAY(VIỆT-HÀN-NHẬT)')?.getCell('D3').value).toBe(1)
    const india = workbook.getWorksheet('ẤN')!
    expect([
      india.getCell('D3').value,
      india.getCell('E3').value,
      india.getCell('J3').value,
      india.getCell('U3').value,
      india.getCell('V3').value,
      india.getCell('W3').value,
      india.getCell('X3').value,
    ]).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(workbook.getWorksheet('ÚC&KAZ')?.getCell('D3').value).toBe(11)
  })
})
