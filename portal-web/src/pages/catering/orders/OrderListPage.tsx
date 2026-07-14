import { Empty, Input, Segmented } from 'antd'
import { CheckCheck, ChevronRight, Pencil, Search, ShoppingBag, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/patterns/PageHeader'
import { useOrders } from '@/modules/catering/hooks/useOrders'
import { categoryTotal, groupOrderFiles, lineTotal, type OrderFile } from '@/modules/catering/orders'
import { paths } from '@/routes/paths'
import { CatSplit, OrderStatusBadge, VerTag, weekdayOf } from './orderUi'

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

  return (
    <div>
      <PageHeader
        badge={t('catering.orders.badge')}
        title={t('catering.orders.title')}
        description={t('catering.orders.desc')}
      />

      {/* KPI tiles */}
      <div className="mt-1 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={<ShoppingBag size={18} />}
          tone="red"
          value={files.length}
          label={t('catering.orders.kpiTotal')}
        />
        <Kpi icon={<Pencil size={18} />} tone="muted" value={draftCount} label={t('catering.orders.kpiDraft')} />
        <Kpi icon={<CheckCheck size={18} />} tone="green" value={sentCount} label={t('catering.orders.kpiSent')} />
        <Kpi
          icon={<TrendingUp size={18} />}
          tone="red"
          value={totalPortions.toLocaleString()}
          label={t('catering.orders.kpiPortions')}
        />
      </div>

      {/* toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
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
          style={{ maxWidth: 320 }}
        />
      </div>

      {/* table */}
      <div className="border-border mt-4 overflow-hidden rounded-2xl border bg-white">
        {visible.length === 0 ? (
          <div className="py-16">
            <Empty description={t('catering.orders.empty')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-text-secondary [&>th]:border-border [&>th]:border-b [&>th]:px-3 [&>th]:py-3 [&>th]:text-left [&>th]:text-[10.5px] [&>th]:font-extrabold [&>th]:tracking-wide [&>th]:uppercase">
                  <th>{t('catering.orders.colOrder')}</th>
                  <th>{t('catering.orders.colDate')}</th>
                  <th>{t('catering.orders.colStatus')}</th>
                  <th>{t('catering.orders.colVersion')}</th>
                  <th className="!text-right">{t('catering.orders.colTotal')}</th>
                  <th>{t('catering.orders.colBreakdown')}</th>
                  <th>{t('catering.orders.colUpdatedBy')}</th>
                  <th className="!text-right">{t('catering.orders.colUpdated')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((f) => (
                  <OrderRow key={f.fileId} file={f} onOpen={() => navigate(paths.catering.orders.detail(f.fileId))} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderRow({ file, onOpen }: { file: OrderFile; onOpen: () => void }) {
  const { t } = useTranslation()
  const o = file.latest
  const pre = categoryTotal(o.lines, 'prebook')
  const crew = categoryTotal(o.lines, 'crew')
  const sales = categoryTotal(o.lines, 'sales')
  return (
    <tr
      onClick={onOpen}
      className="[&>td]:border-border cursor-pointer hover:bg-[#FCFDFE] [&>td]:border-b [&>td]:px-3 [&>td]:py-3 [&>td]:align-middle"
    >
      <td>
        <div className="font-extrabold">{file.fileId}</div>
        <div className="text-text-muted text-[11.5px] font-semibold">{o.station}</div>
      </td>
      <td>
        <div className="font-extrabold">{file.serviceDate}</div>
        <div className="text-text-secondary text-[11.5px] font-semibold">{weekdayOf(t, file.serviceDate)}</div>
      </td>
      <td>
        <OrderStatusBadge status={o.status} />
      </td>
      <td>
        <VerTag v={o.version} />
      </td>
      <td className="!text-right font-extrabold tnum">{lineTotal(o.lines).toLocaleString()}</td>
      <td>
        <CatSplit pre={pre} crew={crew} sales={sales} />
      </td>
      <td>
        <div className="flex items-center gap-2">
          <span className="bg-vj-red grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold text-white">
            {initials(o.createdBy)}
          </span>
          <span className="font-semibold">{o.createdBy}</span>
        </div>
      </td>
      <td className="text-text-secondary !text-right text-[12px] font-semibold tnum">{fmtStamp(o.createdAt)}</td>
      <td className="!text-right">
        <ChevronRight size={16} className="text-text-muted" />
      </td>
    </tr>
  )
}

function Kpi({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode
  tone: 'red' | 'green' | 'muted'
  value: number | string
  label: string
}) {
  const toneCls =
    tone === 'red'
      ? 'bg-vj-red-50 text-vj-red'
      : tone === 'green'
        ? 'bg-vj-green-muted text-vj-green-dark'
        : 'bg-muted text-text-secondary'
  return (
    <div className="border-border rounded-2xl border bg-[#FCFDFE] px-4 py-3.5">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneCls}`}>{icon}</span>
      <div className="mt-2.5 text-[26px] leading-none font-extrabold tnum">{value}</div>
      <div className="text-text-secondary mt-1.5 text-[12px] font-semibold">{label}</div>
    </div>
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
