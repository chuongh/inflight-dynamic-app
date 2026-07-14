import {
  App as AntApp,
  Button,
  Input,
  InputNumber,
  Modal,
  Popover,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Upload,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Inbox,
  Mail,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { FLAG_COLOR, TIME_RE } from '@/modules/catering/constants'
import { distinctTypes } from '@/modules/catering/quota'
import type {
  PendingImport,
  QuotaRow,
  QuotaVersion,
  ReviewRow,
  RowFlag,
  SourceKind,
} from '@/modules/catering/types'
import { formatDateDMY } from '@/shared/utils/format'

const nf = new Intl.NumberFormat('vi-VN')

/** Columns the manual importer expects in the uploaded sheet (matches the AI pipeline). */
const REQUIRED_COLS = ['Flt No', 'Route', 'Type', 'STD', 'STA', 'Hotmeal', 'Bánh mì', 'Trà sữa']

/** Fallback rows when there is no active version to diff a manual import against. */
const SYNTHETIC_BASE: QuotaRow[] = [
  { flightNo: 'VJ021', route: 'HAN-VTE', type: 'INT_Regular', block: '01:30', std: '07:15', sta: '09:00', hotmeal: 60, banhMi: 20, traSua: 15 },
  { flightNo: 'VJ169', route: 'SGN-BKK', type: 'INT_Regular', block: '01:35', std: '10:30', sta: '12:05', hotmeal: 80, banhMi: 25, traSua: 20 },
  { flightNo: 'VJ311', route: 'SGN-DAD', type: 'Domestic_Middle_Other', block: '01:20', std: '06:00', sta: '07:20', hotmeal: 40, banhMi: 10, traSua: 8 },
  { flightNo: 'VJ642', route: 'HAN-CXR', type: 'Domestic_South_Other', block: '01:50', std: '13:10', sta: '15:00', hotmeal: 50, banhMi: 12, traSua: 10 },
  { flightNo: 'VJ018', route: 'DAD-ICN', type: 'INT_Regular', block: '04:40', std: '00:20', sta: '06:40', hotmeal: 90, banhMi: 0, traSua: 0 },
  { flightNo: 'VJ255', route: 'SGN-HAN', type: 'Domestic_North_Other', block: '02:05', std: '18:30', sta: '20:35', hotmeal: 45, banhMi: 15, traSua: 12 },
]

/**
 * Demo-only: simulate reading a Commercial Excel file. Structure is treated as
 * valid; a realistic mix of row flags is produced by diffing against the active
 * version so the reviewer sees the same pipeline the AI Agent feeds.
 */
function simulateParse(active: QuotaVersion | null, fileName: string): PendingImport {
  const base = active?.rows.length ? active.rows : SYNTHETIC_BASE
  const reviewRows: ReviewRow[] = base.map((r, i) => {
    if (i === 0 || i === 5) {
      return { ...r, sta: '25:60', flag: 'error', errorField: 'sta', note: 'Invalid STA time' }
    }
    if (i === 2 || i === 7) {
      return { ...r, prevHotmeal: r.hotmeal, hotmeal: r.hotmeal + 45, flag: 'delta', note: 'Hotmeal jumped vs current version' }
    }
    return { ...r, flag: 'ok' }
  })
  reviewRows.push(
    { flightNo: 'VJ889', route: 'SGN-BKK', type: 'INT_Regular', block: '01:45', std: '07:20', sta: '09:05', hotmeal: 60, banhMi: 20, traSua: 15, flag: 'new', note: 'Not in current version' },
    { flightNo: 'VJ912', route: 'HAN-ICN', type: 'INT_Regular', block: '05:00', std: '23:40', sta: '06:10', hotmeal: 80, banhMi: 0, traSua: 0, flag: 'new', note: 'Not in current version' },
  )
  return {
    source: fileName,
    sourceKind: 'file',
    sourceRows: reviewRows.length,
    normalizedTypes: distinctTypes(reviewRows),
    dedupedRows: 0,
    suggestedEffectiveFrom: formatDateDMY(Date.now()),
    reviewRows,
  }
}

interface ManualImportModalProps {
  open: boolean
  activeVersion: QuotaVersion | null
  onClose: () => void
  onApply: (pending: PendingImport) => void
}

/** Manual Excel import panel — the fallback flow when no AI Agent has ingested a report. */
function ManualImportModal({ open, activeVersion, onClose, onApply }: ManualImportModalProps) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<'upload' | 'validating' | 'result'>('upload')
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [result, setResult] = useState<PendingImport | null>(null)

  const reset = () => {
    setPhase('upload')
    setFile(null)
    setResult(null)
  }
  const close = () => {
    reset()
    onClose()
  }

  const handleFile = (f: File) => {
    setFile({ name: f.name, size: f.size })
    setPhase('validating')
    window.setTimeout(() => {
      setResult(simulateParse(activeVersion, f.name))
      setPhase('result')
    }, 650)
  }

  const counts = useMemo(() => {
    const c: Record<'error' | 'new' | 'delta', number> = { error: 0, new: 0, delta: 0 }
    for (const r of result?.reviewRows ?? []) {
      if (r.flag === 'error' || r.flag === 'new' || r.flag === 'delta') c[r.flag] += 1
    }
    return c
  }, [result])
  const flagged = counts.error + counts.new + counts.delta

  const downloadTemplate = () => {
    const header = 'Flt No,Route,Type,STD,STA,Hotmeal,Banh mi,Tra sua'
    const rows = [
      'VJ021,HAN-VTE,INT_Regular,07:15,09:00,60,20,15',
      'VJ169,SGN-BKK,INT_Regular,10:30,12:05,80,25,20',
    ]
    const blob = new Blob([[header, ...rows].join('\n') + '\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inflight-meal-quota-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const footer =
    phase === 'result' && result ? (
      <div className="flex items-center justify-between">
        <Button icon={<RefreshCw size={14} />} onClick={reset}>
          {t('catering.quota.chooseAnother')}
        </Button>
        <Button
          type="primary"
          icon={<ArrowRight size={15} />}
          onClick={() => {
            onApply(result)
            reset()
          }}
        >
          {t('catering.quota.continueReview')} ({result.reviewRows.length})
        </Button>
      </div>
    ) : (
      <Button onClick={close}>{t('common.cancel')}</Button>
    )

  return (
    <Modal
      open={open}
      onCancel={close}
      width={620}
      destroyOnHidden
      footer={footer}
      title={
        <span className="inline-flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-vj-red" /> {t('catering.quota.manualTitle')}
        </span>
      }
    >
      {phase === 'upload' ? (
        <div className="space-y-4 pt-1">
          <p className="text-text-muted m-0 text-[13px] leading-relaxed">
            {t('catering.quota.manualSubtitle')}
          </p>
          <div>
            <div className="text-text-muted mb-1.5 text-[11px] font-bold tracking-wide uppercase">
              {t('catering.quota.requiredCols')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REQUIRED_COLS.map((c) => (
                <Tag key={c} style={{ marginInlineEnd: 0 }}>
                  {c}
                </Tag>
              ))}
            </div>
          </div>
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={(f) => {
              handleFile(f)
              return false
            }}
            className="quota-dragger"
          >
            <p className="ant-upload-drag-icon flex justify-center">
              <Inbox size={38} />
            </p>
            <p className="ant-upload-text">{t('catering.quota.dropHint')}</p>
            <p className="ant-upload-hint">{t('catering.quota.dropSub')}</p>
          </Upload.Dragger>
          <Button
            type="link"
            size="small"
            icon={<Download size={14} />}
            className="px-0"
            onClick={downloadTemplate}
          >
            {t('catering.quota.downloadTemplate')}
          </Button>
        </div>
      ) : null}

      {phase === 'validating' ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spin size="large" />
          <div className="text-text-muted text-[13px] font-medium">
            {t('catering.quota.validating', { name: file?.name })}
          </div>
        </div>
      ) : null}

      {phase === 'result' && result ? (
        <div className="space-y-3 pt-1">
          {/* File-level validation */}
          <div
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: 'var(--color-vj-green)',
              background: 'var(--color-vj-green-muted)',
            }}
          >
            <div className="flex items-center gap-2 text-[14px] font-bold text-[color:var(--color-vj-green-dark)]">
              <CheckCircle2 size={17} /> {t('catering.quota.fileValidTitle')}
            </div>
            <div className="text-text-muted mt-1 flex items-center gap-1.5 text-[12.5px]">
              <FileSpreadsheet size={13} />
              <span className="text-foreground font-semibold">{file?.name}</span>
              <span>· {Math.max(1, Math.round((file?.size ?? 0) / 1024))} KB</span>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {[
                t('catering.quota.chkColumns', { n: REQUIRED_COLS.length, total: REQUIRED_COLS.length }),
                t('catering.quota.chkSheet', { name: 'Quota' }),
                t('catering.quota.chkRows', { n: result.reviewRows.length }),
                t('catering.quota.chkNoEmpty'),
              ].map((line) => (
                <li key={line} className="flex items-center gap-2 text-[12.5px] font-medium">
                  <Check size={14} className="shrink-0 text-[color:var(--color-vj-green-dark)]" /> {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Row-level validation */}
          <div className="border-border rounded-xl border px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-bold">{t('catering.quota.rowChecks')}</span>
              <Space size={[6, 6]} wrap>
                <Tag color="gold" style={{ marginInlineEnd: 0 }}>{t('catering.quota.chipErrors', { n: counts.error })}</Tag>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>{t('catering.quota.chipNew', { n: counts.new })}</Tag>
                <Tag color="red" style={{ marginInlineEnd: 0 }}>{t('catering.quota.chipDelta', { n: counts.delta })}</Tag>
              </Space>
            </div>
            <div className="flex items-center gap-2 text-[12.5px] font-medium">
              {flagged > 0 ? (
                <>
                  <TriangleAlert size={15} className="shrink-0 text-amber-500" />
                  {t('catering.quota.rowsNeedFix', { n: flagged })}
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  {t('catering.quota.rowsAllOk')}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

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

  const [activePending, setActivePending] = useState<PendingImport | null>(pending)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>(pending?.reviewRows ?? [])
  const [onlyReview, setOnlyReview] = useState(true)
  const [effDate, setEffDate] = useState(pending?.suggestedEffectiveFrom ?? '')
  const [importOpen, setImportOpen] = useState(false)
  // True only after a manual upload — an AI-ingested pending keeps its AI summary.
  const [manual, setManual] = useState(false)

  const applyManual = (p: PendingImport) => {
    setActivePending(p)
    setReviewRows(p.reviewRows)
    setEffDate(p.suggestedEffectiveFrom)
    setOnlyReview(true)
    setManual(true)
    setImportOpen(false)
    message.success(t('catering.quota.manualImported', { name: p.source, n: p.reviewRows.length }))
  }

  const counts = useMemo(() => {
    const c: Record<RowFlag, number> = { error: 0, new: 0, delta: 0, ok: 0 }
    for (const r of reviewRows) c[r.flag] += 1
    return c
  }, [reviewRows])
  const reviewCount = counts.error + counts.new + counts.delta

  const importModal = (
    <ManualImportModal
      open={importOpen}
      activeVersion={activeVersion}
      onClose={() => setImportOpen(false)}
      onApply={applyManual}
    />
  )

  if (!activePending) {
    return (
      <>
        <SurfaceCard>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="text-text-muted bg-background flex h-16 w-16 items-center justify-center rounded-2xl">
              <Inbox size={30} />
            </span>
            <div>
              <div className="text-[16px] font-bold">{t('catering.quota.emptyTitle')}</div>
              <p className="text-text-muted mx-auto mt-1 max-w-[42ch] text-[13px] leading-relaxed">
                {t('catering.quota.emptyDesc')}
              </p>
            </div>
            <Space>
              <Button type="primary" icon={<FileUp size={15} />} onClick={() => setImportOpen(true)}>
                {t('catering.quota.importBtn')}
              </Button>
            </Space>
          </div>
        </SurfaceCard>
        {importModal}
      </>
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
    onCreateVersion(rows, effDate.trim(), activePending.source, activePending.sourceKind)
  }

  const sourcePicker = (
    <div className="w-72 space-y-2">
      <div className="quota-mail quota-mail--sel surface-card">
        <div className="surface-card__body flex items-center gap-3">
          <span className="quota-mail__av">TM</span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{t('catering.quota.mail1Subject')}</div>
            <div className="text-text-muted text-[11.5px]">HOTMEAL.xlsx · Commercial</div>
          </div>
        </div>
      </div>
      <div className="quota-mail surface-card">
        <div className="surface-card__body flex items-center gap-3">
          <span className="quota-mail__av">TM</span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{t('catering.quota.mail2Subject')}</div>
            <div className="text-text-muted text-[11.5px]">ALA-NQZ.xlsx · Commercial</div>
          </div>
        </div>
      </div>
      <Button block icon={<FileUp size={14} />} onClick={() => setImportOpen(true)}>
        {t('catering.quota.importBtn')}
      </Button>
    </div>
  )

  return (
    <>
      {/* Source — one compact line */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3">
        <span className="text-vj-red">
          {activePending.sourceKind === 'email' ? <Mail size={16} /> : <FileSpreadsheet size={16} />}
        </span>
        <span className="font-semibold">{activePending.source}</span>
        <span className="text-text-muted text-[12.5px]">
          · {activePending.sourceKind === 'email' ? t('catering.quota.srcEmail') : t('catering.quota.srcFile')} ·{' '}
          {manual
            ? t('catering.quota.fileMetaManual', { rows: nf.format(activePending.sourceRows) })
            : t('catering.quota.fileMeta', { rows: nf.format(activePending.sourceRows) })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button size="small" icon={<FileUp size={14} />} onClick={() => setImportOpen(true)}>
            {t('catering.quota.importAnother')}
          </Button>
          <Popover trigger="click" placement="bottomRight" title={t('catering.quota.sourceTitle')} content={sourcePicker}>
            <Button size="small" icon={<RefreshCw size={14} />}>{t('catering.quota.changeSource')}</Button>
          </Popover>
        </div>
      </div>

      {manual ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-medium"
          style={{ borderColor: 'var(--color-vj-yellow, #ffdd32)', background: '#fffbe6' }}
        >
          <TriangleAlert size={15} className="shrink-0 text-amber-500" />
          {t('catering.quota.manualBanner')}
        </div>
      ) : (
        /* AI summary — slim */
        <div className="border-border bg-surface rounded-xl border px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--color-vj-green-dark)]">
              <CheckCircle2 size={16} /> {t('catering.quota.aiDone')}
            </span>
            <Space size={[6, 6]} wrap className="ml-auto">
              <Tag color="gold" style={{ marginInlineEnd: 0 }}>{t('catering.quota.chipErrors', { n: counts.error })}</Tag>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>{t('catering.quota.chipNew', { n: counts.new })}</Tag>
              <Tag color="red" style={{ marginInlineEnd: 0 }}>{t('catering.quota.chipDelta', { n: counts.delta })}</Tag>
            </Space>
          </div>
          <div className="divide-border flex divide-x">
            {[
              { label: t('catering.quota.aiRows'), value: nf.format(activePending.sourceRows) },
              { label: t('catering.quota.aiTypes'), value: activePending.normalizedTypes },
              { label: t('catering.quota.aiDeduped'), value: activePending.dedupedRows },
              { label: t('catering.quota.aiReview'), value: reviewCount, accent: true },
            ].map((s, i) => (
              <div key={s.label} className={`min-w-0 flex-1 px-4 py-0.5 ${i === 0 ? 'pl-0' : ''}`}>
                <div className="text-text-muted truncate text-[11px] font-bold tracking-wide uppercase">{s.label}</div>
                <div className={`tnum mt-0.5 text-[20px] font-extrabold ${s.accent ? 'text-vj-red' : ''}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review — the task */}
      <SurfaceCard>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[15px] font-bold">
            {reviewCount > 0 ? (
              <>
                <TriangleAlert size={17} className="text-amber-500" />
                {t('catering.quota.reviewHero', { n: reviewCount })}
              </>
            ) : (
              <>
                <CheckCircle2 size={17} className="text-emerald-600" />
                {t('catering.quota.reviewHeroDone')}
              </>
            )}
          </div>
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <Switch checked={onlyReview} onChange={setOnlyReview} size="small" />
            {t('catering.quota.onlyReview', { n: reviewCount })}
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

      {/* Publish */}
      <div className="quota-sticky-bar">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div>
            <div className="text-text-muted mb-1 text-[11.5px] font-bold">{t('catering.quota.step3Label')}</div>
            <Input value={effDate} onChange={(e) => setEffDate(e.target.value)} style={{ width: 150 }} />
          </div>
          <div className="text-text-muted max-w-[34ch] text-[12.5px] font-medium">
            {t('catering.quota.publishHint')}
          </div>
          <div className="ml-auto">
            <Space>
              <Button onClick={() => message.info(t('catering.quota.draftSaved'))}>
                {t('catering.quota.saveDraft')}
              </Button>
              <Tooltip title={activeVersion ? t('catering.quota.effExplain', { id: activeVersion.id, date: effDate || '—' }) : undefined}>
                <Button type="primary" disabled={!effDate.trim()} onClick={confirm}>
                  {t('catering.quota.publish')}
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>
      </div>

      {importModal}
    </>
  )
}
