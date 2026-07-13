import { AlertTriangle, CheckCircle2, Radio, ShoppingCart, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KpiCard } from '@/components/patterns/KpiCard'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import {
  CommandHero,
  FleetReadinessGauge,
  OpsTicker,
  StationMap,
  type OpsTickerItem,
  type StationMapNode,
} from '@/components/patterns/aviation'
import { STATIONS, type TrolleyUnit } from '@/modules/equipment/constants'
import { vjFleetChartColors } from '@/design-system'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'
import { summarizeFleet } from '@/modules/equipment/lib/generateTrolleys'
import type { RepairRequest } from '@/modules/equipment/types'

interface DashboardPageProps {
  trolleys: TrolleyUnit[]
  repairRequests?: RepairRequest[]
}

/** Approximate positions on stylized VN map (viewBox 0 0 100 160) */
const STATION_LAYOUT: Record<(typeof STATIONS)[number], { x: number; y: number }> = {
  HAN: { x: 52, y: 28 },
  DAD: { x: 56, y: 58 },
  CXR: { x: 58, y: 78 },
  SGN: { x: 48, y: 98 },
  PQC: { x: 30, y: 108 },
}

function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

function buildOpsFeed(trolleys: TrolleyUnit[], repairRequests: RepairRequest[]): OpsTickerItem[] {
  const trolleyEvents: OpsTickerItem[] = trolleys
    .filter((item) => item.status !== 'service')
    .map((item) => ({
      id: `trolley-${item.code}`,
      code: item.code,
      station: item.station,
      status: item.status,
      timestamp: item.updatedAt,
      detail: item.status === 'repairing' ? item.vendor : item.lastRepairReason,
    }))

  const requestEvents: OpsTickerItem[] = repairRequests
    .filter((request) => request.status === 'open' && request.equipmentType === 'trolley')
    .flatMap((request) =>
      request.equipmentCodes.map((code) => ({
        id: `req-${request.id}-${code}`,
        code,
        station: request.station,
        status: 'repairing' as const,
        timestamp: request.requestedAt,
        detail: `→ ${request.vendor}`,
      })),
    )

  return [...trolleyEvents, ...requestEvents]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 8)
}

export function DashboardPage({ trolleys, repairRequests = [] }: DashboardPageProps) {
  const { t } = useTranslation()
  const { statusLabel } = useEquipmentLabels()
  const summary = summarizeFleet(trolleys)
  const total = Math.max(1, summary.total)
  const servicePct = Math.round((summary.service / total) * 1000) / 10
  const repairingPct = Math.round((summary.repairing / total) * 1000) / 10
  const notServicePct = Math.round((summary.notService / total) * 1000) / 10
  const fleetReadyPct = Math.round((summary.service / total) * 1000) / 10

  const totalCount = useCountUp(summary.total)
  const serviceCount = useCountUp(summary.service, 520)
  const repairingCount = useCountUp(summary.repairing, 540)
  const notServiceCount = useCountUp(summary.notService, 560)
  const readyDisplay = useCountUp(Math.round(fleetReadyPct), 580)

  const stationNodes = useMemo((): StationMapNode[] => {
    return STATIONS.map((code) => {
      const atStation = trolleys.filter((item) => item.station === code)
      return {
        code,
        ...STATION_LAYOUT[code],
        count: atStation.length,
        repairing: atStation.filter((item) => item.status === 'repairing').length,
        notService: atStation.filter((item) => item.status === 'not-service').length,
      }
    })
  }, [trolleys])

  const maxStationCount = Math.max(1, ...stationNodes.map((node) => node.count))
  const opsFeed = useMemo(
    () => buildOpsFeed(trolleys, repairRequests),
    [trolleys, repairRequests],
  )

  const gaugeSegments = useMemo(
    () => [
      {
        label: statusLabel('service'),
        pct: servicePct,
        count: summary.service,
        color: vjFleetChartColors.service,
      },
      {
        label: statusLabel('repairing'),
        pct: repairingPct,
        count: summary.repairing,
        color: vjFleetChartColors.repairing,
      },
      {
        label: statusLabel('not-service'),
        pct: notServicePct,
        count: summary.notService,
        color: vjFleetChartColors.notService,
      },
    ],
    [statusLabel, servicePct, repairingPct, notServicePct, summary],
  )

  const stationBars = useMemo(() => {
    return stationNodes
      .filter((node) => node.count > 0)
      .sort((left, right) => right.count - left.count)
  }, [stationNodes])

  return (
    <div className="page-shell page-shell--command">
      <div className="thin-scroll page-shell__body page-shell__body--flush">
        {/* <CommandHero
          badge={t('dashboard.badge')}
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          map={<StationMap stations={stationNodes} maxCount={maxStationCount} />}
          gauge={
            <FleetReadinessGauge
              percent={fleetReadyPct}
              displayPercent={readyDisplay}
              inService={summary.service}
              total={summary.total}
              segments={gaugeSegments}
            />
          }
          ticker={<OpsTicker items={opsFeed} />}
        /> */}

        <div className="command-body">
          <div className="kpi-grid kpi-grid--4">
            <div className="dash-enter dash-enter-delay-1">
              <KpiCard
                label={t('dashboard.kpiTotal')}
                value={totalCount}
                hint={t('dashboard.hintFullHalf', { full: summary.full, half: summary.half })}
                icon={ShoppingCart}
                tone="brand"
              />
            </div>
            <div className="dash-enter dash-enter-delay-2">
              <KpiCard
                label={t('dashboard.kpiInService')}
                value={serviceCount}
                hint={t('dashboard.hintFleetReady', { pct: fleetReadyPct })}
                icon={CheckCircle2}
                tone="success"
              />
            </div>
            <div className="dash-enter dash-enter-delay-3">
              <KpiCard
                className="kpi-card--beacon"
                label={t('dashboard.kpiRepairing')}
                value={repairingCount}
                hint={t('dashboard.hintUnderMaintenance', { count: summary.repairing })}
                icon={Wrench}
                tone="warning"
              />
            </div>
            <div className="dash-enter dash-enter-delay-4">
              <KpiCard
                label={t('dashboard.kpiNotInService')}
                value={notServiceCount}
                hint={t('dashboard.hintAwaitingAction', { count: Math.max(0, summary.notService) })}
                icon={AlertTriangle}
                tone="danger"
              />
            </div>
          </div>

          <div className="dash-enter dash-enter-delay-5">
            <SurfaceCard
              title={t('dashboard.throughputTitle')}
              description={t('dashboard.throughputDesc')}
            >
              <div className="station-throughput">
                {stationBars.map((node, index) => (
                  <div key={node.code} className="station-throughput__row">
                    <div className="station-throughput__meta">
                      <span className="station-throughput__code tnum">{node.code}</span>
                      <span className="station-throughput__stats tnum">
                        {t('dashboard.unitsCount', { count: node.count })}
                        {node.repairing > 0 ? (
                          <span className="station-throughput__alert">
                            <Radio size={10} />
                            {t('dashboard.repairingCount', { count: node.repairing })}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="station-throughput__track">
                      <div
                        className="station-throughput__fill dash-bar-fill"
                        style={{
                          width: `${Math.max(8, (node.count / maxStationCount) * 100)}%`,
                          animationDelay: `${120 + index * 50}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </div>
  )
}
