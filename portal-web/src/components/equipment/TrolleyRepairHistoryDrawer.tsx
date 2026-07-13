import { Drawer, Input, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table/interface'
import { Search, Wrench } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { STATIONS, VENDORS } from '@/modules/equipment/constants'
import {
  formatEquipmentCodes,
  summarizeRepairRequests,
} from '@/modules/equipment/repairRequest'
import type { RepairRequest, RepairRequestStatus } from '@/modules/equipment/types'
import { KpiCard } from '../patterns/KpiCard'
import { RepairRequestBadge } from '../primitives/Badge'
import { DaysBadge } from '../primitives/DaysBadge'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'
import { useFormatters } from '@/i18n/hooks/useFormatters'

interface TrolleyRepairHistoryDrawerProps {
  open: boolean
  onClose: () => void
  requests: RepairRequest[]
}

export function TrolleyRepairHistoryDrawer({
  open,
  onClose,
  requests,
}: TrolleyRepairHistoryDrawerProps) {
  const { t } = useTranslation()
  const { repairStatusOptions } = useEquipmentLabels()
  const { formatDateDMY } = useFormatters()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RepairRequestStatus>('all')
  const [stationFilter, setStationFilter] = useState<string | 'all'>('all')
  const [vendorFilter, setVendorFilter] = useState<string | 'all'>('all')
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null)

  const trolleyRequests = useMemo(
    () => requests.filter((request) => request.equipmentType === 'trolley'),
    [requests],
  )
  const summary = useMemo(() => summarizeRepairRequests(trolleyRequests), [trolleyRequests])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return trolleyRequests.filter((request) => {
      const matchedSearch =
        query === '' ||
        request.id.toLowerCase().includes(query) ||
        request.equipmentCodes.some((code) => code.toLowerCase().includes(query)) ||
        request.issueDescription.toLowerCase().includes(query) ||
        request.vendor.toLowerCase().includes(query)
      const matchedStatus = statusFilter === 'all' || request.status === statusFilter
      const matchedStation = stationFilter === 'all' || request.station === stationFilter
      const matchedVendor = vendorFilter === 'all' || request.vendor === vendorFilter
      return matchedSearch && matchedStatus && matchedStation && matchedVendor
    })
  }, [trolleyRequests, search, statusFilter, stationFilter, vendorFilter])

  const goToTrolley = useCallback(
    (code: string) => {
      navigate(`/equipment/${code}`)
      onClose()
    },
    [navigate, onClose],
  )

  const columns: ColumnsType<RepairRequest> = useMemo(
    () => [
      {
        title: t('equipment.repairDrawer.requestId'),
        dataIndex: 'id',
        width: 130,
        render: (value: string) => (
          <span className="tnum font-mono text-xs font-bold text-vj-red">{value}</span>
        ),
      },
      {
        title: t('equipment.repairDrawer.units'),
        width: 72,
        render: (_value, record) => (
          <span className="tnum text-xs font-semibold text-[var(--color-text-secondary)]">
            {record.equipmentCodes.length}
          </span>
        ),
      },
      {
        title: t('equipment.columns.station'),
        dataIndex: 'station',
        width: 80,
      },
      {
        title: t('equipment.columns.vendor'),
        dataIndex: 'vendor',
        width: 130,
        ellipsis: true,
      },
      {
        title: t('equipment.repairDrawer.issue'),
        dataIndex: 'issueDescription',
        ellipsis: true,
      },
      {
        title: t('equipment.repairDrawer.sent'),
        dataIndex: 'requestedAt',
        width: 100,
        sorter: (left, right) => left.requestedAt - right.requestedAt,
        defaultSortOrder: 'descend',
        render: (value: number) => (
          <span className="tnum text-xs text-[var(--color-text-secondary)]">{formatDateDMY(value)}</span>
        ),
      },
      {
        title: t('equipment.columns.status'),
        dataIndex: 'status',
        width: 110,
        render: (value: RepairRequestStatus) => <RepairRequestBadge status={value} />,
      },
      {
        title: t('equipment.repairDrawer.days'),
        width: 70,
        render: (_value, record) => {
          if (record.turnaroundDays != null) {
            return <span className="tnum text-xs text-[var(--color-text-secondary)]">{record.turnaroundDays}d</span>
          }
          if (record.status === 'open') {
            const days = Math.max(0, Math.floor((Date.now() - record.requestedAt) / 86_400_000))
            return <DaysBadge days={days} />
          }
          return <span className="text-xs text-[var(--color-text-muted)]">—</span>
        },
      },
    ],
    [formatDateDMY, t],
  )

  return (
    <>
      <Drawer
        title={t('equipment.repairDrawer.title')}
        placement="right"
        width={Math.min(960, typeof window !== 'undefined' ? window.innerWidth - 24 : 960)}
        open={open}
        onClose={() => {
          setSelectedRequest(null)
          onClose()
        }}
        destroyOnClose
      >
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{t('equipment.repairDrawer.description')}</p>

        <div className="kpi-grid kpi-grid--4 mb-4">
          <KpiCard
            label={t('equipment.repairDrawer.totalRequests')}
            value={summary.total}
            icon={Wrench}
            tone="brand"
          />
          <KpiCard
            label={t('equipment.repairDrawer.openRequests')}
            value={summary.open}
            icon={Wrench}
            tone="warning"
          />
          <KpiCard
            label={t('equipment.repairDrawer.unitsInRepair')}
            value={summary.unitsInOpenRequests}
            hint={t('equipment.repairDrawer.fromOpenRequests')}
            icon={Wrench}
            tone="warning"
          />
          <KpiCard
            label={t('equipment.repairDrawer.avgTurnaround')}
            value={summary.avgTurnaround > 0 ? `${summary.avgTurnaround}d` : '—'}
            hint={t('equipment.repairDrawer.completedRequests')}
            icon={Wrench}
            tone="success"
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            allowClear
            placeholder={t('equipment.repairDrawer.searchPlaceholder')}
            prefix={<Search className="h-4 w-4 text-[var(--color-text-muted)]" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={repairStatusOptions()}
          />
          <Select
            value={stationFilter}
            onChange={setStationFilter}
            options={[
              { value: 'all', label: t('equipment.repairDrawer.allStations') },
              ...STATIONS.map((station) => ({ value: station, label: station })),
            ]}
          />
          <Select
            value={vendorFilter}
            onChange={setVendorFilter}
            options={[
              { value: 'all', label: t('equipment.repairDrawer.allVendors') },
              ...VENDORS.map((vendor) => ({ value: vendor, label: vendor })),
            ]}
          />
        </div>

        <Table<RepairRequest>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 15,
            showTotal: (total) => t('equipment.repairDrawer.paginationTotal', { total }),
          }}
          onRow={(record) => ({
            onClick: () => setSelectedRequest(record),
            className: 'cursor-pointer',
          })}
        />
      </Drawer>

      <Drawer
        title={selectedRequest?.id ?? t('equipment.repairDrawer.requestDetail')}
        placement="right"
        width={420}
        open={selectedRequest != null}
        onClose={() => setSelectedRequest(null)}
      >
        {selectedRequest ? (
          <div className="space-y-4 text-sm">
            <div>
              <RepairRequestBadge status={selectedRequest.status} />
            </div>
            <dl className="space-y-3">
              {[
                [t('equipment.repairDrawer.trolleys'), formatEquipmentCodes(selectedRequest.equipmentCodes)],
                [t('equipment.repairDrawer.units'), String(selectedRequest.equipmentCodes.length)],
                [t('equipment.columns.station'), selectedRequest.station],
                [t('equipment.columns.vendor'), selectedRequest.vendor],
                [t('equipment.repairDrawer.issue'), selectedRequest.issueDescription],
                [t('equipment.repairDrawer.sent'), formatDateDMY(selectedRequest.requestedAt)],
                [
                  t('equipment.repairDrawer.completed'),
                  selectedRequest.completedAt
                    ? formatDateDMY(selectedRequest.completedAt)
                    : '—',
                ],
                [
                  t('equipment.repairDrawer.turnaround'),
                  selectedRequest.turnaroundDays != null
                    ? t('equipment.repairDrawer.turnaroundDays', {
                        count: selectedRequest.turnaroundDays,
                      })
                    : '—',
                ],
                [t('equipment.repairDrawer.repairContent'), selectedRequest.repairContent ?? '—'],
                [t('equipment.repairDrawer.rootCause'), selectedRequest.rootCause ?? '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-[var(--color-text-secondary)]">{label}</dt>
                  <dd className="mt-0.5 font-medium text-vj-dark">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {t('equipment.repairDrawer.includedTrolleys')}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedRequest.equipmentCodes.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className="tnum rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-bold text-vj-red hover:bg-[var(--color-background)]"
                    onClick={() => {
                      goToTrolley(code)
                      setSelectedRequest(null)
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  )
}
