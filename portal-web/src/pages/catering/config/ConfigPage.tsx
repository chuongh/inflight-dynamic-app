import { Alert, App as AntApp, Button, Input, Popover, Segmented, Select, Space, Spin } from 'antd'
import { Info, Pencil, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/patterns/PageHeader'
import { useAuth } from '@/core/auth/useAuth'
import {
  activeConfigVersion,
  activeRuleCount,
  configVersionsNewestFirst,
  defaultRule,
  GROUPING_RULE_KINDS,
  QUOTA_RULE_KINDS,
  withNewConfigVersion,
} from '@/modules/catering/config'
import type { Rule, RuleConfigVersion, RuleKind } from '@/modules/catering/configTypes'
import {
  useRuleConfigData,
  useSaveRuleConfigData,
} from '@/modules/catering/hooks/useRuleConfig'
import type { VersionStatus } from '@/modules/catering/types'
import { formatDateDMY } from '@/shared/utils/format'
import { RuleCard } from './RuleCard'
import { RuleEditorDrawer } from './RuleEditorDrawer'
import { RulePickerModal } from './RulePickerModal'
import { CrewMealTab } from './crew/CrewMealTab'

type ConfigTab = 'commercial' | 'grouping' | 'crew'

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

export function ConfigPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useRuleConfigData()
  const saveConfig = useSaveRuleConfigData()

  const [tab, setTab] = useState<ConfigTab>('commercial')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [workingRules, setWorkingRules] = useState<Rule[]>([])
  const [effDate, setEffDate] = useState('')

  const [editorRule, setEditorRule] = useState<Rule | null>(null)
  const [editorNew, setEditorNew] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const versions = useMemo(() => configVersionsNewestFirst(data?.versions ?? []), [data])
  const active = useMemo(() => activeConfigVersion(versions), [versions])
  const viewing = useMemo(
    () => versions.find((v) => v.id === viewingId) ?? active,
    [versions, viewingId, active],
  )

  if (isLoading || !data || !viewing) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  const isActiveView = viewing.id === active?.id
  const visibleKinds = tab === 'grouping' ? GROUPING_RULE_KINDS : QUOTA_RULE_KINDS
  const displayRules = (editing ? workingRules : viewing.rules).filter((r) =>
    visibleKinds.includes(r.kind),
  )

  const startEdit = () => {
    setWorkingRules(structuredClone(viewing.rules))
    setEffDate(formatDateDMY(Date.now()))
    setEditing(true)
  }
  const cancelEdit = () => {
    setEditing(false)
    setWorkingRules([])
  }
  const toggleRule = (id: string, enabled: boolean) =>
    setWorkingRules((prev) => prev.map((r) => (r.id === id ? ({ ...r, enabled } as Rule) : r)))
  const removeRule = (id: string) =>
    setWorkingRules((prev) => prev.filter((r) => r.id !== id))
  const openEdit = (rule: Rule) => {
    setEditorRule(rule)
    setEditorNew(false)
    setEditorOpen(true)
  }
  const pickKind = (kind: RuleKind) => {
    setEditorRule(defaultRule(kind, `r-${Date.now()}`))
    setEditorNew(true)
    setPickerOpen(false)
    setEditorOpen(true)
  }
  const saveRule = (rule: Rule) => {
    setWorkingRules((prev) =>
      editorNew ? [...prev, rule] : prev.map((r) => (r.id === rule.id ? rule : r)),
    )
    setEditorOpen(false)
  }

  const publish = () => {
    const today = formatDateDMY(Date.now())
    const startsInFuture = dmyToNum(effDate) > dmyToNum(today)
    const next = withNewConfigVersion(data.versions, workingRules, {
      effectiveFrom: effDate,
      updatedBy: session?.user.name ?? 'Commercial',
      updatedAt: today,
      startsInFuture,
    })
    saveConfig.mutate(
      { versions: next },
      {
        onSuccess: () => {
          setViewingId(next[0].id)
          setEditing(false)
          setWorkingRules([])
          message.success(t('catering.config.created', { id: next[0].id, date: effDate }))
        },
      },
    )
  }

  const effRange = `${viewing.effectiveFrom} → ${viewing.effectiveTo ?? t('catering.quota.untilNextShort')}`

  const summaryText = t('catering.config.summary', { count: activeRuleCount(displayRules) })

  const renderVersion = (v: RuleConfigVersion) => (
    <span className="inline-flex items-center gap-2">
      <Dot status={v.status} /> {v.id} · {t(`catering.quota.status.${v.status}`)}
    </span>
  )

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          badge={t('catering.config.badge')}
          title={t('catering.config.title')}
          description={t('catering.config.desc')}
        />

        <div className="mt-1 mb-4">
          <Segmented<ConfigTab>
            value={tab}
            onChange={(v) => setTab(v)}
            size="large"
            options={[
              { value: 'commercial', label: t('catering.config.tab.commercial') },
              { value: 'grouping', label: t('catering.config.tab.grouping') },
              { value: 'crew', label: t('catering.config.tab.crew') },
            ]}
          />
        </div>

        {tab === 'crew' ? (
          <CrewMealTab />
        ) : (
          <>
        <div className="flex flex-col gap-4">
          {/* Version context bar */}
          <div className="border-border bg-surface flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border px-4 py-3">
            <Select
              value={viewing.id}
              onChange={(id) => {
                setViewingId(id)
                if (editing) cancelEdit()
              }}
              style={{ minWidth: 150 }}
              optionLabelProp="label"
              options={versions.map((v) => ({ value: v.id, label: renderVersion(v) }))}
            />
            <span className="border-border bg-background inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold tnum">
              {effRange}
            </span>
            <Popover
              placement="bottomLeft"
              trigger="click"
              content={
                <div className="max-w-xs space-y-1 text-[12.5px] leading-relaxed">
                  <div>{t('catering.config.updatedMeta', { by: viewing.updatedBy, at: viewing.updatedAt })}</div>
                  {viewing.note ? <div className="text-text-muted">{viewing.note}</div> : null}
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

            <div className="ml-auto">
              {isActiveView && !editing ? (
                <Button type="primary" icon={<Pencil size={15} />} onClick={startEdit}>
                  {t('catering.config.editConfig')}
                </Button>
              ) : null}
            </div>
          </div>

          {!isActiveView && !editing ? (
            <Alert type="info" showIcon title={t('catering.config.readonlyHint')} />
          ) : null}

          {editing ? (
            <Alert type="info" showIcon title={t('catering.config.editBanner')} />
          ) : null}

          {/* Summary line */}
          <div className="border-border bg-surface flex items-center gap-2 rounded-xl border px-4 py-2.5">
            <span className="text-[13px] font-semibold">{summaryText}</span>
          </div>

          {/* Rules list */}
          <div className="flex flex-col gap-2">
            {displayRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                editing={editing}
                onToggle={(enabled) => toggleRule(rule.id, enabled)}
                onEdit={() => openEdit(rule)}
                onRemove={() => removeRule(rule.id)}
              />
            ))}

            {displayRules.length === 0 ? (
              <div className="border-border text-text-muted rounded-xl border border-dashed px-4 py-8 text-center text-[13px]">
                {t('catering.config.noRules')}
              </div>
            ) : null}

            {editing ? (
              <Button
                type="dashed"
                block
                icon={<Plus size={15} />}
                onClick={() => setPickerOpen(true)}
                className="mt-1"
              >
                {t('catering.config.addRule')}
              </Button>
            ) : null}
          </div>
        </div>

        {editing ? (
          <div className="quota-sticky-bar">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div>
                <div className="text-text-muted mb-1 text-[11.5px] font-bold">
                  {t('catering.config.effectiveFrom')}
                </div>
                <Input value={effDate} onChange={(e) => setEffDate(e.target.value)} style={{ width: 150 }} />
              </div>
              <div className="text-text-muted max-w-[34ch] text-[12.5px] font-medium">
                {t('catering.config.publishHint')}
              </div>
              <div className="ml-auto">
                <Space>
                  <Button icon={<X size={14} />} onClick={cancelEdit}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="primary" disabled={!effDate.trim()} onClick={publish}>
                    {t('catering.config.publish')}
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        ) : null}
          </>
        )}
      </div>

      <RuleEditorDrawer
        open={editorOpen}
        rule={editorRule}
        onClose={() => setEditorOpen(false)}
        onSave={saveRule}
      />
      <RulePickerModal
        open={pickerOpen}
        kinds={visibleKinds}
        onClose={() => setPickerOpen(false)}
        onPick={pickKind}
      />
    </div>
  )
}
