import { Button, Switch, Tooltip } from 'antd'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RULE_CATEGORY } from '@/modules/catering/config'
import type { Rule } from '@/modules/catering/configTypes'
import { KIND_ICON, accentForKind, summarizeRule } from './ruleMeta'

interface Props {
  rule: Rule
  editing: boolean
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onRemove: () => void
}

export function RuleCard({ rule, editing, onToggle, onEdit, onRemove }: Props) {
  const { t } = useTranslation()
  const accent = accentForKind(rule.kind)
  const category = RULE_CATEGORY[rule.kind]
  const muted = !rule.enabled

  return (
    <div
      className={`border-border bg-surface flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-opacity ${
        muted ? 'opacity-55' : ''
      }`}
    >
      <span
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent.bg, color: accent.color }}
        aria-hidden
      >
        {KIND_ICON[rule.kind]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10.5px] font-bold tracking-wide uppercase"
            style={{ color: accent.color }}
          >
            {t(`catering.config.cat.${category}`)}
          </span>
          <span className="text-text-muted text-[11px] font-semibold">
            · {t(`catering.config.kind.${rule.kind}.name`)}
          </span>
        </div>
        <div className={`mt-0.5 text-[14.5px] font-semibold ${muted ? 'line-through' : ''}`}>
          {summarizeRule(rule, t)}
        </div>
        <p className="text-text-muted mt-0.5 mb-0 text-[12px] leading-snug">
          {t(`catering.config.kind.${rule.kind}.desc`)}
        </p>
      </div>

      <div className="mt-0.5 flex shrink-0 items-center gap-2">
        <Tooltip title={rule.enabled ? t('catering.config.enabled') : t('catering.config.disabled')}>
          <Switch size="small" checked={rule.enabled} disabled={!editing} onChange={onToggle} />
        </Tooltip>

        {editing ? (
          <>
            <Button
              type="text"
              size="small"
              icon={<Pencil size={15} />}
              aria-label={t('catering.config.editRule')}
              onClick={onEdit}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={15} />}
              aria-label={t('catering.config.removeRule')}
              onClick={onRemove}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
