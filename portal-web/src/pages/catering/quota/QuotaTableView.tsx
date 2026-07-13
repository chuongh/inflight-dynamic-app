import { Alert, Button, Input, InputNumber, Select, Space, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Croissant, CupSoda, Pencil, Search, UploadCloud, UtensilsCrossed, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterBar } from '@/components/patterns/FilterBar'
import { KpiCard } from '@/components/patterns/KpiCard'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { VERSION_STATUS_COLOR } from '@/modules/catering/constants'
import { distinctRoutes, distinctTypes, totals } from '@/modules/catering/quota'
import type { QuotaRow, QuotaVersion, SourceKind } from '@/modules/catering/types'
import { formatDateDMY } from '@/shared/utils/format'

const nf = new Intl.NumberFormat('vi-VN')

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

function QuotaCell({ value }: { value: number }) {
  return <span className={value === 0 ? 'text-text-muted' : 'font-semibold'}>{value}</span>
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

  const sums = totals(version.rows)
  const typeOptions = useMemo(
    () => [
      { value: 'all', label: t('catering.quota.allTypes', { n: distinctTypes(version.rows) }) },
      ...Array.from(new Set(version.rows.map((r) => r.type))).map((ty) => ({
        value: ty,
        label: ty,
      })),
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
      const matchedZero =
        !hideZero || r.hotmeal !== 0 || r.banhMi !== 0 || r.traSua !== 0
      return matchedSearch && matchedType && matchedZero
    })
  }, [rows, search, typeFilter, hideZero])

  const startEdit = () => {
    setEditRows(version.rows.map((r) => ({ ...r })))
    setEffDate(formatDateDMY(Date.now()))
    setEditing(true)
  }

  const patchRow = (flightNo: string, field: 'hotmeal' | 'banhMi' | 'traSua', value: number) => {
    setEditRows((prev) =>
      prev.map((r) => (r.flightNo === flightNo ? { ...r, [field]: value } : r)),
    )
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
      <QuotaCell value={r[field]} />
    )

  const columns: ColumnsType<QuotaRow> = [
    {
      title: t('catering.quota.col.flightNo'),
      dataIndex: 'flightNo',
      width: 96,
      fixed: 'left',
      render: (v: string) => <span className="font-bold tnum">{v}</span>,
    },
    { title: t('catering.quota.col.route'), dataIndex: 'route', width: 120, render: (v: string) => <span className="text-text-muted font-medium">{v}</span> },
    {
      title: t('catering.quota.col.type'),
      dataIndex: 'type',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: t('catering.quota.col.block'), dataIndex: 'block', width: 84, render: (v?: string) => <span className="tnum text-text-muted">{v ?? '—'}</span> },
    { title: t('catering.quota.col.std'), dataIndex: 'std', width: 84, render: (v: string) => <span className="tnum">{v}</span> },
    { title: t('catering.quota.col.sta'), dataIndex: 'sta', width: 84, render: (v: string) => <span className="tnum">{v}</span> },
    { title: t('catering.quota.col.hotmeal'), key: 'hotmeal', align: 'right', width: 110, render: (_v, r) => editNumber(r, 'hotmeal') },
    { title: t('catering.quota.col.banhMi'), key: 'banhMi', align: 'right', width: 110, render: (_v, r) => editNumber(r, 'banhMi') },
    { title: t('catering.quota.col.traSua'), key: 'traSua', align: 'right', width: 110, render: (_v, r) => editNumber(r, 'traSua') },
  ]

  return (
    <>
      {/* Version context bar */}
      <SurfaceCard className="quota-verbar">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <Select
              value={version.id}
              onChange={onSelectVersion}
              style={{ minWidth: 150 }}
              options={versions.map((v) => ({
                value: v.id,
                label: `${v.id} · ${t(`catering.quota.status.${v.status}`)}`,
              }))}
            />
            <Tag color={VERSION_STATUS_COLOR[version.status]} style={{ marginInlineEnd: 0 }}>
              {t(`catering.quota.status.${version.status}`)}
            </Tag>
          </div>
          <div className="min-w-0">
            <div className="font-semibold">
              {t('catering.quota.effectiveFrom', { date: version.effectiveFrom })}
              {version.effectiveTo
                ? ` → ${version.effectiveTo}`
                : ` → ${t('catering.quota.untilNext')}`}
            </div>
            <div className="text-text-muted text-[12.5px]">
              {t('catering.quota.importedMeta', {
                by: version.importedBy,
                at: version.importedAt,
                source: version.source,
              })}
            </div>
          </div>
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
      </SurfaceCard>

      {editing ? (
        <Alert
          type="info"
          showIcon
          title={t('catering.quota.editBannerTitle')}
          description={
            <div className="flex flex-wrap items-center gap-3">
              <span>{t('catering.quota.editBannerDesc')}</span>
              <span className="flex items-center gap-2">
                <span className="text-text-muted text-[12.5px] font-semibold">
                  {t('catering.quota.effectiveLabel')}
                </span>
                <Input
                  value={effDate}
                  onChange={(e) => setEffDate(e.target.value)}
                  style={{ width: 130 }}
                />
                <Button type="primary" size="small" onClick={saveEdit}>
                  {t('catering.quota.saveAsNew')}
                </Button>
                <Button size="small" icon={<X size={14} />} onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
              </span>
            </div>
          }
        />
      ) : null}

      {/* Business rules */}
      <Alert
        type="info"
        showIcon
        title={t('catering.quota.rulesTitle')}
        description={
          <ul className="mt-1 ml-4 list-disc space-y-1 text-[12.5px]">
            <li>{t('catering.quota.rule1')}</li>
            <li>{t('catering.quota.rule2')}</li>
            <li>{t('catering.quota.rule3')}</li>
            <li>{t('catering.quota.rule4')}</li>
          </ul>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          icon={UtensilsCrossed}
          label={t('catering.quota.kpiFlights')}
          value={nf.format(sums.flights)}
          hint={t('catering.quota.kpiFlightsHint', {
            routes: distinctRoutes(version.rows),
            types: distinctTypes(version.rows),
          })}
        />
        <KpiCard tone="brand" icon={UtensilsCrossed} label={t('catering.quota.kpiHotmeal')} value={nf.format(sums.hotmeal)} hint={t('catering.quota.perDay')} />
        <KpiCard icon={Croissant} label={t('catering.quota.kpiBanhMi')} value={nf.format(sums.banhMi)} hint={t('catering.quota.perDay')} />
        <KpiCard icon={CupSoda} label={t('catering.quota.kpiTraSua')} value={nf.format(sums.traSua)} hint={t('catering.quota.perDay')} />
        <KpiCard label={t('catering.quota.kpiZero')} value={nf.format(sums.zeroFlights)} hint={t('catering.quota.kpiZeroHint')} />
      </div>

      <FilterBar className="grid grid-cols-1 gap-2 lg:grid-cols-[1.7fr_1fr_auto]">
        <Input
          value={search}
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('catering.quota.searchPlaceholder')}
          prefix={<Search className="h-4 w-4 text-text-muted" />}
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
