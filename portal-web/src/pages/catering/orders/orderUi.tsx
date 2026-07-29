/** Shared presentational bits for the order list + detail pages. */
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { StatStrip, type StatStripItem, type StatStripTone } from '@/components/patterns/StatStrip'
import type { OrderCategory, OrderStatus } from '@/modules/catering/orderTypes'
import './orders.css'

/** Category colours — brand red / ink / gold for scannable share bars. */
export const CAT_COLOR: Record<OrderCategory, string> = {
  prebook: 'var(--color-vj-red)',
  crew: 'var(--color-vj-red-dark)',
  sales: 'var(--color-vj-yellow-dark)',
}

export type OrderStatTone = StatStripTone
export type OrderStatItem = StatStripItem

/** @deprecated Prefer StatStrip — kept as alias for order pages. */
export const OrderStatStrip = StatStrip

export type OrderCatSegment = { color: string; label: string; n: number }

/** Thin category share bar + legends for the detail overview. */
export function OrderCatBar({
  total,
  segments,
  delta,
  deltaLabel,
}: {
  total: number
  segments: OrderCatSegment[]
  delta?: number
  deltaLabel?: string
}) {
  const denom = total || 1
  return (
    <div>
      <div className="order-cat-bar" aria-hidden>
        {segments.map((s) =>
          s.n > 0 ? (
            <span key={s.label} style={{ width: `${(s.n / denom) * 100}%`, background: s.color }} />
          ) : null,
        )}
      </div>
      <div className="order-cat-bar__legends">
        {segments.map((s) => (
          <span key={s.label} className="order-cat-bar__leg">
            <span className="order-cat-bar__swatch" style={{ background: s.color }} />
            {s.label} <b className="order-cat-bar__n">{s.n.toLocaleString()}</b>
          </span>
        ))}
        {delta != null && deltaLabel ? (
          <span
            className={`order-cat-bar__delta order-cat-bar__delta--${
              delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
            }`}
          >
            {deltaLabel} {delta > 0 ? `+${delta}` : delta}
          </span>
        ) : null}
      </div>
    </div>
  )
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

/** Mini stacked bar: prebook vs hotmeal (main + vegetarian + bread) from ecoSupplyLines. */
export function CatSplit({
  prebook,
  hotmeal,
}: {
  prebook: number | null
  hotmeal: number | null
}) {
  if (prebook == null || hotmeal == null) {
    return <span className="text-text-muted text-[12px] font-semibold">—</span>
  }
  const total = prebook + hotmeal || 1
  const seg = (n: number, c: string) =>
    n > 0 ? <span style={{ width: `${(n / total) * 100}%`, background: c }} /> : null
  const dot = (c: string, n: number) => (
    <span className="text-text-secondary inline-flex items-center gap-1 text-[10.5px] font-bold">
      <span className="h-2 w-2 rounded-[2px]" style={{ background: c }} />
      {n.toLocaleString()}
    </span>
  )
  return (
    <div>
      <div className="bg-muted flex h-2 w-[150px] overflow-hidden rounded-full">
        {seg(prebook, CAT_COLOR.prebook)}
        {seg(hotmeal, CAT_COLOR.sales)}
      </div>
      <div className="mt-1.5 flex gap-2.5">
        {dot(CAT_COLOR.prebook, prebook)}
        {dot(CAT_COLOR.sales, hotmeal)}
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
