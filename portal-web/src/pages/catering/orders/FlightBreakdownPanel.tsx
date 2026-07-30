/** Per-flight-group ECO supply breakdown (snapshot at order build time). */
import { Button, Empty, Input, InputNumber } from 'antd'
import { ChevronDown, PlaneTakeoff, RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CSSProperties } from 'react'
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
  /** Overrides the registry display name — used for synthetic fields (e.g. amenity packages) not in ECO_SUPPLY_FIELDS. */
  label?: string
  /** Change vs the comparison version's effective qty for this group+field — null when there's nothing to compare against. */
  delta: number | null
}

function itemDisplayName(item: FlightItem): string {
  return item.label ?? ecoSupplyFieldDisplayName(item.field)
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

  const fieldGroupMap = useMemo(() => new Map(lines.map((l) => [l.field, l.group])), [lines])
  const getGroup = (field: string): EcoSupplyGroupId =>
    fieldGroupMap.get(field) ?? ECO_SUPPLY_FIELDS.find((f) => f.field === field)?.group ?? 'other'

  const flights = useMemo(
    () =>
      byFlight
        .map((f) => {
          const groupEdits = edits?.[f.groupId] ?? {}
          const prebook = f.cells.prebook ?? 0
          const skyboss = f.cells.skyboss ?? 0
          const commercial = f.quotaCommercial ?? 0
          const prevCells = prevByFlightCells?.[f.groupId]
          const deltaOf = (field: string, qty: number): number | null =>
            prevByFlightCells ? qty - (prevCells?.[field] ?? 0) : null
          const fieldItems: FlightItem[] = Object.entries(f.cells)
            .filter(([field, qty]) => qty > 0 && !HEADER_TOTAL_FIELDS.has(field))
            .map(([field, raw]) => {
              const overridden = field in groupEdits
              const qty = overridden ? groupEdits[field] : raw
              return { field, raw, qty, overridden, group: getGroup(field), delta: deltaOf(field, qty) }
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
                label: p.label,
                delta: deltaOf(field, qty),
              }
            })
          const items = [...fieldItems, ...packageItems].sort((a, b) =>
            itemDisplayName(a).localeCompare(itemDisplayName(b), 'vi'),
          )
          return { ...f, prebook, skyboss, commercial, items }
        })
        .filter((f) => f.items.length > 0 || f.prebook > 0 || f.skyboss > 0 || f.commercial > 0),
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
        const items = f.items.filter((i) => itemDisplayName(i).toLowerCase().includes(q))
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
                className="bg-surface border-border overflow-hidden rounded-xl border shadow-[0_2px_8px_rgba(35,31,32,0.05)] transition-shadow"
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
                  className="grid cursor-pointer select-none grid-cols-[40px_minmax(160px,260px)_1fr_20px] items-center gap-3.5 px-4 py-3 hover:bg-[#FCFDFE]"
                >
                  <span className="bg-vj-red-50 text-vj-red-dark grid h-9 w-9 place-items-center rounded-lg">
                    <PlaneTakeoff size={16} />
                  </span>

                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-extrabold">{flightNos}</div>
                    <div className="text-text-secondary truncate text-[12px] font-semibold">{stationChain}</div>
                  </div>

                  <div className="flex items-center justify-end gap-5">
                    <HeaderStat label={t('catering.orders.byFlight.prebookTotal')} value={f.prebook} />
                    <HeaderStat label={t('catering.orders.byFlight.skyboss')} value={f.skyboss} />
                    <HeaderStat
                      label={t('catering.orders.byFlight.commercial')}
                      value={f.commercial}
                      accent
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
                            <section key={group} className="eco-supply__section">
                              <header
                                className="eco-supply__section-head"
                                style={
                                  {
                                    '--section-bg': style.bg,
                                    '--section-color': style.color,
                                    '--section-dot': style.color,
                                  } as CSSProperties
                                }
                              >
                                <span className="eco-supply__section-dot" />
                                <h3>{groupLabel(t, group)}</h3>
                                <span className="eco-supply__section-total text-text-secondary tnum text-[11px] font-bold">
                                  {t('catering.orders.byFlight.groupSkuCount', { n: groupItems.length })} ·{' '}
                                  {t('catering.orders.byFlight.groupQty', { n: groupTotal.toLocaleString() })}
                                </span>
                              </header>
                              <ul className="eco-supply__list">
                                {groupItems.map((item) => (
                                  <li key={item.field} className="eco-supply__row">
                                    <div className="eco-supply__meta">
                                      <div className="eco-supply__name">
                                        {itemDisplayName(item)}
                                        {item.delta != null ? <DeltaChip value={item.delta} /> : null}
                                      </div>
                                    </div>
                                    <div className="eco-supply__qty">
                                      {editable ? (
                                        <div className="eco-supply__qty-edit">
                                          <InputNumber
                                            min={0}
                                            size="small"
                                            value={item.qty}
                                            className="!w-[76px]"
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
                                        </div>
                                      ) : (
                                        <span className="eco-supply__qty-value tnum">{item.qty.toLocaleString()}</span>
                                      )}
                                      {item.overridden && item.qty !== item.raw ? (
                                        <span className="eco-supply__suggested tnum">
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
