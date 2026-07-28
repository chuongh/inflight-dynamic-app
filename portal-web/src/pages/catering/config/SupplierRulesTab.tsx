import {
  Alert,
  App as AntApp,
  Button,
  Collapse,
  DatePicker,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Space,
  Tag,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Info, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/useAuth'
import {
  activeSupplierRuleVersion,
  supplierRuleVersionsNewestFirst,
  withNewSupplierRuleVersion,
} from '@/modules/catering/supplierRuleConfig'
import type { SupplierRuleConfigVersion } from '@/modules/catering/supplierRuleConfigTypes'
import type {
  SbbLookupDataset,
  SbbLookupItem,
  SbbLookupRow,
  SbbRouteSheet,
} from '@/modules/catering/supplier/types'
import { DEFAULT_ECO_AMENITY_CONFIG } from '@/modules/catering/supplier/amenityDefaults'
import { DEFAULT_ECO_QUANTITY_RULES } from '@/modules/catering/supplier/ecoQuantityEval'
import type {
  EcoAmenityConfig,
  EcoQuantityRule,
  SupplierRouteGroup,
} from '@/modules/catering/supplier/ecoQuantityTypes'
import {
  DEFAULT_SBB_SHEET_BINDINGS,
  resolveSbbSheetBindings,
  selectSbbRouteSheet,
} from '@/modules/catering/supplier/sbbRules'
import { activeCatalogVersion } from '@/modules/catering/catalog'
import {
  useAmenityCatalogData,
  useMealCatalogData,
} from '@/modules/catering/hooks/useCatalog'
import {
  useSaveSupplierRuleConfigData,
  useSupplierRuleConfigData,
} from '@/modules/catering/hooks/useSupplierRuleConfig'
import {
  RULE_CATEGORY_TAB_ORDER,
  ruleCategoryLabel,
  type RuleCatalogCategory,
} from '@/modules/catering/mealCategoryMeta'
import type { VersionStatus } from '@/modules/catering/types'
import { formatDateDMY } from '@/shared/utils/format'
import { AmenityCompositionSection } from './AmenityCompositionSection'
import { EcoQuantityRuleCard } from './EcoQuantityRuleCard'
import { EcoQuantityRuleEditorDrawer } from './EcoQuantityRuleEditorDrawer'
import {
  displayNameFor,
  newEcoQuantityRule,
  productCodeFor,
  ruleCategoryOf,
} from './ecoQuantityRuleMeta'

dayjs.extend(customParseFormat)

const DMY = 'DD/MM/YYYY'

function parseDmy(dmy: string): Dayjs | null {
  if (!dmy.trim()) return null
  const d = dayjs(dmy, DMY, true)
  return d.isValid() ? d : null
}

const SBB_SHEETS: SbbRouteSheet[] = [
  'VIET-HAN-NHAT',
  'CHAY(VIỆT-HÀN-NHẬT)',
  'ẤN',
  'ÚC&KAZ',
]

const SBB_ITEMS: SbbLookupItem[] = [
  'bread',
  'basa',
  'pho',
  'bunBo',
  'stickyRice',
  'chickenGravy',
  'blanket',
]

const STATUS_DOT: Record<VersionStatus, string> = {
  active: '#16a34a',
  scheduled: '#2563eb',
  superseded: '#9ca3af',
  draft: '#c9a000',
}

type ConfigSection = 'eco' | 'amenity' | 'routeHourList' | 'sbb'

function dmyToNum(dmy: string): number {
  const [d, m, y] = dmy.split('/')
  return Number(`${y}${m?.padStart(2, '0')}${d?.padStart(2, '0')}`)
}

function cloneSbb(lookups: SbbLookupDataset): SbbLookupDataset {
  return structuredClone(lookups)
}

function Dot({ status }: { status: VersionStatus }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: STATUS_DOT[status] }}
      aria-hidden
    />
  )
}

type Props = {
  /** Push version / date / Edit CTA into the parent PageHeader. */
  onHeaderActions?: (actions: ReactNode | null) => void
}

export function SupplierRulesTab({ onHeaderActions }: Props) {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useSupplierRuleConfigData()
  const saveConfig = useSaveSupplierRuleConfigData()
  const { data: mealCatalogData } = useMealCatalogData()
  const { data: amenityCatalogData } = useAmenityCatalogData()
  const mealCatalog = activeCatalogVersion(mealCatalogData?.versions ?? [])?.items ?? []
  const amenityCatalog = activeCatalogVersion(amenityCatalogData?.versions ?? [])?.items ?? []

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [effDate, setEffDate] = useState('')
  const [workingSbb, setWorkingSbb] = useState<SbbLookupDataset | null>(null)
  const [workingQuantityRules, setWorkingQuantityRules] = useState<EcoQuantityRule[] | null>(
    null,
  )
  const [workingAmenityConfig, setWorkingAmenityConfig] = useState<EcoAmenityConfig | null>(
    null,
  )
  const [editingQuantityRule, setEditingQuantityRule] = useState<EcoQuantityRule | null>(null)
  const [sheet, setSheet] = useState<SbbRouteSheet>('ÚC&KAZ')
  const [section, setSection] = useState<ConfigSection>('eco')
  const [ecoCategory, setEcoCategory] = useState<RuleCatalogCategory | null>(null)
  const [ruleQuery, setRuleQuery] = useState('')
  const [trialDep, setTrialDep] = useState('SGN')
  const [trialArr, setTrialArr] = useState('MEL')
  const [trialMeal, setTrialMeal] = useState<'standard' | 'vegetarian'>('standard')

  const versions = useMemo(
    () => supplierRuleVersionsNewestFirst(data?.versions ?? []),
    [data],
  )
  const active = useMemo(() => activeSupplierRuleVersion(versions), [versions])
  const viewing = useMemo(
    () => versions.find((v) => v.id === viewingId) ?? active,
    [versions, viewingId, active],
  )

  const amenityConfig =
    editing && workingAmenityConfig
      ? workingAmenityConfig
      : (viewing?.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG)
  const quantityRules =
    editing && workingQuantityRules
      ? workingQuantityRules
      : (viewing?.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES)

  const categoryTabs = useMemo(() => {
    const present = new Set(
      quantityRules.map((r) => ruleCategoryOf(r, mealCatalog, amenityCatalog)),
    )
    return RULE_CATEGORY_TAB_ORDER.filter((c) => present.has(c))
  }, [quantityRules, mealCatalog, amenityCatalog])

  const activeEcoCategory: RuleCatalogCategory =
    ecoCategory && categoryTabs.includes(ecoCategory)
      ? ecoCategory
      : (categoryTabs[0] ?? 'other')

  const categoryRules = quantityRules.filter(
    (r) => ruleCategoryOf(r, mealCatalog, amenityCatalog) === activeEcoCategory,
  )
  const filteredCategoryRules = useMemo(() => {
    const q = ruleQuery.trim().toLowerCase()
    if (!q) return categoryRules
    return categoryRules.filter((rule) => {
      const code = productCodeFor(rule.targetColumn)?.toLowerCase() ?? ''
      const name = displayNameFor(rule.targetColumn, mealCatalog, amenityCatalog).toLowerCase()
      return (
        name.includes(q) ||
        rule.targetColumn.toLowerCase().includes(q) ||
        code.includes(q)
      )
    })
  }, [categoryRules, ruleQuery, mealCatalog, amenityCatalog])

  const isActiveView = !!viewing && viewing.id === active?.id

  const startEdit = () => {
    if (!viewing) return
    const cloned = cloneSbb(viewing.sbbLookups)
    if (!cloned.sheetBindings) {
      cloned.sheetBindings = structuredClone(DEFAULT_SBB_SHEET_BINDINGS)
    }
    setWorkingSbb(cloned)
    setWorkingQuantityRules(
      structuredClone(viewing.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES),
    )
    setWorkingAmenityConfig(
      structuredClone(viewing.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG),
    )
    setEffDate(formatDateDMY(Date.now()))
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setWorkingSbb(null)
    setWorkingQuantityRules(null)
    setWorkingAmenityConfig(null)
    setEditingQuantityRule(null)
  }

  useEffect(() => {
    if (!onHeaderActions) return
    if (!viewing) {
      onHeaderActions(null)
      return
    }

    const effRange = `${viewing.effectiveFrom} → ${viewing.effectiveTo ?? t('catering.quota.untilNextShort')}`
    const renderVersion = (v: SupplierRuleConfigVersion) => (
      <span className="inline-flex items-center gap-2">
        <Dot status={v.status} /> {v.id} · {t(`catering.quota.status.${v.status}`)}
      </span>
    )

    onHeaderActions(
      <>
        <Select
          value={viewing.id}
          onChange={(id) => {
            setViewingId(id)
            if (editing) {
              setEditing(false)
              setWorkingSbb(null)
              setWorkingQuantityRules(null)
              setWorkingAmenityConfig(null)
              setEditingQuantityRule(null)
            }
          }}
          style={{ minWidth: 150 }}
          optionLabelProp="label"
          options={versions.map((v) => ({ value: v.id, label: renderVersion(v) }))}
          aria-label={t('catering.config.supplier.versionSelect')}
        />
        <span className="border-border bg-background tnum inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold">
          {effRange}
        </span>
        <Popover
          placement="bottomLeft"
          trigger="click"
          content={
            <div className="max-w-xs space-y-1 text-[12.5px] leading-relaxed">
              <div>
                {t('catering.config.updatedMeta', {
                  by: viewing.updatedBy,
                  at: viewing.updatedAt,
                })}
              </div>
              {viewing.note ? <div className="text-text-muted">{viewing.note}</div> : null}
            </div>
          }
        >
          <button
            type="button"
            className="text-text-muted hover:text-foreground hover:bg-background inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
            aria-label={t('catering.quota.detailsAria')}
          >
            <Info size={16} />
          </button>
        </Popover>
        {isActiveView && !editing ? (
          <Button type="primary" icon={<Pencil size={15} />} onClick={startEdit}>
            {t('catering.config.supplier.edit')}
          </Button>
        ) : null}
      </>,
    )
  }, [onHeaderActions, viewing, versions, isActiveView, editing, t])

  useEffect(() => {
    return () => onHeaderActions?.(null)
  }, [onHeaderActions])

  if (isLoading || !data || !viewing) {
    return (
      <div className="border-border text-text-muted rounded-xl border border-dashed px-4 py-8 text-center text-[13px]">
        {t('catering.config.supplier.loading')}
      </div>
    )
  }

  const sbb = editing && workingSbb ? workingSbb : viewing.sbbLookups
  const rows = sbb.sheets[sheet] ?? []
  const sheetBindings = resolveSbbSheetBindings(sbb.sheetBindings)
  const currentBinding = sheetBindings[sheet]
  const trialSheet = selectSbbRouteSheet(trialDep, trialArr, trialMeal, sheetBindings)

  const updateQuantityRule = (id: string, patch: Partial<EcoQuantityRule>) => {
    if (!workingQuantityRules) return
    setWorkingQuantityRules(
      workingQuantityRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }

  const removeQuantityRule = (id: string) => {
    if (!workingQuantityRules) return
    setWorkingQuantityRules(workingQuantityRules.filter((r) => r.id !== id))
  }

  const addQuantityRule = () => {
    if (!workingQuantityRules) return
    const created = newEcoQuantityRule('by_std_arr', 'ketchup')
    setWorkingQuantityRules([...workingQuantityRules, created])
    setEditingQuantityRule(created)
  }

  const saveQuantityRule = (rule: EcoQuantityRule) => {
    if (!workingQuantityRules) return
    const exists = workingQuantityRules.some((r) => r.id === rule.id)
    setWorkingQuantityRules(
      exists
        ? workingQuantityRules.map((r) => (r.id === rule.id ? rule : r))
        : [...workingQuantityRules, rule],
    )
    setEditingQuantityRule(null)
  }

  const updateRouteGroup = (id: string, patch: Partial<SupplierRouteGroup>) => {
    if (!workingAmenityConfig) return
    setWorkingAmenityConfig({
      ...workingAmenityConfig,
      routeGroups: workingAmenityConfig.routeGroups.map((g) =>
        g.id === id ? { ...g, ...patch } : g,
      ),
    })
  }

  const removeRouteGroup = (id: string) => {
    if (!workingAmenityConfig) return
    setWorkingAmenityConfig({
      ...workingAmenityConfig,
      routeGroups: workingAmenityConfig.routeGroups.filter((g) => g.id !== id),
    })
  }

  const addRouteGroup = () => {
    if (!workingAmenityConfig) return
    const created: SupplierRouteGroup = {
      id: `group-${Date.now().toString(36)}`,
      label: '',
      airports: [],
    }
    setWorkingAmenityConfig({
      ...workingAmenityConfig,
      routeGroups: [...workingAmenityConfig.routeGroups, created],
    })
  }

  const updateRow = (index: number, patch: Partial<SbbLookupRow>) => {
    if (!workingSbb) return
    const nextRows = [...(workingSbb.sheets[sheet] ?? [])]
    nextRows[index] = { ...nextRows[index], ...patch }
    setWorkingSbb({
      ...workingSbb,
      sheets: { ...workingSbb.sheets, [sheet]: nextRows },
    })
  }

  const updateItem = (index: number, item: SbbLookupItem, value: number | null) => {
    if (!workingSbb) return
    const nextRows = [...(workingSbb.sheets[sheet] ?? [])]
    const row = nextRows[index]
    nextRows[index] = {
      ...row,
      items: { ...row.items, [item]: value },
    }
    setWorkingSbb({
      ...workingSbb,
      sheets: { ...workingSbb.sheets, [sheet]: nextRows },
    })
  }

  const addRow = () => {
    if (!workingSbb) return
    const existing = workingSbb.sheets[sheet] ?? []
    const maxPax = existing.reduce((m, r) => Math.max(m, r.businessPax), 0)
    const next: SbbLookupRow = { businessPax: maxPax + 1, items: {} }
    setWorkingSbb({
      ...workingSbb,
      sheets: { ...workingSbb.sheets, [sheet]: [...existing, next] },
    })
  }

  const removeRow = (index: number) => {
    if (!workingSbb) return
    const nextRows = (workingSbb.sheets[sheet] ?? []).filter((_, i) => i !== index)
    setWorkingSbb({
      ...workingSbb,
      sheets: { ...workingSbb.sheets, [sheet]: nextRows },
    })
  }

  const setSheetAirports = (airports: string[]) => {
    if (!workingSbb) return
    const normalized = airports.map((a) => a.trim().toUpperCase()).filter(Boolean)
    const prev = resolveSbbSheetBindings(workingSbb.sheetBindings)
    setWorkingSbb({
      ...workingSbb,
      sheetBindings: {
        ...prev,
        [sheet]: {
          ...prev[sheet],
          airports: normalized,
          note: prev[sheet]?.note,
          priority: prev[sheet]?.priority,
        },
      },
    })
  }

  const publish = () => {
    if (!workingSbb) return
    const today = formatDateDMY(Date.now())
    const startsInFuture = dmyToNum(effDate) > dmyToNum(today)
    const next = withNewSupplierRuleVersion(
      data.versions,
      {
        ecoRouteRules: viewing.ecoRouteRules,
        sbbLookups: workingSbb,
        ecoAmenity:
          workingAmenityConfig ?? viewing.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG,
        ecoQuantityRules:
          workingQuantityRules ?? viewing.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES,
      },
      {
        effectiveFrom: effDate,
        updatedBy: session?.user.name ?? 'Commercial',
        updatedAt: today,
        startsInFuture,
      },
    )
    saveConfig.mutate(
      { versions: next },
      {
        onSuccess: () => {
          setViewingId(next[0].id)
          cancelEdit()
          message.success(t('catering.config.supplier.created', { id: next[0].id, date: effDate }))
        },
      },
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {!isActiveView && !editing ? (
        <Alert type="info" showIcon title={t('catering.config.readonlyHint')} />
      ) : null}
      {editing ? (
        <Alert type="info" showIcon title={t('catering.config.supplier.editBanner')} />
      ) : null}

      <div className="config-tab-scroll">
        <Segmented<ConfigSection>
          value={section}
          onChange={setSection}
          options={[
            { value: 'eco', label: t('catering.config.supplier.sectionEco') },
            { value: 'amenity', label: t('catering.config.supplier.sectionAmenity') },
            {
              value: 'routeHourList',
              label: t('catering.config.supplier.sectionRouteHourList'),
            },
            { value: 'sbb', label: t('catering.config.supplier.sectionSbb') },
          ]}
        />
      </div>

      {section === 'eco' ? (
        <>
          <section className="border-border bg-surface rounded-xl border p-4">
            <h3 className="mb-1 text-[14px] font-extrabold">
              {t('catering.config.supplier.rulesTitle')}
            </h3>
            <p className="text-text-muted mb-3 text-[12.5px]">
              {t('catering.config.supplier.rulesDesc')}
            </p>
            {categoryTabs.length > 0 ? (
              <div className="config-tab-scroll mb-3">
                <Segmented<RuleCatalogCategory>
                  value={activeEcoCategory}
                  onChange={(v) => {
                    setEcoCategory(v)
                    setRuleQuery('')
                  }}
                  options={categoryTabs.map((c) => ({
                    value: c,
                    label: ruleCategoryLabel(c, t),
                  }))}
                />
              </div>
            ) : null}
            {quantityRules.length > 8 ? (
              <Input
                className="mb-3"
                allowClear
                prefix={<Search size={14} className="text-text-muted" />}
                placeholder={t('catering.config.supplier.searchRules')}
                value={ruleQuery}
                onChange={(e) => setRuleQuery(e.target.value)}
              />
            ) : null}
            <div className="flex flex-col gap-2">
              {filteredCategoryRules.map((rule) => (
                <EcoQuantityRuleCard
                  key={rule.id}
                  rule={rule}
                  editing={editing}
                  amenityConfig={amenityConfig}
                  mealCatalog={mealCatalog}
                  amenityCatalog={amenityCatalog}
                  onToggle={(enabled) => updateQuantityRule(rule.id, { enabled })}
                  onEdit={() => setEditingQuantityRule(rule)}
                  onRemove={() => removeQuantityRule(rule.id)}
                />
              ))}
              {filteredCategoryRules.length === 0 ? (
                <div className="text-text-muted text-center text-[12.5px]">—</div>
              ) : null}
              {editing ? (
                <Button type="dashed" icon={<Plus size={15} />} onClick={addQuantityRule}>
                  {t('catering.config.supplier.addQuantityRule')}
                </Button>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {section === 'amenity' ? (
        <div className="flex flex-col gap-3">
          <Collapse
            defaultActiveKey={[]}
            items={[
              {
                key: 'packages',
                label: t('catering.config.supplier.amenityTitle'),
                children: (
                  <>
                    <p className="text-text-muted mb-3 text-[12.5px]">
                      {t('catering.config.supplier.amenityDesc')}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-[13px]">
                        <thead>
                          <tr className="text-text-secondary [&>th]:border-border [&>th]:border-b [&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-extrabold [&>th]:uppercase">
                            <th>Gói</th>
                            <th>Tàu</th>
                            <th>Loại</th>
                            <th>Tên</th>
                          </tr>
                        </thead>
                        <tbody>
                          {amenityConfig.packages.map((pkg) => (
                            <tr
                              key={pkg.id}
                              className="[&>td]:border-border [&>td]:border-b [&>td]:px-2 [&>td]:py-1.5"
                            >
                              <td className="font-mono font-bold">{pkg.id}</td>
                              <td>{pkg.aircraftFamily === 'A330' ? 'A330' : 'A320/A321'}</td>
                              <td>{pkg.kind}</td>
                              <td>{pkg.label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ),
              },
              {
                key: 'routeGroups',
                label: t('catering.config.supplier.routeGroupsTitle'),
                children: (
                  <>
                    <p className="text-text-muted mb-3 text-[12.5px]">
                      {t('catering.config.supplier.routeGroupsDesc')}
                    </p>
                    <div className="flex flex-col gap-3">
                      {amenityConfig.routeGroups.map((group) =>
                        editing ? (
                          <div
                            key={group.id}
                            className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-start"
                          >
                            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                              <label className="flex flex-col gap-1 text-[12px] font-bold">
                                {t('catering.config.supplier.routeGroupLabel')}
                                <Input
                                  value={group.label}
                                  onChange={(e) =>
                                    updateRouteGroup(group.id, { label: e.target.value })
                                  }
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-[12px] font-bold">
                                {t('catering.config.supplier.routeGroupAirports')}
                                <Select
                                  mode="tags"
                                  className="w-full"
                                  tokenSeparators={[',', ' ']}
                                  value={group.airports}
                                  onChange={(airports) =>
                                    updateRouteGroup(group.id, {
                                      airports: airports.map((a) => String(a).toUpperCase()),
                                    })
                                  }
                                  placeholder="BNE, MEL, SYD"
                                />
                              </label>
                            </div>
                            <Button
                              type="text"
                              danger
                              size="small"
                              className="sm:mt-6"
                              icon={<Trash2 size={14} />}
                              aria-label={t('catering.config.supplier.removeRouteGroup')}
                              onClick={() => removeRouteGroup(group.id)}
                            />
                          </div>
                        ) : (
                          <div key={group.id} className="flex flex-wrap items-center gap-2">
                            <span className="min-w-16 text-[13px] font-semibold">{group.label}</span>
                            {group.airports.map((a) => (
                              <Tag key={a}>{a}</Tag>
                            ))}
                          </div>
                        ),
                      )}
                      {editing ? (
                        <Button type="dashed" icon={<Plus size={15} />} onClick={addRouteGroup}>
                          {t('catering.config.supplier.addRouteGroup')}
                        </Button>
                      ) : null}
                    </div>
                  </>
                ),
              },
              {
                key: 'composition',
                label: t('catering.config.supplier.compositionTitle'),
                children: <AmenityCompositionSection amenityConfig={amenityConfig} />,
              },
            ]}
          />
        </div>
      ) : null}

      {section === 'routeHourList' ? (
        <section className="border-border bg-surface rounded-xl border p-4">
          <h3 className="mb-1 text-[14px] font-extrabold">
            {t('catering.config.supplier.listTitle')}
          </h3>
          <p className="text-text-muted mb-3 text-[12.5px]">
            {t('catering.config.supplier.listDesc')}
          </p>
          <div className="flex flex-col gap-3">
            {amenityConfig.routeHourClasses.map((cls) => (
              <div key={cls.id}>
                <div className="mb-1 text-[12.5px] font-bold">{cls.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {cls.routes.map((route) => (
                    <Tag key={route}>
                      {route.replace(/-SGN$/, '').replace(/^SGN-/, '')}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {section === 'sbb' ? (
        <div className="flex flex-col gap-4">
          <section className="border-border bg-surface rounded-xl border p-4">
            <h3 className="mb-1 text-[14px] font-extrabold">
              {t('catering.config.supplier.sbbRouteTitle')}
            </h3>
            <p className="text-text-muted mb-3 text-[12.5px]">
              {t('catering.config.supplier.sbbRouteDesc')}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-[12px] font-bold">
                {t('catering.config.supplier.trialDep')}
                <Input
                  value={trialDep}
                  onChange={(e) => setTrialDep(e.target.value.toUpperCase())}
                  maxLength={4}
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-bold">
                {t('catering.config.supplier.trialArr')}
                <Input
                  value={trialArr}
                  onChange={(e) => setTrialArr(e.target.value.toUpperCase())}
                  maxLength={4}
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-bold">
                {t('catering.config.supplier.trialMeal')}
                <Segmented<'standard' | 'vegetarian'>
                  value={trialMeal}
                  onChange={setTrialMeal}
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'vegetarian', label: 'Chay' },
                  ]}
                />
              </label>
            </div>
            <div className="bg-background border-border mt-3 rounded-lg border px-3 py-2.5 text-[13px]">
              <span className="text-text-muted">{t('catering.config.supplier.trialResult')} </span>
              <span className="font-semibold">{trialSheet}</span>
              <span className="text-text-muted">
                {' '}
                · {trialDep || '—'} → {trialArr || '—'}
              </span>
            </div>
          </section>

          <section className="border-border bg-surface rounded-xl border p-4">
            <h3 className="mb-1 text-[14px] font-extrabold">
              {t('catering.config.supplier.sbbTitle')}
            </h3>
            <p className="text-text-muted mb-3 text-[12.5px]">
              {t('catering.config.supplier.sbbDesc')}
            </p>
            <div className="config-tab-scroll mb-3">
              <Segmented<SbbRouteSheet>
                value={sheet}
                onChange={setSheet}
                options={SBB_SHEETS.map((s) => ({ value: s, label: s }))}
              />
            </div>

            <div className="border-border bg-background mb-3 rounded-lg border p-3">
              <div className="mb-1 text-[12px] font-bold">
                {t('catering.config.supplier.sbbAirports')}
              </div>
              <p className="text-text-muted mb-2 text-[12px]">
                {sheet === 'CHAY(VIỆT-HÀN-NHẬT)'
                  ? t('catering.config.supplier.sbbChayNote')
                  : sheet === 'VIET-HAN-NHAT'
                    ? t('catering.config.supplier.sbbFallbackNote')
                    : (currentBinding?.note ?? t('catering.config.supplier.sbbAirportsHint'))}
              </p>
              {sheet === 'CHAY(VIỆT-HÀN-NHẬT)' || sheet === 'VIET-HAN-NHAT' ? null : (
                <Select
                  mode="tags"
                  className="w-full"
                  tokenSeparators={[',', ' ']}
                  value={currentBinding?.airports ?? []}
                  disabled={!editing}
                  onChange={(airports) => setSheetAirports(airports.map(String))}
                  placeholder="MEL, BNE, SYD, …"
                />
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="text-text-secondary [&>th]:border-border [&>th]:border-b [&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-extrabold [&>th]:uppercase">
                    <th scope="col">Pax</th>
                    {SBB_ITEMS.map((item) => (
                      <th key={item} scope="col">
                        {t(`catering.config.supplier.item.${item}`)}
                      </th>
                    ))}
                    {editing ? <th scope="col" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${sheet}-${row.businessPax}-${index}`} className="[&>td]:border-border [&>td]:border-b [&>td]:px-2 [&>td]:py-1.5">
                      <td>
                        <InputNumber
                          min={1}
                          value={row.businessPax}
                          disabled={!editing}
                          onChange={(v) =>
                            updateRow(index, { businessPax: typeof v === 'number' ? v : row.businessPax })
                          }
                        />
                      </td>
                      {SBB_ITEMS.map((item) => (
                        <td key={item}>
                          <InputNumber
                            min={0}
                            value={row.items[item] ?? null}
                            disabled={!editing}
                            onChange={(v) =>
                              updateItem(index, item, typeof v === 'number' ? v : null)
                            }
                          />
                        </td>
                      ))}
                      {editing ? (
                        <td>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<Trash2 size={14} />}
                            aria-label={t('catering.config.supplier.removeRow')}
                            onClick={() => removeRow(index)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {editing ? (
              <Button className="mt-3" type="dashed" icon={<Plus size={14} />} onClick={addRow}>
                {t('catering.config.supplier.addRow')}
              </Button>
            ) : null}
            {rows.length === 0 ? (
              <div className="text-text-muted mt-3 text-center text-[12.5px]">
                {t('catering.config.supplier.emptySheet')}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {editing ? (
        <div className="quota-sticky-bar">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div>
              <div className="text-text-muted mb-1 text-[11.5px] font-bold">
                {t('catering.config.effectiveFrom')}
              </div>
              <DatePicker
                format={DMY}
                value={parseDmy(effDate)}
                onChange={(d) => setEffDate(d ? d.format(DMY) : '')}
                style={{ width: 150 }}
              />
            </div>
            <div className="text-text-muted max-w-[34ch] text-[12.5px] font-medium">
              {t('catering.config.publishHint')}
            </div>
            <div className="ml-auto">
              <Space>
                <Button icon={<X size={14} />} onClick={cancelEdit}>
                  {t('common.cancel')}
                </Button>
                <Button type="primary" disabled={!effDate.trim()} loading={saveConfig.isPending} onClick={publish}>
                  {t('catering.config.publish')}
                </Button>
              </Space>
            </div>
          </div>
        </div>
      ) : null}

      <EcoQuantityRuleEditorDrawer
        open={editingQuantityRule != null}
        rule={editingQuantityRule}
        amenityConfig={amenityConfig}
        onClose={() => setEditingQuantityRule(null)}
        onSave={saveQuantityRule}
      />

      <VersionMeta viewing={viewing} />
    </div>
  )
}

function VersionMeta({ viewing }: { viewing: SupplierRuleConfigVersion }) {
  const { t } = useTranslation()
  return (
    <p className="text-text-muted text-[12px]">
      {t('catering.config.updatedMeta', { by: viewing.updatedBy, at: viewing.updatedAt })}
      {viewing.note ? ` · ${viewing.note}` : ''}
    </p>
  )
}
