import { useTranslation } from 'react-i18next'
import { vjFleetChartColors } from '../../../design-system'

interface FleetReadinessGaugeProps {
  percent: number
  displayPercent: number
  inService: number
  total: number
  segments: Array<{ label: string; pct: number; count: number; color: string }>
}

export function FleetReadinessGauge({
  percent,
  displayPercent,
  inService,
  total,
  segments,
}: FleetReadinessGaugeProps) {
  const { t } = useTranslation()
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const readyOffset = circumference - (percent / 100) * circumference

  const conicBackground = segments
    .map((seg, index) => {
      const start = segments.slice(0, index).reduce((sum, item) => sum + item.pct, 0)
      const end = start + seg.pct
      return `${seg.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="fleet-gauge">
      <div className="fleet-gauge__header">
        <span className="fleet-gauge__label">{t('dashboard.fleetReadiness')}</span>
        <span className="fleet-gauge__sub">{t('dashboard.instrumentReadout')}</span>
      </div>

      <div className="fleet-gauge__instrument">
        <div
          className="fleet-gauge__ring-bg"
          style={{ background: `conic-gradient(from -90deg, ${conicBackground})` }}
          role="img"
          aria-label={`${t('dashboard.fleetReadiness')} ${percent}%`}
        />
        <svg className="fleet-gauge__arc" viewBox="0 0 128 128" aria-hidden>
          <circle
            className="fleet-gauge__arc-track"
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="fleet-gauge__arc-fill"
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={readyOffset}
            stroke={vjFleetChartColors.service}
            transform="rotate(-90 64 64)"
          />
        </svg>
        <div className="fleet-gauge__center">
          <div className="fleet-gauge__value tnum">{displayPercent}%</div>
          <div className="fleet-gauge__caption">{t('dashboard.ready')}</div>
          <div className="fleet-gauge__meta tnum">
            {t('dashboard.unitsMeta', { inService, total })}
          </div>
        </div>
      </div>

      <ul className="fleet-gauge__breakdown">
        {segments.map((seg) => (
          <li key={seg.label} className="fleet-gauge__breakdown-item">
            <span className="fleet-gauge__breakdown-label">
              <span className="fleet-gauge__breakdown-dot" style={{ background: seg.color }} />
              {seg.label}
            </span>
            <span className="fleet-gauge__breakdown-value tnum">
              {seg.pct}% · {seg.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
