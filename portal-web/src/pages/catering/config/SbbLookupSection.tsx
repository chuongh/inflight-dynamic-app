import { Button, Input, InputNumber, Segmented, Select, Tag } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AmenityCatalogItem, MealCatalogItem } from '@/modules/catering/catalogTypes'
import type { SupplierRouteGroup } from '@/modules/catering/supplier/ecoQuantityTypes'
import {
  SBB_LOOKUP_ITEMS,
  sbbLookupDisplay,
} from '@/modules/catering/supplier/sbbLookupRegistry'
import {
  DEFAULT_SBB_SHEET_DEFS,
  resolveSbbSheetDefs,
  resolveSheetAirports,
} from '@/modules/catering/supplier/sbbRules'
import type {
  SbbLookupDataset,
  SbbLookupItem,
  SbbLookupRow,
  SbbLookupSheetDef,
  SbbRouteSheet,
} from '@/modules/catering/supplier/types'

interface SbbLookupSectionProps {
  sbb: SbbLookupDataset
  sheet: SbbRouteSheet
  onSheetChange: (sheet: SbbRouteSheet) => void
  editing: boolean
  routeGroups: SupplierRouteGroup[]
  mealCatalog: MealCatalogItem[]
  amenityCatalog: AmenityCatalogItem[]
  onChange: (next: SbbLookupDataset) => void
}

function groupLabels(ids: string[], routeGroups: SupplierRouteGroup[]): string {
  return ids
    .map((id) => routeGroups.find((g) => g.id === id)?.label ?? id)
    .join(' · ')
}

export function SbbLookupSection({
  sbb,
  sheet,
  onSheetChange,
  editing,
  routeGroups,
  mealCatalog,
  amenityCatalog,
  onChange,
}: SbbLookupSectionProps) {
  const { t } = useTranslation()
  const sheetDefs = useMemo(() => resolveSbbSheetDefs(sbb), [sbb])
  const activeDef = sheetDefs.find((d) => d.id === sheet) ?? sheetDefs[0]
  const activeId = activeDef?.id ?? sheet
  const rows = sbb.sheets[activeId] ?? []
  const derivedAirports = resolveSheetAirports(activeDef, routeGroups)

  useEffect(() => {
    if (!sheetDefs.some((d) => d.id === sheet) && sheetDefs[0]) {
      onSheetChange(sheetDefs[0].id)
    }
  }, [sheet, sheetDefs, onSheetChange])

  const ensureDefs = (defs: SbbLookupSheetDef[]): SbbLookupDataset => ({
    ...sbb,
    sheetDefs: defs,
    // Keep legacy bindings in sync for older readers.
    sheetBindings: Object.fromEntries(
      defs.map((d) => [
        d.id,
        {
          routeGroupIds: d.routeGroupIds,
          routePairs: d.routePairs,
          priority: d.priority,
        },
      ]),
    ),
  })

  const patchActiveRows = (nextRows: SbbLookupRow[]) => {
    onChange({
      ...ensureDefs(sheetDefs),
      sheets: { ...sbb.sheets, [activeId]: nextRows },
    })
  }

  const updateDef = (patch: Partial<SbbLookupSheetDef>) => {
    if (!activeDef) return
    const nextDefs = sheetDefs.map((d) => (d.id === activeId ? { ...d, ...patch } : d))
    onChange({
      ...ensureDefs(nextDefs),
      sheets: sbb.sheets,
    })
  }

  const addSheet = () => {
    const unused = routeGroups.find(
      (g) => !sheetDefs.some((d) => d.routeGroupIds.includes(g.id)),
    )
    const id = `sheet-${Date.now().toString(36)}`
    const created: SbbLookupSheetDef = {
      id,
      label: unused?.label ?? t('catering.config.supplier.sbbNewSheet'),
      routeGroupIds: unused ? [unused.id] : [],
      priority: 40,
    }
    onChange({
      ...ensureDefs([...sheetDefs, created]),
      sheets: { ...sbb.sheets, [id]: [] },
    })
    onSheetChange(id)
  }

  const removeSheet = () => {
    if (!activeDef || activeDef.vegetarian || activeDef.fallback) return
    if (sheetDefs.length <= 1) return
    const nextDefs = sheetDefs.filter((d) => d.id !== activeId)
    const { [activeId]: _removed, ...restSheets } = sbb.sheets
    onChange({
      ...ensureDefs(nextDefs),
      sheets: restSheets,
    })
    onSheetChange(nextDefs[0]?.id ?? DEFAULT_SBB_SHEET_DEFS[0].id)
  }

  const updateRow = (index: number, patch: Partial<SbbLookupRow>) => {
    const nextRows = [...rows]
    nextRows[index] = { ...nextRows[index], ...patch }
    patchActiveRows(nextRows)
  }

  const updateItem = (index: number, item: SbbLookupItem, value: number | null) => {
    const nextRows = [...rows]
    const row = nextRows[index]
    nextRows[index] = { ...row, items: { ...row.items, [item]: value } }
    patchActiveRows(nextRows)
  }

  const addRow = () => {
    const maxPax = rows.reduce((m, r) => Math.max(m, r.businessPax), 0)
    patchActiveRows([...rows, { businessPax: maxPax + 1, items: {} }])
  }

  const removeRow = (index: number) => {
    patchActiveRows(rows.filter((_, i) => i !== index))
  }

  return (
    <section className="config-section-surface">
      <h3 className="config-section-title">{t('catering.config.supplier.sbbTitle')}</h3>
      <p className="config-section-desc">{t('catering.config.supplier.sbbDesc')}</p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="config-tab-scroll min-w-0 flex-1">
          <Segmented<SbbRouteSheet>
            value={activeId}
            onChange={onSheetChange}
            options={sheetDefs.map((d) => ({
              value: d.id,
              label: d.label,
            }))}
          />
        </div>
        {editing ? (
          <>
            <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addSheet}>
              {t('catering.config.supplier.sbbAddSheet')}
            </Button>
            {activeDef && !activeDef.vegetarian && !activeDef.fallback ? (
              <Button
                type="text"
                danger
                size="small"
                icon={<Trash2 size={14} />}
                aria-label={t('catering.config.supplier.sbbRemoveSheet')}
                onClick={removeSheet}
              />
            ) : null}
          </>
        ) : null}
      </div>

      {activeDef ? (
        <div className="border-border bg-background mb-3 rounded-lg border p-3">
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-[12px] font-bold">
                {t('catering.config.supplier.sbbSheetLabel')}
                <Input
                  value={activeDef.label}
                  onChange={(e) => updateDef({ label: e.target.value })}
                />
              </label>
              {activeDef.vegetarian ? (
                <p className="text-text-muted self-end text-[12px]">
                  {t('catering.config.supplier.sbbChayNote')}
                </p>
              ) : (
                <label className="flex flex-col gap-1 text-[12px] font-bold">
                  {t('catering.config.supplier.sbbRouteGroups')}
                  <Select
                    mode="multiple"
                    className="w-full"
                    value={activeDef.routeGroupIds}
                    onChange={(ids) => updateDef({ routeGroupIds: ids.map(String) })}
                    options={routeGroups.map((g) => ({
                      value: g.id,
                      label: `${g.label} (${g.id})`,
                    }))}
                    placeholder={t('catering.config.supplier.sbbRouteGroupsPlaceholder')}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              {activeDef.vegetarian ? (
                <span className="text-text-muted">{t('catering.config.supplier.sbbChayNote')}</span>
              ) : (
                <>
                  <span className="font-semibold">
                    {groupLabels(activeDef.routeGroupIds, routeGroups) ||
                      (activeDef.routePairs?.length
                        ? activeDef.routePairs.join(' · ')
                        : '—')}
                  </span>
                  {activeDef.fallback ? (
                    <span className="text-text-muted">
                      · {t('catering.config.supplier.sbbVhnNote')}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          )}
          {!activeDef.vegetarian ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-text-muted text-[11px] font-semibold">
                {t('catering.config.supplier.sbbDerivedAirports')}
              </span>
              {derivedAirports.length > 0 ? (
                derivedAirports.map((a) => <Tag key={a}>{a}</Tag>)
              ) : (
                <span className="text-text-muted text-[12px]">—</span>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="text-text-secondary [&>th]:border-border [&>th]:border-b [&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-extrabold [&>th]:uppercase">
              <th scope="col">Pax</th>
              {SBB_LOOKUP_ITEMS.map((item) => {
                const { name, productCode } = sbbLookupDisplay(
                  item,
                  activeId,
                  mealCatalog,
                  amenityCatalog,
                )
                return (
                  <th key={item} scope="col">
                    <div className="leading-tight normal-case">
                      <div className="text-[12px] font-bold text-slate-800">{name}</div>
                      {productCode ? (
                        <div className="table-cell-code tnum mt-0.5 font-semibold">{productCode}</div>
                      ) : null}
                    </div>
                  </th>
                )
              })}
              {editing ? <th scope="col" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${activeId}-${row.businessPax}-${index}`}
                className="[&>td]:border-border [&>td]:border-b [&>td]:px-2 [&>td]:py-1.5"
              >
                <td>
                  <InputNumber
                    min={1}
                    value={row.businessPax}
                    disabled={!editing}
                    onChange={(v) =>
                      updateRow(index, {
                        businessPax: typeof v === 'number' ? v : row.businessPax,
                      })
                    }
                  />
                </td>
                {SBB_LOOKUP_ITEMS.map((item) => (
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
  )
}
