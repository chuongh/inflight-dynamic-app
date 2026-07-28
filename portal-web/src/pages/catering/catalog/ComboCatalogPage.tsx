import { App as AntApp, Button, Drawer, Input, Select, Space, Spin, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { EquipmentBadge } from '@/components/primitives/Badge'
import { useAuth } from '@/core/auth/useAuth'
import { activeCatalogVersion, replaceActiveCatalogItems } from '@/modules/catering/catalog'
import type { ComboCatalogItem, ComboKind } from '@/modules/catering/catalogTypes'
import { useComboCatalogData, useSaveComboCatalogData } from '@/modules/catering/hooks/useCatalog'
import { formatDateDMY } from '@/shared/utils/format'

const KINDS: ComboKind[] = ['charter', 'happy_meal', 'prebook_combo', 'set', 'meal_box']

const KIND_STYLE: Record<ComboKind, { bg: string; color: string; border: string }> = {
  charter: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  happy_meal: { bg: '#FFF4C4', color: '#C9A000', border: '#F0DC7A' },
  prebook_combo: { bg: '#FEEAE9', color: '#B91C1C', border: '#FECACA' },
  set: { bg: '#EDF9E0', color: '#4A7A00', border: '#B8E67A' },
  meal_box: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
}

function blankCombo(): ComboCatalogItem {
  return {
    id: `combo-${Date.now()}`,
    name: { vi: '' },
    description: '',
    kind: 'set',
    productCode: null,
    active: true,
  }
}

export function ComboCatalogPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useComboCatalogData()
  const save = useSaveComboCatalogData()

  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<ComboKind | 'all'>('all')
  const [drawerItem, setDrawerItem] = useState<ComboCatalogItem | null>(null)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('edit')

  const active = useMemo(() => activeCatalogVersion(data?.versions ?? []), [data])
  const items = active?.items ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (kind !== 'all' && it.kind !== kind) return false
      if (!q) return true
      return (
        it.name.vi.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        (it.productCode?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [items, search, kind])

  if (isLoading || !data || !active) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  const openAdd = () => {
    setDrawerMode('add')
    setDrawerItem(blankCombo())
  }

  const openEdit = (item: ComboCatalogItem) => {
    setDrawerMode('edit')
    setDrawerItem({ ...item, name: { ...item.name } })
  }

  const saveDrawer = (item: ComboCatalogItem) => {
    if (!item.name.vi.trim()) {
      message.warning(t('catering.catalog.nameRequired'))
      return
    }
    const nextItems = drawerMode === 'add' ? [...items, item] : items.map((x) => (x.id === item.id ? item : x))
    const today = formatDateDMY(Date.now())
    save.mutate(
      {
        ...data,
        versions: replaceActiveCatalogItems(data.versions, nextItems, {
          updatedBy: session?.user.name ?? 'Commercial',
          updatedAt: today,
        }),
      },
      {
        onSuccess: () => {
          setDrawerItem(null)
          message.success(t('catering.catalog.saved'))
        },
      },
    )
  }

  const columns: ColumnsType<ComboCatalogItem> = [
    {
      title: t('catering.catalog.col.code'),
      dataIndex: 'productCode',
      width: 120,
      sorter: (a, b) => (a.productCode ?? '').localeCompare(b.productCode ?? ''),
      render: (v: string | null) =>
        v ? <span className="table-cell-code tnum">{v}</span> : '—',
    },
    {
      title: t('catering.catalog.col.name'),
      key: 'name',
      width: 280,
      ellipsis: true,
      sorter: (a, b) => a.name.vi.localeCompare(b.name.vi),
      render: (_v, r) => <span className="font-semibold">{r.name.vi}</span>,
    },
    {
      title: t('catering.catalog.col.kind'),
      dataIndex: 'kind',
      width: 140,
      sorter: (a, b) => a.kind.localeCompare(b.kind),
      render: (k: ComboKind) => {
        const s = KIND_STYLE[k]
        return (
          <Tag style={{ background: s.bg, color: s.color, borderColor: s.border, fontWeight: 700 }}>
            {t(`catering.catalog.comboKind.${k}`)}
          </Tag>
        )
      },
    },
    {
      title: t('catering.catalog.col.description'),
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string) => (
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
    {
      title: '',
      key: 'edit',
      width: 56,
      align: 'center',
      render: (_v, r) => (
        <Button
          type="text"
          size="small"
          icon={<Pencil size={15} />}
          aria-label={t('catering.catalog.edit')}
          onClick={() => openEdit(r)}
        />
      ),
    },
  ]

  return (
    <ListPageLayout
      badge={t('catering.catalog.combos.badge')}
      title={t('catering.catalog.combos.title')}
      description={t('catering.catalog.combos.desc')}
      actions={
        <Button type="primary" icon={<Plus size={15} />} onClick={openAdd}>
          {t('catering.catalog.addItem')}
        </Button>
      }
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[1.5fr_220px]"
      filterBar={
        <>
          <Input
            value={search}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('catering.catalog.searchCombos')}
            prefix={<Search className="text-text-muted h-4 w-4" />}
          />
          <Select
            value={kind}
            onChange={setKind}
            options={[
              { value: 'all', label: t('catering.catalog.comboKind.all') },
              ...KINDS.map((k) => ({ value: k, label: t(`catering.catalog.comboKind.${k}`) })),
            ]}
          />
        </>
      }
      footer={
        <span className="text-text-secondary text-[12.5px] font-semibold">
          {filtered.length}/{items.length} {t('catering.catalog.items')}
        </span>
      }
      modals={
        <Drawer
          open={!!drawerItem}
          onClose={() => setDrawerItem(null)}
          title={drawerMode === 'add' ? t('catering.catalog.newItem') : drawerItem?.name.vi}
          width={420}
          destroyOnHidden
          extra={
            drawerItem ? (
              <Space>
                <Button onClick={() => setDrawerItem(null)}>{t('common.cancel')}</Button>
                <Button type="primary" loading={save.isPending} onClick={() => saveDrawer(drawerItem)}>
                  {t('common.save')}
                </Button>
              </Space>
            ) : null
          }
        >
          {drawerItem ? (
            <div className="catalog-drawer-form">
              <div>
                <label htmlFor="combo-name">{t('catering.catalog.col.name')}</label>
                <Input
                  id="combo-name"
                  value={drawerItem.name.vi}
                  onChange={(e) => setDrawerItem({ ...drawerItem, name: { vi: e.target.value } })}
                />
              </div>
              <div>
                <label htmlFor="combo-kind">{t('catering.catalog.col.kind')}</label>
                <Select
                  id="combo-kind"
                  className="w-full"
                  value={drawerItem.kind}
                  onChange={(k) => setDrawerItem({ ...drawerItem, kind: k })}
                  options={KINDS.map((k) => ({ value: k, label: t(`catering.catalog.comboKind.${k}`) }))}
                />
              </div>
              <div>
                <label htmlFor="combo-code">{t('catering.catalog.col.code')}</label>
                <Input
                  id="combo-code"
                  value={drawerItem.productCode ?? ''}
                  onChange={(e) =>
                    setDrawerItem({ ...drawerItem, productCode: e.target.value.trim() || null })
                  }
                />
              </div>
              <div>
                <label htmlFor="combo-desc">{t('catering.catalog.col.description')}</label>
                <Input.TextArea
                  id="combo-desc"
                  rows={4}
                  value={drawerItem.description}
                  onChange={(e) => setDrawerItem({ ...drawerItem, description: e.target.value })}
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
