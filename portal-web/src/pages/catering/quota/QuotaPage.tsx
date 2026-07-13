import { App as AntApp, Segmented, Spin } from 'antd'
import { History, ListChecks, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/patterns/PageHeader'
import { useAuth } from '@/core/auth/useAuth'
import { useQuotaData, useSaveQuotaData } from '@/modules/catering/hooks/useQuota'
import type { QuotaRow, SourceKind } from '@/modules/catering/types'
import { activeVersion, versionsNewestFirst, withNewVersion } from '@/modules/catering/quota'
import { formatDateDMY } from '@/shared/utils/format'
import { QuotaHistoryView } from './QuotaHistoryView'
import { QuotaImportView } from './QuotaImportView'
import { QuotaTableView } from './QuotaTableView'

type ViewKey = 'table' | 'import' | 'history'

/** DD/MM/YYYY → comparable number YYYYMMDD. */
function dmyToNum(dmy: string): number {
  const [d, m, y] = dmy.split('/')
  return Number(`${y}${m?.padStart(2, '0')}${d?.padStart(2, '0')}`)
}

export function QuotaPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useQuotaData()
  const saveQuota = useSaveQuotaData()

  const [view, setView] = useState<ViewKey>('table')
  const [viewingId, setViewingId] = useState<string | null>(null)

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

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          badge={t('catering.quota.badge')}
          title={t('catering.quota.title')}
          description={t('catering.quota.desc')}
        />

        <div className="quota-page flex flex-col gap-4">
          <Segmented<ViewKey>
            value={view}
            onChange={setView}
            className="self-start"
            options={[
              { value: 'table', label: t('catering.quota.tabTable'), icon: <ListChecks size={15} /> },
              { value: 'import', label: t('catering.quota.tabImport'), icon: <Upload size={15} /> },
              { value: 'history', label: t('catering.quota.tabHistory'), icon: <History size={15} /> },
            ]}
          />

          {view === 'table' ? (
            <QuotaTableView
              version={viewing}
              versions={versions}
              isActive={viewing.id === active?.id}
              onSelectVersion={setViewingId}
              onGotoImport={() => setView('import')}
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
    </div>
  )
}
