import {
  vjTokens,
  type EquipmentStatusKey,
  type RepairRequestStatusKey,
  type StatusToken,
} from '../../design-system/tokens'
import type { RepairRequestStatus } from '../../modules/equipment/types'
import type { TrolleyStatus } from '@/modules/equipment/constants'
import { useTranslation } from 'react-i18next'

type BadgeVariant = 'equipment' | 'repair'

interface BadgeProps {
  variant: BadgeVariant
  status: TrolleyStatus | RepairRequestStatus
  label?: string
  className?: string
}

function getToken(variant: BadgeVariant, status: TrolleyStatus | RepairRequestStatus): StatusToken {
  if (variant === 'equipment') {
    return vjTokens.equipmentStatus[status as EquipmentStatusKey]
  }
  return vjTokens.repairRequestStatus[status as RepairRequestStatusKey]
}

export function Badge({ variant, status, label, className = '' }: BadgeProps) {
  const { t } = useTranslation()
  const token = getToken(variant, status)
  const defaultLabel =
    variant === 'equipment'
      ? t(`equipment.status.${status as TrolleyStatus}`)
      : t(`equipment.repairStatus.${status as RepairRequestStatus}`)
  const text = label ?? defaultLabel

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{
        background: token.bg,
        color: token.text,
        borderColor: token.border,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: token.dot }} />
      {text}
    </span>
  )
}

export function EquipmentBadge({
  status,
  label,
  className,
}: {
  status: TrolleyStatus
  label?: string
  className?: string
}) {
  return <Badge variant="equipment" status={status} label={label} className={className} />
}

export function RepairRequestBadge({
  status,
  label,
  className,
}: {
  status: RepairRequestStatus
  label?: string
  className?: string
}) {
  return <Badge variant="repair" status={status} label={label} className={className} />
}
