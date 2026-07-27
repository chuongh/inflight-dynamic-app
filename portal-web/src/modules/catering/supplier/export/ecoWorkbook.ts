import type ExcelJS from 'exceljs'
import type { EcoSupplierRow } from '../types'
import {
  ECO_COLUMNS,
  ECO_SUPPORT_SHEETS,
  REFERENCE_PROVENANCE,
} from './schema'
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

function addEcoSupportSheets(workbook: ExcelJS.Workbook): void {
  for (const [name, referenceRows] of Object.entries(ECO_SUPPORT_SHEETS)) {
    const sheet = workbook.addWorksheet(name)
    referenceRows.forEach((row) => sheet.addRow([...row]))
    sheet.addRow([])
    sheet.addRow(['Provenance', REFERENCE_PROVENANCE])
    styleSupportSheet(sheet)
  }

  const routeSheet = workbook.addWorksheet('LIST ĐƯỜNG BAY THEO GIỜ')
  routeSheet.addRow([
    'Flight/route key',
    'DEP',
    'ARR',
    'STD from',
    'STD to',
    'Aircraft',
    'Amenity/package',
    'Effective from',
    'Effective to',
    'Source',
  ])
  routeSheet.addRow([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `${REFERENCE_PROVENANCE} No verified route rows are available in the current cleaned dataset.`,
  ])
  styleSupportSheet(routeSheet)
}

export async function buildEcoWorkbook(
  rows: readonly EcoSupplierRow[],
): Promise<Uint8Array> {
  const workbook = await createWorkbook()
  workbook.creator = 'VietJet Catering Planner'
  workbook.created = new Date()
  workbook.calcProperties.fullCalcOnLoad = true

  const sheet = workbook.addWorksheet('NEW')
  sheet.addRow(ECO_COLUMNS.map((column) => column.productCode))
  sheet.addRow(ECO_COLUMNS.map((column) => column.header))

  rows.forEach((supplierRow, rowIndex) => {
    const values = ECO_COLUMNS.map((column, columnIndex) => {
      if (columnIndex === 0) return rowIndex + 1
      if (column.identity === 'operatingDate') {
        return parseIsoExcelDate(supplierRow.operatingDate)
      }
      if (column.identity) return supplierRow[column.identity]
      if (column.field) return effectiveValue(supplierRow.cells[column.field])
      return ''
    })
    const row = sheet.addRow(values)
    row.getCell(2).numFmt = 'dd/mm/yyyy'
  })

  const firstDataRow = 3
  const lastDataRow = rows.length + 2
  const totalRow = sheet.addRow(ECO_COLUMNS.map((column, columnIndex) => {
    if (columnIndex === 0) return 'TOTAL'
    if (!column.field || rows.length === 0) return ''
    return {
      formula: `SUM(${column.letter}${firstDataRow}:${column.letter}${lastDataRow})`,
    }
  }))
  totalRow.font = { bold: true }
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF4CC' },
  }

  setReferenceWidths(sheet, ECO_COLUMNS)
  styleSupplierTable(sheet, ECO_COLUMNS.length, lastDataRow)
  addEcoSupportSheets(workbook)
  addProvenanceSheet(
    workbook,
    rows,
    'ECO',
    (_row, field) =>
      ECO_COLUMNS.find((column) => column.field === field)?.letter ?? '',
  )

  return writeWorkbook(workbook)
}
