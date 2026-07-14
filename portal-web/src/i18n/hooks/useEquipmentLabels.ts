import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TrolleyStatus, TrolleyType } from '@/modules/equipment/constants'
import type { RepairRequestStatus } from '@/modules/equipment/types'

/** Translated equipment status / type labels for selects, tables, badges */
export function useEquipmentLabels() {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      statusLabel: (status: TrolleyStatus) => t(`equipment.status.${status}`),
      typeLabel: (type: TrolleyType) => t(`equipment.type.${type}`),
      repairStatusLabel: (status: RepairRequestStatus) =>
        t(`equipment.repairStatus.${status}`),
      statusOptions: (includeAll = true) => [
        ...(includeAll ? [{ value: 'all' as const, label: t('equipment.trolley.allStatus') }] : []),
        { value: 'service' as const, label: t('equipment.status.service') },
        { value: 'not-service' as const, label: t('equipment.status.not-service') },
        { value: 'repairing' as const, label: t('equipment.status.repairing') },
      ],
      bulkStatusOptions: () => [
        { value: 'service' as const, label: t('equipment.status.service') },
        { value: 'not-service' as const, label: t('equipment.status.not-service') },
        { value: 'repairing' as const, label: t('equipment.status.repairing') },
        { value: 'retired' as const, label: t('equipment.status.retired') },
      ],
      repairStatusOptions: (includeAll = true) => [
        ...(includeAll
          ? [{ value: 'all' as const, label: t('equipment.trolley.allStatus') }]
          : []),
        { value: 'open' as const, label: t('equipment.repairStatus.open') },
        { value: 'completed' as const, label: t('equipment.repairStatus.completed') },
        { value: 'cancelled' as const, label: t('equipment.repairStatus.cancelled') },
      ],
    }),
    [t],
  )
}
