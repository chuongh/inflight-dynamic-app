import {
  Alert,
  App as AntApp,
  Button,
  Collapse,
  Input,
  Segmented,
  Spin,
  Tabs,
  Tag,
} from 'antd'
import { Pencil, Plus, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/useAuth'
import {
  activeSupplierRuleVersion,
  supplierRuleVersionsNewestFirst,
  withNewSupplierRuleVersion,
} from '@/modules/catering/supplierRuleConfig'
import type {
  SbbLookupDataset,
  SbbRouteSheet,
} from '@/modules/catering/supplier/types'
import { DEFAULT_ECO_AMENITY_CONFIG } from '@/modules/catering/supplier/amenityDefaults'
import {
  DEFAULT_ECO_QUANTITY_RULES,
  migrateEcoQuantityRules,
} from '@/modules/catering/supplier/ecoQuantityEval'
import type {
  EcoAmenityConfig,
  EcoQuantityRule,
  SupplierRouteGroup,
} from '@/modules/catering/supplier/ecoQuantityTypes'
import { DEFAULT_SBB_SHEET_DEFS, DEFAULT_SBB_SHEET_BINDINGS } from '@/modules/catering/supplier/sbbRules'
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
import { formatDateDMY } from '@/shared/utils/format'
import { AmenityCompositionSection } from './AmenityCompositionSection'
import { ConfigEmptyState } from './ConfigEmptyState'
import { ConfigPublishBar } from './ConfigPublishBar'
import { ConfigVersionBar } from './ConfigVersionBar'
import { EcoQuantityRuleCard } from './EcoQuantityRuleCard'
import { EcoQuantityRuleEditorDrawer } from './EcoQuantityRuleEditorDrawer'
import { RouteGroupsSection } from './RouteGroupsSection'
import { SbbLookupSection } from './SbbLookupSection'
import {
  displayNameFor,
  newEcoQuantityRule,
  productCodeFor,
  ruleCategoryOf,
  targetColumnsForCategory,
  validateEcoQuantityRules,
} from './ecoQuantityRuleMeta'

type ConfigSection = 'eco' | 'routeGroups' | 'amenity' | 'routeHourList' | 'sbb'

function dmyToNum(dmy: string): number {
  const [d, m, y] = dmy.split('/')
  return Number(`${y}${m?.padStart(2, '0')}${d?.padStart(2, '0')}`)
}

function cloneSbb(lookups: SbbLookupDataset): SbbLookupDataset {
  return structuredClone(lookups)
}

type Props = {
  /** Push Edit CTA into the parent PageHeader (version chrome stays in-tab). */
  onEditAction?: (actions: ReactNode | null) => void
}

export function SupplierRulesTab({ onEditAction }: Props) {
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
  const quantityRules = migrateEcoQuantityRules(
    editing && workingQuantityRules
      ? workingQuantityRules
      : (viewing?.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES),
  )

  const categoryTabs = useMemo(
    () =>
      RULE_CATEGORY_TAB_ORDER.filter(
        (category) => targetColumnsForCategory(category, mealCatalog).length > 0,
      ),
    [mealCatalog],
  )

  const activeEcoCategory: RuleCatalogCategory =
    ecoCategory && categoryTabs.includes(ecoCategory)
      ? ecoCategory
      : (categoryTabs[0] ?? 'other')

  const categoryRules = quantityRules.filter(
    (r) => ruleCategoryOf(r, mealCatalog) === activeEcoCategory,
  )
  const categoryTargetColumns = useMemo(
    () => targetColumnsForCategory(activeEcoCategory, mealCatalog),
    [activeEcoCategory, mealCatalog],
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
    if (!cloned.sheetDefs?.length) {
      cloned.sheetDefs = structuredClone(DEFAULT_SBB_SHEET_DEFS)
    }
    if (!cloned.sheetBindings) {
      cloned.sheetBindings = structuredClone(DEFAULT_SBB_SHEET_BINDINGS)
    }
    setWorkingSbb(cloned)
    setWorkingQuantityRules(
      migrateEcoQuantityRules(
        structuredClone(viewing.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES),
      ),
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
    if (!onEditAction) return
    if (!viewing || !isActiveView || editing) {
      onEditAction(null)
      return
    }
    onEditAction(
      <Button type="primary" icon={<Pencil size={15} />} onClick={startEdit}>
        {t('catering.config.supplier.edit')}
      </Button>,
    )
  }, [onEditAction, viewing, isActiveView, editing, t])

  useEffect(() => {
    return () => onEditAction?.(null)
  }, [onEditAction])

  if (isLoading || !data || !viewing) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  const sbb = editing && workingSbb ? workingSbb : viewing.sbbLookups

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
    const targetColumn = categoryTargetColumns.find(
      (target) => !workingQuantityRules.some((rule) => rule.targetColumn === target),
    )
    if (!targetColumn) {
      message.warning('Mỗi sản phẩm chỉ có thể có một quy tắc. Hãy thêm nhánh vào quy tắc hiện có.')
      return
    }
    const created = newEcoQuantityRule(targetColumn)
    setWorkingQuantityRules([...workingQuantityRules, created])
    setEditingQuantityRule(created)
  }

  const saveQuantityRule = (rule: EcoQuantityRule) => {
    if (!workingQuantityRules) return
    if (workingQuantityRules.some((item) => item.id !== rule.id && item.targetColumn === rule.targetColumn)) {
      message.error('Mỗi sản phẩm chỉ có thể có một quy tắc. Hãy thêm nhánh vào quy tắc hiện có.')
      return
    }
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

  const publish = () => {
    if (!workingSbb) return
    const nextQuantityRules = migrateEcoQuantityRules(
      workingQuantityRules ?? viewing.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES,
    )
    const ruleErrors = validateEcoQuantityRules(nextQuantityRules)
    if (ruleErrors.length > 0) {
      message.error({ content: ruleErrors.join('\n'), duration: 8 })
      return
    }
    const today = formatDateDMY(Date.now())
    const startsInFuture = dmyToNum(effDate) > dmyToNum(today)
    const next = withNewSupplierRuleVersion(
      data.versions,
      {
        ecoRouteRules: viewing.ecoRouteRules,
        sbbLookups: workingSbb,
        ecoAmenity:
          workingAmenityConfig ?? viewing.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG,
        ecoQuantityRules: nextQuantityRules,
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
      <ConfigVersionBar
        versions={versions}
        value={viewing.id}
        selectAriaLabel={t('catering.config.supplier.versionSelect')}
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
      />

      {!isActiveView && !editing ? (
        <Alert type="info" showIcon title={t('catering.config.readonlyHint')} />
      ) : null}
      {editing ? (
        <Alert type="info" showIcon title={t('catering.config.supplier.editBanner')} />
      ) : null}

      <div className="config-subnav">
        <Tabs
          activeKey={section}
          onChange={(key) => setSection(key as ConfigSection)}
          items={[
            { key: 'eco', label: t('catering.config.supplier.sectionEco') },
            { key: 'routeGroups', label: t('catering.config.supplier.sectionRouteGroups') },
            { key: 'amenity', label: t('catering.config.supplier.sectionAmenity') },
            { key: 'routeHourList', label: t('catering.config.supplier.sectionRouteHourList') },
            { key: 'sbb', label: t('catering.config.supplier.sectionSbb') },
          ]}
        />
      </div>

      {section === 'routeGroups' ? (
        <RouteGroupsSection
          routeGroups={amenityConfig.routeGroups}
          editing={editing}
          onUpdate={updateRouteGroup}
          onRemove={removeRouteGroup}
          onAdd={addRouteGroup}
        />
      ) : null}

      {section === 'eco' ? (
        <>
          <section className="config-section-surface">
            <h3 className="config-section-title">{t('catering.config.supplier.rulesTitle')}</h3>
            <p className="config-section-desc">{t('catering.config.supplier.rulesDesc')}</p>
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
                <ConfigEmptyState
                  message={
                    ruleQuery.trim()
                      ? t('catering.config.supplier.noRuleMatches')
                      : t('catering.config.supplier.noRulesInCategory')
                  }
                  actionLabel={editing ? t('catering.config.supplier.addQuantityRule') : undefined}
                  onAction={editing ? addQuantityRule : undefined}
                />
              ) : null}
              {editing && filteredCategoryRules.length > 0 ? (
                <Button type="dashed" block icon={<Plus size={15} />} onClick={addQuantityRule}>
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
                            <th>{t('catering.config.supplier.pkgColId')}</th>
                            <th>{t('catering.config.supplier.pkgColAircraft')}</th>
                            <th>{t('catering.config.supplier.pkgColName')}</th>
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
                key: 'composition',
                label: t('catering.config.supplier.compositionTitle'),
                children: (
                  <AmenityCompositionSection
                    amenityConfig={amenityConfig}
                    editing={editing}
                  />
                ),
              },
            ]}
          />
        </div>
      ) : null}

      {section === 'routeHourList' ? (
        <section className="config-section-surface">
          <h3 className="config-section-title">{t('catering.config.supplier.listTitle')}</h3>
          <p className="config-section-desc">{t('catering.config.supplier.listDesc')}</p>
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
        <SbbLookupSection
          sbb={sbb}
          sheet={sheet}
          onSheetChange={setSheet}
          editing={editing}
          routeGroups={amenityConfig.routeGroups}
          mealCatalog={mealCatalog}
          amenityCatalog={amenityCatalog}
          onChange={(next) => {
            if (editing) setWorkingSbb(next)
          }}
        />
      ) : null}

      {editing ? (
        <ConfigPublishBar
          effDate={effDate}
          onEffDateChange={setEffDate}
          onCancel={cancelEdit}
          onPublish={publish}
          publishing={saveConfig.isPending}
        />
      ) : null}

      <EcoQuantityRuleEditorDrawer
        open={editingQuantityRule != null}
        rule={editingQuantityRule}
        amenityConfig={amenityConfig}
        mealCatalog={mealCatalog}
        amenityCatalog={amenityCatalog}
        availableTargetColumns={categoryTargetColumns}
        onClose={() => setEditingQuantityRule(null)}
        onSave={saveQuantityRule}
      />
    </div>
  )
}
