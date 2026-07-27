import { PlaneTakeoff, Search } from 'lucide-react'
import { Input } from 'antd'
import { useMemo, useState } from 'react'
import type { PlannerContext, PlannerFlight } from './plannerModel'

interface PlannerFlightRailProps {
  flights: PlannerFlight[]
  context: PlannerContext
  selectedKey: string
  onSelect: (key: string) => void
  compact?: boolean
  /** Horizontal chip strip (legacy) or vertical rail with KPIs (editor-first). */
  layout?: 'rail' | 'strip'
  stripLabel?: string
}

function flightMetrics(flight: PlannerFlight) {
  const crewHeadcount =
    flight.input.crewHeadcount ??
    null
  return {
    hotmeal: flight.eco.cells.hotmealTotal.value,
    crew: crewHeadcount,
    water: flight.eco.cells.reserveCrewWater.value,
    sbbPax: flight.sbb?.cells.businessPax.value ?? null,
  }
}

export function PlannerFlightRail({
  flights,
  context,
  selectedKey,
  onSelect,
  compact = false,
  layout = 'rail',
  stripLabel,
}: PlannerFlightRailProps) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return flights
    return flights.filter((flight) =>
      `${flight.flightNo} ${flight.dep} ${flight.arr}`.toLowerCase().includes(normalized),
    )
  }, [flights, query])

  if (layout === 'strip') {
    return (
      <div className="planner-flight-strip" role="listbox" aria-label={stripLabel ?? 'Danh sách chuyến bay'}>
        <div className="planner-flight-strip__meta">
          <span className="planner-eyebrow">{stripLabel ?? 'Chuyến bay'}</span>
          <strong>
            {flights.length} · {context.stationLabel}
          </strong>
        </div>
        <div className="planner-flight-strip__track thin-scroll">
          {flights.map((flight) => {
            const selected = flight.key === selectedKey
            return (
              <button
                key={flight.key}
                type="button"
                role="option"
                aria-selected={selected}
                className={`planner-flight-chip ${selected ? 'planner-flight-chip--selected' : ''}`}
                onClick={() => onSelect(flight.key)}
              >
                <span className="planner-flight-chip__no">
                  <PlaneTakeoff size={14} aria-hidden="true" />
                  {flight.flightNo}
                </span>
                <span className="planner-flight-chip__route">
                  {flight.dep}→{flight.arr}
                </span>
                <span className="planner-flight-chip__badges">
                  <span className="planner-product-badge">ECO</span>
                  {flight.sbb ? (
                    <span className="planner-product-badge planner-product-badge--sbb">SBB</span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <aside className={`planner-rail ${compact ? 'planner-rail--compact' : ''}`} aria-label="Danh sách chuyến bay">
      <div className="planner-panel-head">
        <div>
          <span className="planner-eyebrow">Chuyến bay</span>
          <strong>
            {flights.length} chuyến · {context.stationLabel}
          </strong>
        </div>
      </div>
      <div className="planner-rail__search">
        <Input
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm chuyến, đường bay"
          prefix={<Search size={15} className="text-text-muted" />}
          aria-label="Tìm chuyến bay"
        />
      </div>
      <div className="planner-rail__list thin-scroll">
        {filtered.map((flight) => {
          const selected = flight.key === selectedKey
          const m = flightMetrics(flight)
          return (
            <button
              key={flight.key}
              type="button"
              className={`planner-flight-card ${selected ? 'planner-flight-card--selected' : ''}`}
              onClick={() => onSelect(flight.key)}
              aria-pressed={selected}
            >
              <span className="planner-flight-card__top">
                <span className="planner-flight-card__number">
                  <PlaneTakeoff size={16} aria-hidden="true" />
                  {flight.flightNo}
                </span>
                <span className="planner-flight-card__meta">
                  <span className="planner-product-badge">ECO</span>
                  {flight.sbb ? (
                    <span className="planner-product-badge planner-product-badge--sbb">SBB</span>
                  ) : null}
                </span>
              </span>
              <span className="planner-flight-card__route">
                <b>{flight.dep}</b>
                <span aria-hidden="true">→</span>
                <b>{flight.arr}</b>
              </span>
              <span className="planner-flight-card__kpis" aria-label="Số liệu chính">
                <span>
                  <small>Nóng</small>
                  <strong className="tnum">{fmtMetric(m.hotmeal)}</strong>
                </span>
                <span title="Suất ăn Crew">
                  <small>Suất Crew</small>
                  <strong className="tnum">{fmtMetric(m.crew)}</strong>
                </span>
                <span>
                  <small>Suối</small>
                  <strong className="tnum">{fmtMetric(m.water)}</strong>
                </span>
                {m.sbbPax != null ? (
                  <span>
                    <small>SBB</small>
                    <strong className="tnum">{fmtMetric(m.sbbPax)}</strong>
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function fmtMetric(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('vi-VN')
}
