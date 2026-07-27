import type ExcelJS from 'exceljs'
import { buildSbbSupplierRow } from '../sbbBuilder'
import type {
  SbbLookupDataset,
  SbbLookupItem,
  SbbRouteSheet,
  SbbSupplierRow,
  SupplierFlightInput,
} from '../types'
import { SBB_COLUMNS } from './schema'
import {
  addProvenanceSheet,
  createWorkbook,
  effectiveValue,
  parseIsoExcelDate,
  setReferenceWidths,
  styleSupplierTable,
  styleSupportSheet,
  writeWorkbook,
} from './workbookUtils'

const ROUTE_SHEETS = Object.keys(SBB_COLUMNS) as SbbRouteSheet[]
const LOOKUP_ITEMS: SbbLookupItem[] = [
  'bread',
  'basa',
  'pho',
  'bunBo',
  'stickyRice',
  'chickenGravy',
  'blanket',
]

function addLookupSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: readonly {
    sheet?: SbbRouteSheet
    businessPax: number
    items: Partial<Record<SbbLookupItem, number | null>>
  }[],
  source: string,
): void {
  const sheet = workbook.addWorksheet(name)
  sheet.addRow([
    'Route sheet',
    'Số khách SBB',
    ...LOOKUP_ITEMS,
    'Provenance',
  ])
  rows.forEach((lookupRow) => {
    sheet.addRow([
      lookupRow.sheet ?? '',
      lookupRow.businessPax,
      ...LOOKUP_ITEMS.map((item) => lookupRow.items[item] ?? ''),
      source,
    ])
  })
  if (rows.length === 0) {
    sheet.addRow([
      '',
      '',
      ...LOOKUP_ITEMS.map(() => ''),
      `${source} No verified lookup rows are available in the current cleaned dataset.`,
    ])
  }
  styleSupportSheet(sheet)
  sheet.getColumn(LOOKUP_ITEMS.length + 3).width = 70
}

function addSbbLookupSheets(
  workbook: ExcelJS.Workbook,
  lookup: SbbLookupDataset,
): void {
  const generalRows = (
    ['VIET-HAN-NHAT', 'CHAY(VIỆT-HÀN-NHẬT)', 'ẤN'] as SbbRouteSheet[]
  ).flatMap((sheet) =>
    lookup.sheets[sheet].map((row) => ({ ...row, sheet })),
  )
  addLookupSheet(workbook, 'QUY TẮC C', generalRows, lookup.source)
  addLookupSheet(
    workbook,
    'QUY TẮC C ÚC&KAZ',
    lookup.sheets['ÚC&KAZ'].map((row) => ({ ...row, sheet: 'ÚC&KAZ' as const })),
    lookup.source,
  )
  addLookupSheet(
    workbook,
    'QUY TẮC SGN-PQC',
    [],
    `${lookup.source} The current JSON contains no verified SGN-PQC lookup rows; schema retained without fabricated values.`,
  )
}

export async function buildSbbWorkbook(
  inputRows: readonly SbbSupplierRow[],
  lookup: SbbLookupDataset,
): Promise<Uint8Array | null> {
  const rows = inputRows.filter(
    (row) => (row.cells.businessPax.value ?? 0) > 0,
  )
  if (rows.length === 0) return null

  const workbook = await createWorkbook()
  workbook.creator = 'VietJet Catering Planner'
  workbook.created = new Date()

  for (const sheetName of ROUTE_SHEETS) {
    const columns = SBB_COLUMNS[sheetName]
    const sheet = workbook.addWorksheet(sheetName)
    sheet.addRow(columns.map((column) => column.productCode))
    sheet.addRow(columns.map((column) => column.header))
    const sheetRows = rows.filter((row) => row.sheet === sheetName)
    sheetRows.forEach((supplierRow) => {
      const row = sheet.addRow(columns.map((column) => {
        if (column.identity === 'operatingDate') {
          return parseIsoExcelDate(supplierRow.operatingDate)
        }
        if (column.identity) return supplierRow[column.identity]
        if (column.field) return effectiveValue(supplierRow.cells[column.field])
        return ''
      }))
      row.getCell(1).numFmt = 'dd/mm/yyyy'
    })
    setReferenceWidths(sheet, columns)
    styleSupplierTable(sheet, columns.length, sheetRows.length + 2)
  }

  addSbbLookupSheets(workbook, lookup)
  addProvenanceSheet(
    workbook,
    rows,
    'SBB',
    (row, field) =>
      SBB_COLUMNS[(row as SbbSupplierRow).sheet]
        .find((column) => column.field === field)?.letter ?? '',
  )
  return writeWorkbook(workbook)
}

export async function buildSbbWorkbookFromInputs(
  inputs: readonly SupplierFlightInput[],
  lookup: SbbLookupDataset,
): Promise<Uint8Array | null> {
  const rows = inputs.flatMap((input) => {
    const row = buildSbbSupplierRow(input, lookup)
    return row ? [row] : []
  })
  return buildSbbWorkbook(rows, lookup)
}
