import type { TrolleyUnit } from '../constants'

const DAY = 86_400_000

/**
 * Per-vendor on-time completion rate (0–100, rounded), across ALL trolleys'
 * repairHistory. On-time = a completed repair whose TAT
 * (max(1, floor((completedAt-startedAt)/DAY))) is <= slaDays.
 *
 * Vendors that appear only via open (uncompleted) repairs are included with
 * a rate of 0, rather than omitted. Pure — never mutates `trolleys`.
 */
export function computeVendorOnTime(trolleys: TrolleyUnit[], slaDays = 7): Record<string, number> {
  const byVendor = new Map<string, { onTime: number; completed: number }>()

  for (const unit of trolleys) {
    for (const entry of unit.repairHistory) {
      const bucket = byVendor.get(entry.vendor) ?? { onTime: 0, completed: 0 }
      if (entry.completedAt != null) {
        bucket.completed += 1
        const tatDays = Math.max(1, Math.floor((entry.completedAt - entry.startedAt) / DAY))
        if (tatDays <= slaDays) bucket.onTime += 1
      }
      byVendor.set(entry.vendor, bucket)
    }
  }

  const result: Record<string, number> = {}
  for (const [vendor, { onTime, completed }] of byVendor) {
    result[vendor] = completed === 0 ? 0 : Math.round((onTime / completed) * 100)
  }
  return result
}
