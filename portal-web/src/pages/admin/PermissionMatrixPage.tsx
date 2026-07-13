import { Segmented, Switch } from 'antd'
import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPageLayout } from '@/components/patterns/ListPageLayout'
import { Text } from '@/components/primitives/Text'
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLES,
  ROLE_ORDER,
  type ModuleCode,
  type RoleId,
} from '@/core/permissions'
import { GrantDot, MODULE_LABELS } from './iamUi'

const MODULE_ORDER: ModuleCode[] = ['M1', 'M2', 'M3', 'M4', 'M5']

const SHORT_ROLE: Record<RoleId, string> = {
  admin: 'ADM',
  ifs_backoffice: 'IFS',
  catering_ops: 'CAT',
  commercial: 'COM',
  operations: 'OPS',
  equipment_staff: 'EQP',
  supply: 'SUP',
  dispatcher: 'DSP',
  boarding_agent: 'BRD',
  gate_supervisor: 'GSV',
  cabin_crew: 'CRW',
  purser: 'PSR',
  driver: 'DRV',
  supplier: 'VND',
  viewer: 'VWR',
}

const CORNER = 'sticky left-0 z-30 bg-[var(--color-surface)]'
const HEAD = 'sticky top-0 z-20 bg-[var(--color-surface)]'
const FIRSTCOL = 'sticky left-0 z-10 bg-[var(--color-surface)]'
const CELL = 'border border-[color:var(--color-border)]'

export function PermissionMatrixPage() {
  const { t } = useTranslation()
  const [moduleFilter, setModuleFilter] = useState<'all' | ModuleCode>('all')
  const [hideLater, setHideLater] = useState(false)

  const visiblePerms = useMemo(
    () =>
      ALL_PERMISSIONS.filter((k) => {
        const meta = PERMISSIONS[k]
        if (moduleFilter !== 'all' && meta.module !== moduleFilter) return false
        if (hideLater && meta.wave === 'later') return false
        return true
      }),
    [moduleFilter, hideLater],
  )

  const modules = MODULE_ORDER.filter((m) => visiblePerms.some((k) => PERMISSIONS[k].module === m))

  const totalsByRole = useMemo(
    () =>
      ROLE_ORDER.map(
        (r) => visiblePerms.filter((k) => ROLES[r].permissions.includes(k)).length,
      ),
    [visiblePerms],
  )

  return (
    <ListPageLayout
      badge={t('iam.badge')}
      title={t('iam.matrix.title')}
      description={t('iam.matrix.desc', { roles: ROLE_ORDER.length, perms: ALL_PERMISSIONS.length })}
      filterBarClassName="flex flex-wrap items-center gap-3"
      filterBar={
        <>
          <Segmented
            value={moduleFilter}
            onChange={(value) => setModuleFilter(value as 'all' | ModuleCode)}
            options={[
              { value: 'all', label: t('common.all') },
              ...MODULE_ORDER.map((m) => ({ value: m, label: m })),
            ]}
          />
          <label className="flex cursor-pointer items-center gap-2">
            <Switch size="small" checked={hideLater} onChange={setHideLater} />
            <Text variant="caption" tone="secondary">
              {t('iam.matrix.hideLater')}
            </Text>
          </label>
          <span className="flex items-center gap-1.5">
            <GrantDot />
            <Text variant="caption" tone="secondary">
              {t('iam.matrix.granted')}
            </Text>
          </span>
        </>
      }
      footer={
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ROLE_ORDER.map((r) => (
            <Text key={r} variant="caption" tone="muted">
              <span className="font-mono font-semibold text-vj-dark">{SHORT_ROLE[r]}</span>{' '}
              {ROLES[r].labelVi}
            </Text>
          ))}
        </div>
      }
    >
      <div className="thin-scroll overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <table className="min-w-max border-collapse text-[12px]">
          <thead>
            <tr>
              <th
                className={`${CORNER} ${CELL} px-3 py-2 text-left`}
                style={{ minWidth: 300 }}
              >
                <Text variant="label" tone="secondary">
                  {t('iam.matrix.colPermission')}
                </Text>
              </th>
              {ROLE_ORDER.map((r) => (
                <th
                  key={r}
                  className={`${HEAD} ${CELL} px-1.5 py-2`}
                  style={{ minWidth: 46 }}
                  title={`${ROLES[r].labelVi} — ${ROLES[r].label}`}
                >
                  <span className="font-mono text-[11px] font-bold text-vj-dark">
                    {SHORT_ROLE[r]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => {
              const keys = visiblePerms.filter((k) => PERMISSIONS[k].module === m)
              return (
                <Fragment key={m}>
                  <tr className="bg-vj-red-50">
                    <td className={`${FIRSTCOL} ${CELL} bg-vj-red-50 px-3 py-1.5`}>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-vj-red-dark">
                        {MODULE_LABELS[m]}
                      </span>
                    </td>
                    <td className={`${CELL} bg-vj-red-50`} colSpan={ROLE_ORDER.length} />
                  </tr>
                  {keys.map((k) => (
                    <tr key={k} className="transition-colors hover:bg-vj-red-50/40">
                      <td className={`${FIRSTCOL} ${CELL} px-3 py-2`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-vj-dark">{PERMISSIONS[k].name}</span>
                          <span className="tnum font-mono text-[11px] text-[color:var(--color-text-muted)]">
                            {k}
                          </span>
                        </div>
                      </td>
                      {ROLE_ORDER.map((r) => (
                        <td key={r} className={`${CELL} text-center align-middle`}>
                          {ROLES[r].permissions.includes(k) ? <GrantDot /> : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              )
            })}
            <tr>
              <td className={`${FIRSTCOL} ${CELL} px-3 py-2`}>
                <Text variant="caption" tone="secondary" className="font-semibold">
                  {t('iam.matrix.total')}
                </Text>
              </td>
              {totalsByRole.map((count, index) => (
                <td key={ROLE_ORDER[index]} className={`${CELL} text-center`}>
                  <span className="tnum text-[12px] font-bold text-vj-dark">{count}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </ListPageLayout>
  )
}
