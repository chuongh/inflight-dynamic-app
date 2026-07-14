import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TrolleyUnit } from '@/modules/equipment/constants'
import { isReworkEntry } from '@/modules/equipment/lib/analytics'
import { Text } from '@/components/primitives/Text'
import { useFormatters } from '@/i18n/hooks/useFormatters'

interface TrolleyTimelineProps {
  unit: TrolleyUnit
}

type TimelineKind = 'checkout' | 'checkin-ok' | 'checkin-damaged' | 'repair-sent' | 'repair-done'

interface TimelineNode {
  key: string
  at: number
  kind: TimelineKind
  title: string
  body?: string
  meta: Array<{ label: string; value: string }>
  rework?: boolean
}

const DOT_COLOR: Record<TimelineKind, string> = {
  checkout: 'var(--color-text-secondary)',
  'checkin-ok': 'var(--color-vj-green)',
  'checkin-damaged': 'var(--color-vj-red)',
  'repair-sent': 'var(--color-vj-yellow)',
  'repair-done': 'var(--color-vj-green)',
}

export function TrolleyTimeline({ unit }: TrolleyTimelineProps) {
  const { t } = useTranslation()
  const { formatDateDMY, formatRelativeAgo } = useFormatters()

  const nodes = useMemo(() => {
    const built: TimelineNode[] = []

    for (const m of unit.movements) {
      const kind: TimelineKind =
        m.type === 'checkout' ? 'checkout' : m.condition === 'damaged' ? 'checkin-damaged' : 'checkin-ok'
      built.push({
        key: m.id,
        at: m.timestamp,
        kind,
        title:
          m.type === 'checkout'
            ? t('equipment.checkinout.checkout')
            : m.condition === 'damaged'
              ? t('equipment.trolley.checkinDamaged')
              : t('equipment.checkinout.checkin'),
        body: m.note,
        meta: [
          {
            label: t('equipment.trolley.leg'),
            value: m.type === 'checkout' ? `${m.fromStation} → ${m.toStation}` : `→ ${m.station}`,
          },
          { label: t('equipment.checkinout.flight'), value: m.flight ?? '—' },
          { label: t('equipment.trolley.by'), value: m.actor },
        ],
      })
    }

    unit.repairHistory.forEach((r, index) => {
      built.push({
        key: `${r.id}-sent`,
        at: r.startedAt,
        kind: 'repair-sent',
        title: t('equipment.trolley.sentToRepair'),
        body: r.issueDescription,
        meta: [{ label: t('equipment.columns.vendor'), value: r.vendor }],
      })
      if (r.completedAt != null) {
        built.push({
          key: `${r.id}-done`,
          at: r.completedAt,
          kind: 'repair-done',
          title: t('equipment.trolley.repairCompleted'),
          body: [r.repairContent, r.rootCause].filter(Boolean).join(' · '),
          meta: [{ label: t('equipment.columns.vendor'), value: r.vendor }],
          rework: isReworkEntry(unit.repairHistory, index),
        })
      }
    })

    built.sort((a, b) => b.at - a.at)
    return built
  }, [unit, t])

  if (nodes.length === 0) {
    return (
      <div className="py-8 text-center">
        <Text tone="muted" variant="bodySm">
          {t('equipment.trolley.noTimelineEvents')}
        </Text>
      </div>
    )
  }

  return (
    <ol className="relative ml-2 space-y-5 border-l border-[var(--color-border)] pl-5">
      {nodes.map((node) => (
        <li key={node.key} className="relative">
          <span
            className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-surface)]"
            style={{ background: DOT_COLOR[node.kind] }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Text variant="bodySm" className="font-semibold text-vj-dark">
                {node.title}
              </Text>
              {node.rework ? (
                <span className="rounded-md bg-[var(--color-vj-red-50)] px-2 py-0.5 text-[11px] font-bold text-vj-red">
                  {t('equipment.repairColumns.rework')}
                </span>
              ) : null}
            </div>
            <div className="text-right leading-tight">
              <div className="tnum text-xs font-semibold text-[var(--color-text-secondary)]">
                {formatDateDMY(node.at)}
              </div>
              <Text variant="caption" tone="muted">
                {formatRelativeAgo(node.at)}
              </Text>
            </div>
          </div>
          {node.body ? (
            <Text variant="caption" tone="secondary" as="p" className="mt-1">
              {node.body}
            </Text>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {node.meta.map((item) => (
              <span key={item.label} className="text-[11px] text-[var(--color-text-muted)]">
                {item.label}: <span className="font-medium text-[var(--color-text-secondary)]">{item.value}</span>
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}
