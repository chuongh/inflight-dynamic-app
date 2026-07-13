import { App as AntApp, Button, Input, Modal, Select, Table, Tabs, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  SendToRepairModal,
  type SendToRepairFormValues,
} from '@/components/equipment/SendToRepairModal'
import {
  VENDORS,
  type TrolleyRepairEntry,
  type TrolleyStatus,
  type TrolleyUnit,
} from '@/modules/equipment/constants'
import { useSendTrolleysToRepair } from '@/modules/equipment/hooks/useEquipment'
import { DetailHero } from '@/components/patterns/DetailHero'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { Button as VjButton } from '@/components/primitives/Button'
import { Text } from '@/components/primitives/Text'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'
import { useFormatters } from '@/i18n/hooks/useFormatters'

function TruncatedCell({ value }: { value?: string }) {
  if (!value) return <Text variant="caption" tone="muted">—</Text>
  return (
    <Tooltip title={value}>
      <span className="block max-w-[180px] truncate text-xs text-[var(--color-text-secondary)]">{value}</span>
    </Tooltip>
  )
}

interface TrolleyDetailPageProps {
  trolleys: TrolleyUnit[]
  onTrolleysChange: (next: TrolleyUnit[]) => void
}

export function TrolleyDetailPage({ trolleys, onTrolleysChange }: TrolleyDetailPageProps) {
  const { t } = useTranslation()
  const { statusLabel, typeLabel, bulkStatusOptions } = useEquipmentLabels()
  const { formatDateDMY, formatRelativeAgo } = useFormatters()
  const { message } = AntApp.useApp()
  const { code = '' } = useParams()
  const trolley = trolleys.find((item) => item.code === code)

  const [historySearch, setHistorySearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [repairOpen, setRepairOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState<TrolleyStatus | null>(null)
  const sendToRepair = useSendTrolleysToRepair()

  const filteredHistory = useMemo(() => {
    if (!trolley) return []
    const query = historySearch.trim().toLowerCase()
    return trolley.repairHistory.filter((entry) => {
      const matchedSearch =
        query === '' ||
        entry.issueDescription.toLowerCase().includes(query) ||
        (entry.repairContent ?? '').toLowerCase().includes(query) ||
        (entry.rootCause ?? '').toLowerCase().includes(query)
      const matchedVendor = vendorFilter === 'all' || entry.vendor === vendorFilter
      return matchedSearch && matchedVendor
    })
  }, [historySearch, vendorFilter, trolley])

  const repairColumns: ColumnsType<TrolleyRepairEntry> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 56,
        render: (_, __, index) => (
          <span className="tnum text-xs text-[var(--color-text-secondary)]">{filteredHistory.length - index}</span>
        ),
      },
      {
        title: t('equipment.repairColumns.started'),
        dataIndex: 'startedAt',
        defaultSortOrder: 'descend',
        sorter: (left, right) => left.startedAt - right.startedAt,
        render: (value: number) => (
          <span className="tnum text-xs text-[var(--color-text-secondary)]">{formatDateDMY(value)}</span>
        ),
      },
      {
        title: t('equipment.repairColumns.completed'),
        dataIndex: 'completedAt',
        sorter: (left, right) => (left.completedAt ?? 0) - (right.completedAt ?? 0),
        render: (value?: number) =>
          value ? (
            <span className="tnum text-xs text-[var(--color-text-secondary)]">{formatDateDMY(value)}</span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-[var(--color-vj-yellow-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-vj-yellow-dark)]">
              {t('equipment.repairColumns.inProgress')}
            </span>
          ),
      },
      {
        title: t('equipment.repairColumns.duration'),
        key: 'duration',
        sorter: (left, right) => {
          const leftDays = Math.max(
            1,
            Math.floor(((left.completedAt ?? Date.now()) - left.startedAt) / 86_400_000),
          )
          const rightDays = Math.max(
            1,
            Math.floor(((right.completedAt ?? Date.now()) - right.startedAt) / 86_400_000),
          )
          return leftDays - rightDays
        },
        render: (_, entry) => {
          const end = entry.completedAt ?? Date.now()
          const days = Math.max(1, Math.floor((end - entry.startedAt) / 86_400_000))
          return (
            <span className="tnum text-xs text-[var(--color-text-secondary)]">
              {days}d{entry.completedAt ? '' : t('equipment.repairColumns.ongoingSuffix')}
            </span>
          )
        },
      },
      {
        title: t('equipment.repairColumns.issueDescription'),
        dataIndex: 'issueDescription',
        render: (value: string) => <TruncatedCell value={value} />,
      },
      {
        title: t('equipment.repairColumns.repairContent'),
        dataIndex: 'repairContent',
        render: (value?: string) => <TruncatedCell value={value} />,
      },
      {
        title: t('equipment.repairColumns.rootCause'),
        dataIndex: 'rootCause',
        render: (value?: string) => <TruncatedCell value={value} />,
      },
      {
        title: t('equipment.columns.vendor'),
        dataIndex: 'vendor',
        sorter: (left, right) => left.vendor.localeCompare(right.vendor),
        render: (value: string) => <span className="text-xs font-medium text-[var(--color-foreground)]">{value}</span>,
      },
    ],
    [filteredHistory.length, formatDateDMY, t],
  )

  if (!trolley) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Text tone="secondary">{t('equipment.trolley.unitNotFound', { code })}</Text>
        <Link to="/equipment" className="ml-2 font-semibold text-vj-red">
          {t('equipment.backToList')}
        </Link>
      </div>
    )
  }

  const avgCycle = trolley.repairs > 0 ? (trolley.daysInStatus / trolley.repairs).toFixed(1) : '—'
  const lastRepair = trolley.repairHistory[0]
  const lastRepairDate = lastRepair?.completedAt ?? lastRepair?.startedAt

  const updateUnit = (patch: Partial<TrolleyUnit>) => {
    onTrolleysChange(
      trolleys.map((item) => (item.code === trolley.code ? { ...item, ...patch } : item)),
    )
  }

  const handleSendRepair = (values: SendToRepairFormValues) => {
    sendToRepair.mutate(
      { codes: [trolley.code], vendor: values.vendor },
      {
        onSuccess: () => {
          message.success(
            t('equipment.trolley.sendRepairOneSuccess', { code: trolley.code, vendor: values.vendor }),
          )
          setRepairOpen(false)
        },
        onError: () => message.error(t('equipment.trolley.sendRepairFailed')),
      },
    )
  }

  const handleUpdateStatus = () => {
    if (!nextStatus) return
    updateUnit({
      status: nextStatus,
      daysInStatus: 0,
      updatedAt: Date.now(),
    })
    message.success(
      t('equipment.trolley.updateStatusOne', {
        code: trolley.code,
        status: statusLabel(nextStatus),
      }),
    )
    setNextStatus(null)
    setStatusOpen(false)
  }

  const handleExportHistory = () => {
    const headers = [
      t('equipment.repairColumns.started'),
      t('equipment.repairColumns.completed'),
      t('equipment.repairColumns.issueDescription'),
      t('equipment.repairColumns.repairContent'),
      t('equipment.repairColumns.rootCause'),
      t('equipment.columns.vendor'),
    ]
    const rows = trolley.repairHistory.map((entry) => [
      new Date(entry.startedAt).toISOString().slice(0, 10),
      entry.completedAt ? new Date(entry.completedAt).toISOString().slice(0, 10) : '',
      entry.issueDescription,
      entry.repairContent ?? '',
      entry.rootCause ?? '',
      entry.vendor,
    ])
    const escape = (value: unknown) => {
      const text = String(value)
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    }
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${trolley.code}-repair-history.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    message.success(t('equipment.trolley.exportHistorySuccess'))
  }

  const historyEmptyText =
    trolley.repairHistory.length === 0
      ? t('equipment.trolley.noRepairHistory')
      : t('equipment.trolley.noRepairsMatchFilters')

  return (
    <div className="thin-scroll h-full overflow-auto p-5">
      <DetailHero
        backTo="/equipment"
        backLabel={t('equipment.backToList')}
        title={trolley.code}
        status={trolley.status}
        meta={
          <>
            <Text variant="bodySm" tone="secondary">
              {typeLabel(trolley.type)} · {trolley.manufacturer} · {trolley.serialNumber} ·{' '}
              {trolley.partNo}
            </Text>
            <div className="mt-4 flex gap-6 border-t border-[var(--color-border)] pt-4 text-sm">
              <div>
                <Text variant="caption" tone="secondary">{t('equipment.columns.totalRepairs')}</Text>
                <div className="tnum font-bold text-vj-dark">
                  {t('equipment.trolley.repairsCount', { count: trolley.repairs })}
                </div>
              </div>
              <div>
                <Text variant="caption" tone="secondary">{t('equipment.trolley.avgRepairCycle')}</Text>
                <div className="tnum font-bold text-vj-dark">
                  {avgCycle} {t('equipment.trolley.daysUnit')}
                </div>
              </div>
              <div>
                <Text variant="caption" tone="secondary">{t('equipment.columns.lastRepairDate')}</Text>
                {lastRepairDate ? (
                  <div className="leading-tight">
                    <div className="tnum font-bold text-vj-dark">{formatDateDMY(lastRepairDate)}</div>
                    <Text variant="caption" tone="muted">{formatRelativeAgo(lastRepairDate)}</Text>
                  </div>
                ) : (
                  <div className="tnum font-bold text-vj-dark">—</div>
                )}
              </div>
            </div>
          </>
        }
        actions={
          <>
            <VjButton
              variant="warning"
              disabled={trolley.status !== 'not-service'}
              onClick={() => setRepairOpen(true)}
            >
              {t('equipment.trolley.sendToRepair')}
            </VjButton>
            <Button
              type="primary"
              onClick={() => {
                setNextStatus(null)
                setStatusOpen(true)
              }}
            >
              {t('equipment.trolley.updateStatus')}
            </Button>
            <Button onClick={handleExportHistory}>{t('equipment.trolley.exportHistory')}</Button>
          </>
        }
      />

      <SurfaceCard>
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: t('common.information'),
              children: (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    [t('equipment.columns.partNo'), trolley.partNo],
                    [t('equipment.detail.serialNumber'), trolley.serialNumber],
                    [t('equipment.trolley.manufacturer'), trolley.manufacturer],
                    [t('equipment.detail.yearOfManufacture'), String(trolley.yearOfManufacture)],
                    [
                      t('equipment.detail.yearOfExpiry'),
                      trolley.yearOfExpiry ? String(trolley.yearOfExpiry) : '—',
                    ],
                    [t('equipment.detail.registrationLocation'), trolley.registrationLocation],
                    [t('equipment.detail.currentStation'), trolley.station],
                    [t('equipment.detail.repairVendor'), trolley.vendor],
                    [
                      t('equipment.columns.lastRepairDate'),
                      lastRepairDate
                        ? `${formatDateDMY(lastRepairDate)} · ${formatRelativeAgo(lastRepairDate)}`
                        : '—',
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-[var(--color-text-secondary)]">{label}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-vj-dark">{value}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
            {
              key: 'history',
              label: t('equipment.trolley.repairHistory'),
              children: (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <Select
                      value={vendorFilter}
                      onChange={setVendorFilter}
                      options={[
                        { value: 'all', label: t('equipment.trolley.allVendors') },
                        ...VENDORS.map((vendor) => ({ value: vendor, label: vendor })),
                      ]}
                    />
                    <Input
                      value={historySearch}
                      onChange={(event) => setHistorySearch(event.target.value)}
                      placeholder={t('equipment.trolley.searchHistoryPlaceholder')}
                    />
                  </div>

                  <Table
                    rowKey="id"
                    size="small"
                    columns={repairColumns}
                    dataSource={filteredHistory}
                    pagination={false}
                    locale={{ emptyText: historyEmptyText }}
                    scroll={{ x: 'max-content' }}
                    rowClassName={(record) =>
                      record.completedAt ? '' : 'bg-[var(--color-vj-yellow-muted)]/40'
                    }
                  />
                </div>
              ),
            },
          ]}
        />
      </SurfaceCard>

      <SendToRepairModal
        open={repairOpen}
        unitCount={1}
        unitLabel={t('common.unit')}
        onCancel={() => setRepairOpen(false)}
        onSubmit={handleSendRepair}
      />

      <Modal
        open={statusOpen}
        title={t('equipment.trolley.updateStatusModalTitle', { code: trolley.code })}
        okText={t('equipment.trolley.applyStatus')}
        okButtonProps={{ disabled: !nextStatus, type: 'primary' }}
        onCancel={() => {
          setStatusOpen(false)
          setNextStatus(null)
        }}
        onOk={handleUpdateStatus}
      >
        <p className="mb-3 text-sm text-[var(--color-text-secondary)]">
          {t('equipment.trolley.currentStatus')}{' '}
          <span className="font-semibold text-vj-dark">{statusLabel(trolley.status)}</span>
        </p>
        <Select
          className="w-full"
          placeholder={t('equipment.trolley.selectNewStatus')}
          value={nextStatus ?? undefined}
          onChange={(value) => setNextStatus(value)}
          options={bulkStatusOptions()}
        />
      </Modal>
    </div>
  )
}
