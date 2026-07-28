import { App as AntApp, Button, Popover, Segmented, Select, Spin } from 'antd'
import { Info, Pencil, SlidersHorizontal, UploadCloud } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/patterns/PageHeader'
import { useAuth } from '@/core/auth/useAuth'
import { useQuotaData, useSaveQuotaData } from '@/modules/catering/hooks/useQuota'
import type { QuotaRow, SourceKind, VersionStatus } from '@/modules/catering/types'
import { activeVersion, versionsNewestFirst, withNewVersion } from '@/modules/catering/quota'
import { paths } from '@/routes/paths'
import { formatDateDMY } from '@/shared/utils/format'
import { QuotaHistoryView } from './QuotaHistoryView'
import { QuotaImportView } from './QuotaImportView'
import { QuotaTableView, type QuotaTableViewHandle } from './QuotaTableView'

type ViewKey = 'table' | 'import' | 'history'

const STATUS_DOT: Record<VersionStatus, string> = {
  active: '#16a34a',
  scheduled: '#2563eb',
  superseded: '#9ca3af',
  draft: '#c9a000',
}

/** DD/MM/YYYY → comparable number YYYYMMDD. */
function dmyToNum(dmy: string): number {
  const [d, m, y] = dmy.split('/')
  return Number(`${y}${m?.padStart(2, '0')}${d?.padStart(2, '0')}`)
}

function Dot({ status }: { status: VersionStatus }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: STATUS_DOT[status] }}
      aria-hidden
    />
  )
}

export function QuotaPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useQuotaData()
  const saveQuota = useSaveQuotaData()

  const [view, setView] = useState<ViewKey>('table')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [tableEditing, setTableEditing] = useState(false)
  const tableRef = useRef<QuotaTableViewHandle>(null)

  const versions = useMemo(() => versionsNewestFirst(data?.versions ?? []), [data])
  const active = useMemo(() => activeVersion(versions), [versions])
  const viewing = useMemo(
    () => versions.find((v) => v.id === viewingId) ?? active,
    [versions, viewingId, active],
  )

  const createVersion = (
    rows: QuotaRow[],
    effectiveFrom: string,
    source: string,
    sourceKind: SourceKind,
  ) => {
    if (!data) return
    const today = formatDateDMY(Date.now())
    const startsInFuture = dmyToNum(effectiveFrom) > dmyToNum(today)
    const nextVersions = withNewVersion(data.versions, rows, {
      effectiveFrom,
      importedBy: session?.user.name ?? 'Commercial',
      importedAt: today,
      source,
      sourceKind,
      startsInFuture,
    })
    saveQuota.mutate(
      { versions: nextVersions, pendingImport: null },
      {
        onSuccess: () => {
          setViewingId(nextVersions[0].id)
          setView('history')
          setTableEditing(false)
          message.success(
            t('catering.quota.created', { id: nextVersions[0].id, date: effectiveFrom }),
          )
        },
      },
    )
  }

  if (isLoading || !data || !viewing) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  const effRange = `${viewing.effectiveFrom} → ${viewing.effectiveTo ?? t('catering.quota.untilNextShort')}`
  const isActive = viewing.id === active?.id

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          badge={t('catering.quota.badge')}
          title={t('catering.quota.title')}
          description={t('catering.quota.desc')}
          actions={
            view === 'table' ? (
              <>
                <Select
                  value={viewing.id}
                  onChange={(id) => {
                    setViewingId(id)
                    setTableEditing(false)
                  }}
                  style={{ minWidth: 150 }}
                  optionLabelProp="label"
                  options={versions.map((v) => ({
                    value: v.id,
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <Dot status={v.status} /> {v.id} · {t(`catering.quota.status.${v.status}`)}
                      </span>
                    ),
                  }))}
                />
                <span className="border-border bg-background inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold tnum">
                  {effRange}
                </span>
                <Popover
                  placement="bottomLeft"
                  trigger="click"
                  content={
                    <div className="max-w-xs text-[12.5px] leading-relaxed">
                      {t('catering.quota.importedMeta', {
                        by: viewing.importedBy,
                        at: viewing.importedAt,
                        source: viewing.source,
                      })}
                    </div>
                  }
                >
                  <button
                    type="button"
                    className="text-text-muted hover:text-foreground hover:bg-background inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                    aria-label={t('catering.quota.detailsAria')}
                  >
                    <Info size={16} />
                  </button>
                </Popover>
                <Link
                  to={paths.catering.config.list}
                  className="text-text-muted hover:text-vj-red inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  {t('catering.quota.rulesLink')}
                </Link>
                {isActive ? (
                  <Button
                    icon={<Pencil size={15} />}
                    onClick={() => tableRef.current?.startEdit()}
                    disabled={tableEditing}
                  >
                    {t('catering.quota.manualEdit')}
                  </Button>
                ) : null}
                <Button
                  type="primary"
                  icon={<UploadCloud size={15} />}
                  onClick={() => {
                    setTableEditing(false)
                    setView('import')
                  }}
                >
                  {t('catering.quota.importNew')}
                </Button>
              </>
            ) : null
          }
        />

        <div className="config-tab-scroll mt-1 mb-4">
          <Segmented<ViewKey>
            value={view}
            onChange={(next) => {
              setView(next)
              setTableEditing(false)
            }}
            size="large"
            options={[
              { value: 'table', label: t('catering.quota.tabTable') },
              { value: 'import', label: t('catering.quota.tabImport') },
              { value: 'history', label: t('catering.quota.tabHistory') },
            ]}
          />
        </div>

        {view === 'table' ? (
          <QuotaTableView
            ref={tableRef}
            version={viewing}
            isActive={isActive}
            editing={tableEditing}
            onEditingChange={setTableEditing}
            onCreateVersion={createVersion}
          />
        ) : null}

        {view === 'import' ? (
          <QuotaImportView
            pending={data.pendingImport}
            activeVersion={active}
            onCreateVersion={createVersion}
          />
        ) : null}

        {view === 'history' ? (
          <QuotaHistoryView versions={versions} highlightId={viewingId} />
        ) : null}
      </div>
    </div>
  )
}
