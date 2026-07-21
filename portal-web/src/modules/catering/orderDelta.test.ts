import { describe, expect, it } from 'vitest'
import { changedLines } from './orderSnapshot'
import type { OrderSourceCell } from './orderTypes'

const cell = (p: Partial<OrderSourceCell> & { name: string; qty: number }): OrderSourceCell => ({
  category: 'prebook', groupId: 'g1', ...p,
})

describe('changedLines', () => {
  it('lists only changed lines with per-flight deltas', () => {
    const base: OrderSourceCell[] = [
      cell({ name: 'Cơm', flightNo: 'VJ1', qty: 40 }),
      cell({ name: 'Cơm', flightNo: 'VJ2', qty: 53 }),
      cell({ name: 'Mì', flightNo: 'VJ1', qty: 10 }),
    ]
    const next: OrderSourceCell[] = [
      cell({ name: 'Cơm', flightNo: 'VJ1', qty: 48 }),
      cell({ name: 'Cơm', flightNo: 'VJ2', qty: 57 }),
      cell({ name: 'Mì', flightNo: 'VJ1', qty: 10 }),
    ]
    const changed = changedLines(base, next)
    expect(changed).toHaveLength(1)
    expect(changed[0]).toMatchObject({ name: 'Cơm', from: 93, to: 105, delta: 12 })
    expect(changed[0].flights).toEqual([
      { flightNo: 'VJ1', dep: undefined, arr: undefined, groupId: 'g1', from: 40, to: 48, delta: 8 },
      { flightNo: 'VJ2', dep: undefined, arr: undefined, groupId: 'g1', from: 53, to: 57, delta: 4 },
    ])
  })

  it('handles a flight that only exists in next (new booking)', () => {
    const changed = changedLines(
      [cell({ name: 'Cơm', flightNo: 'VJ1', qty: 40 })],
      [cell({ name: 'Cơm', flightNo: 'VJ1', qty: 40 }), cell({ name: 'Cơm', flightNo: 'VJ3', qty: 6 })],
    )
    expect(changed[0].delta).toBe(6)
    expect(changed[0].flights).toEqual([{ flightNo: 'VJ3', dep: undefined, arr: undefined, groupId: 'g1', from: 0, to: 6, delta: 6 }])
  })

  it('returns nothing when totals are unchanged', () => {
    const same: OrderSourceCell[] = [cell({ name: 'Cơm', flightNo: 'VJ1', qty: 40 })]
    expect(changedLines(same, same)).toEqual([])
  })
})
