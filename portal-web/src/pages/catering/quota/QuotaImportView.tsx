import {
  Alert,
  App as AntApp,
  Button,
  Empty,
  Input,
  InputNumber,
  Space,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Upload,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckCircle2, FileSpreadsheet, Inbox, Mail, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { FLAG_COLOR, TIME_RE } from '@/modules/catering/constants'
import type {
  PendingImport,
  QuotaRow,
  QuotaVersion,
  ReviewRow,
  RowFlag,
  SourceKind,
} from '@/modules/catering/types'

const nf = new Intl.NumberFormat('vi-VN')

interface Props {
  pending: PendingImport | null
  activeVersion: QuotaVersion | null
  onCreateVersion: (
    rows: QuotaRow[],
    effectiveFrom: string,
    source: string,
    sourceKind: SourceKind,
  ) => void
}

export function QuotaImportView({ pending, activeVersion, onCreateVersion }: Props) {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()

  const [reviewRows, setReviewRows] = useState<ReviewRow[]>(pending?.reviewRows ?? [])
  const [onlyReview, setOnlyReview] = useState(true)
  const [effDate, setEffDate] = useState(pending?.suggestedEffectiveFrom ?? '')

  const counts = useMemo(() => {
    const c: Record<RowFlag, number> = { error: 0, new: 0, delta: 0, ok: 0 }
    for (const r of reviewRows) c[r.flag] += 1
    return c
  }, [reviewRows])

  if (!pending) {
    return (
      <SurfaceCard>
        <Empty description={t('catering.quota.noPending')}>
          <Upload.Dragger disabled className="quota-dragger">
            <p className="ant-upload-drag-icon flex justify-center">
              <Inbox size={40} />
            </p>
            <p className="ant-upload-text">{t('catering.quota.dropHint')}</p>
          </Upload.Dragger>
        </Empty>
      </SurfaceCard>
    )
  }

  const patch = (
    flightNo: string,
    field: 'hotmeal' | 'banhMi' | 'traSua' | 'std' | 'sta',
    value: number | string,
  ) => {
    setReviewRows((prev) =>
      prev.map((r) => {
        if (r.flightNo !== flightNo) return r
        const next = { ...r, [field]: value }
        // re-clear an error flag once the offending time cell becomes valid
        if (r.flag === 'error' && r.errorField && TIME_RE.test(String(next[r.errorField]))) {
          next.flag = 'ok'
        }
        return next
      }),
    )
  }

  const visibleRows = onlyReview ? reviewRows.filter((r) => r.flag !== 'ok') : reviewRows

  const editTime = (r: ReviewRow, field: 'std' | 'sta') => {
    const invalid = r.flag === 'error' && r.errorField === field
    return (
      <Input
        size="small"
        status={invalid ? 'warning' : undefined}
        value={r[field]}
        onChange={(e) => patch(r.flightNo, field, e.target.value)}
        style={{ width: 78 }}
      />
    )
  }

  const editNum = (r: ReviewRow, field: 'hotmeal' | 'banhMi' | 'traSua') => (
    <Space size={4}>
      <InputNumber
        size="small"
        min={0}
        value={r[field]}
        onChange={(v) => patch(r.flightNo, field, Number(v ?? 0))}
        style={{ width: 58 }}
      />
      {field === 'hotmeal' && r.flag === 'delta' && r.prevHotmeal !== undefined ? (
        <span
          className={r.hotmeal >= r.prevHotmeal ? 'text-[11px] font-bold text-emerald-600' : 'text-[11px] font-bold text-red-600'}
        >
          {r.hotmeal >= r.prevHotmeal ? '▲' : '▼'} {r.prevHotmeal}
        </span>
      ) : null}
    </Space>
  )

  const columns: ColumnsType<ReviewRow> = [
    { title: t('catering.quota.col.flightNo'), dataIndex: 'flightNo', width: 90, fixed: 'left', render: (v: string) => <span className="font-bold tnum">{v}</span> },
    { title: t('catering.quota.col.route'), dataIndex: 'route', width: 116, render: (v: string) => <span className="text-text-muted font-medium">{v}</span> },
    { title: t('catering.quota.col.type'), dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
    { title: t('catering.quota.col.std'), key: 'std', width: 96, render: (_v, r) => editTime(r, 'std') },
    {
      title: t('catering.quota.col.sta'),
      key: 'sta',
      width: 150,
      render: (_v, r) => (
        <div>
          {editTime(r, 'sta')}
          {r.flag === 'error' && r.note ? (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <TriangleAlert size={12} /> {r.note}
            </div>
          ) : null}
        </div>
      ),
    },
    { title: t('catering.quota.col.hotmeal'), key: 'hotmeal', align: 'right', width: 120, render: (_v, r) => editNum(r, 'hotmeal') },
    { title: t('catering.quota.col.banhMi'), key: 'banhMi', align: 'right', width: 92, render: (_v, r) => editNum(r, 'banhMi') },
    { title: t('catering.quota.col.traSua'), key: 'traSua', align: 'right', width: 92, render: (_v, r) => editNum(r, 'traSua') },
    {
      title: t('catering.quota.col.flag'),
      dataIndex: 'flag',
      width: 118,
      render: (flag: RowFlag, r) => (
        <Tooltip title={r.note}>
          <Tag color={FLAG_COLOR[flag]} style={{ marginInlineEnd: 0 }}>
            {t(`catering.quota.flag.${flag}`)}
          </Tag>
        </Tooltip>
      ),
    },
  ]

  const confirm = () => {
    const rows: QuotaRow[] = reviewRows.map((r) => ({
      flightNo: r.flightNo,
      route: r.route,
      type: r.type,
      block: r.block,
      std: r.std,
      sta: r.sta,
      hotmeal: r.hotmeal,
      banhMi: r.banhMi,
      traSua: r.traSua,
    }))
    onCreateVersion(rows, effDate.trim(), pending.source, pending.sourceKind)
  }

  return (
    <>
      <Steps
        size="small"
        current={1}
        items={[
          { title: t('catering.quota.step1') },
          { title: t('catering.quota.step2') },
          { title: t('catering.quota.step3') },
        ]}
      />

      {/* Source */}
      <SurfaceCard title={t('catering.quota.sourceTitle')}>
        <Tabs
          items={[
            {
              key: 'upload',
              label: (
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={15} /> {t('catering.quota.tabUpload')}
                </span>
              ),
              children: (
                <div className="space-y-3">
                  <Upload.Dragger disabled className="quota-dragger">
                    <p className="ant-upload-drag-icon flex justify-center">
                      <Inbox size={38} />
                    </p>
                    <p className="ant-upload-text">{t('catering.quota.dropHint')}</p>
                    <p className="ant-upload-hint">{t('catering.quota.dropSub')}</p>
                  </Upload.Dragger>
                  <Alert
                    type="success"
                    showIcon
                    icon={<CheckCircle2 size={18} />}
                    title={pending.source}
                    description={t('catering.quota.fileMeta', { rows: nf.format(pending.sourceRows) })}
                  />
                </div>
              ),
            },
            {
              key: 'mail',
              label: (
                <span className="flex items-center gap-2">
                  <Mail size={15} /> {t('catering.quota.tabInbox')} <Tag>2</Tag>
                </span>
              ),
              children: (
                <div className="space-y-2">
                  <SurfaceCard padding="md" className="quota-mail quota-mail--sel">
                    <div className="flex items-center gap-3">
                      <span className="quota-mail__av">TM</span>
                      <div className="min-w-0">
                        <div className="font-semibold">{t('catering.quota.mail1Subject')}</div>
                        <div className="text-text-muted text-[12px]">mai.nguyen@vietjetair.com · Team Commercial</div>
                      </div>
                      <Tag className="ml-auto" icon={<FileSpreadsheet size={12} />}>
                        HOTMEAL.xlsx
                      </Tag>
                    </div>
                  </SurfaceCard>
                  <SurfaceCard padding="md" className="quota-mail">
                    <div className="flex items-center gap-3">
                      <span className="quota-mail__av">TM</span>
                      <div className="min-w-0">
                        <div className="font-semibold">{t('catering.quota.mail2Subject')}</div>
                        <div className="text-text-muted text-[12px]">mai.nguyen@vietjetair.com · Team Commercial</div>
                      </div>
                      <Tag className="ml-auto" icon={<FileSpreadsheet size={12} />}>
                        ALA-NQZ.xlsx
                      </Tag>
                    </div>
                  </SurfaceCard>
                </div>
              ),
            },
          ]}
        />
      </SurfaceCard>

      {/* AI summary */}
      <Alert
        type="success"
        showIcon
        title={t('catering.quota.aiTitle')}
        description={
          <div className="space-y-2">
            <div className="text-[12.5px]">
              {t('catering.quota.aiDesc', {
                rows: nf.format(pending.sourceRows),
                types: pending.normalizedTypes,
                deduped: pending.dedupedRows,
                n: reviewRows.filter((r) => r.flag !== 'ok').length,
              })}
            </div>
            <Space size={[6, 6]} wrap>
              <Tag color="gold">{t('catering.quota.chipErrors', { n: counts.error })}</Tag>
              <Tag color="blue">{t('catering.quota.chipNew', { n: counts.new })}</Tag>
              <Tag color="red">{t('catering.quota.chipDelta', { n: counts.delta })}</Tag>
              <Tag>{t('catering.quota.chipAuto', { n: nf.format(pending.sourceRows - reviewRows.filter((r) => r.flag !== 'ok').length) })}</Tag>
            </Space>
          </div>
        }
      />

      {/* Review table */}
      <SurfaceCard
        title={t('catering.quota.reviewTitle')}
        description={activeVersion ? t('catering.quota.reviewVs', { id: activeVersion.id }) : undefined}
      >
        <div className="mb-3 flex justify-end">
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <Switch checked={onlyReview} onChange={setOnlyReview} size="small" />
            {t('catering.quota.onlyReview', { n: reviewRows.filter((r) => r.flag !== 'ok').length })}
          </label>
        </div>
        <div className="data-table-wrap data-table-wrap--ops">
          <Table
            rowKey="flightNo"
            size="middle"
            columns={columns}
            dataSource={visibleRows}
            scroll={{ x: 'max-content' }}
            pagination={false}
          />
        </div>
      </SurfaceCard>

      {/* Sticky action bar = step 3 */}
      <div className="quota-sticky-bar">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <div className="text-text-muted mb-1 text-[11.5px] font-bold">{t('catering.quota.step3Label')}</div>
            <Input value={effDate} onChange={(e) => setEffDate(e.target.value)} style={{ width: 150 }} />
          </div>
          <div className="text-text-muted max-w-[46ch] text-[12.5px] font-medium">
            {activeVersion
              ? t('catering.quota.effExplain', { id: activeVersion.id, date: effDate || '—' })
              : t('catering.quota.effExplainFirst', { date: effDate || '—' })}
          </div>
          <div className="ml-auto">
            <Space>
              <Button onClick={() => message.info(t('catering.quota.draftSaved'))}>
                {t('catering.quota.saveDraft')}
              </Button>
              <Button type="primary" disabled={!effDate.trim()} onClick={confirm}>
                {t('catering.quota.createApply')}
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </>
  )
}
