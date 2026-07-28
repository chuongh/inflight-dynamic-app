import { Alert, App as AntApp, Button, Input, InputNumber, Segmented, Space, Tag } from 'antd'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/useAuth'
import {
  activeSupplierRuleVersion,
  supplierRuleVersionsNewestFirst,
  withNewSupplierRuleVersion,
} from '@/modules/catering/supplierRuleConfig'
import type {
  SupplierRuleConfigVersion,
} from '@/modules/catering/supplierRuleConfigTypes'
import type {
  EcoRouteRuleDataset,
  SbbLookupDataset,
  SbbLookupItem,
  SbbLookupRow,
  SbbRouteSheet,
} from '@/modules/catering/supplier/types'
import { DEFAULT_ECO_AMENITY_CONFIG } from '@/modules/catering/supplier/amenityDefaults'
import { DEFAULT_ECO_QUANTITY_RULES } from '@/modules/catering/supplier/ecoQuantityEval'
import type { EcoRuleBase, EcoQuantityRule } from '@/modules/catering/supplier/ecoQuantityTypes'
import {
  DEFAULT_SBB_SHEET_BINDINGS,
  resolveSbbSheetBindings,
  selectSbbRouteSheet,
} from '@/modules/catering/supplier/sbbRules'
import {
  useSaveSupplierRuleConfigData,
  useSupplierRuleConfigData,
} from '@/modules/catering/hooks/useSupplierRuleConfig'
import { formatDateDMY } from '@/shared/utils/format'

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

type ConfigSection = 'eco' | 'amenity' | 'sbb'

function dmyToNum(dmy: string): number {
  const [d, m, y] = dmy.split('/')
  return Number(`${y}${m?.padStart(2, '0')}${d?.padStart(2, '0')}`)
}

function cloneEco(rules: EcoRouteRuleDataset): EcoRouteRuleDataset {
  return structuredClone(rules)
}

function cloneSbb(lookups: SbbLookupDataset): SbbLookupDataset {
  return structuredClone(lookups)
}

function summarizeRule(rule: EcoQuantityRule): string {
  if (rule.expr) {
    const src =
      rule.expr.source === 'hotmeal_total'
        ? 'Tổng hotmeal'
        : rule.expr.source === 'column'
          ? rule.expr.id
          : rule.expr.id
    const round = rule.expr.round === 'ceil' ? 'ceil' : ''
    const body = `${src} × ${rule.expr.coef}`
    return round ? `${round}(${body})` : body
  }
  const branchCount = rule.branches?.length ?? 0
  return `${branchCount} nhánh` + (rule.fallback ? ' + fallback' : '')
}

export function SupplierRulesTab() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useSupplierRuleConfigData()
  const saveConfig = useSaveSupplierRuleConfigData()

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [effDate, setEffDate] = useState('')
  const [workingEco, setWorkingEco] = useState<EcoRouteRuleDataset | null>(null)
  const [workingSbb, setWorkingSbb] = useState<SbbLookupDataset | null>(null)
  const [sheet, setSheet] = useState<SbbRouteSheet>('ÚC&KAZ')
  const [section, setSection] = useState<ConfigSection>('eco')
  const [ecoBase, setEcoBase] = useState<EcoRuleBase>('by_std_arr')
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

  const amenityConfig = viewing?.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG
  const quantityRules = viewing?.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES
  const baseRules = quantityRules.filter((r) => r.base === ecoBase)

  if (isLoading || !data || !viewing) {
    return (
      <div className="border-border text-text-muted rounded-xl border border-dashed px-4 py-8 text-center text-[13px]">
        {t('catering.config.supplier.loading')}
      </div>
    )
  }

  const isActiveView = viewing.id === active?.id
  const eco = editing && workingEco ? workingEco : viewing.ecoRouteRules
  const sbb = editing && workingSbb ? workingSbb : viewing.sbbLookups
  const rows = sbb.sheets[sheet] ?? []
  const sheetBindings = resolveSbbSheetBindings(sbb.sheetBindings)
  const currentBinding = sheetBindings[sheet]
  const trialSheet = selectSbbRouteSheet(trialDep, trialArr, trialMeal, sheetBindings)

  const startEdit = () => {
    const cloned = cloneSbb(viewing.sbbLookups)
    if (!cloned.sheetBindings) {
      cloned.sheetBindings = structuredClone(DEFAULT_SBB_SHEET_BINDINGS)
    }
    setWorkingEco(cloneEco(viewing.ecoRouteRules))
    setWorkingSbb(cloned)
    setEffDate(formatDateDMY(Date.now()))
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setWorkingEco(null)
    setWorkingSbb(null)
  }

  const setAirports = (raw: string) => {
    if (!workingEco) return
    const airports = raw
      .split(/[,\s]+/)
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean)
    setWorkingEco({ ...workingEco, airports })
  }

  const setNoodleValue = (value: number | null) => {
    if (!workingEco || value == null) return
    setWorkingEco({
      ...workingEco,
      fields: {
        ...workingEco.fields,
        australiaNoodleVegetables: {
          ...workingEco.fields.australiaNoodleVegetables,
          value,
        },
      },
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

  const setSheetAirports = (raw: string) => {
    if (!workingSbb) return
    const airports = raw
      .split(/[,\s]+/)
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean)
    const prev = resolveSbbSheetBindings(workingSbb.sheetBindings)
    setWorkingSbb({
      ...workingSbb,
      sheetBindings: {
        ...prev,
        [sheet]: {
          ...prev[sheet],
          airports,
          note: prev[sheet]?.note,
          priority: prev[sheet]?.priority,
        },
      },
    })
  }

  const publish = () => {
    if (!workingEco || !workingSbb) return
    const today = formatDateDMY(Date.now())
    const startsInFuture = dmyToNum(effDate) > dmyToNum(today)
    const next = withNewSupplierRuleVersion(
      data.versions,
      {
        ecoRouteRules: workingEco,
        sbbLookups: workingSbb,
        ecoAmenity: viewing.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG,
        ecoQuantityRules: viewing.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES,
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
      <div className="border-border bg-surface flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border px-4 py-3">
        <select
          className="border-border rounded-lg border bg-white px-3 py-1.5 text-[13px] font-semibold"
          value={viewing.id}
          onChange={(e) => {
            setViewingId(e.target.value)
            if (editing) cancelEdit()
          }}
          aria-label={t('catering.config.supplier.versionSelect')}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} · {t(`catering.quota.status.${v.status}`)}
            </option>
          ))}
        </select>
        <span className="border-border bg-background inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold tnum">
          {viewing.effectiveFrom} → {viewing.effectiveTo ?? t('catering.quota.untilNextShort')}
        </span>
        <div className="ml-auto">
          {isActiveView && !editing ? (
            <Button type="primary" icon={<Pencil size={15} />} onClick={startEdit}>
              {t('catering.config.supplier.edit')}
            </Button>
          ) : null}
        </div>
      </div>

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
            <div className="config-tab-scroll mb-3">
              <Segmented<EcoRuleBase>
                value={ecoBase}
                onChange={setEcoBase}
                options={[
                  { value: 'by_item', label: t('catering.config.supplier.baseByItem') },
                  { value: 'by_hotmeal_total', label: t('catering.config.supplier.baseByHotmeal') },
                  { value: 'by_std_arr', label: t('catering.config.supplier.baseByStdArr') },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              {baseRules.map((rule) => (
                <div
                  key={rule.id}
                  className="border-border flex items-start gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="bg-background border-border min-w-10 rounded-md border px-2 py-1 text-center font-mono text-[12px] font-bold">
                    {rule.docRef?.split(' ').pop() ?? rule.targetColumn.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">
                      {rule.label ?? rule.targetColumn}
                    </div>
                    <div className="text-text-secondary text-[12.5px]">
                      {summarizeRule(rule)}
                      {rule.docRef ? ` · ${rule.docRef}` : ''}
                    </div>
                  </div>
                  <Tag color={rule.enabled ? 'green' : 'default'}>
                    {rule.enabled ? 'ON' : 'OFF'}
                  </Tag>
                </div>
              ))}
              {baseRules.length === 0 ? (
                <div className="text-text-muted text-center text-[12.5px]">—</div>
              ) : null}
            </div>
          </section>

          <section className="border-border bg-surface rounded-xl border p-4">
            <h3 className="mb-1 text-[14px] font-extrabold">
              {t('catering.config.supplier.ecoTitle')}
            </h3>
            <p className="text-text-muted mb-3 text-[12.5px]">
              {t('catering.config.supplier.ecoDesc')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[12px] font-bold">
                {t('catering.config.supplier.airports')}
                <Input
                  value={eco.airports.join(', ')}
                  disabled={!editing}
                  onChange={(e) => setAirports(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-bold">
                {t('catering.config.supplier.noodleVeg')}
                <InputNumber
                  className="w-full"
                  min={0}
                  value={eco.fields.australiaNoodleVegetables.value ?? 0}
                  disabled={!editing}
                  onChange={(v) => setNoodleValue(typeof v === 'number' ? v : null)}
                />
              </label>
            </div>
            <ul className="text-text-secondary mt-3 space-y-1 text-[12.5px]">
              <li>{t('catering.config.supplier.skybossEggs')}</li>
              <li>{t('catering.config.supplier.skybossYogurt')}</li>
              <li>{t('catering.config.supplier.roundBread')}</li>
            </ul>
          </section>
        </>
      ) : null}

      {section === 'amenity' ? (
        <>
          <section className="border-border bg-surface rounded-xl border p-4">
            <h3 className="mb-1 text-[14px] font-extrabold">
              {t('catering.config.supplier.amenityTitle')}
            </h3>
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
                    <tr key={pkg.id} className="[&>td]:border-border [&>td]:border-b [&>td]:px-2 [&>td]:py-1.5">
                      <td className="font-mono font-bold">{pkg.id}</td>
                      <td>{pkg.aircraftFamily === 'A330' ? 'A330' : 'A320/A321'}</td>
                      <td>{pkg.kind}</td>
                      <td>{pkg.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border-border bg-surface rounded-xl border p-4">
            <h3 className="mb-1 text-[14px] font-extrabold">
              {t('catering.config.supplier.listTitle')}
            </h3>
            <div className="flex flex-col gap-3">
              {amenityConfig.routeHourClasses.map((cls) => (
                <div key={cls.id}>
                  <div className="mb-1 text-[12.5px] font-bold">{cls.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.routes.map((route) => (
                      <Tag key={route}>{route.replace(/-SGN$/, '').replace(/^SGN-/, '')}</Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-border bg-surface rounded-xl border p-4">
            <h3 className="mb-1 text-[14px] font-extrabold">
              {t('catering.config.supplier.routeGroupsTitle')}
            </h3>
            <div className="flex flex-col gap-2">
              {amenityConfig.routeGroups.map((group) => (
                <div key={group.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-16 text-[13px] font-semibold">{group.label}</span>
                  {group.airports.map((a) => (
                    <Tag key={a}>{a}</Tag>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </>
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
                <Input
                  value={(currentBinding?.airports ?? []).join(', ')}
                  disabled={!editing}
                  onChange={(e) => setSheetAirports(e.target.value)}
                  placeholder="MEL, BNE, SYD, …"
                />
              )}
              {sheet !== 'CHAY(VIỆT-HÀN-NHẬT)' && sheet !== 'VIET-HAN-NHAT' ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(currentBinding?.airports ?? []).map((a) => (
                    <Tag key={a}>{a}</Tag>
                  ))}
                </div>
              ) : null}
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
              <Input value={effDate} onChange={(e) => setEffDate(e.target.value)} style={{ width: 150 }} />
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
