import { App as AntApp, Button, Input, Select, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  SendToRepairModal,
  type SendToRepairFormValues,
} from '@/components/equipment/SendToRepairModal'
import {
  MANUFACTURERS,
  STATIONS,
  type TrolleyStatus,
} from '@/modules/equipment/constants'
import { type PortableDevice } from '@/modules/equipment/lib/generatePortableDevices'
import { usePosDevices, useSavePosDevices } from '@/modules/equipment/hooks/useEquipment'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { EquipmentBadge } from '@/components/primitives/Badge'
import { Button as VjButton } from '@/components/primitives/Button'
import { Text } from '@/components/primitives/Text'
import { useEquipmentLabels } from '@/i18n/hooks/useEquipmentLabels'
import { useFormatters } from '@/i18n/hooks/useFormatters'

export function PosPage() {
  const { t } = useTranslation()
  const { statusLabel, bulkStatusOptions } = useEquipmentLabels()
  const { formatDate } = useFormatters()
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const { data: devices = [], isLoading } = usePosDevices()
  const savePos = useSavePosDevices()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TrolleyStatus>('all')
  const [stationFilter, setStationFilter] = useState<string | 'all'>('all')
  const [manufacturerFilter, setManufacturerFilter] = useState<string | 'all'>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<TrolleyStatus | null>(null)
  const [repairOpen, setRepairOpen] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return devices.filter((item) => {
      const matchedSearch =
        query === '' ||
        item.code.toLowerCase().includes(query) ||
        (item.serialNumber ?? '').toLowerCase().includes(query) ||
        (item.imei ?? '').toLowerCase().includes(query)
      const matchedStatus = statusFilter === 'all' || item.status === statusFilter
      const matchedStation = stationFilter === 'all' || item.station === stationFilter
      const matchedManufacturer = manufacturerFilter === 'all' || item.manufacturer === manufacturerFilter
      return matchedSearch && matchedStatus && matchedStation && matchedManufacturer
    })
  }, [devices, search, statusFilter, stationFilter, manufacturerFilter])

  const selectedRows = filtered.filter((item) => selectedRowKeys.includes(item.code))
  const canSendRepair =
    selectedRows.length > 0 && selectedRows.every((item) => item.status === 'not-service')

  const handleSendRepair = (values: SendToRepairFormValues) => {
    const selected = new Set(selectedRowKeys)
    const now = Date.now()
    savePos.mutate(
      devices.map((item) =>
        selected.has(item.code)
          ? {
              ...item,
              status: 'repairing' as TrolleyStatus,
              vendor: values.vendor,
              sentForRepairAt: now,
              issueDescription: 'Sent for repair',
              updatedAt: now,
            }
          : item,
      ),
    )
    message.success(`Sent ${selectedRowKeys.length} POS devices to ${values.vendor}.`)
    setSelectedRowKeys([])
    setBulkStatus(null)
    setRepairOpen(false)
  }

  const handleChangeStatus = () => {
    if (!bulkStatus || selectedRowKeys.length === 0) return
    const selected = new Set(selectedRowKeys)
    savePos.mutate(
      devices.map((item) =>
        selected.has(item.code)
          ? { ...item, status: bulkStatus, updatedAt: Date.now() }
          : item,
      ),
    )
    message.success(t('equipment.pos.statusUpdated', { status: statusLabel(bulkStatus), count: selectedRowKeys.length }))
    setSelectedRowKeys([])
    setBulkStatus(null)
  }

  const columns: ColumnsType<PortableDevice> = [
    {
      title: t('equipment.columns.code'),
      dataIndex: 'code',
      sorter: (left, right) => left.code.localeCompare(right.code),
      render: (value: string) => (
        <button
          type="button"
          className="table-cell-code tnum"
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/equipment/pos/${value}`)
          }}
        >
          {value}
        </button>
      ),
    },
    {
      title: t('equipment.columns.serial'),
      dataIndex: 'serialNumber',
      render: (value?: string) => (
        <Text variant="caption" tone="secondary">
          {value ?? '—'}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.imei'),
      dataIndex: 'imei',
      render: (value?: string) => (
        <Text variant="caption" tone="secondary">
          {value ?? '—'}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.mfg'),
      dataIndex: 'manufacturer',
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.status'),
      dataIndex: 'status',
      render: (value: TrolleyStatus) => <EquipmentBadge status={value} />,
    },
    {
      title: t('equipment.columns.station'),
      dataIndex: 'station',
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.holder'),
      dataIndex: 'holder',
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('equipment.columns.updated'),
      dataIndex: 'updatedAt',
      render: (value: number) => (
        <Text variant="caption" tone="secondary">
          {formatDate(value)}
        </Text>
      ),
    },
  ]

  const rowSelection: TableRowSelection<PortableDevice> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as string[]),
  }

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <ListPageLayout
      title={t('equipment.pos.listTitle')}
      description={t('equipment.pos.listDesc')}
      actions={<Button icon={<Download className="h-4 w-4" />}>{t('equipment.pos.exportList')}</Button>}
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr]"
      filterBar={
        <>
          <Input
            value={search}
            allowClear
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('equipment.pos.searchPlaceholder')}
            prefix={<Search className="h-4 w-4 text-text-muted" />}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('equipment.trolley.allStatus') },
              { value: 'service', label: statusLabel('service') },
              { value: 'not-service', label: statusLabel('not-service') },
              { value: 'repairing', label: statusLabel('repairing') },
            ]}
          />
          <Select
            value={stationFilter}
            onChange={setStationFilter}
            options={[{ value: 'all', label: t('equipment.trolley.station') }, ...STATIONS.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            value={manufacturerFilter}
            onChange={setManufacturerFilter}
            options={[
              { value: 'all', label: t('equipment.trolley.manufacturer') },
              ...MANUFACTURERS.map((name) => ({ value: name, label: name })),
            ]}
          />
        </>
      }
      footer={
        <>
          <Text variant="caption" tone="secondary" className="tnum font-semibold">
            {filtered.length} of {devices.length} POS devices
            {selectedRowKeys.length > 0 ? ` · ${selectedRowKeys.length} selected` : ''}
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
              Apply status
            </Button>
            <VjButton variant="warning" disabled={!canSendRepair} onClick={() => setRepairOpen(true)}>
              Send to repair
            </VjButton>
            <Button
              type="link"
              disabled={
                !search &&
                selectedRowKeys.length === 0 &&
                statusFilter === 'all' &&
                stationFilter === 'all' &&
                manufacturerFilter === 'all'
              }
              onClick={() => {
                setSearch('')
                setSelectedRowKeys([])
                setBulkStatus(null)
                setStatusFilter('all')
                setStationFilter('all')
                setManufacturerFilter('all')
              }}
            >
              Clear filters
            </Button>
          </div>
        </>
      }
      modals={
        <SendToRepairModal
          open={repairOpen}
          unitCount={selectedRowKeys.length}
          unitLabel="POS devices"
          onCancel={() => setRepairOpen(false)}
          onSubmit={handleSendRepair}
        />
      }
    >
      <Table
        rowKey="code"
        size="middle"
        columns={columns}
        dataSource={filtered}
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
            navigate(`/equipment/pos/${record.code}`)
          },
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
          showTotal: (total) => `${total} POS devices`,
        }}
      />
    </ListPageLayout>
  )
}
