import { Alert, Button, Input, InputNumber, Select, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, X } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTableShell } from '@/components/patterns/DataTableShell'
import { FilterBar } from '@/components/patterns/FilterBar'
import { distinctTypes } from '@/modules/catering/quota'
import type { QuotaRow, QuotaVersion, SourceKind } from '@/modules/catering/types'
import { formatDateDMY } from '@/shared/utils/format'

export type QuotaTableViewHandle = {
  startEdit: () => void
}

interface Props {
  version: QuotaVersion
  isActive: boolean
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onCreateVersion: (
    rows: QuotaRow[],
    effectiveFrom: string,
    source: string,
    sourceKind: SourceKind,
  ) => void
}

export const QuotaTableView = forwardRef<QuotaTableViewHandle, Props>(function QuotaTableView(
  { version, isActive, editing, onEditingChange, onCreateVersion },
  ref,
) {
  const { t } = useTranslation()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [hideZero, setHideZero] = useState(false)

  const [editRows, setEditRows] = useState<QuotaRow[]>(version.rows)
  const [effDate, setEffDate] = useState(formatDateDMY(Date.now()))

  const startEdit = () => {
    if (!isActive) return
    setEditRows(version.rows.map((r) => ({ ...r })))
    setEffDate(formatDateDMY(Date.now()))
    onEditingChange(true)
  }

  useImperativeHandle(
    ref,
    () => ({ startEdit }),
    // startEdit reads latest version + isActive via closure
    [isActive, version.id, version.rows, onEditingChange],
  )

  useEffect(() => {
    if (!editing) return
    setEditRows(version.rows.map((r) => ({ ...r })))
    setEffDate(formatDateDMY(Date.now()))
  }, [version.id]) // eslint-disable-line react-hooks/exhaustive-deps -- reset draft when version changes mid-edit

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: t('catering.quota.allTypes', { n: distinctTypes(version.rows) }) },
      ...Array.from(new Set(version.rows.map((r) => r.type))).map((ty) => ({ value: ty, label: ty })),
    ],
    [version.rows, t],
  )

  const rows = editing ? editRows : version.rows
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const matchedSearch =
        q === '' || r.flightNo.toLowerCase().includes(q) || r.route.toLowerCase().includes(q)
      const matchedType = typeFilter === 'all' || r.type === typeFilter
      const matchedZero = !hideZero || r.hotmeal !== 0 || r.banhMi !== 0 || r.traSua !== 0
      return matchedSearch && matchedType && matchedZero
    })
  }, [rows, search, typeFilter, hideZero])

  const patchRow = (flightNo: string, field: 'hotmeal' | 'banhMi' | 'traSua', value: number) => {
    setEditRows((prev) => prev.map((r) => (r.flightNo === flightNo ? { ...r, [field]: value } : r)))
  }
  const saveEdit = () => {
    onCreateVersion(editRows, effDate, t('catering.quota.manualSource'), 'manual')
    onEditingChange(false)
  }

  const editNumber = (r: QuotaRow, field: 'hotmeal' | 'banhMi' | 'traSua') =>
    editing ? (
      <InputNumber
        size="small"
        min={0}
        value={r[field]}
        onChange={(v) => patchRow(r.flightNo, field, Number(v ?? 0))}
        style={{ width: 62 }}
      />
    ) : (
      <span className={r[field] === 0 ? 'text-text-muted' : 'font-semibold'}>{r[field]}</span>
    )

  const columns: ColumnsType<QuotaRow> = [
    { title: t('catering.quota.col.flightNo'), dataIndex: 'flightNo', width: 96, fixed: 'left', render: (v: string) => <span className="font-bold tnum">{v}</span> },
    { title: t('catering.quota.col.route'), dataIndex: 'route', width: 120, render: (v: string) => <span className="text-text-muted font-medium">{v}</span> },
    { title: t('catering.quota.col.type'), dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
    { title: t('catering.quota.col.block'), dataIndex: 'block', width: 84, render: (v?: string) => <span className="tnum text-text-muted">{v ?? '—'}</span> },
    { title: t('catering.quota.col.std'), dataIndex: 'std', width: 84, render: (v: string) => <span className="tnum">{v}</span> },
    { title: t('catering.quota.col.sta'), dataIndex: 'sta', width: 84, render: (v: string) => <span className="tnum">{v}</span> },
    { title: t('catering.quota.col.hotmeal'), key: 'hotmeal', align: 'right', width: 108, render: (_v, r) => editNumber(r, 'hotmeal') },
    { title: t('catering.quota.col.banhMi'), key: 'banhMi', align: 'right', width: 100, render: (_v, r) => editNumber(r, 'banhMi') },
    { title: t('catering.quota.col.traSua'), key: 'traSua', align: 'right', width: 100, render: (_v, r) => editNumber(r, 'traSua') },
  ]

  return (
    <>
      {editing ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          title={t('catering.quota.editBannerTitle')}
          description={
            <div className="flex flex-wrap items-center gap-3">
              <span>{t('catering.quota.editBannerDesc')}</span>
              <span className="flex items-center gap-2">
                <span className="text-text-muted text-[12.5px] font-semibold">{t('catering.quota.effectiveLabel')}</span>
                <Input value={effDate} onChange={(e) => setEffDate(e.target.value)} style={{ width: 130 }} />
                <Button type="primary" size="small" onClick={saveEdit}>{t('catering.quota.saveAsNew')}</Button>
                <Button size="small" icon={<X size={14} />} onClick={() => onEditingChange(false)}>{t('common.cancel')}</Button>
              </span>
            </div>
          }
        />
      ) : null}

      <FilterBar className="grid grid-cols-1 gap-2 lg:grid-cols-[1.7fr_1fr_auto]">
        <Input
          value={search}
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('catering.quota.searchPlaceholder')}
          prefix={<Search className="text-text-muted h-4 w-4" />}
        />
        <Select value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
        <label className="flex items-center gap-2 text-[13px] font-semibold whitespace-nowrap">
          <Switch checked={hideZero} onChange={setHideZero} size="small" />
          {t('catering.quota.hideZero')}
        </label>
      </FilterBar>

      <DataTableShell>
        <Table
          rowKey="flightNo"
          size="middle"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50'],
            showTotal: (total) => t('catering.quota.total', { count: total }),
          }}
        />
      </DataTableShell>
    </>
  )
})
