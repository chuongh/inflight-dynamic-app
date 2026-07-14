import { Input, Segmented, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterBar } from '@/components/patterns/FilterBar'
import { PageHeader } from '@/components/patterns/PageHeader'
import { dishKind, type DishKind } from '@/modules/catering/grouping'
import { useMeals } from '@/modules/catering/hooks/useMeals'
import type { MealItem } from '@/modules/catering/mealsTypes'

type Kind = 'all' | DishKind

const KIND_STYLE: Record<DishKind, { bg: string; color: string; border: string }> = {
  business: { bg: '#FFF4C4', color: '#C9A000', border: '#F0DC7A' },
  veg: { bg: '#EDF9E0', color: '#4A7A00', border: '#B8E67A' },
  snack: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  main: { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
}

export function MealListPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useMeals()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<Kind>('all')

  const meals = useMemo(() => data?.meals ?? [], [data])
  const totalCodes = useMemo(
    () => meals.reduce((sum, m) => sum + m.pbmlCodes.length, 0),
    [meals],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return meals.filter((m) => {
      if (kind !== 'all' && dishKind(m.name) !== kind) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.pbmlCodes.some((c) => c.toLowerCase().includes(q))
      )
    })
  }, [meals, search, kind])

  const columns: ColumnsType<MealItem> = [
    {
      title: t('catering.meals.col.kind'),
      key: 'kind',
      width: 130,
      render: (_v, m) => {
        const k = dishKind(m.name)
        const s = KIND_STYLE[k]
        return (
          <Tag style={{ background: s.bg, color: s.color, borderColor: s.border, fontWeight: 700 }}>
            {t(`catering.meals.kind.${k}`)}
          </Tag>
        )
      },
    },
    {
      title: t('catering.meals.col.name'),
      dataIndex: 'name',
      width: 260,
      render: (v: string) => <span className="font-bold">{v}</span>,
    },
    {
      title: t('catering.meals.col.description'),
      dataIndex: 'description',
      render: (v: string) =>
        v ? <span className="text-text-secondary">{v}</span> : <span className="text-text-muted">—</span>,
    },
    {
      title: t('catering.meals.col.codes'),
      dataIndex: 'pbmlCodes',
      width: 300,
      render: (codes: string[]) => (
        <span className="flex flex-wrap gap-1">
          {codes.map((c) => (
            <span
              key={c}
              className="border-border text-vj-red-dark inline-flex items-center rounded-md border bg-[#FCFDFE] px-2 py-0.5 text-[12px] font-bold tnum"
            >
              {c}
            </span>
          ))}
        </span>
      ),
    },
  ]

  if (isLoading || !data) {
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
          badge={t('catering.meals.badge')}
          title={t('catering.meals.title')}
          description={t('catering.meals.desc')}
        />

        <div className="flex flex-col gap-4">
          <div className="border-border bg-surface flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-[13px] font-semibold">
            <span className="text-vj-red inline-flex items-center gap-1.5">
              <UtensilsCrossed size={16} />
              <span className="text-foreground font-extrabold">{meals.length}</span>
              <span className="text-text-secondary">{t('catering.meals.dishes')}</span>
            </span>
            <span className="bg-border h-1 w-1 rounded-full" />
            <span>
              <span className="text-foreground font-extrabold">{totalCodes}</span>{' '}
              {t('catering.meals.pbmlCodes')}
            </span>
          </div>

          <FilterBar className="grid grid-cols-1 gap-2 lg:grid-cols-[1.7fr_auto]">
            <Input
              value={search}
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('catering.meals.searchPlaceholder')}
              prefix={<Search className="text-text-muted h-4 w-4" />}
            />
            <Segmented<Kind>
              value={kind}
              onChange={setKind}
              options={[
                { value: 'all', label: t('catering.meals.kind.all') },
                { value: 'main', label: t('catering.meals.kind.main') },
                { value: 'veg', label: t('catering.meals.kind.veg') },
                { value: 'business', label: t('catering.meals.kind.business') },
                { value: 'snack', label: t('catering.meals.kind.snack') },
              ]}
            />
          </FilterBar>

          <div className="data-table-wrap data-table-wrap--ops">
            <Table
              rowKey="name"
              size="middle"
              columns={columns}
              dataSource={filtered}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
