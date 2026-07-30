import {
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
} from 'antd'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AmenityCatalogItem, MealCatalogItem } from '@/modules/catering/catalogTypes'
import type {
  AircraftFamily,
  EcoAmenityConfig,
  EcoQuantityBranch,
  EcoQuantityRule,
  EcoQuantityValue,
  EcoQuantityWhen,
  EcoUpliftType,
  RouteHourClassId,
} from '@/modules/catering/supplier/ecoQuantityTypes'
import {
  buildValueSourceGroups,
  columnOptionLabel,
  decodeValueSource,
  encodeValueSource,
  ECO_QUANTITY_TARGET_COLUMNS,
  sourceCoef,
  summarizeBranchesPreview,
  whenConditionChips,
  whenNatural,
} from './ecoQuantityRuleMeta'

interface Props {
  open: boolean
  rule: EcoQuantityRule | null
  amenityConfig: EcoAmenityConfig
  mealCatalog: MealCatalogItem[]
  amenityCatalog: AmenityCatalogItem[]
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

type ValueUiKind = 'const' | 'source' | 'sum'

function uiKindOf(value: EcoQuantityValue): ValueUiKind {
  if (value.kind === 'sum') return 'sum'
  if (value.kind === 'const') return 'const'
  return 'source'
}

function defaultValue(kind: ValueUiKind): EcoQuantityValue {
  switch (kind) {
    case 'const':
      return { kind: 'const', value: 0 }
    case 'source':
      return { kind: 'metric', metricId: 'totalPrebook', coef: 1 }
    case 'sum':
      return {
        kind: 'sum',
        parts: [
          { kind: 'metric', metricId: 'quotaCommercial', coef: 1 },
          { kind: 'metric', metricId: 'totalPrebook', coef: 1 },
        ],
      }
  }
}

const AIRCRAFT_FAMILIES: AircraftFamily[] = ['A321', 'A330']
const UPLIFT_TYPES: EcoUpliftType[] = ['DAU_NGAY', 'DOI_TO', 'NIGHTSTOP']
const FLIGHT_KINDS: Array<'ferry_cargo' | 'charter_china' | 'normal'> = [
  'normal',
  'ferry_cargo',
  'charter_china',
]

type ConditionKey =
  | 'routeGroups'
  | 'hourClasses'
  | 'aircraftFamilies'
  | 'upliftTypes'
  | 'flightKinds'
  | 'routePairs'

const CONDITION_KEYS: ConditionKey[] = [
  'routeGroups',
  'hourClasses',
  'aircraftFamilies',
  'upliftTypes',
  'flightKinds',
  'routePairs',
]

export function EcoQuantityValueEditor({
  value,
  onChange,
  mealCatalog,
  amenityCatalog,
}: {
  value: EcoQuantityValue
  onChange: (next: EcoQuantityValue) => void
  mealCatalog: MealCatalogItem[]
  amenityCatalog: AmenityCatalogItem[]
}) {
  const { t } = useTranslation()
  const uiKind = uiKindOf(value)
  const sourceGroups = useMemo(
    () => buildValueSourceGroups(mealCatalog, amenityCatalog),
    [mealCatalog, amenityCatalog],
  )

  return (
    <div className="border-border bg-background space-y-2 rounded-lg border p-3">
      <Select
        className="w-full"
        value={uiKind}
        onChange={(kind) => onChange(defaultValue(kind))}
        options={[
          { value: 'const', label: t('catering.config.supplier.valueKind.const') },
          { value: 'source', label: t('catering.config.supplier.valueKind.source') },
          { value: 'sum', label: t('catering.config.supplier.valueKind.sum') },
        ]}
      />
      {value.kind === 'const' ? (
        <InputNumber
          className="w-full"
          value={value.value}
          onChange={(v) => onChange({ kind: 'const', value: Number(v ?? 0) })}
        />
      ) : null}
      {uiKind === 'source' && value.kind !== 'const' && value.kind !== 'sum' ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Select
            className="w-full"
            showSearch
            optionFilterProp="label"
            value={encodeValueSource(value) ?? undefined}
            onChange={(encoded) => onChange(decodeValueSource(encoded, sourceCoef(value)))}
            options={sourceGroups.map((g) => ({
              label: g.label,
              options: g.options,
            }))}
          />
          <InputNumber
            className="w-[100px]"
            addonBefore="×"
            value={sourceCoef(value)}
            onChange={(v) => {
              const coef = Number(v ?? 1)
              const encoded = encodeValueSource(value)
              if (encoded) onChange(decodeValueSource(encoded, coef))
            }}
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
                  mealCatalog={mealCatalog}
                  amenityCatalog={amenityCatalog}
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
                parts: [...value.parts, defaultValue('const')],
              })
            }
          >
            {t('catering.config.supplier.addSumPart')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ConditionPicker({
  conditionKey,
  when,
  amenityConfig,
  onChange,
}: {
  conditionKey: ConditionKey
  when: EcoQuantityWhen
  amenityConfig: EcoAmenityConfig
  onChange: (next: EcoQuantityWhen) => void
}) {
  const { t } = useTranslation()

  switch (conditionKey) {
    case 'routeGroups':
      return (
        <Select
          mode="multiple"
          className="w-full"
          placeholder={t('catering.config.supplier.whenRouteGroups')}
          value={when.routeGroups ?? []}
          onChange={(routeGroups) => onChange({ ...when, routeGroups })}
          options={amenityConfig.routeGroups.map((g) => ({
            value: g.id,
            label: g.label,
          }))}
        />
      )
    case 'hourClasses':
      return (
        <Select
          mode="multiple"
          className="w-full"
          placeholder={t('catering.config.supplier.whenHourClasses')}
          value={when.hourClasses ?? []}
          onChange={(hourClasses: RouteHourClassId[]) =>
            onChange({ ...when, hourClasses })
          }
          options={amenityConfig.routeHourClasses.map((c) => ({
            value: c.id,
            label: c.label,
          }))}
        />
      )
    case 'aircraftFamilies':
      return (
        <Checkbox.Group
          value={when.aircraftFamilies ?? []}
          onChange={(v) =>
            onChange({ ...when, aircraftFamilies: v as AircraftFamily[] })
          }
        >
          <Space wrap>
            {AIRCRAFT_FAMILIES.map((f) => (
              <Checkbox key={f} value={f}>
                {f === 'A330' ? 'A330' : 'A321'}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      )
    case 'upliftTypes':
      return (
        <Checkbox.Group
          value={when.upliftTypes ?? []}
          onChange={(v) => onChange({ ...when, upliftTypes: v as EcoUpliftType[] })}
        >
          <Space wrap>
            {UPLIFT_TYPES.map((u) => (
              <Checkbox key={u} value={u}>
                {t(`catering.config.supplier.uplift.${u}`, { defaultValue: u })}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      )
    case 'flightKinds':
      return (
        <Checkbox.Group
          value={when.flightKinds ?? []}
          onChange={(v) =>
            onChange({
              ...when,
              flightKinds: v as Array<'ferry_cargo' | 'charter_china' | 'normal'>,
            })
          }
        >
          <Space wrap>
            {FLIGHT_KINDS.map((k) => (
              <Checkbox key={k} value={k}>
                {t(`catering.config.supplier.flightKind.${k}`, { defaultValue: k })}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      )
    case 'routePairs':
      return (
        <Select
          mode="tags"
          className="w-full"
          tokenSeparators={[',', ' ']}
          value={when.routePairs ?? []}
          onChange={(routePairs) =>
            onChange({
              ...when,
              routePairs: routePairs.map((p) => String(p).toUpperCase()),
            })
          }
          placeholder="SGN-MEL"
        />
      )
  }
}

function BranchEditor({
  branch,
  amenityConfig,
  mealCatalog,
  amenityCatalog,
  previewLine,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  branch: EcoQuantityBranch
  amenityConfig: EcoAmenityConfig
  mealCatalog: MealCatalogItem[]
  amenityCatalog: AmenityCatalogItem[]
  previewLine: string
  onChange: (next: EcoQuantityBranch) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const [editingCondition, setEditingCondition] = useState<ConditionKey | null>(null)
  const when = branch.when
  const chips = whenConditionChips(when, amenityConfig)
  const activeKeys = new Set(chips.map((c) => c.key))
  const availableConditions = CONDITION_KEYS.filter((k) => !activeKeys.has(k))

  const conditionLabels: Record<ConditionKey, string> = {
    routeGroups: t('catering.config.supplier.whenRouteGroups'),
    hourClasses: t('catering.config.supplier.whenHourClasses'),
    aircraftFamilies: t('catering.config.supplier.whenAircraft'),
    upliftTypes: t('catering.config.supplier.whenUplift'),
    flightKinds: t('catering.config.supplier.whenFlightKind'),
    routePairs: t('catering.config.supplier.whenRoutePairs'),
  }

  const clearCondition = (key: ConditionKey) => {
    const next = { ...when }
    delete next[key]
    onChange({ ...branch, when: next })
    if (editingCondition === key) setEditingCondition(null)
  }

  if (!expanded) {
    return (
      <div className="border-border flex items-center gap-2 rounded-xl border px-3 py-2.5">
        <button
          type="button"
          className="text-text-secondary hover:text-foreground flex cursor-pointer items-center gap-1.5 text-left text-[12.5px] font-semibold"
          onClick={() => setExpanded(true)}
        >
          <ChevronRight size={14} />
          <span className="min-w-0 flex-1 truncate">{previewLine}</span>
        </button>
        <div className="ml-auto flex shrink-0 gap-1">
          {onMoveUp ? (
            <Button type="text" size="small" icon={<ArrowUp size={14} />} onClick={onMoveUp} />
          ) : null}
          {onMoveDown ? (
            <Button type="text" size="small" icon={<ArrowDown size={14} />} onClick={onMoveDown} />
          ) : null}
          <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={onRemove} />
        </div>
      </div>
    )
  }

  return (
    <div className="border-border space-y-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-foreground flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold"
          onClick={() => setExpanded(false)}
        >
          <ChevronDown size={14} />
          {branch.id}
        </button>
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

      <div>
        <span className="mb-1.5 block text-[12.5px] font-bold">
          {t('catering.config.supplier.conditions')}
        </span>
        {chips.length === 0 ? (
          <p className="text-text-muted mb-2 text-[12px]">
            {t('catering.config.supplier.applyAllCases')}
          </p>
        ) : (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <Tag
                key={chip.key}
                closable
                onClose={() => clearCondition(chip.key as ConditionKey)}
                className="m-0 cursor-pointer"
                onClick={() => setEditingCondition(chip.key as ConditionKey)}
              >
                {chip.label}
              </Tag>
            ))}
          </div>
        )}

        {editingCondition ? (
          <div className="border-border bg-muted/40 mb-2 space-y-2 rounded-lg border p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold">{conditionLabels[editingCondition]}</span>
              <Button type="link" size="small" onClick={() => setEditingCondition(null)}>
                {t('common.done', { defaultValue: 'Xong' })}
              </Button>
            </div>
            <ConditionPicker
              conditionKey={editingCondition}
              when={when}
              amenityConfig={amenityConfig}
              onChange={(next) => onChange({ ...branch, when: next })}
            />
          </div>
        ) : null}

        {availableConditions.length > 0 ? (
          <Dropdown
            menu={{
              items: availableConditions.map((k) => ({
                key: k,
                label: conditionLabels[k],
                onClick: () => setEditingCondition(k),
              })),
            }}
          >
            <Button size="small" icon={<Plus size={14} />}>
              {t('catering.config.supplier.addCondition')}
            </Button>
          </Dropdown>
        ) : null}
      </div>

      <Field label={t('catering.config.supplier.branchValue')}>
        <EcoQuantityValueEditor
          value={branch.value}
          mealCatalog={mealCatalog}
          amenityCatalog={amenityCatalog}
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
  mealCatalog,
  amenityCatalog,
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

  const branches = draft.branches
  const previewLines =
    summarizeBranchesPreview(draft, amenityConfig, mealCatalog, amenityCatalog) ?? []

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
            options={ECO_QUANTITY_TARGET_COLUMNS.map((c) => ({
              value: c,
              label: columnOptionLabel(c, mealCatalog, amenityCatalog),
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Field>

        <div className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
          <span className="text-[12.5px] font-bold">
            {t('catering.config.supplier.roundCeil')}
          </span>
          <Switch
            checked={draft.round === 'ceil'}
            onChange={(on) => patch({ round: on ? 'ceil' : undefined })}
          />
        </div>

        <div className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
          <span className="text-[12.5px] font-bold">
            {t('catering.config.supplier.formulaConfirmed')}
          </span>
          <Switch
            checked={draft.confirmed !== false}
            onChange={(on) => patch({ confirmed: on })}
          />
        </div>

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
              mealCatalog={mealCatalog}
              amenityCatalog={amenityCatalog}
              previewLine={
                previewLines[index] ??
                `${whenNatural(branch.when, amenityConfig)}: = …`
              }
              onChange={(next) => {
                const list = [...branches]
                list[index] = next
                patch({ branches: list })
              }}
              onRemove={() => patch({ branches: branches.filter((_, i) => i !== index) })}
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

        <Field
          label={t('catering.config.supplier.fallbackElse')}
          hint={t('catering.config.supplier.fallbackElseHint')}
        >
          <EcoQuantityValueEditor
            value={draft.fallback}
            mealCatalog={mealCatalog}
            amenityCatalog={amenityCatalog}
            onChange={(fallback) => patch({ fallback })}
          />
        </Field>

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
