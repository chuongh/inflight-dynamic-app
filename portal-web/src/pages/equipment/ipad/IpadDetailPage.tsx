import { Button, Spin, Tabs } from 'antd'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useIpads } from '@/modules/equipment/hooks/useEquipment'
import { DetailHero } from '@/components/patterns/DetailHero'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { Text } from '@/components/primitives/Text'
import { useFormatters } from '@/i18n/hooks/useFormatters'
import { paths } from '@/routes/paths'

export function IpadDetailPage() {
  const { t } = useTranslation()
  const { formatDate, formatDateDMY } = useFormatters()
  const { code = '' } = useParams()
  const { data: devices = [], isLoading } = useIpads()
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
        <Text tone="secondary">{t('equipment.ipad.notFound', { code })}</Text>
        <Link to={paths.equipment.ipad.list} className="ml-2 font-semibold text-vj-red">
          {t('equipment.ipad.backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="thin-scroll h-full overflow-auto p-5">
      <DetailHero
        backTo={paths.equipment.ipad.list}
        backLabel={t('equipment.ipad.backToList')}
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
        <Link to={paths.equipment.ipad.list}>
          <Button>{t('equipment.ipad.backToList')}</Button>
        </Link>
      </div>
    </div>
  )
}
