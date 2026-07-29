/** Read-only per-flight ECO supply breakdown (snapshot at order build time). */
import { Drawer, Empty } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { EcoSupplyFlightBreakdown } from '@/modules/catering/orderTypes'
import { ecoSupplyFieldDisplayName } from '@/modules/catering/supplier/ecoSupplyRegistry'

/** Commercial totals shown in the flight header — not repeated in the item list. */
const HEADER_TOTAL_FIELDS = new Set(['prebook'])

interface FlightBreakdownDrawerProps {
  open: boolean
  onClose: () => void
  byFlight: EcoSupplyFlightBreakdown[]
}

export function FlightBreakdownDrawer({ open, onClose, byFlight }: FlightBreakdownDrawerProps) {
  const { t } = useTranslation()

  const flights = useMemo(
    () =>
      byFlight
        .map((f) => {
          const prebook = f.cells.prebook ?? 0
          const items = Object.entries(f.cells)
            .filter(([field, qty]) => qty > 0 && !HEADER_TOTAL_FIELDS.has(field))
            .sort(([a], [b]) =>
              ecoSupplyFieldDisplayName(a).localeCompare(ecoSupplyFieldDisplayName(b), 'vi'),
            )
          return { ...f, prebook, items }
        })
        .filter((f) => f.items.length > 0 || f.prebook > 0),
    [byFlight],
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={440}
      title={t('catering.orders.byFlight.title')}
      destroyOnClose
    >
      {flights.length === 0 ? (
        <Empty description={t('catering.orders.byFlight.empty')} className="py-12" />
      ) : (
        <div className="flex flex-col gap-4">
          {flights.map((f) => (
            <section
              key={`${f.flightNo}-${f.dep}-${f.arr}`}
              className="border-border rounded-lg border px-3 py-2.5"
            >
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-[13px] font-extrabold">
                  {f.flightNo}{' '}
                  <span className="text-text-secondary font-semibold">
                    · {f.dep}→{f.arr}
                  </span>
                </div>
                <div className="text-text-secondary text-[12px] font-semibold">
                  {t('catering.orders.byFlight.prebookTotal')}{' '}
                  <span className="text-foreground font-extrabold tnum">
                    {f.prebook.toLocaleString()}
                  </span>
                </div>
              </header>
              {f.items.length === 0 ? (
                <p className="text-text-muted mb-0 text-[12px]">
                  {t('catering.orders.byFlight.noDetailItems')}
                </p>
              ) : (
                <ul className="m-0 list-none p-0">
                  {f.items.map(([field, qty]) => (
                    <li
                      key={field}
                      className="border-border flex items-center justify-between gap-3 border-b border-dashed py-1.5 text-[12.5px] last:border-b-0"
                    >
                      <span className="text-text-secondary font-semibold">
                        {ecoSupplyFieldDisplayName(field)}
                      </span>
                      <span className="font-extrabold tnum">{qty.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </Drawer>
  )
}
