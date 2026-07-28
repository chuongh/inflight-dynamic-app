import { describe, expect, it } from 'vitest'
import lookupJson from '../../../mock-data/catering/supplier/sbb-lookups.json'
import supplierFlightsJson from '../../../mock-data/catering/supplier/flights-2026-07-08.json'
import { buildSbbSupplierRow } from './sbbBuilder'
import { selectSbbRouteSheet } from './sbbRules'
import type { SbbLookupDataset, SupplierFlightInput } from './types'

const lookup = lookupJson as SbbLookupDataset
const flights = supplierFlightsJson as SupplierFlightInput[]

describe('SBB route selection', () => {
  it('selects each supported route sheet', () => {
    expect(selectSbbRouteSheet('SGN', 'HAN')).toBe('VIET-HAN-NHAT')
    expect(selectSbbRouteSheet('SGN', 'NRT', 'vegetarian')).toBe('CHAY(VIỆT-HÀN-NHẬT)')
    expect(selectSbbRouteSheet('SGN', 'DEL')).toBe('ẤN')
    expect(selectSbbRouteSheet('SGN', 'MEL')).toBe('ÚC&KAZ')
  })

  it('uses configurable STD/ARR bindings when provided', () => {
    const bindings = {
      ẤN: { airports: ['DEL'], priority: 10 },
      'ÚC&KAZ': { airports: ['ICN'], priority: 20 },
    } as const
    expect(selectSbbRouteSheet('SGN', 'DEL', 'standard', bindings)).toBe('ẤN')
    expect(selectSbbRouteSheet('SGN', 'ICN', 'standard', bindings)).toBe('ÚC&KAZ')
    expect(selectSbbRouteSheet('SGN', 'MEL', 'standard', bindings)).toBe('VIET-HAN-NHAT')
  })
})

describe('buildSbbSupplierRow', () => {
  it('does not emit SBB when businessPax is zero or null', () => {
    expect(buildSbbSupplierRow({
      operatingDate: '08/07/2026',
      flightNo: 'VJ999',
      dep: 'SGN',
      arr: 'HAN',
      businessPax: 0,
    }, lookup)).toBeNull()
    expect(buildSbbSupplierRow({
      operatingDate: '08/07/2026',
      flightNo: 'VJ999',
      dep: 'SGN',
      arr: 'HAN',
      businessPax: null,
    }, lookup)).toBeNull()
  })

  it('emits SBB when businessPax is positive and keeps it distinct from skybossEco', () => {
    const fixture = flights.find((flight) => flight.flightNo === 'VJ083')
    expect(fixture).toBeDefined()

    const row = buildSbbSupplierRow(fixture!, lookup)

    expect(fixture!.skybossEco).toBe(8)
    expect(fixture!.businessPax).toBe(9)
    expect(row?.cells.businessPax.value).toBe(9)
  })

  it('preserves the verified VJ85 and VJ162 passenger facts', () => {
    const vj85 = flights.find((flight) => flight.flightNo === 'VJ085')
    const vj162 = flights.find((flight) => flight.flightNo === 'VJ162')

    expect(vj85?.skybossEco).toBe(15)
    expect(vj85?.businessPax).toBe(4)
    expect(buildSbbSupplierRow(vj85!, lookup)?.cells.businessPax.value).toBe(4)
    expect(vj162?.skybossEco).toBe(0)
    expect(vj162?.businessPax).toBe(1)
    expect(buildSbbSupplierRow(vj162!, lookup)?.cells.businessPax.value).toBe(1)
  })

  it('fills VJ83 ÚC&KAZ lookup quantities from QUY TẮC C ÚC&KAZ', () => {
    const fixture = flights.find((flight) => flight.flightNo === 'VJ083')
    const row = buildSbbSupplierRow(fixture!, lookup)

    expect(row?.cells.bread.value).toBe(4)
    expect(row?.cells.basa.value).toBe(4)
    expect(row?.cells.pho.value).toBe(6)
    expect(row?.cells.bunBo.value).toBe(6)
    expect(row?.cells.stickyRice.value).toBe(4)
    expect(row?.cells.chickenGravy.value).toBe(4)
  })

  it('builds the verified VJ81 Australia business golden values', () => {
    const fixture = flights.find((flight) => flight.flightNo === 'VJ081')
    expect(fixture).toBeDefined()

    const row = buildSbbSupplierRow(fixture!, lookup)

    expect(row?.sheet).toBe('ÚC&KAZ')
    expect(row?.cells.businessPax.value).toBe(11)
    expect(row?.cells.bread.value).toBe(5)
    expect(row?.cells.basa.value).toBe(4)
    expect(row?.cells.pho.value).toBe(7)
    expect(row?.cells.bunBo.value).toBe(7)
    expect(row?.cells.stickyRice.value).toBe(5)
    expect(row?.cells.chickenGravy.value).toBe(4)
    expect(row?.cells.cocktail.value).toBe(22)
    expect(row?.cells.maccaRaisins.value).toBe(22)
    expect(row?.cells.utensils.value).toBe(39)
    expect(row?.cells.kit.value).toBe(12)
    expect(row?.cells.pillow.value).toBe(12)
    expect(row?.cells.mattress.value).toBe(12)
    expect(row?.cells.blanket.value).toBeNull()
  })

  it('takes non-Australia amenity fields from sbb* inputs', () => {
    const fixture = flights.find((flight) => flight.flightNo === 'VJ162')
    const row = buildSbbSupplierRow({
      ...fixture!,
      sbbCocktail: 5,
      sbbMaccaRaisins: 6,
      sbbUtensils: 7,
      sbbKit: 8,
      sbbPillow: 9,
      sbbMattress: 10,
    }, lookup)

    expect(row?.cells.cocktail.value).toBe(5)
    expect(row?.cells.maccaRaisins.value).toBe(6)
    expect(row?.cells.utensils.value).toBe(7)
    expect(row?.cells.kit.value).toBe(8)
    expect(row?.cells.pillow.value).toBe(9)
    expect(row?.cells.mattress.value).toBe(10)
    expect(row?.cells.businessPax.source).toContain('VJ162')
  })

  it('returns null lookup cells when businessPax has no exact row', () => {
    const row = buildSbbSupplierRow({
      operatingDate: '08/07/2026',
      flightNo: 'VJ81',
      dep: 'SGN',
      arr: 'MEL',
      businessPax: 13,
    }, lookup)

    expect(row?.cells.bread.value).toBeNull()
    expect(row?.cells.cocktail.value).toBe(26)
    expect(row?.cells.utensils.value).toBe(46)
  })

  it('puts value and source on every SBB output cell', () => {
    const fixture = flights.find((flight) => flight.flightNo === 'VJ081')
    const row = buildSbbSupplierRow(fixture!, lookup)

    for (const cell of Object.values(row!.cells)) {
      expect(cell.source.length).toBeGreaterThan(0)
      expect(Object.keys(cell).sort()).toEqual(['source', 'value'])
    }
  })
})
