/** Per-flight-group ECO supply breakdown (snapshot at order build time). */
import { Button, Empty, Input, InputNumber } from 'antd'
import { ChevronDown, PlaneTakeoff, RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EcoSupplyFlightBreakdown, EcoSupplyGroupId, EcoSupplyLine } from '@/modules/catering/orderTypes'
import { ECO_SUPPLY_FIELDS, ECO_SUPPLY_GROUP_ORDER, ecoSupplyFieldDisplayName } from '@/modules/catering/supplier/ecoSupplyRegistry'
import { DeltaChip, GROUP_STYLE, groupLabel } from './EcoSupplyPanel'

/** Passenger-count metrics shown in the flight header — not repeated in the item list. */
const HEADER_TOTAL_FIELDS = new Set(['prebook', 'skyboss'])

interface FlightBreakdownPanelProps {
  byFlight: EcoSupplyFlightBreakdown[]
  /** Order-level lines — supplies the catalog-resolved category per field, kept in sync with the Supply Breakdown tab. */
  lines: EcoSupplyLine[]
  editable?: boolean
  /** groupId → field → manually overridden qty for that flight group. */
  edits?: Record<string, Record<string, number>>
  onChangeQty?: (groupId: string, field: string, qty: number) => void
  onResetField?: (groupId: string, field: string) => void
  /** Effective qty of the comparison (previous) version, by groupId → field — null when there's nothing to compare against. */
  prevByFlightCells?: Record<string, Record<string, number>> | null
}

interface FlightItem {
  field: string
  /** Effective qty shown/edited — the override where present, else the computed value. */
  qty: number
  /** Original computed qty, for the reset action and the "suggested" hint. */
  raw: number
  overridden: boolean
  group: EcoSupplyGroupId
  /** Catalog product code from the matching order-level line (same source as Supply Breakdown). */
  productCode: string | null
  /** Catalog unit from the matching order-level line. */
  unit: string | null
  /** Catalog-resolved display name from the matching order-level line (same source as Supply Breakdown). */
  name: string
  /** Overrides the catalog name — used for synthetic fields (e.g. amenity packages) not in ECO_SUPPLY_FIELDS. */
  label?: string
  /** Change vs the comparison version's effective qty for this group+field — null when there's nothing to compare against. */
  delta: number | null
}

function itemDisplayName(item: FlightItem): string {
  return item.label ?? item.name
}

export function FlightBreakdownPanel({
  byFlight,
  lines,
  editable = false,
  edits,
  onChangeQty,
  onResetField,
  prevByFlightCells = null,
}: FlightBreakdownPanelProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [openCards, setOpenCards] = useState<Set<string>>(new Set())

  const fieldMetaMap = useMemo(
    () =>
      new Map(
        lines.map((l) => [
          l.field,
          { group: l.group, productCode: l.productCode, unit: l.unit, name: l.name } as const,
        ]),
      ),
    [lines],
  )
  const getGroup = (field: string): EcoSupplyGroupId =>
    fieldMetaMap.get(field)?.group ?? ECO_SUPPLY_FIELDS.find((f) => f.field === field)?.group ?? 'other'
  const getProductCode = (field: string): string | null => fieldMetaMap.get(field)?.productCode ?? null
  const getUnit = (field: string): string | null => fieldMetaMap.get(field)?.unit ?? null
  // Prefer the catalog-resolved name (same source as Supply Breakdown); the
  // registry's fallbackNameVi only applies when this field isn't on any line yet.
  const getName = (field: string): string =>
    fieldMetaMap.get(field)?.name || ecoSupplyFieldDisplayName(field)

  const flights = useMemo(
    () =>
      byFlight
        .map((f) => {
          const groupEdits = edits?.[f.groupId] ?? {}
          const prebook = f.cells.prebook ?? 0
          const skyboss = f.cells.skyboss ?? 0
          const commercial = f.quotaCommercial ?? 0
          const commercialBanhMi = f.quotaBanhMi ?? f.cells.banhMiCommercial ?? 0
          const commercialTraSua = f.quotaTraSua ?? f.cells.traSuaCommercial ?? 0
          const hasCommercialMeal =
            commercial > 0 || commercialBanhMi > 0 || commercialTraSua > 0
          const prevCells = prevByFlightCells?.[f.groupId]
          const deltaOf = (field: string, qty: number): number | null =>
            prevByFlightCells ? qty - (prevCells?.[field] ?? 0) : null
          const fieldItems: FlightItem[] = Object.entries(f.cells)
            .filter(([field, qty]) => qty > 0 && !HEADER_TOTAL_FIELDS.has(field))
            .map(([field, raw]) => {
              const overridden = field in groupEdits
              const qty = overridden ? groupEdits[field] : raw
              return {
                field,
                raw,
                qty,
                overridden,
                group: getGroup(field),
                productCode: getProductCode(field),
                unit: getUnit(field),
                name: getName(field),
                delta: deltaOf(field, qty),
              }
            })
          const packageItems: FlightItem[] = (f.amenityPackages ?? [])
            .filter((p) => p.count > 0)
            .map((p) => {
              const field = `amenityPackage${p.id}`
              const overridden = field in groupEdits
              const qty = overridden ? groupEdits[field] : p.count
              return {
                field,
                raw: p.count,
                qty,
                overridden,
                group: 'amenity_composition' as const,
                productCode: getProductCode(field),
                unit: getUnit(field),
                name: getName(field),
                label: p.label,
                delta: deltaOf(field, qty),
              }
            })
          const items = [...fieldItems, ...packageItems].sort((a, b) =>
            itemDisplayName(a).localeCompare(itemDisplayName(b), 'vi'),
          )
          return {
            ...f,
            prebook,
            skyboss,
            commercial,
            commercialBanhMi,
            commercialTraSua,
            hasCommercialMeal,
            items,
          }
        })
        .filter(
          (f) =>
            f.items.length > 0 ||
            f.prebook > 0 ||
            f.skyboss > 0 ||
            f.commercial > 0 ||
            f.commercialBanhMi > 0 ||
            f.commercialTraSua > 0,
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byFlight, edits, lines, prevByFlightCells],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return flights
    return flights
      .map((f) => {
        const flightMatches = f.legs.some(
          (leg) =>
            leg.flightNo.toLowerCase().includes(q) ||
            leg.dep.toLowerCase().includes(q) ||
            leg.arr.toLowerCase().includes(q),
        )
        if (flightMatches) return f
        const items = f.items.filter(
          (i) =>
            itemDisplayName(i).toLowerCase().includes(q) ||
            (i.productCode?.toLowerCase().includes(q) ?? false),
        )
        return items.length > 0 ? { ...f, items } : null
      })
      .filter((f): f is (typeof flights)[number] => f !== null)
  }, [flights, query])

  const toggleCard = (groupId: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  if (flights.length === 0) {
    return <Empty description={t('catering.orders.byFlight.empty')} className="py-12" />
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Input
          allowClear
          prefix={<Search size={14} className="text-text-muted" />}
          placeholder={t('catering.orders.byFlight.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-text-muted shrink-0 text-[12px] font-semibold">
          {t('catering.orders.byFlight.groupCount', { n: filtered.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Empty description={t('catering.orders.byFlight.noMatches')} className="py-12" />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((f) => {
            const groups = ECO_SUPPLY_GROUP_ORDER.filter((g) => f.items.some((i) => i.group === g))
            const flightNos = f.legs.map((l) => l.flightNo).join(' · ')
            const stationChain = [f.legs[0]?.dep, ...f.legs.map((l) => l.arr)].filter(Boolean).join(' → ')
            const open = openCards.has(f.groupId)
            return (
              <article
                key={f.groupId}
                className={`eco-flight-card${f.hasCommercialMeal ? ' eco-flight-card--commercial' : ''}`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => toggleCard(f.groupId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleCard(f.groupId)
                    }
                  }}
                  className="eco-flight-card__head"
                >
                  <span className="eco-flight-card__icon">
                    <PlaneTakeoff size={16} strokeWidth={2.25} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="truncate text-[15px] font-extrabold">{flightNos}</div>
                      {f.hasCommercialMeal ? (
                        <span className="eco-flight-card__commercial-badge">
                          {t('catering.orders.byFlight.commercialBadge')}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-text-secondary truncate text-[12px] font-semibold">{stationChain}</div>
                  </div>

                  <div className="flex items-center justify-end gap-5">
                    <HeaderStat label={t('catering.orders.byFlight.prebookTotal')} value={f.prebook} />
                    <HeaderStat label={t('catering.orders.byFlight.skyboss')} value={f.skyboss} />
                    <HeaderStat
                      label={t('catering.orders.byFlight.commercial')}
                      value={f.commercial}
                      accent={f.hasCommercialMeal}
                    />
                  </div>

                  <ChevronDown
                    size={18}
                    className={`text-text-muted justify-self-end transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </div>

                {open ? (
                  <div className="border-border bg-vj-canvas border-t px-4 py-3.5">
                    {f.items.length === 0 ? (
                      <p className="text-text-muted m-0 text-[12px]">
                        {t('catering.orders.byFlight.noDetailItems')}
                      </p>
                    ) : (
                      <div className="eco-supply__grid !p-0">
                        {groups.map((group) => {
                          const groupItems = f.items.filter((i) => i.group === group)
                          const groupTotal = groupItems.reduce((s, i) => s + i.qty, 0)
                          const style = GROUP_STYLE[group]
                          return (
                            <section
                              key={group}
                              className="mb-3 break-inside-avoid overflow-hidden rounded-lg border border-slate-300 bg-slate-50/50"
                            >
                              <header className="flex items-center gap-2 border-b border-slate-200/70 px-3.5 py-2.5">
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{ background: style.color }}
                                  aria-hidden
                                />
                                <h3 className="text-[13px] font-bold" style={{ color: style.color }}>
                                  {groupLabel(t, group)}
                                </h3>
                                <span className="ml-auto shrink-0 text-[11px] font-semibold whitespace-nowrap text-slate-400 tabular-nums">
                                  {t('catering.orders.byFlight.groupSkuCount', { n: groupItems.length })} ·{' '}
                                  {t('catering.orders.byFlight.groupQty', { n: groupTotal.toLocaleString() })}
                                </span>
                              </header>
                              <ul className="divide-y divide-slate-100">
                                {groupItems.map((item) => (
                                  <li
                                    key={item.field}
                                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                                  >
                                    <div className="min-w-0 flex-1 text-left">
                                      <div className="text-[13px] font-semibold text-slate-900">
                                        {itemDisplayName(item)}
                                      </div>
                                      <div className="mt-0.5 flex items-center gap-1.5">
                                        {item.productCode ? (
                                          <span className="table-cell-code tnum">{item.productCode}</span>
                                        ) : (
                                          <span className="text-[12px] text-slate-400">—</span>
                                        )}
                                        {item.unit ? (
                                          <span className="text-[12px] text-slate-400">· {item.unit}</span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                                      <div className="flex items-center gap-2">
                                        {item.delta != null && item.delta !== 0 ? (
                                          <DeltaChip value={item.delta} />
                                        ) : null}
                                        {editable ? (
                                          <>
                                            <InputNumber
                                              min={0}
                                              size="small"
                                              value={item.qty}
                                              className="!w-16 [&_input]:!font-mono [&_input]:!tabular-nums"
                                              aria-label={itemDisplayName(item)}
                                              onChange={(v) => {
                                                if (v == null || !Number.isFinite(v)) return
                                                onChangeQty?.(f.groupId, item.field, Math.max(0, Math.round(v)))
                                              }}
                                            />
                                            {item.overridden ? (
                                              <Button
                                                type="text"
                                                size="small"
                                                icon={<RotateCcw size={13} />}
                                                aria-label={t('catering.orders.supply.reset')}
                                                onClick={() => onResetField?.(f.groupId, item.field)}
                                              />
                                            ) : null}
                                          </>
                                        ) : (
                                          <span className="font-mono text-[15px] font-extrabold tabular-nums text-slate-900">
                                            {item.qty.toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                      {item.overridden && item.qty !== item.raw ? (
                                        <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-400">
                                          {t('catering.orders.supply.suggested', { n: item.raw })}
                                        </span>
                                      ) : null}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HeaderStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-right">
      <div className={`text-[16px] leading-none font-extrabold tnum ${accent ? 'text-vj-red-dark' : 'text-foreground'}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-text-muted mt-1 text-[9.5px] font-bold tracking-wide uppercase">{label}</div>
    </div>
  )
}
