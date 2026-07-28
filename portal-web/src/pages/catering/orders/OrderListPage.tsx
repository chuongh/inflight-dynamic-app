import { Empty, Input, Segmented, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { useOrders } from '@/modules/catering/hooks/useOrders'
import { categoryTotal, groupOrderFiles, lineTotal, orderGroupCount, type OrderFile } from '@/modules/catering/orders'
import { paths } from '@/routes/paths'
import { CatSplit, OrderStatStrip, OrderStatusBadge, VerTag, weekdayOf } from './orderUi'

type StatusFilter = 'all' | 'draft' | 'sent'

export function OrderListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data } = useOrders()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')

  const files = useMemo(() => groupOrderFiles(data?.orders ?? []), [data])

  const draftCount = files.filter((f) => f.latest.status === 'draft').length
  const sentCount = files.filter((f) => f.latest.status === 'sent').length
  const totalPortions = files.reduce((s, f) => s + lineTotal(f.latest.lines), 0)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return files.filter((f) => {
      if (status !== 'all' && f.latest.status !== status) return false
      if (q && !`${f.fileId} ${f.serviceDate}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [files, status, query])

  const columns: ColumnsType<OrderFile> = [
    {
      title: t('catering.orders.colOrder'),
      key: 'order',
      render: (_v, file) => (
        <div>
          <div className="font-extrabold">{file.fileId}</div>
          <div className="text-text-muted text-[11.5px] font-semibold">{file.latest.station}</div>
        </div>
      ),
    },
    {
      title: t('catering.orders.colDate'),
      key: 'date',
      width: 130,
      render: (_v, file) => (
        <div>
          <div className="font-extrabold">{file.serviceDate}</div>
          <div className="text-text-secondary text-[11.5px] font-semibold">{weekdayOf(t, file.serviceDate)}</div>
        </div>
      ),
    },
    {
      title: t('catering.orders.colStatus'),
      key: 'status',
      width: 120,
      render: (_v, file) => <OrderStatusBadge status={file.latest.status} />,
    },
    {
      title: t('catering.orders.colGroups'),
      key: 'groups',
      width: 100,
      align: 'right',
      render: (_v, file) => {
        const n = orderGroupCount(file.latest)
        return (
          <span className="font-extrabold tnum">
            {n > 0 ? n : '—'}
          </span>
        )
      },
    },
    {
      title: t('catering.orders.colVersion'),
      key: 'version',
      width: 80,
      render: (_v, file) => <VerTag v={file.latest.version} />,
    },
    {
      title: t('catering.orders.colTotal'),
      key: 'total',
      width: 100,
      align: 'right',
      render: (_v, file) => (
        <span className="font-extrabold tnum">{lineTotal(file.latest.lines).toLocaleString()}</span>
      ),
    },
    {
      title: t('catering.orders.colBreakdown'),
      key: 'breakdown',
      width: 180,
      render: (_v, file) => {
        const o = file.latest
        return (
          <CatSplit
            pre={categoryTotal(o.lines, 'prebook')}
            crew={categoryTotal(o.lines, 'crew')}
            sales={categoryTotal(o.lines, 'sales')}
          />
        )
      },
    },
    {
      title: t('catering.orders.colUpdatedBy'),
      key: 'by',
      width: 160,
      render: (_v, file) => (
        <div className="flex items-center gap-2">
          <span className="bg-planner-accent grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold text-white">
            {initials(file.latest.createdBy)}
          </span>
          <span className="font-semibold">{file.latest.createdBy}</span>
        </div>
      ),
    },
    {
      title: t('catering.orders.colUpdated'),
      key: 'updated',
      width: 110,
      align: 'right',
      render: (_v, file) => (
        <span className="text-text-secondary text-[12px] font-semibold tnum">{fmtStamp(file.latest.createdAt)}</span>
      ),
    },
    {
      title: '',
      key: 'go',
      width: 40,
      align: 'right',
      render: () => <ChevronRight size={16} className="text-text-muted" aria-hidden />,
    },
  ]

  return (
    <ListPageLayout
      badge={t('catering.orders.badge')}
      title={t('catering.orders.title')}
      description={t('catering.orders.desc')}
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[auto_1fr]"
      filterBar={
        <>
          <Segmented
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={[
              { value: 'all', label: t('catering.orders.filterAll', { n: files.length }) },
              { value: 'draft', label: t('catering.orders.filterDraft', { n: draftCount }) },
              { value: 'sent', label: t('catering.orders.filterSent', { n: sentCount }) },
            ]}
          />
          <Input
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<Search size={15} className="text-text-muted" />}
            placeholder={t('catering.orders.searchPlaceholder')}
            style={{ maxWidth: 360 }}
          />
        </>
      }
      lead={
        <OrderStatStrip
          items={[
            { label: t('catering.orders.kpiTotal'), value: files.length, featured: true },
            { label: t('catering.orders.kpiDraft'), value: draftCount },
            { label: t('catering.orders.kpiSent'), value: sentCount, tone: 'success' },
            {
              label: t('catering.orders.kpiPortions'),
              value: totalPortions.toLocaleString(),
            },
          ]}
        />
      }
      footer={
        <span className="text-text-secondary text-[12.5px] font-semibold tnum">
          {visible.length}/{files.length} {t('catering.orders.title')}
        </span>
      }
    >
      {visible.length === 0 ? (
        <div className="py-16">
          <Empty description={t('catering.orders.empty')} />
        </div>
      ) : (
        <Table
          rowKey="fileId"
          size="middle"
          columns={columns}
          dataSource={visible}
          pagination={false}
          scroll={{ x: 'max-content' }}
          onRow={(file) => ({
            onClick: () => navigate(paths.catering.orders.detail(file.fileId)),
            style: { cursor: 'pointer' },
          })}
        />
      )}
    </ListPageLayout>
  )
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
}

function fmtStamp(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}
