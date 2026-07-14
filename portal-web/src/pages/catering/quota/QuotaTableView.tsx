import { Alert, Button, Input, InputNumber, Popover, Select, Space, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Info, Pencil, Search, SlidersHorizontal, UploadCloud, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FilterBar } from '@/components/patterns/FilterBar'
import { distinctTypes } from '@/modules/catering/quota'
import { paths } from '@/routes/paths'
import type { QuotaRow, QuotaVersion, SourceKind, VersionStatus } from '@/modules/catering/types'
import { formatDateDMY } from '@/shared/utils/format'

/** Status dot colour — always paired with the text label (never colour-only). */
const STATUS_DOT: Record<VersionStatus, string> = {
  active: '#16a34a',
  scheduled: '#2563eb',
  superseded: '#9ca3af',
  draft: '#c9a000',
}

interface Props {
  version: QuotaVersion
  versions: QuotaVersion[]
  isActive: boolean
  onSelectVersion: (id: string) => void
  onGotoImport: () => void
  onCreateVersion: (
    rows: QuotaRow[],
    effectiveFrom: string,
    source: string,
    sourceKind: SourceKind,
  ) => void
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

export function QuotaTableView({
  version,
  versions,
  isActive,
  onSelectVersion,
  onGotoImport,
  onCreateVersion,
}: Props) {
  const { t } = useTranslation()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [hideZero, setHideZero] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editRows, setEditRows] = useState<QuotaRow[]>(version.rows)
  const [effDate, setEffDate] = useState(formatDateDMY(Date.now()))

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

  const startEdit = () => {
    setEditRows(version.rows.map((r) => ({ ...r })))
    setEffDate(formatDateDMY(Date.now()))
    setEditing(true)
  }
  const patchRow = (flightNo: string, field: 'hotmeal' | 'banhMi' | 'traSua', value: number) => {
    setEditRows((prev) => prev.map((r) => (r.flightNo === flightNo ? { ...r, [field]: value } : r)))
  }
  const saveEdit = () => {
    onCreateVersion(editRows, effDate, t('catering.quota.manualSource'), 'manual')
    setEditing(false)
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

  const effRange = `${version.effectiveFrom} → ${version.effectiveTo ?? t('catering.quota.untilNextShort')}`

  return (
    <>
      {/* Version context bar — one compact row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-4 py-3">
        <Select
          value={version.id}
          onChange={onSelectVersion}
          style={{ minWidth: 150 }}
          optionLabelProp="label"
          options={versions.map((v) => ({
            value: v.id,
            label: (
              <span className="inline-flex items-center gap-2">
                <Dot status={v.status} /> {v.id} · {t(`catering.quota.status.${v.status}`)}
              </span>
            ),
          }))}
        />

        <span className="border-border bg-background inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold tnum">
          {effRange}
        </span>

        <Popover
          placement="bottomLeft"
          trigger="click"
          content={
            <div className="max-w-xs text-[12.5px] leading-relaxed">
              {t('catering.quota.importedMeta', {
                by: version.importedBy,
                at: version.importedAt,
                source: version.source,
              })}
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

        <Link
          to={paths.catering.config.list}
          className="text-text-muted hover:text-vj-red inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors"
        >
          <SlidersHorizontal size={14} />
          {t('catering.quota.rulesLink')}
        </Link>

        <div className="ml-auto">
          <Space>
            {isActive ? (
              <Button icon={<Pencil size={15} />} onClick={startEdit} disabled={editing}>
                {t('catering.quota.manualEdit')}
              </Button>
            ) : null}
            <Button type="primary" icon={<UploadCloud size={15} />} onClick={onGotoImport}>
              {t('catering.quota.importNew')}
            </Button>
          </Space>
        </div>
      </div>

      {editing ? (
        <Alert
          type="info"
          showIcon
          title={t('catering.quota.editBannerTitle')}
          description={
            <div className="flex flex-wrap items-center gap-3">
              <span>{t('catering.quota.editBannerDesc')}</span>
              <span className="flex items-center gap-2">
                <span className="text-text-muted text-[12.5px] font-semibold">{t('catering.quota.effectiveLabel')}</span>
                <Input value={effDate} onChange={(e) => setEffDate(e.target.value)} style={{ width: 130 }} />
                <Button type="primary" size="small" onClick={saveEdit}>{t('catering.quota.saveAsNew')}</Button>
                <Button size="small" icon={<X size={14} />} onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
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

      <div className="data-table-wrap data-table-wrap--ops">
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
      </div>
    </>
  )
}
