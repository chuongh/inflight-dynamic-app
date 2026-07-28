import { App as AntApp, Button, Drawer, Input, Select, Space, Spin, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Pencil, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { EquipmentBadge } from '@/components/primitives/Badge'
import { useAuth } from '@/core/auth/useAuth'
import {
  activeCatalogVersion,
  catalogVersionsNewestFirst,
  withNewAmenityCatalogVersion,
} from '@/modules/catering/catalog'
import type { AmenityCatalogItem } from '@/modules/catering/catalogTypes'
import { useAmenityCatalogData, useSaveAmenityCatalogData } from '@/modules/catering/hooks/useCatalog'
import { formatDateDMY } from '@/shared/utils/format'

export function AmenityCatalogPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useAmenityCatalogData()
  const save = useSaveAmenityCatalogData()

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [working, setWorking] = useState<AmenityCatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [needsCodeOnly, setNeedsCodeOnly] = useState(false)
  const [drawerItem, setDrawerItem] = useState<AmenityCatalogItem | null>(null)

  const versions = useMemo(() => catalogVersionsNewestFirst(data?.versions ?? []), [data])
  const active = useMemo(() => activeCatalogVersion(versions), [versions])
  const viewing = useMemo(
    () => versions.find((v) => v.id === viewingId) ?? active,
    [versions, viewingId, active],
  )
  const items = editing ? working : (viewing?.items ?? [])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (needsCodeOnly && !it.needsCode) return false
      if (!q) return true
      return (
        it.name.vi.toLowerCase().includes(q) ||
        (it.productCode?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [items, search, needsCodeOnly])

  if (isLoading || !data || !viewing) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  const startEdit = () => {
    setWorking(structuredClone(viewing.items))
    setEditing(true)
  }
  const cancelEdit = () => {
    setEditing(false)
    setWorking([])
    setDrawerItem(null)
  }
  const publish = () => {
    const today = formatDateDMY(Date.now())
    const next = withNewAmenityCatalogVersion(data.versions, working, {
      effectiveFrom: today,
      updatedBy: session?.user.name ?? 'Commercial',
      updatedAt: today,
      startsInFuture: false,
    })
    save.mutate(
      { ...data, versions: next },
      {
        onSuccess: () => {
          setViewingId(next[0].id)
          setEditing(false)
          setWorking([])
          message.success(t('catering.catalog.published', { id: next[0].id }))
        },
      },
    )
  }

  const columns: ColumnsType<AmenityCatalogItem> = [
    {
      title: t('catering.catalog.col.code'),
      dataIndex: 'productCode',
      width: 120,
      sorter: (a, b) => (a.productCode ?? '').localeCompare(b.productCode ?? ''),
      render: (v: string | null) =>
        v ? (
          <span className="table-cell-code tnum">{v}</span>
        ) : (
          <Tag color="warning">{t('catering.catalog.needsCode')}</Tag>
        ),
    },
    {
      title: t('catering.catalog.col.name'),
      key: 'name',
      width: 260,
      ellipsis: true,
      sorter: (a, b) => a.name.vi.localeCompare(b.name.vi),
      render: (_v, r) => <span className="font-semibold">{r.name.vi}</span>,
    },
    {
      title: t('catering.catalog.col.unit'),
      dataIndex: 'unit',
      width: 100,
      render: (v: string | null) => (
        <span className="text-text-secondary text-[12.5px] font-semibold">{v || '—'}</span>
      ),
    },
    {
      title: t('catering.catalog.col.status'),
      dataIndex: 'active',
      width: 120,
      sorter: (a, b) => Number(b.active) - Number(a.active),
      render: (v: boolean) =>
        v ? (
          <EquipmentBadge status="service" label={t('catering.catalog.status.active')} />
        ) : (
          <EquipmentBadge status="retired" label={t('catering.catalog.status.inactive')} />
        ),
    },
    ...(editing
      ? [
          {
            title: '',
            key: 'edit',
            width: 56,
            render: (_: unknown, r: AmenityCatalogItem) => (
              <Button
                type="text"
                size="small"
                icon={<Pencil size={15} />}
                aria-label={t('catering.catalog.edit')}
                onClick={() => setDrawerItem({ ...r })}
              />
            ),
          } as const,
        ]
      : []),
  ]

  return (
    <ListPageLayout
      badge={t('catering.catalog.amenity.badge')}
      title={t('catering.catalog.amenity.title')}
      description={t('catering.catalog.amenity.desc')}
      actions={
        <>
          <Select
            value={viewing.id}
            onChange={(id) => {
              setViewingId(id)
              if (editing) cancelEdit()
            }}
            style={{ minWidth: 150 }}
            options={versions.map((v) => ({
              value: v.id,
              label: `${v.id} · ${t(`catering.quota.status.${v.status}`)}`,
            }))}
          />
          {viewing.id === active?.id && !editing ? (
            <Button type="primary" icon={<Pencil size={15} />} onClick={startEdit}>
              {t('catering.catalog.edit')}
            </Button>
          ) : null}
        </>
      }
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[1.5fr_auto]"
      filterBar={
        <>
          <Input
            value={search}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('catering.catalog.searchAmenity')}
            prefix={<Search className="text-text-muted h-4 w-4" />}
          />
          <label className="text-text-secondary flex items-center gap-2 text-[13px] font-semibold">
            <Switch size="small" checked={needsCodeOnly} onChange={setNeedsCodeOnly} />
            {t('catering.catalog.filterNeedsCode')}
          </label>
        </>
      }
      footer={
        editing ? (
          <>
            <span className="text-text-secondary text-[12.5px] font-semibold">
              {filtered.length}/{items.length} {t('catering.catalog.items')}
            </span>
            <div className="flex items-center gap-2">
              <Button onClick={cancelEdit}>{t('common.cancel')}</Button>
              <Button type="primary" onClick={publish}>
                {t('catering.catalog.publish')}
              </Button>
            </div>
          </>
        ) : (
          <span className="text-text-secondary text-[12.5px] font-semibold">
            {filtered.length}/{items.length} {t('catering.catalog.items')}
          </span>
        )
      }
      modals={
        <Drawer
          open={!!drawerItem}
          onClose={() => setDrawerItem(null)}
          title={drawerItem?.name.vi}
          width={400}
          destroyOnHidden
          extra={
            drawerItem ? (
              <Space>
                <Button onClick={() => setDrawerItem(null)}>{t('common.cancel')}</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setWorking((prev) => prev.map((x) => (x.id === drawerItem.id ? drawerItem : x)))
                    setDrawerItem(null)
                  }}
                >
                  {t('common.save')}
                </Button>
              </Space>
            ) : null
          }
        >
          {drawerItem ? (
            <div className="catalog-drawer-form">
              <div>
                <label htmlFor="amn-code">{t('catering.catalog.col.code')}</label>
                <Input
                  id="amn-code"
                  value={drawerItem.productCode ?? ''}
                  onChange={(e) =>
                    setDrawerItem({
                      ...drawerItem,
                      productCode: e.target.value.trim() || null,
                      needsCode: !e.target.value.trim(),
                    })
                  }
                />
              </div>
              <div>
                <label htmlFor="amn-name">{t('catering.catalog.col.name')}</label>
                <Input
                  id="amn-name"
                  value={drawerItem.name.vi}
                  onChange={(e) => setDrawerItem({ ...drawerItem, name: { vi: e.target.value } })}
                />
              </div>
              <div>
                <label htmlFor="amn-unit">{t('catering.catalog.col.unit')}</label>
                <Input
                  id="amn-unit"
                  value={drawerItem.unit ?? ''}
                  onChange={(e) => setDrawerItem({ ...drawerItem, unit: e.target.value.trim() || null })}
                />
              </div>
              <label className="catalog-drawer-form__switch">
                <Switch
                  checked={drawerItem.active}
                  onChange={(active) => setDrawerItem({ ...drawerItem, active })}
                />
                {t('catering.catalog.status.active')}
              </label>
            </div>
          ) : null}
        </Drawer>
      }
    >
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={filtered}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
          showTotal: (total) => `${filtered.length}/${items.length} · ${total}`,
        }}
      />
    </ListPageLayout>
  )
}
