/** Shared presentational bits for the order list + detail pages. */
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { OrderCategory, OrderStatus } from '@/modules/catering/orderTypes'

/** Category colours (all brand-derived): pre-book red · crew dark-red · sales gold. */
export const CAT_COLOR: Record<OrderCategory, string> = {
  prebook: 'var(--color-vj-red)',
  crew: 'var(--color-vj-red-dark)',
  sales: 'var(--color-vj-yellow-dark)',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  const sent = status === 'sent'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${
        sent ? 'bg-vj-green-muted text-vj-green-dark border border-[#c7ec93]' : 'bg-muted text-text-secondary'
      }`}
    >
      <span className={`h-[7px] w-[7px] rounded-full ${sent ? 'bg-vj-green-dark' : 'bg-text-muted'}`} />
      {t(`catering.orders.status.${status}`)}
    </span>
  )
}

export function VerTag({ v }: { v: number }) {
  return <span className="bg-muted text-foreground rounded-md px-1.5 py-0.5 text-[11.5px] font-extrabold tnum">v{v}</span>
}

/** Mini stacked bar of the three category totals. */
export function CatSplit({ pre, crew, sales }: { pre: number; crew: number; sales: number }) {
  const total = pre + crew + sales || 1
  const seg = (n: number, c: string) => (n > 0 ? <span style={{ width: `${(n / total) * 100}%`, background: c }} /> : null)
  const dot = (c: string, n: number) => (
    <span className="text-text-secondary inline-flex items-center gap-1 text-[10.5px] font-bold">
      <span className="h-2 w-2 rounded-[2px]" style={{ background: c }} />
      {n.toLocaleString()}
    </span>
  )
  return (
    <div>
      <div className="bg-muted flex h-2 w-[150px] overflow-hidden rounded-full">
        {seg(pre, CAT_COLOR.prebook)}
        {seg(crew, CAT_COLOR.crew)}
        {seg(sales, CAT_COLOR.sales)}
      </div>
      <div className="mt-1.5 flex gap-2.5">
        {dot(CAT_COLOR.prebook, pre)}
        {dot(CAT_COLOR.crew, crew)}
        {dot(CAT_COLOR.sales, sales)}
      </div>
    </div>
  )
}

/** Vietnamese weekday label from a `DD/MM/YYYY` date. */
export function weekdayOf(t: TFunction, serviceDate: string): string {
  const [d, m, y] = serviceDate.split('/').map(Number)
  const wd = new Date(y, m - 1, d).getDay() // 0 = Sun
  return t(`catering.orders.weekday.${wd}`)
}
