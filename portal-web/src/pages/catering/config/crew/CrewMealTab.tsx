import {
  Alert,
  App as AntApp,
  Button,
  Checkbox,
  InputNumber,
  Input,
  Popover,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
} from 'antd'
import { Info, Lock, Pencil, Plane, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/useAuth'
import {
  activeCrewMealVersion,
  crewMealVersionsNewestFirst,
  profileFor,
  windowSpanLabel,
  withNewCrewMealVersion,
} from '@/modules/catering/crewMeal'
import { TIME_RE } from '@/modules/catering/constants'
import type {
  CrewColumn,
  CrewGroup,
  CrewMealProfile,
  CrewMealConfigVersion,
  MealWindow,
} from '@/modules/catering/crewMealTypes'
import {
  useCrewMealConfigData,
  useSaveCrewMealConfigData,
} from '@/modules/catering/hooks/useCrewMealConfig'
import type { VersionStatus } from '@/modules/catering/types'
import { formatDateDMY } from '@/shared/utils/format'
import { CrewMealSimulator } from './CrewMealSimulator'
import { MealWindowTimeline, SLOT_META } from './MealWindowTimeline'

const STATUS_DOT: Record<VersionStatus, string> = {
  active: '#16a34a',
  scheduled: '#2563eb',
  superseded: '#9ca3af',
  draft: '#c9a000',
}

const GROUPS: { value: CrewGroup; icon: ReactNode }[] = [
  { value: 'cockpit', icon: <Plane size={15} strokeWidth={2} /> },
  { value: 'cabin', icon: <Users size={15} strokeWidth={2} /> },
]

const ALL_COLUMNS: CrewColumn[] = ['cockpit', 'jumpseat', 'positioning', 'cabin']

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

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-border bg-surface rounded-xl border px-4 py-3.5">
      <div className="mb-3">
        <h3 className="m-0 text-[13.5px] font-bold">{title}</h3>
        {hint ? <p className="text-text-muted m-0 mt-0.5 text-[11.5px] leading-snug">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function CrewMealTab() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { data, isLoading } = useCrewMealConfigData()
  const saveConfig = useSaveCrewMealConfigData()

  const [group, setGroup] = useState<CrewGroup>('cockpit')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [workingProfiles, setWorkingProfiles] = useState<CrewMealProfile[]>([])
  const [effDate, setEffDate] = useState('')

  const versions = useMemo(() => crewMealVersionsNewestFirst(data?.versions ?? []), [data])
  const active = useMemo(() => activeCrewMealVersion(versions), [versions])
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
  const displayProfiles = editing ? workingProfiles : viewing.profiles

  // Only groups the airline applies a meal policy to are selectable. Vietjet
  // feeds the cockpit only, so cabin ships disabled — the profile stays configured.
  const enabledGroups = displayProfiles.filter((p) => p.enabled).map((p) => p.group)
  const disabledGroups = displayProfiles.filter((p) => !p.enabled)
  const activeGroup = enabledGroups.includes(group) ? group : (enabledGroups[0] ?? group)
  const profile =
    displayProfiles.find((p) => p.group === activeGroup) ?? profileFor(viewing, activeGroup)!

  const timeInvalid = displayProfiles.some((p) =>
    p.windows.some((w) => !TIME_RE.test(w.start) || !TIME_RE.test(w.end)),
  )

  const startEdit = () => {
    setWorkingProfiles(structuredClone(viewing.profiles))
    setEffDate(formatDateDMY(Date.now()))
    setEditing(true)
  }
  const cancelEdit = () => {
    setEditing(false)
    setWorkingProfiles([])
  }

  const patchProfile = (partial: Partial<CrewMealProfile>) =>
    setWorkingProfiles((prev) =>
      prev.map((p) => (p.group === activeGroup ? { ...p, ...partial } : p)),
    )
  const patchWindow = (id: string, partial: Partial<MealWindow>) =>
    setWorkingProfiles((prev) =>
      prev.map((p) =>
        p.group === activeGroup
          ? { ...p, windows: p.windows.map((w) => (w.id === id ? { ...w, ...partial } : w)) }
          : p,
      ),
    )

  const publish = () => {
    const today = formatDateDMY(Date.now())
    const startsInFuture = dmyToNum(effDate) > dmyToNum(today)
    const next = withNewCrewMealVersion(data.versions, workingProfiles, {
      effectiveFrom: effDate,
      updatedBy: session?.user.name ?? 'IFS',
      updatedAt: today,
      startsInFuture,
    })
    saveConfig.mutate(
      { versions: next },
      {
        onSuccess: () => {
          setViewingId(next[0].id)
          setEditing(false)
          setWorkingProfiles([])
          message.success(t('catering.config.crew.created', { id: next[0].id, date: effDate }))
        },
      },
    )
  }

  const effRange = `${viewing.effectiveFrom} → ${viewing.effectiveTo ?? t('catering.quota.untilNextShort')}`
  const disabled = !editing

  const renderVersion = (v: CrewMealConfigVersion) => (
    <span className="inline-flex items-center gap-2">
      <Dot status={v.status} /> {v.id} · {t(`catering.quota.status.${v.status}`)}
    </span>
  )

  return (
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
        <span className="border-border bg-background tnum inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-semibold">
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
              {t('catering.config.crew.editConfig')}
            </Button>
          ) : null}
        </div>
      </div>

      {!isActiveView && !editing ? (
        <Alert type="info" showIcon message={t('catering.config.readonlyHint')} />
      ) : null}
      {editing ? <Alert type="info" showIcon message={t('catering.config.editBanner')} /> : null}

      {/* Profile switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<CrewGroup>
          value={activeGroup}
          onChange={setGroup}
          options={GROUPS.map((g) => {
            const on = displayProfiles.find((p) => p.group === g.value)?.enabled ?? false
            return {
              value: g.value,
              disabled: !on,
              label: (
                <span className="inline-flex items-center gap-1.5 px-1 py-0.5 font-semibold">
                  {on ? g.icon : <Lock size={13} strokeWidth={2} />}
                  {t(`catering.config.crew.group.${g.value}`)}
                </span>
              ),
            }
          })}
        />
        <span className="text-text-muted text-[12px]">
          {t(`catering.config.crew.groupHint.${activeGroup}`)}
        </span>
      </div>

      {disabledGroups.length > 0 ? (
        <div className="border-border bg-background text-text-secondary flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-[12px] leading-snug">
          <Lock size={14} className="mt-0.5 shrink-0 text-[color:var(--color-vj-yellow-dark)]" />
          <span>
            {t('catering.config.crew.disabledNote', {
              groups: disabledGroups
                .map((p) => t(`catering.config.crew.group.${p.group}`))
                .join(', '),
            })}
          </span>
        </div>
      ) : null}

      {/* Main grid: form + sticky simulator */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          {/* A — Meal windows */}
          <Card title={t('catering.config.crew.windows.title')} hint={t('catering.config.crew.windows.hint')}>
            <MealWindowTimeline windows={profile.windows} />
            <div className="mt-3 flex flex-col gap-1.5">
              {profile.windows.map((w) => {
                const meta = SLOT_META[w.slot]
                const bad = !TIME_RE.test(w.start) || !TIME_RE.test(w.end)
                return (
                  <div
                    key={w.id}
                    className="border-border bg-background flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2"
                  >
                    <span
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                      style={{ color: meta.color, minWidth: 96 }}
                    >
                      {meta.icon}
                      {t(`catering.config.crew.slot.${w.slot}`)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Input
                        value={w.start}
                        disabled={disabled}
                        status={disabled ? undefined : !TIME_RE.test(w.start) ? 'error' : undefined}
                        onChange={(e) => patchWindow(w.id, { start: e.target.value })}
                        style={{ width: 78 }}
                        className="tnum"
                        aria-label={t('catering.config.crew.windows.start')}
                      />
                      <span className="text-text-muted">–</span>
                      <Input
                        value={w.end}
                        disabled={disabled}
                        status={disabled ? undefined : !TIME_RE.test(w.end) ? 'error' : undefined}
                        onChange={(e) => patchWindow(w.id, { end: e.target.value })}
                        style={{ width: 78 }}
                        className="tnum"
                        aria-label={t('catering.config.crew.windows.end')}
                      />
                    </span>
                    <span className="text-text-muted tnum ml-auto text-[11.5px]">
                      {bad ? t('catering.config.crew.windows.invalid') : windowSpanLabel(w)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* B — Duty span buffers */}
          <Card title={t('catering.config.crew.duty.title')} hint={t('catering.config.crew.duty.hint')}>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">{t('catering.config.crew.duty.preStd')}</span>
                <InputNumber
                  min={0}
                  max={240}
                  step={5}
                  value={profile.preStdMinutes}
                  disabled={disabled}
                  onChange={(v) => patchProfile({ preStdMinutes: Number(v ?? 0) })}
                  addonBefore="−"
                  addonAfter={t('catering.config.crew.minutes')}
                  style={{ width: 168 }}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">{t('catering.config.crew.duty.postSta')}</span>
                <InputNumber
                  min={0}
                  max={240}
                  step={5}
                  value={profile.postStaMinutes}
                  disabled={disabled}
                  onChange={(v) => patchProfile({ postStaMinutes: Number(v ?? 0) })}
                  addonBefore="+"
                  addonAfter={t('catering.config.crew.minutes')}
                  style={{ width: 168 }}
                />
              </label>
            </div>
          </Card>

          {/* C — Counting & dedupe */}
          <Card title={t('catering.config.crew.count.title')} hint={t('catering.config.crew.count.hint')}>
            <div className="mb-3">
              <span className="mb-2 block text-[12px] font-bold">{t('catering.config.crew.count.columns')}</span>
              <Checkbox.Group
                value={profile.countedColumns}
                disabled={disabled}
                onChange={(v) => patchProfile({ countedColumns: v as CrewColumn[] })}
              >
                <Space size={[16, 8]} wrap>
                  {ALL_COLUMNS.map((c) => (
                    <Checkbox key={c} value={c}>
                      {t(`catering.config.crew.column.${c}`)}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>
            <div className="border-border flex items-center justify-between border-t pt-3">
              <span className="text-[12.5px] font-semibold">{t('catering.config.crew.count.dedupe')}</span>
              <Switch
                checked={profile.dedupeByEmployee}
                disabled={disabled}
                onChange={(v) => patchProfile({ dedupeByEmployee: v })}
              />
            </div>
          </Card>

          {/* D — Midnight split, overlap threshold & formula */}
          <Card title={t('catering.config.crew.rules.title')}>
            <div className="flex flex-col gap-3">
              <label className="flex flex-wrap items-center justify-between gap-2">
                <span className="max-w-[38ch] text-[12.5px] font-semibold">
                  {t('catering.config.crew.rules.minOverlap')}
                </span>
                <InputNumber
                  min={0}
                  max={120}
                  step={5}
                  value={profile.minOverlapMinutes}
                  disabled={disabled}
                  onChange={(v) => patchProfile({ minOverlapMinutes: Number(v ?? 0) })}
                  addonAfter={t('catering.config.crew.minutes')}
                  style={{ width: 150 }}
                />
              </label>
              <div className="border-border flex items-center justify-between gap-2 border-t pt-3">
                <span className="max-w-[38ch] text-[12.5px] font-semibold">
                  {t('catering.config.crew.rules.splitMidnight')}
                </span>
                <Switch
                  checked={profile.splitByLandingDate}
                  disabled={disabled}
                  onChange={(v) => patchProfile({ splitByLandingDate: v })}
                />
              </div>
              <div className="border-border rounded-lg border bg-[color:var(--color-vj-red-50)]/40 px-3.5 py-2.5">
                <span className="text-text-muted text-[11px] font-bold tracking-wide uppercase">
                  {t('catering.config.crew.rules.formula')}
                </span>
                <div className="mt-1 text-[13.5px] font-semibold">
                  {t('catering.config.crew.rules.formulaBody')}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sticky simulator */}
        <div className="xl:sticky xl:top-4">
          <CrewMealSimulator profile={profile} />
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
                <Button
                  type="primary"
                  disabled={!effDate.trim() || timeInvalid}
                  onClick={publish}
                >
                  {t('catering.config.publish')}
                </Button>
              </Space>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
