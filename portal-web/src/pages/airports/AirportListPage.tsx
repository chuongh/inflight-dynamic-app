import { App as AntApp, Button, Dropdown, Input, Select, Spin, Switch, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  Building2,
  Map as MapIcon,
  MapPinned,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  UtensilsCrossed,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterBar } from '@/components/patterns/FilterBar'
import { KpiCard } from '@/components/patterns/KpiCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { useAirports, useSaveAirports } from '@/modules/airports/hooks/useAirports'
import type { Airport, AirportFormValues, AirportMap } from '@/modules/airports/types'
import { AirportFormModal } from './AirportFormModal'
import { AirportMapSetupModal } from './AirportMapSetupModal'
import { LaterTag } from './LaterTag'

const STATUS_COLOR: Record<Airport['status'], string> = {
  active: 'green',
  draft: 'default',
  inactive: 'red',
}

export function AirportListPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { data: airports = [], isLoading } = useAirports()
  const saveAirports = useSaveAirports()

  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | Airport['kind']>('all')
  const [cateringFilter, setCateringFilter] = useState<'all' | 'yes' | 'no'>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [activeAirport, setActiveAirport] = useState<Airport | null>(null)

  const [mapOpen, setMapOpen] = useState(false)
  const [mapAirport, setMapAirport] = useState<Airport | null>(null)

  const persist = (next: Airport[]) => saveAirports.mutate(next)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return airports.filter((a) => {
      const matchedSearch =
        query === '' ||
        a.code.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query)
      const matchedKind = kindFilter === 'all' || a.kind === kindFilter
      const matchedCatering =
        cateringFilter === 'all' ||
        (cateringFilter === 'yes' ? a.hasCatering : !a.hasCatering)
      return matchedSearch && matchedKind && matchedCatering
    })
  }, [airports, search, kindFilter, cateringFilter])

  const cateringCount = airports.filter((a) => a.hasCatering).length
  const mappedCount = airports.filter((a) => (a.map?.points.length ?? 0) > 0).length

  const openAdd = () => {
    setFormMode('add')
    setActiveAirport(null)
    setFormOpen(true)
  }

  const openEdit = (airport: Airport) => {
    setFormMode('edit')
    setActiveAirport(airport)
    setFormOpen(true)
  }

  const openMap = (airport: Airport) => {
    setMapAirport(airport)
    setMapOpen(true)
  }

  const handleSubmit = (values: AirportFormValues) => {
    if (formMode === 'add') {
      const created: Airport = { ...values, updatedAt: Date.now() }
      persist([created, ...airports])
      message.success(t('airports.savedAdd', { code: created.code }))
    } else {
      persist(
        airports.map((a) => (a.code === values.code ? { ...a, ...values, updatedAt: Date.now() } : a)),
      )
      message.success(t('airports.savedEdit', { code: values.code }))
    }
    setFormOpen(false)
  }

  const toggleCatering = (code: string, checked: boolean) => {
    persist(
      airports.map((a) => (a.code === code ? { ...a, hasCatering: checked, updatedAt: Date.now() } : a)),
    )
  }

  const handleSaveMap = (code: string, map: AirportMap) => {
    persist(airports.map((a) => (a.code === code ? { ...a, map, updatedAt: Date.now() } : a)))
    setMapOpen(false)
  }

  const rowMenu = (airport: Airport): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <Pencil size={14} />,
      label: t('airports.editInfo'),
      onClick: () => openEdit(airport),
    },
    {
      key: 'map',
      icon: <MapIcon size={14} />,
      label: (
        <span className="airport-menu-item-later">
          {t('airports.setupMap')}
          <LaterTag />
        </span>
      ),
      onClick: () => openMap(airport),
    },
  ]

  const columns: ColumnsType<Airport> = [
    {
      title: t('airports.col.code'),
      dataIndex: 'code',
      width: 90,
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (value: string) => <span className="airport-code tnum">{value}</span>,
    },
    {
      title: t('airports.col.name'),
      dataIndex: 'name',
      render: (value: string, record) => (
        <div>
          <div className="airport-name">{value}</div>
          <div className="airport-name__sub">{record.icao ?? '—'}</div>
        </div>
      ),
    },
    {
      title: t('airports.col.city'),
      dataIndex: 'city',
      render: (value: string) => <span className="airport-muted">{value}</span>,
    },
    {
      title: t('airports.col.kind'),
      dataIndex: 'kind',
      width: 120,
      render: (value: Airport['kind']) => (
        <Tag color={value === 'international' ? 'blue' : 'default'}>{t(`airports.kind.${value}`)}</Tag>
      ),
    },
    {
      title: t('airports.col.catering'),
      dataIndex: 'hasCatering',
      width: 150,
      filters: [
        { text: t('airports.catering.on'), value: true },
        { text: t('airports.catering.off'), value: false },
      ],
      onFilter: (value, record) => record.hasCatering === value,
      render: (value: boolean, record) => (
        <div className="airport-catering-cell">
          <Switch
            checked={value}
            onChange={(checked) => toggleCatering(record.code, checked)}
            aria-label={t('airports.col.catering')}
          />
          <span className={value ? 'airport-catering-cell__on' : 'airport-catering-cell__off'}>
            {value ? t('airports.catering.on') : t('airports.catering.off')}
          </span>
        </div>
      ),
    },
    {
      title: (
        <span className="airport-col-later">
          {t('airports.col.map')}
          <LaterTag />
        </span>
      ),
      key: 'map',
      width: 230,
      render: (_value, record) => {
        const points = record.map?.points.length ?? 0
        const zones = record.map?.zones.length ?? 0
        if (points === 0) {
          return (
            <Button size="small" icon={<Plus size={14} />} onClick={() => openMap(record)}>
              {t('airports.map.draw')}
            </Button>
          )
        }
        return (
          <div className="airport-map-cell">
            <Tag color="green">{t('airports.map.badge', { points, zones })}</Tag>
            {record.map?.published ? (
              <Tag>{t('airports.map.publishedTag', { v: record.map.version })}</Tag>
            ) : (
              <Tag color="orange">{t('airports.map.draft')}</Tag>
            )}
          </div>
        )
      },
    },
    {
      title: t('airports.col.status'),
      dataIndex: 'status',
      width: 110,
      render: (value: Airport['status']) => (
        <Tag color={STATUS_COLOR[value]}>{t(`airports.status.${value}`)}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      align: 'center',
      render: (_value, record) => (
        <Dropdown menu={{ items: rowMenu(record) }} trigger={['click']} placement="bottomRight">
          <button type="button" className="airport-row-menu" aria-label={t('airports.actions')}>
            <MoreHorizontal size={18} />
          </button>
        </Dropdown>
      ),
    },
  ]

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
          badge={t('airports.badge')}
          title={t('airports.listTitle')}
          description={t('airports.listDesc')}
          actions={
            <Button type="primary" icon={<Plus size={16} />} onClick={openAdd}>
              {t('airports.add')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard
            icon={Building2}
            label={t('airports.kpiTotal')}
            value={airports.length}
            hint={t('airports.kpiTotalHint', {
              dom: airports.filter((a) => a.kind === 'domestic').length,
              intl: airports.filter((a) => a.kind === 'international').length,
            })}
          />
          <KpiCard
            icon={UtensilsCrossed}
            tone="brand"
            label={t('airports.kpiCatering')}
            value={cateringCount}
            hint={t('airports.kpiCateringHint')}
          />
          <KpiCard
            icon={MapPinned}
            label={t('airports.kpiMapped')}
            value={mappedCount}
            hint={t('airports.kpiMappedHint')}
            badge={<LaterTag />}
          />
        </div>

        <FilterBar className="grid grid-cols-1 gap-2 lg:grid-cols-[1.7fr_1fr_1fr]">
          <Input
            value={search}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('airports.searchPlaceholder')}
            prefix={<Search className="h-4 w-4 text-text-muted" />}
          />
          <Select
            value={kindFilter}
            onChange={setKindFilter}
            options={[
              { value: 'all', label: t('airports.filterKind') },
              { value: 'domestic', label: t('airports.kind.domestic') },
              { value: 'international', label: t('airports.kind.international') },
            ]}
          />
          <Select
            value={cateringFilter}
            onChange={setCateringFilter}
            options={[
              { value: 'all', label: t('airports.filterCatering') },
              { value: 'yes', label: t('airports.catering.on') },
              { value: 'no', label: t('airports.catering.off') },
            ]}
          />
        </FilterBar>

        <div className="data-table-wrap data-table-wrap--ops">
          <Table
            rowKey="code"
            size="middle"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50'],
              showTotal: (total) => t('airports.total', { count: total }),
            }}
          />
        </div>
      </div>

      <AirportFormModal
        open={formOpen}
        mode={formMode}
        airport={activeAirport}
        existingCodes={airports.map((a) => a.code)}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <AirportMapSetupModal
        open={mapOpen}
        airport={mapAirport}
        onCancel={() => setMapOpen(false)}
        onSave={handleSaveMap}
      />
    </div>
  )
}
