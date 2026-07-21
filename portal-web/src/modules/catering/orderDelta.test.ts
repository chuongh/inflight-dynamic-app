import { describe, expect, it } from 'vitest'
import { changedLines, changedLinesFromLines } from './orderSnapshot'
import type { CateringOrderLine, OrderSourceCell } from './orderTypes'

const line = (p: Partial<CateringOrderLine> & { name: string; qty: number }): CateringOrderLine => ({
  category: 'prebook', pbmlCodes: [], suggested: p.qty, ...p,
})

describe('changedLinesFromLines (fallback when no breakdown)', () => {
  it('lists changed lines by dish, with no per-flight detail', () => {
    const base = [line({ name: 'Cơm', qty: 100 }), line({ name: 'Mì', qty: 50 })]
    const next = [line({ name: 'Cơm', qty: 108 }), line({ name: 'Mì', qty: 50 })]
    const changed = changedLinesFromLines(base, next)
    expect(changed).toEqual([{ category: 'prebook', name: 'Cơm', from: 100, to: 108, delta: 8, flights: [] }])
  })

  it('handles a dish that only exists in one version', () => {
    const changed = changedLinesFromLines([line({ name: 'Cơm', qty: 100 })], [line({ name: 'Cơm', qty: 100 }), line({ name: 'Phở', qty: 6 })])
    expect(changed).toEqual([{ category: 'prebook', name: 'Phở', from: 0, to: 6, delta: 6, flights: [] }])
  })
})

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
