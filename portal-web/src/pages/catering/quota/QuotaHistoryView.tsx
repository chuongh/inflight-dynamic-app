import { Button, Select, Space, Table, Tag, Timeline } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileSpreadsheet, Mail, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { DIFF_COLOR, VERSION_STATUS_COLOR } from '@/modules/catering/constants'
import { diffVersions } from '@/modules/catering/quota'
import type { DiffRow, QuotaVersion, SourceKind } from '@/modules/catering/types'

interface Props {
  versions: QuotaVersion[]
  highlightId?: string | null
}

const SOURCE_ICON: Record<SourceKind, typeof Mail> = {
  file: FileSpreadsheet,
  email: Mail,
  manual: Pencil,
}

export function QuotaHistoryView({ versions, highlightId }: Props) {
  const { t } = useTranslation()

  const [fromId, setFromId] = useState(versions[1]?.id ?? versions[0]?.id)
  const [toId, setToId] = useState(versions[0]?.id)

  const from = versions.find((v) => v.id === fromId)
  const to = versions.find((v) => v.id === toId)
  const diff = useMemo(() => (from && to ? diffVersions(from, to) : null), [from, to])

  const diffColumns: ColumnsType<DiffRow> = [
    { title: t('catering.quota.col.flightNo'), dataIndex: 'flightNo', width: 96, render: (v: string) => <span className="font-bold tnum">{v}</span> },
    { title: t('catering.quota.col.route'), dataIndex: 'route', width: 120, render: (v: string) => <span className="text-text-muted font-medium">{v}</span> },
    {
      title: t('catering.quota.col.change'),
      dataIndex: 'kind',
      width: 130,
      render: (kind: DiffRow['kind']) => (
        <Tag color={DIFF_COLOR[kind]}>{t(`catering.quota.diff.${kind}`)}</Tag>
      ),
    },
    {
      title: t('catering.quota.col.hotmeal'),
      key: 'hotmeal',
      align: 'right',
      render: (_v, r) => {
        if (r.kind === 'added') return <span className="font-bold text-emerald-600">{r.hotmealTo}</span>
        if (r.kind === 'removed') return <span className="text-text-muted line-through">{r.hotmealFrom}</span>
        return (
          <span>
            <span className="text-text-muted line-through">{r.hotmealFrom}</span>
            <span className="text-text-muted mx-1.5">→</span>
            <span className={r.kind === 'increase' ? 'font-bold text-emerald-600' : 'font-bold text-red-600'}>
              {r.hotmealTo}
            </span>
          </span>
        )
      },
    },
    { title: t('catering.quota.col.banhMi'), dataIndex: 'banhMi', align: 'right', width: 96, render: (v?: number) => v ?? '—' },
    { title: t('catering.quota.col.traSua'), dataIndex: 'traSua', align: 'right', width: 96, render: (v?: number) => v ?? '—' },
  ]

  const options = versions.map((v) => ({
    value: v.id,
    label: `${v.id} · ${t(`catering.quota.status.${v.status}`)}`,
  }))

  return (
    <>
      {/* Compare */}
      <SurfaceCard title={t('catering.quota.compareTitle')}>
        <Space wrap align="center" className="mb-4">
          <Select value={fromId} onChange={setFromId} options={options} style={{ minWidth: 190 }} />
          <span className="text-text-muted font-bold">→</span>
          <Select value={toId} onChange={setToId} options={options} style={{ minWidth: 190 }} />
        </Space>

        {diff ? (
          <>
            <div className="mb-3 flex flex-wrap gap-5">
              <Stat color="#16a34a" value={diff.increases} label={t('catering.quota.diffUp')} />
              <Stat color="#dc2626" value={diff.decreases} label={t('catering.quota.diffDown')} />
              <Stat color="#2563eb" value={diff.added} label={t('catering.quota.diffNew')} />
              <Stat color="#6b7280" value={diff.removed} label={t('catering.quota.diffRemoved')} />
            </div>
            <div className="data-table-wrap data-table-wrap--ops">
              <Table
                rowKey={(r) => `${r.flightNo}-${r.kind}`}
                size="middle"
                columns={diffColumns}
                dataSource={diff.rows}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </div>
          </>
        ) : (
          <p className="text-text-muted">{t('catering.quota.pickTwo')}</p>
        )}
      </SurfaceCard>

      {/* Timeline */}
      <SurfaceCard title={t('catering.quota.allVersions')}>
        <Timeline
          items={versions.map((v) => {
            const Icon = SOURCE_ICON[v.sourceKind]
            return {
              color:
                v.status === 'active'
                  ? 'green'
                  : v.status === 'scheduled'
                    ? 'blue'
                    : 'gray',
              content: (
                <div
                  className={`quota-vrow${v.id === highlightId ? ' quota-vrow--hl' : ''}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold">{v.id}</span>
                    <Tag color={VERSION_STATUS_COLOR[v.status]}>
                      {t(`catering.quota.status.${v.status}`)}
                    </Tag>
                    {v.effectiveTo ? (
                      <span className="text-text-muted text-[12px]">
                        {v.effectiveFrom} → {v.effectiveTo}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[12px]">
                        {t('catering.quota.effectiveFrom', { date: v.effectiveFrom })}
                      </span>
                    )}
                  </div>
                  <div className="text-text-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                    <span className="flex items-center gap-1.5">
                      <Icon size={13} /> {v.source}
                    </span>
                    <span>
                      {t('catering.quota.importedBy')}: <b className="text-foreground">{v.importedBy}</b>
                    </span>
                    <span>{v.importedAt}</span>
                    <span>{t('catering.quota.rowCount', { n: v.rows.length })}</span>
                  </div>
                  <div className="mt-2">
                    <Button
                      size="small"
                      onClick={() => {
                        setToId(v.id)
                        const older = versions.find((x) => x.version === v.version - 1)
                        if (older) setFromId(older.id)
                      }}
                    >
                      {t('catering.quota.compareBtn')}
                    </Button>
                  </div>
                </div>
              ),
            }
          })}
        />
      </SurfaceCard>
    </>
  )
}

function Stat({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[18px] font-extrabold tnum" style={{ color }}>
        {value}
      </span>
      <span className="text-text-muted text-[13px] font-semibold">{label}</span>
    </div>
  )
}
