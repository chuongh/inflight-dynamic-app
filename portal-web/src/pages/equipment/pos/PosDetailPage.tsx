import { Button, Spin, Tabs } from 'antd'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { usePosDevices } from '@/modules/equipment/hooks/useEquipment'
import { DetailHero } from '@/components/patterns/DetailHero'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { Text } from '@/components/primitives/Text'
import { useFormatters } from '@/i18n/hooks/useFormatters'
import { paths } from '@/routes/paths'

export function PosDetailPage() {
  const { t } = useTranslation()
  const { formatDate, formatDateDMY } = useFormatters()
  const { code = '' } = useParams()
  const { data: devices = [], isLoading } = usePosDevices()
  const device = devices.find((item) => item.code === code)

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Text tone="secondary">{t('equipment.pos.notFound', { code })}</Text>
        <Link to={paths.equipment.pos.list} className="ml-2 font-semibold text-vj-red">
          {t('equipment.pos.backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="thin-scroll h-full overflow-auto p-5">
      <DetailHero
        backTo={paths.equipment.pos.list}
        backLabel={t('equipment.pos.backToList')}
        title={device.code}
        status={device.status}
        meta={
          <Text variant="caption" tone="secondary">
            {device.station} · {device.manufacturer} · {formatDate(device.updatedAt)}
          </Text>
        }
      />

      <Tabs
        className="mt-4"
        items={[
          {
            key: 'info',
            label: t('common.information'),
            children: (
              <SurfaceCard title={device.code}>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['Serial', device.serialNumber],
                    ['IMEI', device.imei],
                    ['Holder', device.holder],
                    ['Updated', formatDateDMY(device.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-text-muted">{label}</dt>
                      <dd className="text-sm font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </SurfaceCard>
            ),
          },
        ]}
      />

      <div className="mt-4">
        <Link to={paths.equipment.pos.list}>
          <Button>{t('equipment.pos.backToList')}</Button>
        </Link>
      </div>
    </div>
  )
}
