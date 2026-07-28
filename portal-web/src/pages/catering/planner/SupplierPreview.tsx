import { FileSpreadsheet } from 'lucide-react'
import { InputNumber, Segmented } from 'antd'
import { useMemo, useState, type RefObject } from 'react'
import type { EcoCells, SbbCells, SbbRouteSheet, SupplierCell } from '@/modules/catering/supplier/types'
import {
  ECO_FIELD_GROUPS,
  FIELD_LABELS,
  getPlannerCellAccessibleName,
  groupFlightsBySbbRouteSheet,
  SBB_FIELD_GROUPS,
  type PlannerFlight,
  type PlannerProduct,
} from './plannerModel'
import type { PlannerCellChange } from './PlannerFlightEditor'
import { CellValue } from './PlannerStatus'

export function SupplierPreview({
  flights,
  headingRef,
  editable = false,
  onCellChange,
  selectedFlightKey,
  onSelectFlight,
}: {
  flights: PlannerFlight[]
  headingRef?: RefObject<HTMLHeadingElement | null>
  editable?: boolean
  onCellChange?: (change: PlannerCellChange) => void
  selectedFlightKey?: string
  onSelectFlight?: (key: string) => void
}) {
  const [product, setProduct] = useState<'eco' | 'sbb'>('eco')

  return (
    <section className="planner-preview planner-preview--matrix" aria-label="Xem trước dữ liệu nhà cung cấp">
      <div className="planner-preview__head">
        <div>
          <span className="planner-eyebrow">Supplier matrix</span>
          <h2 ref={headingRef} tabIndex={-1}>
            Bảng xuất · chuyến × cột
          </h2>
        </div>
        <FileSpreadsheet size={20} aria-hidden="true" />
      </div>

      <div className="planner-preview__toolbar">
        <Segmented<'eco' | 'sbb'>
          value={product}
          onChange={setProduct}
          options={[
            { value: 'eco', label: `ECO · ${flights.length}` },
            {
              value: 'sbb',
              label: `SBB · ${flights.filter((f) => f.sbb).length}`,
            },
          ]}
        />
      </div>

      {product === 'eco' ? (
        <EcoMatrix
          flights={flights}
          editable={editable}
          onCellChange={onCellChange}
          selectedFlightKey={selectedFlightKey}
          onSelectFlight={onSelectFlight}
        />
      ) : (
        <SbbMatrix
          flights={flights}
          editable={editable}
          onCellChange={onCellChange}
          selectedFlightKey={selectedFlightKey}
          onSelectFlight={onSelectFlight}
        />
      )}
    </section>
  )
}

function EcoMatrix({
  flights,
  editable,
  onCellChange,
  selectedFlightKey,
  onSelectFlight,
}: {
  flights: PlannerFlight[]
  editable: boolean
  onCellChange?: (change: PlannerCellChange) => void
  selectedFlightKey?: string
  onSelectFlight?: (key: string) => void
}) {
  const [groupKey, setGroupKey] = useState(ECO_FIELD_GROUPS[0].key)
  const group = ECO_FIELD_GROUPS.find((g) => g.key === groupKey) ?? ECO_FIELD_GROUPS[0]

  return (
    <div className="planner-preview__matrix-body">
      <Segmented
        size="small"
        value={groupKey}
        onChange={(value) => setGroupKey(String(value))}
        options={ECO_FIELD_GROUPS.map((g) => ({
          value: g.key,
          label: g.label,
        }))}
      />
      <PreviewTable
        flights={flights}
        fields={group.fields}
        product="eco"
        editable={editable}
        onCellChange={onCellChange}
        selectedFlightKey={selectedFlightKey}
        onSelectFlight={onSelectFlight}
        groupLabel={group.label}
      />
    </div>
  )
}

function SbbMatrix({
  flights,
  editable,
  onCellChange,
  selectedFlightKey,
  onSelectFlight,
}: {
  flights: PlannerFlight[]
  editable: boolean
  onCellChange?: (change: PlannerCellChange) => void
  selectedFlightKey?: string
  onSelectFlight?: (key: string) => void
}) {
  const routeGroups = useMemo(() => groupFlightsBySbbRouteSheet(flights), [flights])
  const [sheet, setSheet] = useState<SbbRouteSheet | ''>(routeGroups[0]?.sheet ?? '')
  const [groupKey, setGroupKey] = useState(SBB_FIELD_GROUPS[0].key)

  const activeSheet = sheet || routeGroups[0]?.sheet
  const sheetFlights =
    routeGroups.find((g) => g.sheet === activeSheet)?.flights ?? []
  const group = SBB_FIELD_GROUPS.find((g) => g.key === groupKey) ?? SBB_FIELD_GROUPS[0]

  if (routeGroups.length === 0) {
    return (
      <p className="planner-preview__empty-sbb">
        Không có chuyến SkyBoss Business trong ngày này.
      </p>
    )
  }

  return (
    <div className="planner-preview__matrix-body">
      <Segmented
        size="small"
        value={activeSheet}
        onChange={(value) => setSheet(value as SbbRouteSheet)}
        options={routeGroups.map(({ sheet: s, flights: sheetFlightsCount }) => ({
          value: s,
          label: `${s} · ${sheetFlightsCount.length}`,
        }))}
      />
      <Segmented
        size="small"
        value={groupKey}
        onChange={(value) => setGroupKey(String(value))}
        options={SBB_FIELD_GROUPS.map((g) => ({
          value: g.key,
          label: g.label,
        }))}
      />
      <PreviewTable
        flights={sheetFlights}
        fields={group.fields}
        product="sbb"
        editable={editable}
        onCellChange={onCellChange}
        selectedFlightKey={selectedFlightKey}
        onSelectFlight={onSelectFlight}
        groupLabel={group.label}
      />
    </div>
  )
}

function PreviewTable({
  flights,
  fields,
  product,
  editable,
  onCellChange,
  selectedFlightKey,
  onSelectFlight,
  groupLabel,
}: {
  flights: PlannerFlight[]
  fields: readonly (keyof EcoCells | keyof SbbCells)[]
  product: PlannerProduct
  editable: boolean
  onCellChange?: (change: PlannerCellChange) => void
  selectedFlightKey?: string
  onSelectFlight?: (key: string) => void
  groupLabel: string
}) {
  return (
    <div className="planner-preview-table-wrap thin-scroll">
      <table className="planner-preview-table" aria-label={`${product.toUpperCase()} · ${groupLabel}`}>
        <thead>
          <tr>
            <th scope="col" className="planner-preview-table__sticky planner-preview-table__sticky--flight">
              Chuyến
            </th>
            <th scope="col" className="planner-preview-table__sticky planner-preview-table__sticky--route">
              Đường bay
            </th>
            {fields.map((field) => (
              <th scope="col" key={field}>
                {FIELD_LABELS[field]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flights.map((flight) => {
            const selected = flight.key === selectedFlightKey
            return (
              <tr
                key={flight.key}
                className={selected ? 'planner-preview-table__row--selected' : undefined}
                onClick={() => onSelectFlight?.(flight.key)}
              >
                <th
                  scope="row"
                  className="planner-preview-table__sticky planner-preview-table__sticky--flight"
                >
                  {flight.flightNo}
                </th>
                <td className="planner-preview-table__sticky planner-preview-table__sticky--route">
                  {flight.dep}–{flight.arr}
                </td>
                {fields.map((field) => {
                  const cells = product === 'eco' ? flight.eco.cells : flight.sbb?.cells
                  const cell = cells?.[field as never] as SupplierCell<number> | undefined
                  return (
                    <td key={field} onClick={(e) => e.stopPropagation()}>
                      {cell ? (
                        <PreviewCell
                          flightKey={flight.key}
                          flightNo={flight.flightNo}
                          product={product}
                          field={field}
                          cell={cell}
                          editable={editable}
                          onCellChange={onCellChange}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PreviewCell({
  flightKey,
  flightNo,
  product,
  field,
  cell,
  editable,
  onCellChange,
}: {
  flightKey: string
  flightNo: string
  product: PlannerProduct
  field: keyof EcoCells | keyof SbbCells
  cell: SupplierCell<number>
  editable: boolean
  onCellChange?: (change: PlannerCellChange) => void
}) {
  const label = FIELD_LABELS[field]
  if (editable && onCellChange) {
    return (
      <InputNumber
        min={0}
        step={1}
        precision={0}
        size="small"
        value={cell.value ?? undefined}
        onChange={(value) => {
          if (value == null || !Number.isFinite(value)) return
          onCellChange({
            flightKey,
            product,
            field: String(field),
            value: Math.max(0, Math.round(value)),
          })
        }}
        aria-label={`${flightNo}, ${getPlannerCellAccessibleName(label, cell)}`}
        className="w-full"
      />
    )
  }
  return <CellValue cell={cell} />
}
