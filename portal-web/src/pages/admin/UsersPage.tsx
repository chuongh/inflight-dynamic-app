import { Button, Input, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table/interface'
import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { Text } from '@/components/primitives/Text'
import { ROLE_ORDER, ROLES, type RoleId } from '@/core/permissions'
import { loadDemoUsers, type DemoUserRecord } from '@/mock-data/loaders/loadAuth'
import { Code, RoleTag } from './iamUi'

function exportUsersCsv(rows: DemoUserRecord[]) {
  const header = ['Employee code', 'Name', 'Department', 'Job title', 'Role id', 'Role']
  const body = rows.map((u) => [
    u.employeeCode,
    u.name,
    u.department,
    u.jobTitle,
    u.roleId,
    ROLES[u.roleId].labelVi,
  ])
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'opp-016-users.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function UsersPage() {
  const { t } = useTranslation()
  const users = useMemo(() => loadDemoUsers(), [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | RoleId>('all')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchedSearch =
        query === '' ||
        u.employeeCode.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query) ||
        u.department.toLowerCase().includes(query) ||
        u.jobTitle.toLowerCase().includes(query)
      const matchedRole = roleFilter === 'all' || u.roleId === roleFilter
      return matchedSearch && matchedRole
    })
  }, [users, search, roleFilter])

  const columns: ColumnsType<DemoUserRecord> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_v, _r, index) => (
        <Text variant="caption" tone="muted" className="tnum">
          {index + 1}
        </Text>
      ),
    },
    {
      title: t('iam.users.colCode'),
      dataIndex: 'employeeCode',
      sorter: (a, b) => a.employeeCode.localeCompare(b.employeeCode),
      render: (value: string) => <Code>{value}</Code>,
    },
    {
      title: t('iam.users.colName'),
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value: string) => (
        <Text variant="bodySm" tone="primary" className="font-semibold">
          {value}
        </Text>
      ),
    },
    {
      title: t('iam.users.colDepartment'),
      dataIndex: 'department',
      sorter: (a, b) => a.department.localeCompare(b.department),
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('iam.users.colJobTitle'),
      dataIndex: 'jobTitle',
      render: (value: string) => (
        <Text variant="caption" tone="secondary">
          {value}
        </Text>
      ),
    },
    {
      title: t('iam.users.colRole'),
      dataIndex: 'roleId',
      sorter: (a, b) => ROLES[a.roleId].labelVi.localeCompare(ROLES[b.roleId].labelVi),
      render: (value: RoleId) => (
        <RoleTag label={ROLES[value].labelVi} external={ROLES[value].external} />
      ),
    },
  ]

  return (
    <ListPageLayout
      badge={t('iam.badge')}
      title={t('iam.users.title')}
      description={t('iam.users.desc', { count: users.length })}
      actions={
        <Button icon={<Download className="h-4 w-4" />} onClick={() => exportUsersCsv(filtered)}>
          {t('common.export')}
        </Button>
      }
      filterBarClassName="grid grid-cols-1 gap-2 lg:grid-cols-[1.5fr_1fr]"
      filterBar={
        <>
          <Input
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('iam.users.searchPlaceholder')}
            prefix={<Search className="h-4 w-4 text-text-muted" />}
          />
          <Select
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
            options={[
              { value: 'all', label: t('iam.users.allRoles') },
              ...ROLE_ORDER.map((r) => ({ value: r, label: ROLES[r].labelVi })),
            ]}
          />
        </>
      }
    >
      <Table<DemoUserRecord>
        rowKey="employeeCode"
        columns={columns}
        dataSource={filtered}
        pagination={false}
        size="middle"
      />
    </ListPageLayout>
  )
}
