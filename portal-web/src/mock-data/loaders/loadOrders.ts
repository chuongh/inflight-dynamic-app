import type { CateringOrderDataset } from '../../modules/catering/orderTypes'

const STORAGE_KEY = 'vj-mock-catering-orders'

function read(): CateringOrderDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CateringOrderDataset
    return Array.isArray(parsed.orders) ? parsed : null
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
