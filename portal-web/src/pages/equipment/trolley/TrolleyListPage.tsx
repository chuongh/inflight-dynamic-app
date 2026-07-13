import { App as AntApp, Button, Input, Modal, Select, Table } from 'antd'
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface'
import { Download, FileUp, Search, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TrolleyRepairHistoryDrawer } from '@/components/equipment/TrolleyRepairHistoryDrawer'
import { ImportRepairResultsModal } from '@/components/equipment/ImportRepairResultsModal'
import {
  SendToRepairModal,
  type SendToRepairFormValues,
} from '@/components/equipment/SendToRepairModal'
import {
  MANUFACTURERS,
  STATIONS,
  type TrolleyStatus,
  type TrolleyType,
  type TrolleyUnit,
} from '@/modules/equipment/constants'
import { exportTrolleysCsv, summarizeFleet } from '@/modules/equipment/lib/generateTrolleys'
import { useRepairRequests, useSendTrolleysToRepair } from '@/modules/equipment/hooks/useEquipment'
import { summarizeRepairRequests } from '@/modules/equipment/repairRequest'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { EquipmentBadge } from '@/components/primitives/Badge'
import { Button as VjButton } from '@/components/primitives/Button'
import { Text } from '@/components/primitives/Text'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'
import { useFormatters } from '@/i18n/hooks/useFormatters'

interface TrolleyListPageProps {
  trolleys: TrolleyUnit[]
  onTrolleysChange: (next: TrolleyUnit[]) => void
}

export function TrolleyListPage({ trolleys, onTrolleysChange }: TrolleyListPageProps) {
  const { t } = useTranslation()
  const { statusLabel, typeLabel, bulkStatusOptions } = useEquipmentLabels()
  const { formatDateDMY, formatRelativeAgo } = useFormatters()
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TrolleyType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TrolleyStatus>('all')
  const [stationFilter, setStationFilter] = useState<string | 'all'>('all')
  const [manufacturerFilter, setManufacturerFilter] = useState<string | 'all'>('all')
  const [repairsAtLeast, setRepairsAtLeast] = useState<number | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<TrolleyStatus | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [repairOpen, setRepairOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data: repairRequests = [] } = useRepairRequests()
  const sendToRepair = useSendTrolleysToRepair()
  const repairSummary = useMemo(
    () => summarizeRepairRequests(repairRequests.filter((request) => request.equipmentType === 'trolley')),
    [repairRequests],
  )

  const summary = useMemo(() => summarizeFleet(trolleys), [trolleys])

  const filteredTrolleys = useMemo(() => {
    const query = search.trim().toLowerCase()
    return trolleys.filter((item) => {
      const matchedSearch =
        query === '' ||
        item.code.toLowerCase().includes(query) ||
        item.serialNumber.toLowerCase().includes(query) ||
        item.partNo.toLowerCase().includes(query)
      const matchedType = typeFilter === 'all' || item.type === typeFilter
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      const matchedStation = stationFilter === 'all' || item.station === stationFilter
      const matchedManufacturer =
        manufacturerFilter === 'all' || item.manufacturer === manufacturerFilter
      const matchedRepairs = repairsAtLeast == null || item.repairs >= repairsAtLeast

      return (
        matchedSearch &&
        matchedType &&
        matchedStatus &&
        matchedStation &&
        matchedManufacturer &&
        matchedRepairs
      )
    })
  }, [search, trolleys, typeFilter, statusFilter, stationFilter, manufacturerFilter, repairsAtLeast])

  const selectedRows = filteredTrolleys.filter((item) => selectedRowKeys.includes(item.code))
  const canSendRepair =
    selectedRows.length > 0 && selectedRows.every((item) => item.status === 'not-service')

  const handleSendRepair = (values: SendToRepairFormValues) => {
    sendToRepair.mutate(
      { codes: [...selectedRowKeys], vendor: values.vendor },
      {
        onSuccess: (created) => {
          const request = created[0]
          const count = request?.equipmentCodes.length ?? selectedRowKeys.length
          message.success(
            request
              ? t('equipment.trolley.sendRepairSuccess', {
                  id: request.id,
                  count,
                  vendor: values.vendor,
                })
              : t('equipment.trolley.sendRepairSuccessShort', {
                  count,
                  vendor: values.vendor,
                }),
          )
          setSelectedRowKeys([])
          setBulkStatus(null)
          setRepairOpen(false)
        },
        onError: () => {
          message.error(t('equipment.trolley.sendRepairFailed'))
        },
      },
    )
  }

  const handleChangeStatus = () => {
    if (!bulkStatus || selectedRowKeys.length === 0) return
    const selected = new Set(selectedRowKeys)
    onTrolleysChange(
      trolleys.map((item) =>
        selected.has(item.code)
          ? { ...item, status: bulkStatus, daysInStatus: 0, updatedAt: Date.now() }
          : item,
      ),
    )
    message.success(
      t('equipment.trolley.statusUpdated', {
        status: statusLabel(bulkStatus),
        count: selectedRowKeys.length,
      }),
    )
    setSelectedRowKeys([])
    setBulkStatus(null)
  }

  const columns: ColumnsType<TrolleyUnit> = useMemo(
    () => [
    {
      title: t('equipment.columns.code'),
      dataIndex: 'code',
      fixed: 'left',
      width: 110,
      sorter: (left, right) => left.code.localeCompare(right.code),
      defaultSortOrder: 'ascend',
      render: (value: string) => (
        <button
          type="button"
          className="table-cell-code tnum"
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/equipment/${value}`)
          }}
        >
          {value}
        </button>
      ),
    },
    {
      title: t('equipment.columns.type'),
      dataIndex: 'type',
      sorter: (left, right) => left.type.localeCompare(right.type),
      render: (value: TrolleyType) => (
        <Text variant="caption" tone="secondary">
          {typeLabel(value)}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.partNo'),
      dataIndex: 'partNo',
      sorter: (left, right) => left.partNo.localeCompare(right.partNo),
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.serial'),
      dataIndex: 'serialNumber',
      sorter: (left, right) => left.serialNumber.localeCompare(right.serialNumber),
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.mfg'),
      dataIndex: 'manufacturer',
      sorter: (left, right) => left.manufacturer.localeCompare(right.manufacturer),
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.mfgYear'),
      dataIndex: 'yearOfManufacture',
      render: (value: number) => (
        <Text variant="caption" tone="secondary" className="tnum">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.status'),
      dataIndex: 'status',
      sorter: (left, right) => left.status.localeCompare(right.status),
      render: (value: TrolleyStatus) => <EquipmentBadge status={value} />,
    },
    {
      title: t('equipment.columns.station'),
      dataIndex: 'station',
      sorter: (left, right) => left.station.localeCompare(right.station),
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.totalRepairs'),
      dataIndex: 'repairs',
      sorter: (left, right) => left.repairs - right.repairs,
      render: (value: number) => (
        <Text variant="caption" tone="primary" className="tnum font-semibold">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.lastRepairDate'),
      key: 'lastRepairDate',
      sorter: (left, right) => {
        const leftDate = left.repairHistory[0]?.completedAt ?? left.repairHistory[0]?.startedAt ?? 0
        const rightDate =
          right.repairHistory[0]?.completedAt ?? right.repairHistory[0]?.startedAt ?? 0
        return leftDate - rightDate
      },
      render: (_: unknown, record: TrolleyUnit) => {
        const lastRepair = record.repairHistory[0]
        const value = lastRepair?.completedAt ?? lastRepair?.startedAt
        if (!value) return <Text variant="caption" tone="muted">—</Text>
        return (
          <div className="leading-tight">
            <Text variant="caption" tone="primary" className="tnum font-medium">
              {formatDateDMY(value)}
            </Text>
            <Text variant="caption" tone="muted" className="text-[11px]">
              {formatRelativeAgo(value)}
            </Text>
          </div>
        )
      },
    },
  ],
    [t, typeLabel, formatDateDMY, formatRelativeAgo, navigate],
  )

  const rowSelection: TableRowSelection<TrolleyUnit> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as string[]),
  }

  return (
    <ListPageLayout
      title={t('equipment.trolley.listTitle')}
      description={t('equipment.trolley.listDesc')}
      actions={
        <>
          <Button icon={<Wrench className="h-4 w-4" />} onClick={() => setHistoryOpen(true)}>
            {t('equipment.trolley.repairHistory')}
            {repairSummary.unitsInOpenRequests > 0 ? (
              <span className="ml-1.5 inline-flex rounded-full border border-[var(--color-vj-yellow-border)] bg-[var(--color-vj-yellow-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-vj-yellow-text)]">
                {repairSummary.unitsInOpenRequests}
              </span>
            ) : null}
          </Button>
          <Button icon={<FileUp className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
            {t('common.import')}
          </Button>
          <Button
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              exportTrolleysCsv(filteredTrolleys)
              message.success(t('equipment.trolley.exportSuccess', { count: filteredTrolleys.length }))
            }}
          >
            {t('equipment.trolley.exportList')}
          </Button>
        </>
      }
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr]"
      filterBar={
        <>
          <Input
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('equipment.trolley.searchPlaceholder')}
            prefix={<Search className="h-4 w-4 text-text-muted" />}
          />
          <Select
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={[
              { value: 'all', label: t('equipment.trolley.allTypes') },
              { value: 'full', label: typeLabel('full') },
              { value: 'half', label: typeLabel('half') },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: 'all', label: t('equipment.trolley.allStatus') },
              { value: 'service', label: statusLabel('service') },
              { value: 'not-service', label: statusLabel('not-service') },
              { value: 'repairing', label: statusLabel('repairing') },
            ]}
          />
          <Select
            value={stationFilter}
            onChange={(value) => setStationFilter(value)}
            options={[
              { value: 'all', label: t('equipment.trolley.station') },
              ...STATIONS.map((station) => ({ value: station, label: station })),
            ]}
          />
          <Select
            value={manufacturerFilter}
            onChange={(value) => setManufacturerFilter(value)}
            options={[
              { value: 'all', label: t('equipment.trolley.manufacturer') },
              ...MANUFACTURERS.map((name) => ({ value: name, label: name })),
            ]}
          />
          <Select
            value={repairsAtLeast == null ? 'all' : String(repairsAtLeast)}
            onChange={(value) => setRepairsAtLeast(value === 'all' ? null : Number(value))}
            options={[
              { value: 'all', label: t('equipment.trolley.repairs') },
              { value: '2', label: t('equipment.trolley.repairsGte', { count: 2 }) },
              { value: '5', label: t('equipment.trolley.repairsGte', { count: 5 }) },
              { value: '8', label: t('equipment.trolley.repairsGte', { count: 8 }) },
            ]}
          />
        </>
      }
      footer={
        <>
          <Text variant="caption" tone="secondary" className="tnum font-semibold">
            {t('equipment.trolley.footerCount', { filtered: filteredTrolleys.length, total: summary.total })}
            {selectedRowKeys.length > 0
              ? t('equipment.trolley.footerSelected', { count: selectedRowKeys.length })
              : ''}
          </Text>
          <div className="flex items-center gap-2">
            <Select
              placeholder={t('equipment.trolley.changeStatus')}
              value={bulkStatus ?? undefined}
              onChange={(value) => setBulkStatus(value)}
              disabled={selectedRowKeys.length === 0}
              className="bulk-status-select"
              style={{ width: 160 }}
              options={bulkStatusOptions()}
            />
            <Button
              type="primary"
              disabled={!bulkStatus || selectedRowKeys.length === 0}
              onClick={handleChangeStatus}
            >
              {t('equipment.trolley.applyStatus')}
            </Button>
            <VjButton variant="warning" disabled={!canSendRepair} onClick={() => setRepairOpen(true)}>
              {t('equipment.trolley.sendToRepair')}
            </VjButton>
            <Button
              type="link"
              disabled={
                !search &&
                selectedRowKeys.length === 0 &&
                typeFilter === 'all' &&
                statusFilter === 'all' &&
                stationFilter === 'all' &&
                manufacturerFilter === 'all' &&
                repairsAtLeast == null
              }
              onClick={() => {
                setSearch('')
                setSelectedRowKeys([])
                setBulkStatus(null)
                setTypeFilter('all')
                setStatusFilter('all')
                setStationFilter('all')
                setManufacturerFilter('all')
                setRepairsAtLeast(null)
              }}
            >
              {t('common.clearFilters')}
            </Button>
          </div>
        </>
      }
      modals={
        <>
          <Modal
            open={importOpen}
            title={t('equipment.trolley.importResults')}
            footer={null}
            onCancel={() => setImportOpen(false)}
          >
            <ImportRepairResultsModal
              onImport={() => {
                message.info(t('equipment.trolley.importDemo'))
                setImportOpen(false)
              }}
            />
          </Modal>

          <SendToRepairModal
            open={repairOpen}
            unitCount={selectedRowKeys.length}
            unitLabel={t('common.carts')}
            onCancel={() => setRepairOpen(false)}
            onSubmit={handleSendRepair}
          />

          <TrolleyRepairHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            requests={repairRequests}
          />
        </>
      }
    >
      <Table
        rowKey="code"
        size="middle"
        columns={columns}
        dataSource={filteredTrolleys}
        rowSelection={rowSelection}
        onRow={(record) => ({
          onClick: (event) => {
            const target = event.target as HTMLElement
            if (
              target.closest('td.ant-table-selection-column') ||
              target.closest('button') ||
              target.closest('input')
            ) {
              return
            }
            navigate(`/equipment/${record.code}`)
          },
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
          showTotal: (total) => t('equipment.trolley.paginationTotal', { total }),
        }}
      />
    </ListPageLayout>
  )
}
