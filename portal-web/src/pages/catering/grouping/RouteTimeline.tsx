import { Scissors, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatDuration,
  isCateringStation,
  legDurationMin,
  stationsOf,
} from '@/modules/catering/grouping'
import type { FlightGroup } from '@/modules/catering/groupingTypes'

/** Compact one-line route for the collapsed row: SGN → BMV → SGN → … */
export function InlineRoute({ group }: { group: FlightGroup }) {
  const stations = stationsOf(group)
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13.5px] font-extrabold">
      {stations.map((code, i) => {
        const cat = isCateringStation(code)
        return (
          <span key={`${code}-${i}`} className="flex items-center gap-1.5">
            {i === 0 ? (
              <span className="text-vj-red-dark inline-flex items-center gap-1">
                <Utensils size={13} />
                {code}
              </span>
            ) : (
              <span className={cat ? 'text-foreground' : 'text-text-muted font-bold'}>{code}</span>
            )}
            {i < stations.length - 1 ? <span className="text-text-muted font-normal">→</span> : null}
          </span>
        )
      })}
    </div>
  )
}

interface TimelineProps {
  group: FlightGroup
  editing: boolean
  onSplit: (at: number) => void
}

/** Full rotation timeline shown in the expanded detail. */
export function RouteTimeline({ group, editing, onSplit }: TimelineProps) {
  const { t } = useTranslation()
  const stations = stationsOf(group)

  return (
    <div className="fg-timeline flex items-start overflow-x-auto pb-1.5">
      {stations.map((code, i) => {
        const cat = isCateringStation(code)
        const isOrigin = i === 0
        const leg = i < group.legs.length ? group.legs[i] : null
        return (
          <div key={`${code}-${i}`} className="flex items-start">
            {/* Station node */}
            <div className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
              <span
                className="grid place-items-center rounded-full"
                style={
                  isOrigin
                    ? {
                        width: 26,
                        height: 26,
                        border: '3px solid var(--color-vj-red)',
                        background: 'var(--color-vj-red-50)',
                      }
                    : {
                        width: 13,
                        height: 13,
                        border: `3px solid ${cat ? 'var(--color-vj-red)' : 'var(--color-text-muted)'}`,
                        background: cat ? 'var(--color-vj-red)' : 'var(--color-surface)',
                      }
                }
              >
                {isOrigin ? <Utensils size={14} className="text-vj-red" /> : null}
              </span>
              <span className="text-[14px] font-extrabold">{code}</span>
              {isOrigin ? (
                <span className="text-vj-red text-[9px] font-extrabold uppercase tracking-wide">
                  {t('catering.grouping.load')}
                </span>
              ) : cat ? (
                <span className="text-vj-red text-[9px] font-extrabold uppercase tracking-wide">
                  {t('catering.grouping.catering')}
                </span>
              ) : (
                <span className="text-text-muted text-[9.5px] font-bold">
                  {t('catering.grouping.noCatering')}
                </span>
              )}
            </div>

            {/* Connector + leg chip */}
            {leg ? (
              <div className="relative flex min-w-[96px] flex-1 flex-col items-center pt-0.5">
                {editing && i > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSplit(i)}
                    aria-label={t('catering.grouping.splitHere')}
                    title={t('catering.grouping.splitHere')}
                    className="border-vj-red text-vj-red hover:bg-vj-red absolute top-[-11px] left-1/2 z-10 grid h-[22px] w-[22px] -translate-x-1/2 cursor-pointer place-items-center rounded-full border border-dashed bg-white transition-colors hover:text-white"
                  >
                    <Scissors size={12} />
                  </button>
                ) : null}
                <div className="fg-conn-line bg-border relative mb-2 h-[3px] w-full rounded-full" />
                <div className="border-border rounded-lg border bg-white px-2 py-1 text-center">
                  <span className="flex items-center justify-center gap-1 text-[12px] font-extrabold">
                    {leg.flightNo}
                    {leg.intl ? (
                      <span
                        className="rounded px-1 text-[8px] font-extrabold"
                        style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                      >
                        QT
                      </span>
                    ) : null}
                  </span>
                  <span className="text-text-secondary mt-0.5 block text-[10.5px] font-bold">
                    {leg.std}
                    {leg.stdNextDay ? <sup className="text-vj-red font-extrabold">+1</sup> : null}→{leg.sta}
                    {leg.staNextDay ? <sup className="text-vj-red font-extrabold">+1</sup> : null}
                  </span>
                  <span className="text-text-muted block text-[9.5px] font-bold">
                    {formatDuration(legDurationMin(leg))} {t('catering.grouping.flightShort')}
                  </span>
                  {leg.premeal != null ? (
                    <span className="text-vj-red-dark bg-vj-red-50 mt-1 block rounded px-1 text-[9.5px] font-extrabold">
                      {t('catering.grouping.premealN', { count: leg.premeal })}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
