import type { CateringOrderDataset, CateringOrderLine } from '../../modules/catering/orderTypes'

const STORAGE_KEY = 'vj-mock-catering-orders'

/** WIP catalog rename briefly wrote `productCodes` onto cached order lines. */
type LegacyLine = CateringOrderLine & { productCodes?: string[] }

function migrateLine(line: LegacyLine): CateringOrderLine {
  if (Array.isArray(line.pbmlCodes)) {
    const { productCodes: _drop, ...rest } = line
    return rest
  }
  return {
    name: line.name,
    category: line.category,
    pbmlCodes: line.productCodes ?? [],
    suggested: line.suggested,
    qty: line.qty,
  }
}

function read(): CateringOrderDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CateringOrderDataset
    if (!Array.isArray(parsed.orders)) return null
    return {
      orders: parsed.orders.map((o) => ({
        ...o,
        lines: (o.lines as LegacyLine[]).map(migrateLine),
      })),
    }
  } catch {
    return null
  }
}

export function getOrdersCache(): CateringOrderDataset {
  return read() ?? { orders: [] }
}

export function saveOrdersCache(dataset: CateringOrderDataset) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
}
