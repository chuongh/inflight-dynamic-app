import { useTranslation } from 'react-i18next'
import type { TrolleyStatus } from '@/modules/equipment/constants'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'

export interface StationMapNode {
  code: string
  x: number
  y: number
  count: number
  repairing: number
  notService: number
}

interface StationMapProps {
  stations: StationMapNode[]
  maxCount: number
  onStationClick?: (code: string) => void
}

function dotSize(count: number, max: number) {
  if (count === 0) return 10
  const ratio = count / Math.max(1, max)
  return Math.round(12 + ratio * 18)
}

export function StationMap({ stations, maxCount, onStationClick }: StationMapProps) {
  const { t } = useTranslation()
  const { statusLabel } = useEquipmentLabels()

  const STATUS_LEGEND: Array<{ status: TrolleyStatus; label: string }> = [
    { status: 'service', label: statusLabel('service') },
    { status: 'repairing', label: statusLabel('repairing') },
    { status: 'not-service', label: statusLabel('not-service') },
  ]

  return (
    <div className="station-map">
      <div className="station-map__header">
        <span className="station-map__label">{t('dashboard.networkMap')}</span>
        <span className="station-map__live">
          <span className="station-map__live-dot" aria-hidden />
          {t('dashboard.live')}
        </span>
      </div>

      <svg
        className="station-map__svg"
        viewBox="0 0 100 160"
        role="img"
        aria-label={t('dashboard.mapAria')}
      >
        <defs>
          <linearGradient id="vn-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(240, 40, 35, 0.06)" />
            <stop offset="100%" stopColor="rgba(255, 221, 50, 0.08)" />
          </linearGradient>
        </defs>

        <path
          className="station-map__land"
          d="M 34 8 L 56 6 L 64 22 L 60 38 L 66 52 L 62 68 L 64 82 L 58 98 L 54 112 L 48 128 L 42 142 L 34 152 L 26 138 L 22 118 L 24 98 L 28 78 L 30 58 L 32 38 Z"
          fill="url(#vn-fill)"
          stroke="rgba(240, 40, 35, 0.15)"
          strokeWidth="0.8"
        />

        {[20, 40, 60, 80, 100, 120, 140].map((y) => (
          <line
            key={`h-${y}`}
            x1="18"
            y1={y * 0.9 + 8}
            x2="72"
            y2={y * 0.9 + 8}
            className="station-map__grid-line"
          />
        ))}

        {stations.map((station) => {
          const size = dotSize(station.count, maxCount)
          const hasAlert = station.repairing > 0 || station.notService > 0
          return (
            <g
              key={station.code}
              className="station-map__node"
              transform={`translate(${station.x}, ${station.y})`}
              onClick={() => onStationClick?.(station.code)}
              style={{ cursor: onStationClick ? 'pointer' : undefined }}
            >
              {hasAlert ? (
                <circle
                  className="station-map__pulse"
                  r={size / 2 + 6}
                  fill="none"
                  stroke="var(--color-vj-yellow)"
                  strokeWidth="1"
                  opacity="0.5"
                />
              ) : null}
              <circle
                className="station-map__dot"
                r={size / 2}
                fill="var(--color-vj-red)"
                stroke="#fff"
                strokeWidth="1.5"
              />
              <text className="station-map__code" y={size / 2 + 10} textAnchor="middle">
                {station.code}
              </text>
              <text className="station-map__count tnum" y={-size / 2 - 4} textAnchor="middle">
                {station.count}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="station-map__legend">
        {STATUS_LEGEND.map(({ status, label }) => (
          <span key={status} className="station-map__legend-item">
            <span className={`station-map__legend-dot station-map__legend-dot--${status}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
