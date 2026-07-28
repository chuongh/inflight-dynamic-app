import { App as AntApp, Button, Drawer, Input, Select, Space, Spin, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { EquipmentBadge } from '@/components/primitives/Badge'
import { useAuth } from '@/core/auth/useAuth'
import { activeCatalogVersion, replaceActiveCatalogItems } from '@/modules/catering/catalog'
import type { MealCatalogItem, MealItemCategory } from '@/modules/catering/catalogTypes'
import {
  MEAL_CATEGORIES,
  MEAL_CATEGORY_STYLE,
} from '@/modules/catering/mealCategoryMeta'
import { useMealCatalogData, useSaveMealCatalogData } from '@/modules/catering/hooks/useCatalog'
import { formatDateDMY } from '@/shared/utils/format'

function blankMeal(): MealCatalogItem {
  return {
    id: `meal-${Date.now()}`,
    productCode: null,
    name: { vi: '' },
    unit: null,
    category: 'eco_main',
    cabinScopes: ['ECO'],
    active: true,
    needsCode: true,
  }
}

export function MealCatalogPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useMealCatalogData()
  const save = useSaveMealCatalogData()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<MealItemCategory | 'all'>('all')
  const [needsCodeOnly, setNeedsCodeOnly] = useState(false)
  const [drawerItem, setDrawerItem] = useState<MealCatalogItem | null>(null)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('edit')

  const active = useMemo(() => activeCatalogVersion(data?.versions ?? []), [data])
  const items = active?.items ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (category !== 'all' && it.category !== category) return false
      if (needsCodeOnly && !it.needsCode) return false
      if (!q) return true
      return (
        it.name.vi.toLowerCase().includes(q) ||
        (it.productCode?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [items, search, category, needsCodeOnly])

  if (isLoading || !data || !active) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  const openAdd = () => {
    setDrawerMode('add')
    setDrawerItem(blankMeal())
  }

  const openEdit = (item: MealCatalogItem) => {
    setDrawerMode('edit')
    setDrawerItem({ ...item, name: { ...item.name } })
  }

  const saveDrawer = (item: MealCatalogItem) => {
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

  const columns: ColumnsType<MealCatalogItem> = [
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
      title: t('catering.catalog.col.category'),
      dataIndex: 'category',
      width: 140,
      sorter: (a, b) => a.category.localeCompare(b.category),
      render: (c: MealItemCategory) => {
        const s = MEAL_CATEGORY_STYLE[c]
        return (
          <Tag style={{ background: s.bg, color: s.color, borderColor: s.border, fontWeight: 700 }}>
            {t(`catering.catalog.category.${c}`)}
          </Tag>
        )
      },
    },
    {
      title: t('catering.catalog.col.unit'),
      dataIndex: 'unit',
      width: 90,
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
      badge={t('catering.catalog.meals.badge')}
      title={t('catering.catalog.meals.title')}
      description={t('catering.catalog.meals.desc')}
      actions={
        <Button type="primary" icon={<Plus size={15} />} onClick={openAdd}>
          {t('catering.catalog.addItem')}
        </Button>
      }
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[1.5fr_220px_auto]"
      filterBar={
        <>
          <Input
            value={search}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('catering.catalog.searchMeals')}
            prefix={<Search className="text-text-muted h-4 w-4" />}
          />
          <Select
            value={category}
            onChange={setCategory}
            options={[
              { value: 'all', label: t('catering.catalog.category.all') },
              ...MEAL_CATEGORIES.map((c) => ({ value: c, label: t(`catering.catalog.category.${c}`) })),
            ]}
          />
          <label className="text-text-secondary flex items-center gap-2 text-[13px] font-semibold">
            <Switch size="small" checked={needsCodeOnly} onChange={setNeedsCodeOnly} />
            {t('catering.catalog.filterNeedsCode')}
          </label>
        </>
      }
      footer={
        <span className="text-text-secondary text-[12.5px] font-semibold tnum">
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
                <label htmlFor="meal-code">{t('catering.catalog.col.code')}</label>
                <Input
                  id="meal-code"
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
                <label htmlFor="meal-name">{t('catering.catalog.col.name')}</label>
                <Input
                  id="meal-name"
                  value={drawerItem.name.vi}
                  onChange={(e) =>
                    setDrawerItem({ ...drawerItem, name: { ...drawerItem.name, vi: e.target.value } })
                  }
                />
              </div>
              <div>
                <label htmlFor="meal-category">{t('catering.catalog.col.category')}</label>
                <Select
                  id="meal-category"
                  className="w-full"
                  value={drawerItem.category}
                  onChange={(next) => setDrawerItem({ ...drawerItem, category: next })}
                  options={MEAL_CATEGORIES.map((c) => ({
                    value: c,
                    label: t(`catering.catalog.category.${c}`),
                  }))}
                />
              </div>
              <div>
                <label htmlFor="meal-unit">{t('catering.catalog.col.unit')}</label>
                <Input
                  id="meal-unit"
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
