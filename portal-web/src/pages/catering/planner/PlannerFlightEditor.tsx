import {
  Plane,
  PlaneTakeoff,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Egg,
  Soup,
  Droplets,
} from 'lucide-react'
import { InputNumber } from 'antd'
import type { ReactNode } from 'react'
import type { EcoCells, SbbCells, SupplierCell } from '@/modules/catering/supplier/types'
import {
  derivePlannerContext,
  ECO_FIELD_GROUPS,
  FIELD_LABELS,
  getPlannerCellAccessibleName,
  SBB_FIELD_GROUPS,
  type PlannerContext,
  type PlannerFlight,
  type PlannerProduct,
} from './plannerModel'
import { CellValue } from './PlannerStatus'

export type PlannerCellChange = {
  flightKey: string
  product: PlannerProduct
  field: string
  value: number
}

/** Fields derived by ECO formulas — shown read-only in their Excel group. */
const ECO_CALCULATED = new Set<keyof EcoCells>([
  'hotmealTotal',
  'skybossEggs',
  'totalEggs',
  'australiaNoodleVegetables',
  'australiaSkybossYogurt',
  'australiaRoundBread',
  'ketchup',
  'chiliSauce',
  'soySauce',
  'hotmealUtensils',
  'totalUtensils',
  'prebookCashews',
])

const GROUP_ICON: Record<string, ReactNode> = {
  hotmeal: <Soup size={16} />,
  'bread-eggs': <Egg size={16} />,
  condiments: <Droplets size={16} />,
  utensils: <UtensilsCrossed size={16} />,
  commercial: <ShoppingBag size={16} />,
  'amenity-ops': <UtensilsCrossed size={16} />,
  'passengers-meals': <Sparkles size={16} />,
  service: <ShoppingBag size={16} />,
  amenities: <Sparkles size={16} />,
}

interface PlannerFlightEditorProps {
  flight: PlannerFlight
  context: PlannerContext
  editable?: boolean
  onCellChange?: (change: PlannerCellChange) => void
}

export function PlannerFlightEditor({
  flight,
  context,
  editable = false,
  onCellChange,
}: PlannerFlightEditorProps) {
  const flightDate = derivePlannerContext([flight]).dateLabel

  const change = (product: PlannerProduct, field: string, value: number | null) => {
    if (!editable || !onCellChange || value == null || !Number.isFinite(value)) return
    onCellChange({ flightKey: flight.key, product, field, value: Math.max(0, Math.round(value)) })
  }

  return (
    <section className="planner-editor" aria-label={`Biên tập chuyến bay ${flight.flightNo}`}>
      <div className="planner-editor__hero">
        <div>
          <span className="planner-eyebrow">Chuyến đang chọn</span>
          <div className="planner-editor__title-row">
            <h2>{flight.flightNo}</h2>
            <span className="planner-status planner-status--ready">
              <PlaneTakeoff size={12} aria-hidden="true" />
              ECO{flight.sbb ? ' · SBB' : ''}
            </span>
          </div>
          <p>
            {flight.dep} → {flight.arr} · {flightDate} · {context.stationLabel}
          </p>
        </div>
      </div>

      {/* Identity only — không nhét trứng / dụng cụ vào đây */}
      <EditorSection icon={<Plane size={16} />} title="Chuyến bay">
        <StaticField label="Ngày khai thác" value={flightDate} />
        <StaticField label="Đường bay" value={`${flight.dep} → ${flight.arr}`} />
        <StaticField
          label="Quota thương mại"
          value={
            flight.input.quotaCommercial == null
              ? 'Chưa có'
              : flight.input.quotaCommercial.toLocaleString('vi-VN')
          }
        />
      </EditorSection>

      {/* ECO groups mirror Excel column blocks */}
      {ECO_FIELD_GROUPS.map((group) => (
        <EditorSection
          key={group.key}
          icon={GROUP_ICON[group.key] ?? <UtensilsCrossed size={16} />}
          title={`ECO · ${group.label}`}
          calculated={group.fields.every((f) => ECO_CALCULATED.has(f))}
        >
          {group.fields.map((field) => {
            const calculated = ECO_CALCULATED.has(field)
            return (
              <CellField
                key={field}
                label={FIELD_LABELS[field]}
                product="eco"
                field={field}
                cell={flight.eco.cells[field]}
                editable={editable && !calculated}
                onChange={change}
                readOnly={calculated}
              />
            )
          })}
        </EditorSection>
      ))}

      {flight.sbb ? (
        SBB_FIELD_GROUPS.map((group) => (
          <EditorSection
            key={`sbb-${group.key}`}
            icon={GROUP_ICON[group.key] ?? <Sparkles size={16} />}
            title={`SBB · ${group.label}`}
          >
            <StaticField label="Route sheet" value={flight.sbb!.sheet} />
            {group.fields.map((field) => (
              <CellField
                key={field}
                label={FIELD_LABELS[field]}
                product="sbb"
                field={field}
                cell={flight.sbb!.cells[field]}
                editable={editable}
                onChange={change}
              />
            ))}
          </EditorSection>
        ))
      ) : (
        <EditorSection icon={<Sparkles size={16} />} title="SBB · SkyBoss Business">
          <div className="planner-section__empty">Không tạo dòng SBB khi Business Pax bằng 0.</div>
        </EditorSection>
      )}
    </section>
  )
}

function EditorSection({
  icon,
  title,
  children,
  calculated = false,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  calculated?: boolean
}) {
  return (
    <section className={`planner-section ${calculated ? 'planner-section--calculated' : ''}`}>
      <div className="planner-section__head">
        <span>{icon}</span>
        <h3>{title}</h3>
        {calculated ? <span className="planner-readonly-badge">Chỉ đọc</span> : null}
      </div>
      <div className="planner-section__grid">{children}</div>
    </section>
  )
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="planner-field">
      <span className="planner-field__label">{label}</span>
      <strong className="planner-field__static">{value}</strong>
    </div>
  )
}

function CellField({
  label,
  product,
  field,
  cell,
  editable,
  onChange,
  hint,
  readOnly = false,
}: {
  label: string
  product: PlannerProduct
  field: keyof EcoCells | keyof SbbCells | string
  cell: SupplierCell<number>
  editable: boolean
  onChange: (product: PlannerProduct, field: string, value: number | null) => void
  hint?: string
  readOnly?: boolean
}) {
  const canEdit = editable && !readOnly
  return (
    <div className={`planner-field planner-field--cell${readOnly ? ' planner-field--readonly' : ''}`}>
      <span className="planner-field__label">
        {label}
        {hint ? <small>{hint}</small> : null}
        {readOnly ? <small>Công thức</small> : null}
      </span>
      <span className="planner-field__value">
        {canEdit ? (
          <InputNumber
            min={0}
            step={1}
            precision={0}
            value={cell.value ?? undefined}
            onChange={(value) => onChange(product, String(field), value)}
            aria-label={getPlannerCellAccessibleName(label, cell)}
            className="w-full"
            size="small"
          />
        ) : (
          <CellValue cell={cell} />
        )}
      </span>
    </div>
  )
}
