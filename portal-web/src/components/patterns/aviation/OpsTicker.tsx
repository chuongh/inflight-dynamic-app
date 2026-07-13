import { useTranslation } from 'react-i18next'
import type { TrolleyStatus } from '@/modules/equipment/constants'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'
import { useFormatters } from '@/i18n/hooks/useFormatters'

export interface OpsTickerItem {
  id: string
  code: string
  station: string
  status: TrolleyStatus
  timestamp: number
  detail?: string
}

interface OpsTickerProps {
  items: OpsTickerItem[]
}

const statusTone: Record<TrolleyStatus, string> = {
  service: 'ops-ticker__status--service',
  repairing: 'ops-ticker__status--repairing',
  'not-service': 'ops-ticker__status--alert',
}

export function OpsTicker({ items }: OpsTickerProps) {
  const { t } = useTranslation()
  const { statusLabel } = useEquipmentLabels()
  const { formatRelativeAgo } = useFormatters()

  if (items.length === 0) {
    return (
      <div className="ops-ticker">
        <div className="ops-ticker__header">
          <span className="ops-ticker__label">{t('dashboard.opsFeed')}</span>
        </div>
        <p className="ops-ticker__empty">{t('dashboard.noEvents')}</p>
      </div>
    )
  }

  return (
    <div className="ops-ticker">
      <div className="ops-ticker__header">
        <span className="ops-ticker__label">{t('dashboard.opsFeed')}</span>
        <span className="ops-ticker__count tnum">{t('dashboard.eventsCount', { count: items.length })}</span>
      </div>
      <ul className="ops-ticker__list">
        {items.map((item) => (
          <li key={item.id} className="ops-ticker__item">
            <span className="ops-ticker__time tnum">{formatRelativeAgo(item.timestamp)}</span>
            <span className="ops-ticker__code tnum">{item.code}</span>
            <span className="ops-ticker__station">{item.station}</span>
            <span className={`ops-ticker__status ${statusTone[item.status]}`}>
              {item.status === 'repairing' ? (
                <span className="ops-ticker__beacon" aria-hidden />
              ) : null}
              {statusLabel(item.status)}
            </span>
            {item.detail ? <span className="ops-ticker__detail">{item.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
