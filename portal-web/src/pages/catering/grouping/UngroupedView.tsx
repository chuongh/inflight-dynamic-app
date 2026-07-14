import { Button } from 'antd'
import { Clock, Plane, Sparkles, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration, isCateringStation, legDurationMin } from '@/modules/catering/grouping'
import type { RawFlight } from '@/modules/catering/groupingTypes'

interface Props {
  station: string
  flights: RawFlight[]
  running: boolean
  onRun: () => void
}

export function UngroupedView({ station, flights, running, onRun }: Props) {
  const { t } = useTranslation()
  const aircraftCount = new Set(flights.map((f) => f.aircraft)).size

  return (
    <div className="flex flex-col gap-4">
      {/* Empty-state hero */}
      <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-xl border px-6 py-9 text-center">
        <span className="bg-vj-red-50 text-vj-red grid h-16 w-16 place-items-center rounded-2xl">
          <Sparkles size={30} />
        </span>
        <h2 className="text-[19px] font-extrabold">{t('catering.grouping.ungroupedTitle')}</h2>
        <p className="text-text-secondary max-w-md text-[13.5px] font-semibold">
          {t('catering.grouping.ungroupedDesc', {
            count: flights.length,
            aircraft: aircraftCount,
            station,
          })}
        </p>
        <Button
          type="primary"
          size="large"
          loading={running}
          icon={running ? undefined : <Sparkles size={17} />}
          onClick={onRun}
          className="mt-1"
        >
          {running ? t('catering.grouping.grouping') : t('catering.grouping.runGrouping')}
        </Button>
      </div>

      {/* Pending raw flights */}
      <div>
        <div className="text-text-secondary mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wide">
          <Plane size={14} className="text-vj-red" />
          {t('catering.grouping.pendingFlights', { count: flights.length })}
        </div>
        <div className="border-border bg-surface overflow-hidden rounded-xl border">
          {flights.map((f, i) => {
            const cat = isCateringStation(f.arr)
            return (
              <div
                key={f.flightNo}
                className={`grid grid-cols-[70px_minmax(120px,1fr)_auto_auto_minmax(140px,220px)] items-center gap-4 px-4 py-2.5 text-[13px] ${
                  i > 0 ? 'border-border border-t' : ''
                } ${running ? 'opacity-50' : ''}`}
              >
                <span className="font-extrabold">{f.flightNo}</span>
                <span className="flex items-center gap-2 font-bold">
                  {f.aircraft}
                  <span className="bg-muted text-text-secondary rounded px-1.5 py-px text-[10px] font-extrabold">
                    {f.aircraftType}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 font-extrabold">
                  <span className={isCateringStation(f.dep) ? 'text-vj-red-dark inline-flex items-center gap-1' : ''}>
                    {isCateringStation(f.dep) ? <Utensils size={12} /> : null}
                    {f.dep}
                  </span>
                  <span className="text-text-muted font-normal">→</span>
                  <span className={cat ? 'text-foreground' : 'text-text-muted'}>{f.arr}</span>
                  {f.intl ? (
                    <span
                      className="ml-1 rounded px-1 text-[8px] font-extrabold"
                      style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                    >
                      QT
                    </span>
                  ) : null}
                </span>
                <span className="text-text-secondary flex items-center gap-1.5 text-[12px] font-bold tnum">
                  <Clock size={13} className="text-text-muted" />
                  {f.std}→{f.sta}
                  <span className="text-text-muted">· {formatDuration(legDurationMin(f))}</span>
                </span>
                <span className="text-text-secondary truncate text-[12px] font-semibold">
                  {t('catering.grouping.purser')} · {f.purser}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
