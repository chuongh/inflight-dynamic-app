import {
  Button,
  Checkbox,
  Drawer,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
} from 'antd'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  AircraftFamily,
  EcoAmenityConfig,
  EcoQuantityBranch,
  EcoQuantityExpr,
  EcoQuantityRule,
  EcoQuantityValue,
  EcoUpliftType,
  RouteHourClassId,
} from '@/modules/catering/supplier/ecoQuantityTypes'
import { ECO_QUANTITY_TARGET_COLUMNS, productCodeFor } from './ecoQuantityRuleMeta'

interface Props {
  open: boolean
  rule: EcoQuantityRule | null
  amenityConfig: EcoAmenityConfig
  onClose: () => void
  onSave: (rule: EcoQuantityRule) => void
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold">{label}</span>
      {children}
      {hint ? (
        <span className="text-text-muted mt-1 block text-[11.5px]">{hint}</span>
      ) : null}
    </label>
  )
}

const VALUE_KINDS: EcoQuantityValue['kind'][] = [
  'const',
  'column',
  'hotmeal_total',
  'metric',
  'sum',
  'manual',
]

const AIRCRAFT_FAMILIES: AircraftFamily[] = ['A320_A321', 'A330']
const UPLIFT_TYPES: EcoUpliftType[] = ['DAU_NGAY', 'DOI_TO', 'NIGHTSTOP']
const FLIGHT_KINDS: Array<'ferry_cargo' | 'charter_china' | 'normal'> = [
  'normal',
  'ferry_cargo',
  'charter_china',
]

function defaultValue(kind: EcoQuantityValue['kind']): EcoQuantityValue {
  switch (kind) {
    case 'const':
      return { kind: 'const', value: 0 }
    case 'column':
      return { kind: 'column', columnId: 'spaghetti', coef: 1 }
    case 'hotmeal_total':
      return { kind: 'hotmeal_total', coef: 1 }
    case 'metric':
      return { kind: 'metric', metricId: 'totalPrebook', coef: 1 }
    case 'sum':
      return {
        kind: 'sum',
        parts: [
          { kind: 'metric', metricId: 'quotaCommercial', coef: 1 },
          { kind: 'metric', metricId: 'totalPrebook', coef: 1 },
        ],
      }
    default:
      return { kind: 'manual' }
  }
}

export function EcoQuantityValueEditor({
  value,
  onChange,
}: {
  value: EcoQuantityValue
  onChange: (next: EcoQuantityValue) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="border-border bg-background space-y-2 rounded-lg border p-3">
      <Select
        className="w-full"
        value={value.kind}
        onChange={(kind) => onChange(defaultValue(kind))}
        options={VALUE_KINDS.map((k) => ({
          value: k,
          label: t(`catering.config.supplier.valueKind.${k}`),
        }))}
      />
      {value.kind === 'const' ? (
        <InputNumber
          className="w-full"
          value={value.value}
          onChange={(v) => onChange({ kind: 'const', value: Number(v ?? 0) })}
        />
      ) : null}
      {value.kind === 'column' ? (
        <div className="grid grid-cols-2 gap-2">
          <Select
            className="w-full"
            value={value.columnId}
            onChange={(columnId) => onChange({ ...value, columnId })}
            options={ECO_QUANTITY_TARGET_COLUMNS.map((c) => {
              const code = productCodeFor(c)
              return { value: c, label: code ? `${c} — ${code}` : c }
            })}
            showSearch
          />
          <InputNumber
            className="w-full"
            addonBefore="×"
            value={value.coef ?? 1}
            onChange={(v) => onChange({ ...value, coef: Number(v ?? 1) })}
          />
        </div>
      ) : null}
      {value.kind === 'hotmeal_total' ? (
        <InputNumber
          className="w-full"
          addonBefore="×"
          value={value.coef ?? 1}
          onChange={(v) => onChange({ kind: 'hotmeal_total', coef: Number(v ?? 1) })}
        />
      ) : null}
      {value.kind === 'metric' ? (
        <div className="grid grid-cols-2 gap-2">
          <Select
            className="w-full"
            value={value.metricId}
            onChange={(metricId) => onChange({ ...value, metricId })}
            options={[
              { value: 'quotaCommercial', label: 'quotaCommercial' },
              { value: 'totalPrebook', label: 'totalPrebook' },
              { value: 'skybossEco', label: 'skybossEco' },
            ]}
          />
          <InputNumber
            className="w-full"
            addonBefore="×"
            value={value.coef ?? 1}
            onChange={(v) => onChange({ ...value, coef: Number(v ?? 1) })}
          />
        </div>
      ) : null}
      {value.kind === 'sum' ? (
        <div className="space-y-2">
          {value.parts.map((part, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <EcoQuantityValueEditor
                  value={part}
                  onChange={(next) => {
                    const parts = [...value.parts]
                    parts[i] = next
                    onChange({ kind: 'sum', parts })
                  }}
                />
              </div>
              <Button
                type="text"
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() =>
                  onChange({
                    kind: 'sum',
                    parts: value.parts.filter((_, j) => j !== i),
                  })
                }
              />
            </div>
          ))}
          <Button
            size="small"
            icon={<Plus size={14} />}
            onClick={() =>
              onChange({
                kind: 'sum',
                parts: [...value.parts, defaultValue('metric')],
              })
            }
          >
            {t('catering.config.supplier.addSumPart')}
          </Button>
        </div>
      ) : null}
      {value.kind === 'manual' ? (
        <p className="text-text-muted mb-0 text-[12px]">
          {t('catering.config.supplier.valueManualHint')}
        </p>
      ) : null}
    </div>
  )
}

function ExprEditor({
  expr,
  onChange,
}: {
  expr: EcoQuantityExpr
  onChange: (next: EcoQuantityExpr) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <Field label={t('catering.config.supplier.exprSource')}>
        <Select
          className="w-full"
          value={expr.source}
          onChange={(source) => onChange({ ...expr, source, id: undefined })}
          options={[
            { value: 'column', label: t('catering.config.supplier.valueKind.column') },
            { value: 'hotmeal_total', label: t('catering.config.supplier.valueKind.hotmeal_total') },
            { value: 'metric', label: t('catering.config.supplier.valueKind.metric') },
          ]}
        />
      </Field>
      {expr.source === 'column' || expr.source === 'metric' ? (
        <Field label={t('catering.config.supplier.exprId')}>
          {expr.source === 'column' ? (
            <Select
              className="w-full"
              value={expr.id}
              onChange={(id) => onChange({ ...expr, id })}
              options={ECO_QUANTITY_TARGET_COLUMNS.map((c) => {
                const code = productCodeFor(c)
                return { value: c, label: code ? `${c} — ${code}` : c }
              })}
              showSearch
            />
          ) : (
            <Select
              className="w-full"
              value={expr.id}
              onChange={(id) => onChange({ ...expr, id })}
              options={[
                { value: 'quotaCommercial', label: 'quotaCommercial' },
                { value: 'totalPrebook', label: 'totalPrebook' },
                { value: 'skybossEco', label: 'skybossEco' },
              ]}
            />
          )}
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('catering.config.supplier.exprCoef')}>
          <InputNumber
            className="w-full"
            value={expr.coef}
            onChange={(v) => onChange({ ...expr, coef: Number(v ?? 1) })}
          />
        </Field>
        <Field label={t('catering.config.supplier.exprRound')}>
          <Select
            className="w-full"
            value={expr.round ?? 'none'}
            onChange={(round) => onChange({ ...expr, round })}
            options={[
              { value: 'none', label: 'none' },
              { value: 'ceil', label: 'ceil' },
            ]}
          />
        </Field>
      </div>
    </div>
  )
}

function BranchEditor({
  branch,
  amenityConfig,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  branch: EcoQuantityBranch
  amenityConfig: EcoAmenityConfig
  onChange: (next: EcoQuantityBranch) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const { t } = useTranslation()
  const when = branch.when

  return (
    <div className="border-border space-y-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <span className="text-[12.5px] font-bold">{branch.id}</span>
        <div className="ml-auto flex gap-1">
          {onMoveUp ? (
            <Button type="text" size="small" icon={<ArrowUp size={14} />} onClick={onMoveUp} />
          ) : null}
          {onMoveDown ? (
            <Button type="text" size="small" icon={<ArrowDown size={14} />} onClick={onMoveDown} />
          ) : null}
          <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={onRemove} />
        </div>
      </div>

      <Field label={t('catering.config.supplier.whenRouteGroups')}>
        <Select
          mode="multiple"
          className="w-full"
          value={when.routeGroups ?? []}
          onChange={(routeGroups) =>
            onChange({ ...branch, when: { ...when, routeGroups } })
          }
          options={amenityConfig.routeGroups.map((g) => ({
            value: g.id,
            label: g.label,
          }))}
        />
      </Field>
      <Field label={t('catering.config.supplier.whenHourClasses')}>
        <Select
          mode="multiple"
          className="w-full"
          value={when.hourClasses ?? []}
          onChange={(hourClasses: RouteHourClassId[]) =>
            onChange({ ...branch, when: { ...when, hourClasses } })
          }
          options={amenityConfig.routeHourClasses.map((c) => ({
            value: c.id,
            label: c.label,
          }))}
        />
      </Field>
      <Field label={t('catering.config.supplier.whenAircraft')}>
        <Checkbox.Group
          value={when.aircraftFamilies ?? []}
          onChange={(v) =>
            onChange({
              ...branch,
              when: { ...when, aircraftFamilies: v as AircraftFamily[] },
            })
          }
        >
          <Space wrap>
            {AIRCRAFT_FAMILIES.map((f) => (
              <Checkbox key={f} value={f}>
                {f === 'A330' ? 'A330' : 'A320/A321'}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Field>
      <Field label={t('catering.config.supplier.whenUplift')}>
        <Checkbox.Group
          value={when.upliftTypes ?? []}
          onChange={(v) =>
            onChange({
              ...branch,
              when: { ...when, upliftTypes: v as EcoUpliftType[] },
            })
          }
        >
          <Space wrap>
            {UPLIFT_TYPES.map((u) => (
              <Checkbox key={u} value={u}>
                {u}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Field>
      <Field label={t('catering.config.supplier.whenFlightKind')}>
        <Checkbox.Group
          value={when.flightKinds ?? []}
          onChange={(v) =>
            onChange({
              ...branch,
              when: {
                ...when,
                flightKinds: v as Array<'ferry_cargo' | 'charter_china' | 'normal'>,
              },
            })
          }
        >
          <Space wrap>
            {FLIGHT_KINDS.map((k) => (
              <Checkbox key={k} value={k}>
                {k}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Field>
      <Field label={t('catering.config.supplier.whenRoutePairs')} hint={t('catering.config.supplier.whenRoutePairsHint')}>
        <Select
          mode="tags"
          className="w-full"
          tokenSeparators={[',', ' ']}
          value={when.routePairs ?? []}
          onChange={(routePairs) =>
            onChange({
              ...branch,
              when: {
                ...when,
                routePairs: routePairs.map((p) => String(p).toUpperCase()),
              },
            })
          }
          placeholder="SGN-MEL"
        />
      </Field>
      <Field label={t('catering.config.supplier.branchValue')}>
        <EcoQuantityValueEditor
          value={branch.value}
          onChange={(next) => onChange({ ...branch, value: next })}
        />
      </Field>
      <Field label={t('catering.config.supplier.branchNote')}>
        <Input
          value={branch.note ?? ''}
          onChange={(e) => onChange({ ...branch, note: e.target.value || undefined })}
        />
      </Field>
    </div>
  )
}

export function EcoQuantityRuleEditorDrawer({
  open,
  rule,
  amenityConfig,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<EcoQuantityRule | null>(rule)

  useEffect(() => {
    setDraft(rule)
  }, [rule])

  if (!draft) return null

  const patch = (partial: Partial<EcoQuantityRule>) =>
    setDraft((d) => (d ? { ...d, ...partial } : d))

  const branches = draft.branches ?? []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      destroyOnHidden
      title={t('catering.config.supplier.qtyEditorTitle')}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={() => onSave(draft)}>
            {t('catering.config.form.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label={t('catering.config.supplier.qtyTarget')}>
          <Select
            className="w-full"
            value={draft.targetColumn}
            onChange={(targetColumn) => patch({ targetColumn })}
            options={ECO_QUANTITY_TARGET_COLUMNS.map((c) => {
              const code = productCodeFor(c)
              return { value: c, label: code ? `${c} — ${code}` : c }
            })}
            showSearch
          />
        </Field>

        {draft.base === 'by_item' || draft.base === 'by_hotmeal_total' ? (
          <ExprEditor
            expr={
              draft.expr ?? {
                source: draft.base === 'by_hotmeal_total' ? 'hotmeal_total' : 'column',
                id: draft.base === 'by_item' ? 'spaghetti' : undefined,
                coef: 1,
                round: 'none',
              }
            }
            onChange={(expr) => patch({ expr })}
          />
        ) : null}

        {draft.base === 'by_std_arr' ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold">
                {t('catering.config.supplier.branches')}
              </span>
              <Button
                size="small"
                icon={<Plus size={14} />}
                onClick={() => {
                  const id = `b${Date.now().toString(36)}`
                  patch({
                    branches: [
                      ...branches,
                      {
                        id,
                        when: {},
                        value: { kind: 'const', value: 0 },
                      },
                    ],
                  })
                }}
              >
                {t('catering.config.supplier.addBranch')}
              </Button>
            </div>
            <div className="space-y-3">
              {branches.map((branch, index) => (
                <BranchEditor
                  key={branch.id}
                  branch={branch}
                  amenityConfig={amenityConfig}
                  onChange={(next) => {
                    const list = [...branches]
                    list[index] = next
                    patch({ branches: list })
                  }}
                  onRemove={() =>
                    patch({ branches: branches.filter((_, i) => i !== index) })
                  }
                  onMoveUp={
                    index > 0
                      ? () => {
                          const list = [...branches]
                          ;[list[index - 1], list[index]] = [list[index], list[index - 1]]
                          patch({ branches: list })
                        }
                      : undefined
                  }
                  onMoveDown={
                    index < branches.length - 1
                      ? () => {
                          const list = [...branches]
                          ;[list[index], list[index + 1]] = [list[index + 1], list[index]]
                          patch({ branches: list })
                        }
                      : undefined
                  }
                />
              ))}
            </div>
            <Field label={t('catering.config.supplier.fallback')}>
              <EcoQuantityValueEditor
                value={draft.fallback ?? { kind: 'manual' }}
                onChange={(fallback) => patch({ fallback })}
              />
            </Field>
          </>
        ) : null}

        <div className="border-border flex items-center justify-between border-t pt-4">
          <span className="text-[12.5px] font-bold">
            {draft.enabled
              ? t('catering.config.enabled')
              : t('catering.config.disabled')}
          </span>
          <Switch
            checked={draft.enabled}
            onChange={(enabled) => patch({ enabled })}
          />
        </div>
      </div>
    </Drawer>
  )
}
