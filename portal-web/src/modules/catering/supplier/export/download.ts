export type SupplierExportProduct = 'eco' | 'sbb'

function compactDate(value: string): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (iso) return `${iso[1]}${iso[2]}${iso[3]}`
  const projectDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (projectDate) return `${projectDate[3]}${projectDate[2]}${projectDate[1]}`
  throw new Error(`Invalid supplier export date: ${value}`)
}

export function buildSupplierExportFilename(
  station: string,
  product: SupplierExportProduct,
  operatingDate: string,
): string {
  const normalizedStation = station.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(normalizedStation)) {
    throw new Error(`Invalid supplier export station: ${station}`)
  }
  return `GC-${normalizedStation}-${product.toUpperCase()}-${compactDate(operatingDate)}.xlsx`
}

export function downloadXlsx(bytes: Uint8Array, filename: string): void {
  const browserBytes = new Uint8Array(bytes)
  const blob = new Blob(
    [browserBytes.buffer],
    {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  )
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  try {
    anchor.click()
  } finally {
    anchor.remove()
    // Revoke after the click handler has had a chance to start the download.
    queueMicrotask(() => URL.revokeObjectURL(objectUrl))
  }
}
