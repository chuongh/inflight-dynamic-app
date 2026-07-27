import { Alert, App as AntApp, Button, Input, InputNumber, Segmented, Space } from 'antd'
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

  const versions = useMemo(
    () => supplierRuleVersionsNewestFirst(data?.versions ?? []),
    [data],
  )
  const active = useMemo(() => activeSupplierRuleVersion(versions), [versions])
  const viewing = useMemo(
    () => versions.find((v) => v.id === viewingId) ?? active,
    [versions, viewingId, active],
  )

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

  const startEdit = () => {
    setWorkingEco(cloneEco(viewing.ecoRouteRules))
    setWorkingSbb(cloneSbb(viewing.sbbLookups))
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

  const publish = () => {
    if (!workingEco || !workingSbb) return
    const today = formatDateDMY(Date.now())
    const startsInFuture = dmyToNum(effDate) > dmyToNum(today)
    const next = withNewSupplierRuleVersion(
      data.versions,
      { ecoRouteRules: workingEco, sbbLookups: workingSbb },
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
    <div className="flex flex-col gap-4">
      <div className="border-border bg-surface flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border px-4 py-3">
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

      <section className="border-border bg-surface rounded-xl border p-4">
        <h3 className="mb-1 text-[14px] font-extrabold">
          {t('catering.config.supplier.sbbTitle')}
        </h3>
        <p className="text-text-muted mb-3 text-[12.5px]">
          {t('catering.config.supplier.sbbDesc')}
        </p>
        <Segmented<SbbRouteSheet>
          value={sheet}
          onChange={setSheet}
          options={SBB_SHEETS.map((s) => ({ value: s, label: s }))}
          className="mb-3"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
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
