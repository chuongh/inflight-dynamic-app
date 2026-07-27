import type ExcelJS from 'exceljs'
import type {
  EcoSupplierRow,
  SbbSupplierRow,
  SupplierCell,
} from '../types'
import type { ExportColumn } from './schema'

const VJ_RED = 'FFF02823'
const VJ_YELLOW = 'FFFFDD32'
const DARK_TEXT = 'FF231F20'

export async function createWorkbook(): Promise<ExcelJS.Workbook> {
  const { default: ExcelJSModule } = await import('exceljs')
  return new ExcelJSModule.Workbook()
}

export function parseIsoExcelDate(value: string): Date | '' {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return ''
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

export function effectiveValue(cell: SupplierCell<number>): number | '' {
  return cell.value ?? ''
}

export function styleSupplierTable(
  sheet: ExcelJS.Worksheet,
  columnCount: number,
  dataEndRow: number,
): void {
  const productRow = sheet.getRow(1)
  productRow.height = 22
  productRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VJ_RED } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  const headerRow = sheet.getRow(2)
  headerRow.height = 38
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VJ_YELLOW } }
    cell.font = { bold: true, color: { argb: DARK_TEXT }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  for (let rowNumber = 3; rowNumber <= dataEndRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'middle', wrapText: false }
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      }
    })
  }
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }]
  sheet.autoFilter = { from: 'A2', to: `${sheet.getColumn(columnCount).letter}${Math.max(2, dataEndRow)}` }
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  }
}

export function setReferenceWidths(
  sheet: ExcelJS.Worksheet,
  columns: readonly ExportColumn<string>[],
): void {
  columns.forEach((column, index) => {
    const width = column.identity === 'operatingDate'
      ? 13
      : column.identity
        ? 11
        : Math.min(24, Math.max(10, column.header.length * 0.8))
    sheet.getColumn(index + 1).width = width
  })
}

export function styleSupportSheet(sheet: ExcelJS.Worksheet): void {
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VJ_RED } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  })
  sheet.columns.forEach((column) => {
    column.width = 28
  })
}

export function addProvenanceSheet(
  workbook: ExcelJS.Workbook,
  rows: readonly (EcoSupplierRow | SbbSupplierRow)[],
  product: 'ECO' | 'SBB',
  columnForField: (row: EcoSupplierRow | SbbSupplierRow, field: string) => string,
): void {
  const sheet = workbook.addWorksheet('PROVENANCE', { state: 'hidden' })
  sheet.addRow([
    'Flight key',
    'Product/sheet',
    'Field',
    'Column',
    'Effective value',
    'Source',
  ])
  for (const row of rows) {
    for (const [field, cell] of Object.entries(row.cells)) {
      sheet.addRow([
        row.key,
        product === 'ECO' ? product : (row as SbbSupplierRow).sheet,
        field,
        columnForField(row, field),
        effectiveValue(cell),
        cell.source,
      ])
    }
  }
  styleSupportSheet(sheet)
  sheet.getColumn(1).width = 32
  sheet.getColumn(6).width = 60
}

export async function writeWorkbook(workbook: ExcelJS.Workbook): Promise<Uint8Array> {
  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer as unknown as ArrayBuffer)
}
