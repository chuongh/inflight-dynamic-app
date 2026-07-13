import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EquipmentBadge } from '../primitives/Badge'
import type { TrolleyStatus } from '@/modules/equipment/constants'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'

interface DetailHeroProps {
  backTo: string
  backLabel?: string
  title: string
  status?: TrolleyStatus
  statusLabel?: string
  meta?: ReactNode
  actions?: ReactNode
}

export function DetailHero({
  backTo,
  backLabel,
  title,
  status,
  statusLabel: statusLabelProp,
  meta,
  actions,
}: DetailHeroProps) {
  const { t } = useTranslation()
  const { statusLabel } = useEquipmentLabels()
  const resolvedBackLabel = backLabel ?? t('common.back')

  return (
    <div className="detail-hero">
      <div className="detail-hero__top">
        <Link to={backTo} className="detail-hero__back interactive">
          <ArrowLeft size={16} />
          {resolvedBackLabel}
        </Link>
        {actions ? <div className="detail-hero__actions">{actions}</div> : null}
      </div>
      <div className="detail-hero__main">
        <h1 className="detail-hero__title font-vja-heading">{title}</h1>
        {status ? (
          <EquipmentBadge
            status={status}
            label={statusLabelProp ?? statusLabel(status)}
          />
        ) : null}
      </div>
      {meta ? <div className="detail-hero__meta">{meta}</div> : null}
    </div>
  )
}
