import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { computeVendorScorecard, type VendorScore } from '@/modules/equipment/lib/analytics'
import { computeVendorOnTime } from '@/modules/equipment/lib/vendorOnTime'
import { useTrolleys } from '@/modules/equipment/hooks/useEquipment'
import { PageHeader } from '@/components/patterns/PageHeader'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { Text } from '@/components/primitives/Text'

interface VendorRow extends VendorScore {
  onTime: number
}

function reworkTone(rate: number): string {
  if (rate <= 0.08) return 'var(--color-vj-green-dark)'
  if (rate <= 0.15) return 'var(--color-vj-yellow-dark)'
  return 'var(--color-vj-red)'
}

function reworkBarColor(rate: number): string {
  if (rate <= 0.08) return 'var(--color-vj-green)'
  if (rate <= 0.15) return 'var(--color-vj-yellow)'
  return 'var(--color-vj-red)'
}

function onTimeTone(onTime: number): string {
  if (onTime >= 85) return 'var(--color-vj-green-dark)'
  if (onTime >= 70) return 'var(--color-vj-yellow-dark)'
  return 'var(--color-vj-red)'
}

function ratingStyle(rate: number): { bg: string; text: string; key: string } {
  if (rate <= 0.08) {
    return { bg: 'var(--color-vj-green-muted)', text: 'var(--color-vj-green-dark)', key: 'equipment.scorecard.ratingGood' }
  }
  if (rate <= 0.15) {
    return { bg: 'var(--color-vj-yellow-muted)', text: 'var(--color-vj-yellow-dark)', key: 'equipment.scorecard.ratingWatch' }
  }
  return { bg: 'var(--color-vj-red-50)', text: 'var(--color-vj-red-dark)', key: 'equipment.scorecard.ratingRisk' }
}

function RatingBadge({ rate }: { rate: number }) {
  const { t } = useTranslation()
  const style = ratingStyle(rate)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: style.bg, color: style.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.text }} />
      {t(style.key)}
    </span>
  )
}

function BarRow({ label, pct, value, color }: { label: string; pct: number; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs font-semibold text-[var(--color-foreground)]" title={label}>
        {label}
      </span>
      <span className="h-3 flex-1 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-background)]">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </span>
      <span className="tnum w-14 shrink-0 text-right text-xs font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export function VendorScorecardPage() {
  const { t } = useTranslation()
  const { data: trolleys = [], isLoading } = useTrolleys()

  const rows: VendorRow[] = useMemo(() => {
    const board = computeVendorScorecard(trolleys)
    const onTimeByVendor = computeVendorOnTime(trolleys)
    return board.map((vendor) => ({ ...vendor, onTime: onTimeByVendor[vendor.vendor] ?? 0 }))
  }, [trolleys])

  const worst = rows[0]
  const showRiskCallout = worst != null && worst.reworkRate > 0.15
  const maxReworkRate = Math.max(0.01, ...rows.map((row) => row.reworkRate))

  const volumeRows = useMemo(() => [...rows].sort((left, right) => right.repairs - left.repairs), [rows])
  const maxRepairs = Math.max(1, ...rows.map((row) => row.repairs))
  const topVolumeVendor = volumeRows[0]
  const showVolumeNote =
    topVolumeVendor != null && worst != null && topVolumeVendor.vendor === worst.vendor && worst.reworkRate > 0.15

  const columns: ColumnsType<VendorRow> = useMemo(
    () => [
      {
        title: t('equipment.scorecard.colVendor'),
        dataIndex: 'vendor',
        render: (value: string) => <span className="font-bold text-[var(--color-foreground)]">{value}</span>,
      },
      {
        title: t('equipment.scorecard.colRepairs'),
        dataIndex: 'repairs',
        align: 'right',
        render: (value: number) => <span className="tnum">{value}</span>,
      },
      {
        title: t('equipment.scorecard.colReworks'),
        dataIndex: 'reworks',
        align: 'right',
        render: (value: number) => <span className="tnum">{value}</span>,
      },
      {
        title: t('equipment.scorecard.colReworkRate'),
        dataIndex: 'reworkRate',
        align: 'right',
        render: (value: number) => (
          <span className="tnum font-bold" style={{ color: reworkTone(value) }}>
            {(value * 100).toFixed(1)}%
          </span>
        ),
      },
      {
        title: t('equipment.scorecard.colAvgTat'),
        dataIndex: 'avgTatDays',
        align: 'right',
        render: (value: number) => <span className="tnum">{value}d</span>,
      },
      {
        title: t('equipment.scorecard.colOnTime'),
        dataIndex: 'onTime',
        align: 'right',
        render: (value: number) => (
          <span className="tnum font-bold" style={{ color: onTimeTone(value) }}>
            {value}%
          </span>
        ),
      },
      {
        title: t('equipment.scorecard.colRating'),
        key: 'rating',
        render: (_: unknown, record: VendorRow) => <RatingBadge rate={record.reworkRate} />,
      },
    ],
    [t],
  )

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          badge={t('equipment.scorecard.badge')}
          title={t('equipment.scorecard.title')}
          description={t('equipment.scorecard.subtitle')}
        />

        {rows.length === 0 ? (
          <SurfaceCard>
            <Text tone="secondary">{t('equipment.scorecard.empty')}</Text>
          </SurfaceCard>
        ) : (
          <>
            <SurfaceCard
              title={t('equipment.scorecard.rankingTitle')}
              description={t('equipment.scorecard.rankingDesc')}
            >
              <Table
                rowKey="vendor"
                size="middle"
                columns={columns}
                dataSource={rows}
                pagination={false}
              />
            </SurfaceCard>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SurfaceCard title={t('equipment.scorecard.reworkChartTitle')}>
                <div className="flex flex-col gap-3">
                  {rows.map((row) => (
                    <BarRow
                      key={row.vendor}
                      label={row.vendor}
                      pct={(row.reworkRate / maxReworkRate) * 100}
                      value={`${(row.reworkRate * 100).toFixed(1)}%`}
                      color={reworkBarColor(row.reworkRate)}
                    />
                  ))}
                </div>

                {showRiskCallout ? (
                  <div className="mt-4 flex gap-3 rounded-xl border border-[var(--color-vj-red-hover)] bg-gradient-to-b from-[var(--color-vj-red-50)] to-[var(--color-surface)] p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-vj-red" aria-hidden />
                    <div>
                      <div className="text-sm font-extrabold text-[var(--color-foreground)]">
                        {t('equipment.scorecard.calloutTitle', { vendor: worst.vendor })}
                      </div>
                      <div className="mt-1 text-xs font-semibold leading-relaxed text-[var(--color-text-secondary)]">
                        {t('equipment.scorecard.calloutBody', {
                          rate: (worst.reworkRate * 100).toFixed(1),
                          onTime: worst.onTime,
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </SurfaceCard>

              <SurfaceCard title={t('equipment.scorecard.volumeChartTitle')}>
                <div className="flex flex-col gap-3">
                  {volumeRows.map((row) => (
                    <BarRow
                      key={row.vendor}
                      label={row.vendor}
                      pct={(row.repairs / maxRepairs) * 100}
                      value={String(row.repairs)}
                      color="var(--color-vj-dark)"
                    />
                  ))}
                </div>

                {showVolumeNote ? (
                  <Text variant="caption" tone="secondary" as="p" className="mt-3.5">
                    {t('equipment.scorecard.volumeNote', { vendor: topVolumeVendor.vendor })}
                  </Text>
                ) : null}
              </SurfaceCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
