import { Button, Switch, Tooltip } from 'antd'
import { Calculator, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AmenityCatalogItem, MealCatalogItem } from '@/modules/catering/catalogTypes'
import { RULE_CATEGORY_STYLE } from '@/modules/catering/mealCategoryMeta'
import type {
  EcoAmenityConfig,
  EcoQuantityRule,
} from '@/modules/catering/supplier/ecoQuantityTypes'
import {
  displayNameFor,
  fieldBadge,
  ruleCategoryOf,
  summarizeBranchesPreview,
  summarizeRule,
} from './ecoQuantityRuleMeta'

interface Props {
  rule: EcoQuantityRule
  editing: boolean
  amenityConfig: EcoAmenityConfig
  mealCatalog: MealCatalogItem[]
  amenityCatalog: AmenityCatalogItem[]
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onRemove: () => void
}

export function EcoQuantityRuleCard({
  rule,
  editing,
  amenityConfig,
  mealCatalog,
  amenityCatalog,
  onToggle,
  onEdit,
  onRemove,
}: Props) {
  const { t } = useTranslation()
  const muted = !rule.enabled
  const badge = fieldBadge(rule.targetColumn)
  const title = displayNameFor(rule.targetColumn, mealCatalog, amenityCatalog)
  const category = ruleCategoryOf(rule, mealCatalog, amenityCatalog)
  const style = RULE_CATEGORY_STYLE[category]
  const branchPreview = summarizeBranchesPreview(
    rule,
    amenityConfig,
    mealCatalog,
    amenityCatalog,
  )

  return (
    <div
      className={`border-border bg-surface flex w-full min-w-0 items-start gap-3 rounded-xl border px-3.5 py-3 transition-opacity ${
        muted ? 'opacity-55' : ''
      }`}
    >
      <span
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--color-vj-red)]"
        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
        aria-hidden
      >
        <Calculator size={18} strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="bg-background border-border rounded-md border px-1.5 py-0.5 text-[10.5px] font-bold">
            {badge}
          </span>
        </div>
        <div className={`mt-0.5 text-[14.5px] font-semibold ${muted ? 'line-through' : ''}`}>
          {title}
        </div>
        <p className="text-text-muted mt-0.5 mb-0 text-[12px] leading-snug">
          {summarizeRule(rule, mealCatalog, amenityCatalog)}
        </p>
        {branchPreview ? (
          <ul className="text-text-secondary mt-1 mb-0 list-disc space-y-0.5 pl-4 text-[12px] leading-snug">
            {branchPreview.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-0.5 flex shrink-0 items-center gap-2">
        <Tooltip
          title={
            rule.enabled
              ? t('catering.config.enabled')
              : t('catering.config.disabled')
          }
        >
          <Switch
            size="small"
            checked={rule.enabled}
            disabled={!editing}
            onChange={onToggle}
          />
        </Tooltip>

        {editing ? (
          <>
            <Button
              type="text"
              size="small"
              icon={<Pencil size={15} />}
              aria-label={t('catering.config.supplier.qtyEdit')}
              onClick={onEdit}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={15} />}
              aria-label={t('catering.config.supplier.qtyRemove')}
              onClick={onRemove}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
