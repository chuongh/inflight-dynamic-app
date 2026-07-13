import { Input, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table/interface'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { Text } from '@/components/primitives/Text'
import {
  PERMISSIONS,
  ROLE_ORDER,
  ROLES,
  type ModuleCode,
  type PermissionKey,
  type Platform,
  type RoleDefinition,
  type Wave,
} from '@/core/permissions'
import { loadDemoUsers } from '@/mock-data/loaders/loadAuth'
import { Code, MODULE_LABELS, PlatformBadge, WaveBadge } from './iamUi'

const MODULE_ORDER: ModuleCode[] = ['M1', 'M2', 'M3', 'M4', 'M5']

function RolePermissions({ permissions }: { permissions: PermissionKey[] }) {
  const grouped = MODULE_ORDER.map((m) => ({
    module: m,
    keys: permissions.filter((k) => PERMISSIONS[k].module === m),
  })).filter((g) => g.keys.length > 0)

  return (
    <div className="flex flex-col gap-3 py-1">
      {grouped.map((group) => (
        <div key={group.module} className="flex flex-col gap-1.5">
          <Text variant="label" tone="secondary">
            {MODULE_LABELS[group.module]}
          </Text>
          <div className="flex flex-wrap gap-1.5">
            {group.keys.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                title={PERMISSIONS[k].description}
              >
                <span className="text-[12px] font-semibold text-vj-dark">{PERMISSIONS[k].name}</span>
                <Code>{k}</Code>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function RolesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all')
  const [waveFilter, setWaveFilter] = useState<'all' | Wave>('all')

  const userCountByRole = useMemo(() => {
    const counts = {} as Record<string, number>
    for (const u of loadDemoUsers()) counts[u.roleId] = (counts[u.roleId] ?? 0) + 1
    return counts
  }, [])

  const roles = useMemo(() => {
    const query = search.trim().toLowerCase()
    return ROLE_ORDER.map((id) => ROLES[id]).filter((r) => {
      const matchedSearch =
        query === '' ||
        r.labelVi.toLowerCase().includes(query) ||
        r.label.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      const matchedPlatform = platformFilter === 'all' || r.platform === platformFilter
      const matchedWave = waveFilter === 'all' || r.wave === waveFilter
      return matchedSearch && matchedPlatform && matchedWave
    })
  }, [search, platformFilter, waveFilter])

  const columns: ColumnsType<RoleDefinition> = [
    {
      title: t('iam.roles.colRole'),
      dataIndex: 'labelVi',
      render: (_v, role) => (
        <div className="flex flex-col gap-0.5">
          <Text variant="bodySm" tone="primary" className="font-semibold">
            {role.labelVi}
          </Text>
          <span className="flex items-center gap-2">
            <Text variant="caption" tone="muted">
              {role.label}
            </Text>
            <Code>{role.id}</Code>
          </span>
        </div>
      ),
    },
    {
      title: t('iam.roles.colPlatform'),
      dataIndex: 'platform',
      width: 130,
      render: (value: Platform) => <PlatformBadge platform={value} />,
    },
    {
      title: t('iam.roles.colWave'),
      dataIndex: 'wave',
      width: 110,
      render: (value: Wave) => <WaveBadge wave={value} />,
    },
    {
      title: t('iam.roles.colUsers'),
      key: 'users',
      width: 90,
      align: 'center',
      sorter: (a, b) => (userCountByRole[a.id] ?? 0) - (userCountByRole[b.id] ?? 0),
      render: (_v, role) => (
        <Text variant="bodySm" tone="primary" className="tnum font-semibold">
          {userCountByRole[role.id] ?? 0}
        </Text>
      ),
    },
    {
      title: t('iam.roles.colPerms'),
      key: 'perms',
      width: 110,
      align: 'center',
      sorter: (a, b) => a.permissions.length - b.permissions.length,
      render: (_v, role) => (
        <span className="inline-flex min-w-7 justify-center rounded-md bg-vj-red-50 px-2 py-0.5 tnum text-[13px] font-bold text-vj-red-dark">
          {role.permissions.length}
        </span>
      ),
    },
    {
      title: t('iam.roles.colDescription'),
      dataIndex: 'description',
      render: (value: string) => (
        <Text variant="caption" tone="secondary" className="block max-w-md">
          {value}
        </Text>
      ),
    },
  ]

  return (
    <ListPageLayout
      badge={t('iam.badge')}
      title={t('iam.roles.title')}
      description={t('iam.roles.desc', { count: ROLE_ORDER.length })}
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[1.5fr_1fr_1fr]"
      filterBar={
        <>
          <Input
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('iam.roles.searchPlaceholder')}
            prefix={<Search className="h-4 w-4 text-text-muted" />}
          />
          <Select
            value={platformFilter}
            onChange={(value) => setPlatformFilter(value)}
            options={[
              { value: 'all', label: t('iam.roles.allPlatforms') },
              { value: 'web', label: 'Web' },
              { value: 'mobile', label: 'Mobile' },
              { value: 'both', label: 'Web + Mobile' },
            ]}
          />
          <Select
            value={waveFilter}
            onChange={(value) => setWaveFilter(value)}
            options={[
              { value: 'all', label: t('iam.roles.allWaves') },
              { value: 'mvp', label: 'MVP' },
              { value: 'later', label: 'Wave sau' },
            ]}
          />
        </>
      }
    >
      <Table<RoleDefinition>
        rowKey="id"
        columns={columns}
        dataSource={roles}
        pagination={false}
        size="middle"
        expandable={{
          expandedRowRender: (role) => <RolePermissions permissions={role.permissions} />,
          rowExpandable: (role) => role.permissions.length > 0,
        }}
      />
    </ListPageLayout>
  )
}
