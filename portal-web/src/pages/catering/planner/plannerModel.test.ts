import { describe, expect, it } from 'vitest'
import ecoRouteRulesJson from '../../../mock-data/catering/supplier/eco-route-rules.json'
import supplierFlightsJson from '../../../mock-data/catering/supplier/flights-2026-07-08.json'
import sbbLookupsJson from '../../../mock-data/catering/supplier/sbb-lookups.json'
import {
  applySupplierEdits,
  buildPlannerWorkspace,
  countCellsIssues,
  derivePlannerContext,
  ECO_FIELD_GROUPS,
  getPlannerCellAccessibleName,
  getPlannerScrollBehavior,
  groupFlightsBySbbRouteSheet,
  parsePlannerFlights,
  selectPlannerFlight,
  selectFlightStatus,
  SBB_FIELD_GROUPS,
  rollupDishOverview,
} from './plannerModel'

describe('plannerModel', () => {
  it('parses the dated supplier flight fixture and rejects malformed rows', () => {
    const parsed = parsePlannerFlights(supplierFlightsJson)

    expect(parsed).toHaveLength(4)
    expect(parsed[0]).toMatchObject({
      operatingDate: '08/07/2026',
      flightNo: 'VJ081',
      dep: 'SGN',
      arr: 'MEL',
    })
    expect(() => parsePlannerFlights([{ flightNo: 'VJ999' }])).toThrow(
      'Invalid planner flight at row 1',
    )
  })

  it('builds ECO and positive-business-pax SBB rows from route datasets', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )

    expect(workspace.flights).toHaveLength(4)
    expect(workspace.flights.every((flight) => flight.eco != null)).toBe(true)
    expect(workspace.sbbRows).toHaveLength(4)
    expect(workspace.sbbRows.map((row) => row.sheet)).toEqual([
      'ÚC&KAZ',
      'ÚC&KAZ',
      'ÚC&KAZ',
      'VIET-HAN-NHAT',
    ])
    expect(workspace.flights[0].eco.cells.hotmealTotal.value).toBe(316)
  })

  it('treats all flights as ready in the happy-case numeric model', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )

    expect(workspace.summary.totalFlights).toBe(4)
    expect(workspace.summary.blockers).toBe(0)
    expect(workspace.summary.readyFlights).toBe(4)
    expect(selectFlightStatus({ blockers: 1, warnings: 9 })).toBe('ready')
  })

  it('exposes grouped preview fields instead of a flat workbook clone', () => {
    expect(ECO_FIELD_GROUPS.map((group) => group.key)).toEqual([
      'hotmeal',
      'bread-eggs',
      'condiments',
      'utensils',
      'commercial',
      'amenity-ops',
    ])
    expect(ECO_FIELD_GROUPS.flatMap((group) => group.fields)).toContain(
      'hotmealTotal',
    )
    expect(SBB_FIELD_GROUPS.flatMap((group) => group.fields)).toContain('blanket')
  })

  it('applies direct supplierEdits onto cell values for display and export', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )
    const key = workspace.flights[0].key
    const patched = applySupplierEdits(workspace, {
      [key]: { eco: { spaghetti: 80 } },
    })

    expect(workspace.flights[0].eco.cells.spaghetti.value).toBe(77)
    expect(patched.flights[0].eco.cells.spaghetti.value).toBe(80)
    expect(patched.ecoRows[0].cells.spaghetti.value).toBe(80)
    expect(patched.flights[0].eco.cells.spaghetti.source).toBe('Manual edit')
  })

  it('reports zero blockers and warnings for happy-case cells', () => {
    expect(countCellsIssues({
      quantity: { value: null, source: 'Not provided' },
    })).toEqual({ blockers: 0, warnings: 0 })
  })

  it('retains a valid selected flight and otherwise falls back to the first', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )

    expect(selectPlannerFlight(workspace.flights, workspace.flights[2].key)).toBe(
      workspace.flights[2],
    )
    expect(selectPlannerFlight(workspace.flights, 'missing-key')).toBe(
      workspace.flights[0],
    )
    expect(selectPlannerFlight([], 'missing-key')).toBeUndefined()
  })

  it('groups positive-pax SBB flights by route sheet in first-seen order', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )
    const groups = groupFlightsBySbbRouteSheet(workspace.flights)

    expect(groups.map((group) => [group.sheet, group.flights.length])).toEqual([
      ['ÚC&KAZ', 3],
      ['VIET-HAN-NHAT', 1],
    ])
    expect(groups.flatMap((group) => group.flights).every((flight) => flight.sbb)).toBe(true)
  })

  it('disables smooth programmatic scrolling when reduced motion is preferred', () => {
    expect(getPlannerScrollBehavior(true)).toBe('auto')
    expect(getPlannerScrollBehavior(false)).toBe('smooth')
  })

  it('derives single and mixed station/date workspace context', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )

    expect(derivePlannerContext(workspace.flights)).toMatchObject({
      stationLabel: 'SGN',
      dateLabel: '08/07/2026',
      stations: ['SGN'],
      dates: ['2026-07-08'],
    })
    expect(derivePlannerContext([
      { dep: 'SGN', operatingDate: '2026-07-08' },
      { dep: 'HAN', operatingDate: '2026-07-09' },
    ])).toMatchObject({
      stationLabel: 'Nhiều trạm',
      dateLabel: 'Nhiều ngày',
    })
  })

  it('builds an accessible cell name from value only', () => {
    expect(getPlannerCellAccessibleName('SkyBoss ECO', {
      value: 0,
      source: 'Flight source',
    })).toBe('SkyBoss ECO, giá trị 0')
    expect(getPlannerCellAccessibleName('Nước tổ bay', {
      value: null,
      source: 'Not provided',
    })).toBe('Nước tổ bay, giá trị chưa có')
  })

  it('keeps unknown distinct from a valid zero', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )
    const domestic = workspace.flights.find((flight) => flight.flightNo === 'VJ162')

    expect(domestic?.eco.cells.skyboss.value).toBe(0)
    expect(domestic?.eco.cells.spaghetti.value).toBe(1)
    expect(domestic?.eco.cells.bread.value).toBe(0)
  })

  it('rolls up dish overview from ECO/SBB without amenities', () => {
    const workspace = buildPlannerWorkspace(
      supplierFlightsJson,
      ecoRouteRulesJson,
      sbbLookupsJson,
    )
    const rollup = rollupDishOverview(workspace.flights)

    expect(rollup.sections.some((s) => s.key.includes('amenity'))).toBe(false)
    expect(rollup.sections.some((s) => s.key === 'sbb:amenities')).toBe(false)
    expect(rollup.total).toBeGreaterThan(0)
    expect(rollup.ecoMeals + rollup.ecoCommercial + rollup.sbbMeals).toBe(rollup.total)
  })
})
