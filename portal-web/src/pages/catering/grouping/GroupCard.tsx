import { Button, Select, Tooltip } from 'antd'
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ChevronDown,
  Circle,
  Pencil,
  Plane,
  Utensils,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  formatDuration,
  groupFlightMinutes,
  isReview,
} from '@/modules/catering/grouping'
import type { FlightGroup } from '@/modules/catering/groupingTypes'
import { InlineRoute, RouteTimeline } from './RouteTimeline'

interface Props {
  group: FlightGroup
  /** 1-based display number (stable across sort/filter). */
  number: number
  open: boolean
  editing: boolean
  allGroups: FlightGroup[]
  numberOf: (id: string) => number
  onToggleOpen: () => void
  onToggleEdit: () => void
  onConfirm: () => void
  onMarkCorrect: () => void
  onSplit: (at: number) => void
  onMergeInto: (targetId: string) => void
  onMoveLeg: (legIndex: number, destId: string) => void
}

function shortPurser(name: string): string {
  return name.split(' ').slice(0, 3).join(' ')
}

export function GroupCard({
  group,
  number,
  open,
  editing,
  allGroups,
  numberOf,
  onToggleOpen,
  onToggleEdit,
  onConfirm,
  onMarkCorrect,
  onSplit,
  onMergeInto,
  onMoveLeg,
}: Props) {
  const { t } = useTranslation()
  const review = isReview(group)
  const flightMin = groupFlightMinutes(group)
  const origin = group.legs[0]?.dep ?? '—'
  const timeRange = group.legs.length
    ? `${group.legs[0].std} – ${group.legs[group.legs.length - 1].sta}`
    : '—'

  const accent = group.confirmed
    ? 'border-l-[3px] border-l-vj-green'
    : review
      ? 'border-l-[3px] border-l-vj-yellow'
      : ''

  const numTagCls = group.confirmed
    ? 'bg-vj-green-muted text-vj-green-dark'
    : review
      ? 'bg-vj-yellow-muted text-vj-yellow-dark'
      : 'bg-[#F1F5F9] text-text-secondary'

  const mergeTargets = allGroups.filter((g) => g.id !== group.id && g.aircraft === group.aircraft)
  const moveTargets = allGroups.filter((g) => g.id !== group.id)

  return (
    <article
      className={`bg-surface border-border overflow-hidden rounded-xl border shadow-[var(--shadow-soft,0_2px_8px_rgba(35,31,32,0.05))] transition-shadow ${accent} ${group.confirmed ? 'opacity-90' : ''}`}
    >
      {/* Collapsed row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleOpen()
          }
        }}
        className="grid cursor-pointer select-none grid-cols-[26px_minmax(150px,210px)_1fr_auto_auto] items-center gap-3.5 px-4 py-3 hover:bg-[#FCFDFE]"
      >
        <span
          title={t('catering.grouping.groupN', { n: number })}
          className={`grid h-[26px] w-[26px] place-items-center rounded-md text-[13px] font-extrabold ${numTagCls}`}
        >
          {number}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-extrabold">
            {group.aircraft}
            <span className="bg-muted text-text-secondary rounded px-1.5 py-px text-[10.5px] font-extrabold">
              {group.aircraftType}
            </span>
          </div>
          <div className="text-text-secondary mt-0.5 truncate text-[12px] font-semibold">
            {t('catering.grouping.purser')} · <span className="text-foreground">{group.purser}</span>
          </div>
        </div>

        <InlineRoute group={group} />

        <div className="flex items-center justify-self-end gap-4">
          <div className="text-right">
            <div className="text-[17px] leading-none font-extrabold">{group.legs.length}</div>
            <div className="text-text-secondary mt-0.5 text-[11px] font-semibold">
              {t('catering.grouping.legs')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[17px] leading-none font-extrabold tnum">{formatDuration(flightMin)}</div>
            <div className="text-text-secondary mt-0.5 text-[11px] font-semibold">
              {t('catering.grouping.flightTime')}
            </div>
          </div>
          {group.confirmed ? (
            <span className="bg-vj-green-muted text-vj-green-dark inline-flex items-center gap-1.5 rounded-full border border-[#B8E67A] px-2.5 py-1 text-[11.5px] font-extrabold">
              <Check size={13} strokeWidth={3} />
              {t('catering.grouping.confirmed')}
            </span>
          ) : review ? (
            <span className="bg-vj-yellow-muted text-vj-yellow-dark border-vj-yellow-border inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-extrabold">
              <AlertTriangle size={13} />
              {t('catering.grouping.needsReview')}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 justify-self-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={group.confirmed ? t('catering.grouping.unconfirm') : t('catering.grouping.confirm')}>
            <button
              type="button"
              onClick={onConfirm}
              aria-label={group.confirmed ? t('catering.grouping.unconfirm') : t('catering.grouping.confirm')}
              className={`grid h-9 w-9 cursor-pointer place-items-center rounded-lg border transition-colors ${
                group.confirmed
                  ? 'bg-vj-green-dark border-vj-green-dark text-white'
                  : 'border-border text-text-muted hover:border-vj-green-dark hover:text-vj-green-dark hover:bg-vj-green-muted'
              }`}
            >
              {group.confirmed ? <Check size={18} strokeWidth={3} /> : <Circle size={18} />}
            </button>
          </Tooltip>
          <button
            type="button"
            onClick={onToggleOpen}
            aria-label={t('catering.grouping.toggleDetail')}
            className={`text-text-muted grid h-9 w-[30px] cursor-pointer place-items-center transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <ChevronDown size={19} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {open ? (
        <div className="border-border border-t bg-[#FCFDFE] px-[22px] py-[18px]">
          <div className="bg-vj-red-50 text-vj-red-dark mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#F5C6C4] px-3 py-1.5 text-[12px] font-bold">
            <Utensils size={15} />
            {t('catering.grouping.loadNote', {
              station: origin,
              legs: group.legs.length,
              time: formatDuration(flightMin),
            })}
          </div>

          <RouteTimeline group={group} editing={editing} onSplit={onSplit} />

          <div className="border-border mt-[18px] flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-dashed pt-4">
            <DetailField label={t('catering.grouping.loadPoint')} value={origin} />
            <DetailField label={t('catering.grouping.totalFlightTime')} value={formatDuration(flightMin)} />
            <DetailField label={t('catering.grouping.timeRange')} value={timeRange} />
            <DetailField label={t('catering.grouping.aircraft')} value={`${group.aircraft} · ${group.aircraftType}`} />
            <DetailField label={t('catering.grouping.purser')} value={`${shortPurser(group.purser)} · #${group.purserCode}`} />

            <div className="ml-auto flex items-center gap-2.5">
              <Button icon={<Pencil size={15} />} onClick={onToggleEdit}>
                {editing ? t('catering.grouping.doneEditing') : t('catering.grouping.editGrouping')}
              </Button>
              <Button
                type={group.confirmed ? 'default' : 'primary'}
                icon={group.confirmed ? <Circle size={15} /> : <Check size={15} strokeWidth={3} />}
                onClick={onConfirm}
                style={
                  group.confirmed
                    ? undefined
                    : { background: 'var(--color-vj-green-dark)', borderColor: 'var(--color-vj-green-dark)' }
                }
              >
                {group.confirmed ? t('catering.grouping.unconfirm') : t('catering.grouping.confirmGroup')}
              </Button>
            </div>
          </div>

          {review && group.reviewNote ? (
            <div className="bg-vj-yellow-muted border-vj-yellow-border text-vj-yellow-dark mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[12.5px] font-semibold">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                <span className="text-foreground font-bold">{t('catering.grouping.aiSuggests')}</span>{' '}
                {group.reviewNote}
              </span>
              <div className="ml-auto flex shrink-0 gap-2">
                <Button size="small" onClick={onToggleEdit}>
                  {t('catering.grouping.adjust')}
                </Button>
                <Button size="small" type="primary" onClick={onMarkCorrect}>
                  {t('catering.grouping.markCorrect')}
                </Button>
              </div>
            </div>
          ) : null}

          {editing ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#D6DCE5] bg-white p-3.5">
              <h4 className="text-text-secondary mb-2.5 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide">
                <ArrowRightLeft size={14} className="text-vj-red" />
                {t('catering.grouping.moveLegsTitle')}
              </h4>
              <div className="mb-3.5 flex flex-col gap-2">
                {group.legs.map((leg, i) => (
                  <div key={leg.flightNo} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-[74px] font-extrabold">{leg.flightNo}</span>
                    <span className="text-text-secondary flex-1 font-semibold">
                      {leg.dep}→{leg.arr} · {leg.std}
                    </span>
                    <Select
                      size="small"
                      style={{ minWidth: 240 }}
                      value=""
                      onChange={(destId) => destId && onMoveLeg(i, destId)}
                      options={[
                        { value: '', label: t('catering.grouping.keepHere') },
                        ...moveTargets.map((g) => ({
                          value: g.id,
                          label: `→ ${t('catering.grouping.groupN', { n: numberOf(g.id) })} · ${g.aircraft} · ${shortPurser(g.purser)}`,
                        })),
                      ]}
                    />
                  </div>
                ))}
              </div>
              <div className="border-border flex items-center gap-2.5 border-t border-dashed pt-3 text-[13px] font-bold">
                <Plane size={15} />
                {t('catering.grouping.mergeInto')}
                <Select
                  size="small"
                  style={{ minWidth: 240 }}
                  value=""
                  disabled={mergeTargets.length === 0}
                  onChange={(targetId) => targetId && onMergeInto(targetId)}
                  options={[
                    { value: '', label: t('catering.grouping.pickSameAircraft') },
                    ...mergeTargets.map((g) => ({
                      value: g.id,
                      label: `${t('catering.grouping.groupN', { n: numberOf(g.id) })} · ${shortPurser(g.purser)}`,
                    })),
                  ]}
                />
                <span className="text-text-muted text-[12px] font-semibold">
                  {t('catering.grouping.orSplitHint')}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-text-secondary text-[11px] font-semibold">{label}</span>
      <span className="text-[14px] font-extrabold">{value}</span>
    </div>
  )
}
