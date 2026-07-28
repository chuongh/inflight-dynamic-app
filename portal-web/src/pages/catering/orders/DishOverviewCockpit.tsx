import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import type { CateringOrderLine, OrderCategory } from '@/modules/catering/orderTypes'
import type { DishRollup, DishRollupLine } from '../planner/plannerModel'

const TOP_N = 8

export function DishOverviewCockpit({
  rollup,
  lines,
  lineLabel,
  catTotal,
  onGotoSupplier,
  showSupplierCta,
  editByFlight,
}: {
  rollup: DishRollup | null
  lines: CateringOrderLine[]
  lineLabel: (l: CateringOrderLine) => string
  catTotal: (c: OrderCategory) => number
  onGotoSupplier: () => void
  showSupplierCta: boolean
  editByFlight?: ReactNode
}) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)

  const topDishes = useMemo(() => {
    if (rollup) {
      return rollup.sections
        .flatMap((s) => s.lines)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, TOP_N)
    }
    return lines
      .map((l) => ({
        key: `${l.category}-${l.name}`,
        label: lineLabel(l),
        product: l.category,
        qty: l.qty,
        delta: l.qty - l.suggested,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, TOP_N)
  }, [rollup, lines, lineLabel])

  const exceptions = useMemo(() => {
    if (rollup) return [] as { key: string; label: string; note: string }[]
    return lines
      .filter((l) => l.qty !== l.suggested)
      .map((l) => ({
        key: `${l.category}-${l.name}`,
        label: lineLabel(l),
        note:
          l.qty > l.suggested
            ? `+${(l.qty - l.suggested).toLocaleString()}`
            : String(l.qty - l.suggested),
      }))
  }, [rollup, lines, lineLabel])

  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <SurfaceCard
        title={t('catering.orders.supplier.cockpitTopTitle')}
        description={t('catering.orders.supplier.cockpitTopDesc', { n: TOP_N })}
      >
        {topDishes.length === 0 ? (
          <p className="text-text-muted text-[13px] font-semibold">{t('catering.orders.empty')}</p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-0 p-0">
            {topDishes.map((item, idx) => (
              <li
                key={item.key}
                className="border-border flex items-center gap-3 border-b py-2.5 last:border-b-0"
              >
                <span className="text-text-muted w-5 text-right text-[11px] font-extrabold tnum">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <span className="truncate text-[13px] font-bold">{item.label}</span>
                  {'product' in item && typeof item.product === 'string' && rollup ? (
                    <span className="text-text-muted ml-2 text-[10px] font-bold uppercase">
                      {item.product}
                    </span>
                  ) : null}
                </div>
                <span className="w-[92px] text-right text-[15px] font-extrabold tnum">
                  {item.qty.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </SurfaceCard>

      {exceptions.length > 0 ? (
        <SurfaceCard
          title={t('catering.orders.supplier.cockpitExceptionsTitle')}
          description={t('catering.orders.supplier.cockpitExceptionsDesc', { n: exceptions.length })}
        >
          {exceptions.map((ex) => (
            <div
              key={ex.key}
              className="border-border flex items-center justify-between gap-3 border-b border-dashed py-2 last:border-b-0"
            >
              <span className="text-[13px] font-bold">{ex.label}</span>
              <span className="bg-muted text-foreground rounded px-1.5 text-[12px] font-extrabold tnum">
                {ex.note}
              </span>
            </div>
          ))}
        </SurfaceCard>
      ) : null}

      {showSupplierCta ? (
        <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
          <p className="text-text-secondary m-0 min-w-0 flex-1 text-[12.5px] font-semibold">
            {t('catering.orders.supplier.rollupHint')}
          </p>
          <Button type="primary" icon={<ArrowRight size={15} />} onClick={onGotoSupplier}>
            {t('catering.orders.supplier.gotoEditFlights')}
          </Button>
        </div>
      ) : null}

      {editByFlight}

      {rollup && rollup.sections.length > 0 ? (
        <div>
          <button
            type="button"
            className="text-planner-accent hover:text-planner-ink mb-2 inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
          >
            {showAll ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showAll
              ? t('catering.orders.supplier.cockpitHideAll')
              : t('catering.orders.supplier.cockpitShowAll')}
          </button>
          {showAll
            ? rollup.sections.map((section) => (
                <SurfaceCard
                  key={section.key}
                  className="mb-3"
                  padding="none"
                  title={section.label}
                  description={t('catering.orders.portionsN', {
                    n: section.total.toLocaleString(),
                  })}
                >
                  {section.lines.map((line: DishRollupLine, idx: number) => (
                    <div
                      key={line.key}
                      className="border-border flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
                    >
                      <span className="text-text-muted w-5 text-right text-[11px] font-extrabold tnum">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="truncate text-[13px] font-bold">{line.label}</span>
                      </div>
                      <span className="w-[92px] text-right text-[15px] font-extrabold tnum">
                        {line.qty.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </SurfaceCard>
              ))
            : null}
        </div>
      ) : null}

      {!rollup ? (
        <p className="text-text-muted text-[12px] font-semibold">
          {t('catering.orders.supplier.cockpitLegacyHint', {
            pre: catTotal('prebook'),
            crew: catTotal('crew'),
            sales: catTotal('sales'),
          })}
        </p>
      ) : null}
    </div>
  )
}
