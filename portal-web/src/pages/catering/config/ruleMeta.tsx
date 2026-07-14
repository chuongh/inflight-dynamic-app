import { Ban, Clock, Percent, StickyNote, Timer, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { RULE_CATEGORY, type RuleCategory } from '@/modules/catering/config'
import type { Rule, RuleKind } from '@/modules/catering/configTypes'

/** Catalog icon per rule kind (Lucide, stroke 2). */
export const KIND_ICON: Record<RuleKind, ReactNode> = {
  threshold_reduction: <Percent size={18} strokeWidth={2} />,
  time_exclusion: <Clock size={18} strokeWidth={2} />,
  status_exclusion: <Ban size={18} strokeWidth={2} />,
  scope_note: <StickyNote size={18} strokeWidth={2} />,
  group_by_purser: <Users size={18} strokeWidth={2} />,
  group_by_flight_hour: <Timer size={18} strokeWidth={2} />,
}

/** Accent colours per category — brand-only tokens. */
export const CATEGORY_ACCENT: Record<RuleCategory, { color: string; bg: string }> = {
  reduction: { color: 'var(--color-vj-red)', bg: 'var(--color-vj-red-50)' },
  exclusion: { color: 'var(--color-vj-red-dark)', bg: 'var(--color-vj-red-50)' },
  note: { color: 'var(--color-vj-green-dark)', bg: 'var(--color-vj-green-muted)' },
  grouping: { color: 'var(--color-text-secondary)', bg: '#f1f5f9' },
}

export function accentForKind(kind: RuleKind) {
  return CATEGORY_ACCENT[RULE_CATEGORY[kind]]
}

/** Human, self-explanatory one-line summary of a rule. */
export function summarizeRule(rule: Rule, t: TFunction): string {
  switch (rule.kind) {
    case 'threshold_reduction':
      return t('catering.config.summ.threshold_reduction', {
        metric: t(`catering.config.metric.${rule.metric}`),
        threshold: rule.threshold,
        pct: rule.reducePct,
      })
    case 'time_exclusion':
      return t('catering.config.summ.time_exclusion', {
        scope: t(`catering.config.scope.${rule.scope}`),
        time: rule.fromTime,
      })
    case 'status_exclusion': {
      const list =
        rule.statuses.length > 0
          ? rule.statuses.map((s) => t(`catering.config.status.${s}`)).join(' · ')
          : '—'
      return t('catering.config.summ.status_exclusion', { statuses: list })
    }
    case 'scope_note':
      return rule.text.trim() || t('catering.config.summ.scope_note_empty')
    case 'group_by_purser':
      return t('catering.config.summ.group_by_purser')
    case 'group_by_flight_hour':
      return t('catering.config.summ.group_by_flight_hour', { hours: rule.maxHours })
  }
}
