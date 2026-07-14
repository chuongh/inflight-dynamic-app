import { Empty, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileSpreadsheet, Mail, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DIFF_COLOR, VERSION_STATUS_COLOR } from '@/modules/catering/constants'
import { diffVersions } from '@/modules/catering/quota'
import type { DiffRow, QuotaVersion, SourceKind, VersionStatus } from '@/modules/catering/types'

interface Props {
  versions: QuotaVersion[]
  highlightId?: string | null
}

const SOURCE_ICON: Record<SourceKind, typeof Mail> = {
  file: FileSpreadsheet,
  email: Mail,
  manual: Pencil,
}

const STATUS_DOT: Record<VersionStatus, string> = {
  active: '#16a34a',
  scheduled: '#2563eb',
  superseded: '#9ca3af',
  draft: '#c9a000',
}

export function QuotaHistoryView({ versions, highlightId }: Props) {
  const { t } = useTranslation()

  const [selectedId, setSelectedId] = useState(highlightId ?? versions[0]?.id)
  const [compareId, setCompareId] = useState<string | undefined>(undefined)

  const selected = versions.find((v) => v.id === selectedId) ?? versions[0]
  const predecessor = versions.find((v) => v.version === (selected?.version ?? 0) - 1)
  const compareVersion =
    versions.find((v) => v.id === (compareId ?? predecessor?.id)) ?? null
  const diff = useMemo(
    () => (compareVersion && selected ? diffVersions(compareVersion, selected) : null),
    [compareVersion, selected],
  )

  const select = (id: string) => {
    setSelectedId(id)
    setCompareId(undefined)
  }

  const diffColumns: ColumnsType<DiffRow> = [
    { title: t('catering.quota.col.flightNo'), dataIndex: 'flightNo', width: 92, render: (v: string) => <span className="font-bold tnum">{v}</span> },
    { title: t('catering.quota.col.route'), dataIndex: 'route', width: 116, render: (v: string) => <span className="text-text-muted font-medium">{v}</span> },
    { title: t('catering.quota.col.change'), dataIndex: 'kind', width: 128, render: (kind: DiffRow['kind']) => <Tag color={DIFF_COLOR[kind]}>{t(`catering.quota.diff.${kind}`)}</Tag> },
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
            <span className={r.kind === 'increase' ? 'font-bold text-emerald-600' : 'font-bold text-red-600'}>{r.hotmealTo}</span>
          </span>
        )
      },
    },
    { title: t('catering.quota.col.banhMi'), dataIndex: 'banhMi', align: 'right', width: 92, render: (v?: number) => v ?? '—' },
    { title: t('catering.quota.col.traSua'), dataIndex: 'traSua', align: 'right', width: 92, render: (v?: number) => v ?? '—' },
  ]

  const compareOptions = versions
    .filter((v) => v.id !== selected?.id)
    .map((v) => ({ value: v.id, label: `${v.id} · ${t(`catering.quota.status.${v.status}`)}` }))

  const SourceIcon = selected ? SOURCE_ICON[selected.sourceKind] : FileSpreadsheet

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[288px_1fr]">
      {/* Master — version list */}
      <div className="border-border bg-surface h-max overflow-hidden rounded-xl border">
        <div className="text-text-muted border-border border-b px-4 py-2.5 text-[11px] font-bold tracking-wide uppercase">
          {t('catering.quota.histVersions')} ({versions.length})
        </div>
        <div className="flex flex-col p-1.5">
          {versions.map((v) => {
            const on = v.id === selected?.id
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => select(v.id)}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  on ? 'bg-vj-red-50' : 'hover:bg-background'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_DOT[v.status] }} aria-hidden />
                  <span className="text-[14px] font-bold">{v.id}</span>
                  <Tag color={VERSION_STATUS_COLOR[v.status]} style={{ marginInlineEnd: 0 }}>
                    {t(`catering.quota.status.${v.status}`)}
                  </Tag>
                </span>
                <span className="text-text-muted pl-4 text-[11.5px] tnum">
                  {v.effectiveTo ? `${v.effectiveFrom} → ${v.effectiveTo}` : `${v.effectiveFrom} → ${t('catering.quota.untilNextShort')}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail — selected version + its changes */}
      {selected ? (
        <div className="border-border bg-surface rounded-xl border">
          <div className="border-border flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-5 py-3.5">
            <span className="text-[18px] font-extrabold">{selected.id}</span>
            <Tag color={VERSION_STATUS_COLOR[selected.status]} style={{ marginInlineEnd: 0 }}>
              {t(`catering.quota.status.${selected.status}`)}
            </Tag>
            <span className="border-border bg-background inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold tnum">
              {selected.effectiveTo ? `${selected.effectiveFrom} → ${selected.effectiveTo}` : `${selected.effectiveFrom} → ${t('catering.quota.untilNextShort')}`}
            </span>
            <span className="text-text-muted ml-auto inline-flex items-center gap-1.5 text-[12px]">
              <SourceIcon size={13} /> {selected.source} · {selected.importedBy} · {selected.importedAt}
            </span>
          </div>

          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[14px] font-bold">
                {compareVersion ? t('catering.quota.histChangesVs', { id: compareVersion.id }) : t('catering.quota.histFirst')}
              </span>
              {compareOptions.length > 0 ? (
                <span className="ml-auto flex items-center gap-2">
                  <span className="text-text-muted text-[12.5px] font-semibold">{t('catering.quota.histCompareWith')}</span>
                  <Select
                    size="small"
                    value={compareVersion?.id}
                    onChange={setCompareId}
                    options={compareOptions}
                    style={{ minWidth: 150 }}
                  />
                </span>
              ) : null}
            </div>

            {diff ? (
              diff.rows.length > 0 ? (
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
                <Empty description={t('catering.quota.histNoChange')} />
              )
            ) : (
              <Empty description={t('catering.quota.histFirst')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>
      ) : (
        <div className="border-border bg-surface flex items-center justify-center rounded-xl border p-10">
          <Empty description={t('catering.quota.histSelectHint')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )}
    </div>
  )
}

function Stat({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[18px] font-extrabold tnum" style={{ color }}>{value}</span>
      <span className="text-text-muted text-[13px] font-semibold">{label}</span>
    </div>
  )
}
