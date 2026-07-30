import { Alert, App as AntApp, Button, Segmented, Spin } from 'antd'
import { Pencil, Plus } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
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
  RULE_CATEGORY,
  type RuleCategory,
  withNewConfigVersion,
} from '@/modules/catering/config'
import type { Rule, RuleKind } from '@/modules/catering/configTypes'
import {
  useRuleConfigData,
  useSaveRuleConfigData,
} from '@/modules/catering/hooks/useRuleConfig'
import { formatDateDMY } from '@/shared/utils/format'
import { CATEGORY_ACCENT } from './ruleMeta'
import { ConfigEmptyState } from './ConfigEmptyState'
import { ConfigPublishBar } from './ConfigPublishBar'
import { ConfigVersionBar } from './ConfigVersionBar'
import { CrewMealTab } from './crew/CrewMealTab'
import { RuleCard } from './RuleCard'
import { RuleEditorDrawer } from './RuleEditorDrawer'
import { RulePickerModal } from './RulePickerModal'
import { SupplierRulesTab } from './SupplierRulesTab'

/** Fixed scan order — reduction (cuts) before exclusion (zeroes) before grouping. */
const CATEGORY_ORDER: RuleCategory[] = ['reduction', 'exclusion', 'grouping']

type ConfigTab = 'commercial' | 'grouping' | 'crew' | 'supplier'

function dmyToNum(dmy: string): number {
  const [d, m, y] = dmy.split('/')
  return Number(`${y}${m?.padStart(2, '0')}${d?.padStart(2, '0')}`)
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
  const [crewEditAction, setCrewEditAction] = useState<ReactNode>(null)
  const [supplierEditAction, setSupplierEditAction] = useState<ReactNode>(null)

  const onCrewEditAction = useCallback((actions: ReactNode | null) => {
    setCrewEditAction(actions)
  }, [])

  const onSupplierEditAction = useCallback((actions: ReactNode | null) => {
    setSupplierEditAction(actions)
  }, [])

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
  const categoriesPresent = CATEGORY_ORDER.filter((cat) =>
    displayRules.some((r) => RULE_CATEGORY[r.kind] === cat),
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

  const summaryText = t('catering.config.summary', { count: activeRuleCount(displayRules) })
  const showQuotaTabs = tab === 'commercial' || tab === 'grouping'

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          badge={t('catering.config.badge')}
          title={t('catering.config.title')}
          description={t('catering.config.desc')}
          actions={
            tab === 'crew' ? (
              crewEditAction
            ) : tab === 'supplier' ? (
              supplierEditAction
            ) : isActiveView && !editing ? (
              <Button type="primary" icon={<Pencil size={15} />} onClick={startEdit}>
                {t('catering.config.editConfig')}
              </Button>
            ) : null
          }
        />

        <div className="config-tab-scroll mt-1 mb-3">
          <Segmented<ConfigTab>
            value={tab}
            onChange={(v) => {
              setTab(v)
              if (v !== 'crew') setCrewEditAction(null)
              if (v !== 'supplier') setSupplierEditAction(null)
            }}
            size="large"
            options={[
              { value: 'commercial', label: t('catering.config.tab.commercial') },
              { value: 'grouping', label: t('catering.config.tab.grouping') },
              { value: 'supplier', label: t('catering.config.tab.supplier') },
              { value: 'crew', label: t('catering.config.tab.crew') },
            ]}
          />
        </div>

        {showQuotaTabs ? (
          <ConfigVersionBar
            versions={versions}
            value={viewing.id}
            onChange={(id) => {
              setViewingId(id)
              if (editing) cancelEdit()
            }}
          />
        ) : null}

        {tab === 'crew' ? (
          <CrewMealTab onEditAction={onCrewEditAction} />
        ) : tab === 'supplier' ? (
          <SupplierRulesTab onEditAction={onSupplierEditAction} />
        ) : (
          <>
            <div className="flex w-full min-w-0 flex-col gap-4">
              {!isActiveView && !editing ? (
                <Alert type="info" showIcon title={t('catering.config.readonlyHint')} />
              ) : null}

              {editing ? (
                <Alert type="info" showIcon title={t('catering.config.editBanner')} />
              ) : null}

              <p className="config-eyebrow">{summaryText}</p>

              <div className="flex flex-col gap-2">
                {categoriesPresent.length > 1
                  ? categoriesPresent.map((cat) => {
                      const rulesInCat = displayRules.filter((r) => RULE_CATEGORY[r.kind] === cat)
                      const accent = CATEGORY_ACCENT[cat]
                      return (
                        <div key={cat} className="config-rule-group">
                          <div className="config-rule-group__head">
                            <span className="config-rule-group__dot" style={{ background: accent.color }} />
                            <span className="config-rule-group__label" style={{ color: accent.color }}>
                              {t(`catering.config.cat.${cat}`)}
                            </span>
                            <span className="config-rule-group__count">{rulesInCat.length}</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {rulesInCat.map((rule) => (
                              <RuleCard
                                key={rule.id}
                                rule={rule}
                                editing={editing}
                                onToggle={(enabled) => toggleRule(rule.id, enabled)}
                                onEdit={() => openEdit(rule)}
                                onRemove={() => removeRule(rule.id)}
                                showCategory={false}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })
                  : displayRules.map((rule) => (
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
                  <ConfigEmptyState
                    message={t('catering.config.noRules')}
                    actionLabel={editing ? t('catering.config.addRule') : undefined}
                    onAction={editing ? () => setPickerOpen(true) : undefined}
                  />
                ) : null}

                {editing && displayRules.length > 0 ? (
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
              <ConfigPublishBar
                effDate={effDate}
                onEffDateChange={setEffDate}
                onCancel={cancelEdit}
                onPublish={publish}
                publishing={saveConfig.isPending}
              />
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
