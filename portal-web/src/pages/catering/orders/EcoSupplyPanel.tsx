import { Button, InputNumber } from 'antd'
import { Crown, PackageSearch, PlaneTakeoff, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { MEAL_CATEGORY_STYLE } from '@/modules/catering/mealCategoryMeta'
import type { EcoSupplyGroupId, EcoSupplyLine } from '@/modules/catering/orderTypes'
import { ECO_SUPPLY_GROUP_ORDER } from '@/modules/catering/supplier/ecoSupplyRegistry'

/**
 * Category label accent — a color per category so the eyebrow/dot stay
 * scannable, but NOT used for card background/border. Category cards render
 * on a neutral surface (bg-slate-50/50) so they never blend into the colored
 * cabin-bucket header above them (e.g. ECO's green matches "main"'s green).
 */
export const GROUP_STYLE: Record<EcoSupplyGroupId, { color: string }> = {
  main: { color: MEAL_CATEGORY_STYLE.main.color },
  vegetarian: { color: MEAL_CATEGORY_STYLE.vegetarian.color },
  appetizer: { color: MEAL_CATEGORY_STYLE.appetizer.color },
  dessert: { color: MEAL_CATEGORY_STYLE.dessert.color },
  bread: { color: MEAL_CATEGORY_STYLE.bread.color },
  drink: { color: MEAL_CATEGORY_STYLE.drink.color },
  snack: { color: MEAL_CATEGORY_STYLE.snack.color },
  condiment: { color: MEAL_CATEGORY_STYLE.condiment.color },
  amenity: { color: '#4338CA' },
  amenity_composition: { color: '#4338CA' },
  other: { color: '#4338CA' },
}

export function groupLabel(t: TFunction, group: EcoSupplyGroupId | string): string {
  const normalized = normalizeGroup(group)
  if (normalized === 'amenity') return t('catering.orders.supply.group.amenity')
  if (normalized === 'amenity_composition') {
    return t('catering.orders.supply.group.amenity_composition')
  }
  if (normalized === 'other') return t('catering.orders.supply.group.other')
  return t(`catering.catalog.category.${normalized}`)
}

/** Map legacy supply groups (pre-catalog alignment) onto catalog categories. */
function normalizeGroup(group: string): EcoSupplyGroupId {
  const legacy: Record<string, EcoSupplyGroupId> = {
    hotmeal: 'main',
    bread_eggs: 'bread',
    condiments: 'condiment',
    utensils: 'amenity',
    commercial: 'other',
    amenity_ops: 'amenity',
  }
  if (legacy[group]) return legacy[group]
  if ((ECO_SUPPLY_GROUP_ORDER as readonly string[]).includes(group)) {
    return group as EcoSupplyGroupId
  }
  return 'other'
}

/**
 * Mirror the ECO / SBB Meal Catalog split. Category (main, vegetarian, bread,
 * drink, …) is a cross-cabin dimension — which cabin an item belongs to comes
 * from the line's own `cabinScopes`, resolved from the catalog item. An item
 * shared by both catalogs shows under both cabin sections. Lines with no cabin
 * (amenity / crew / other cross-cabin metrics) land in "other".
 */
type CabinBucketId = 'eco' | 'sbb' | 'other'
const CABIN_BUCKET_ORDER: readonly CabinBucketId[] = ['eco', 'sbb', 'other']

function bucketsOf(line: EcoSupplyLine): CabinBucketId[] {
  const scopes = line.cabinScopes
  if (!scopes || scopes.length === 0) return ['other']
  return scopes.map((s) => (s === 'ECO' ? 'eco' : 'sbb'))
}

function bucketLabel(t: TFunction, bucket: CabinBucketId): string {
  return t(`catering.orders.supply.bucket.${bucket}`)
}

function bucketHint(t: TFunction, bucket: CabinBucketId): string {
  return t(`catering.orders.supply.bucketHint.${bucket}`)
}

const BUCKET_ICON: Record<CabinBucketId, typeof PlaneTakeoff> = {
  eco: PlaneTakeoff,
  sbb: Crown,
  other: PackageSearch,
}

/** Small +/− pill showing the change vs the comparison version. Renders nothing when unchanged. */
export function DeltaChip({ value }: { value: number }) {
  if (value === 0) return null
  const up = value > 0
  return (
    <span
      className={`tnum inline-flex items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold ${
        up ? 'bg-vj-green-muted text-vj-green-dark' : 'bg-vj-red-50 text-vj-red-dark'
      }`}
    >
      {up ? '+' : ''}
      {value.toLocaleString()}
    </span>
  )
}

/** Alert-only badges — everything else on a line stays badge-free. */
function FormulaStatusTag({ line }: { line: EcoSupplyLine }) {
  const { t } = useTranslation()
  if (line.noRuleConfigured) {
    return (
      <span className="border-border text-text-muted rounded-full border border-dashed px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap">
        {t('catering.orders.supply.noFormula')}
      </span>
    )
  }
  if (line.confirmed === false) {
    return (
      <span className="border-vj-yellow-border bg-vj-yellow-muted text-vj-yellow-dark rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap">
        {t('catering.orders.supply.unconfirmed')}
      </span>
    )
  }
  return null
}

interface EcoSupplyPanelProps {
  lines: EcoSupplyLine[]
  editable?: boolean
  onChangeQty?: (lineId: string, qty: number) => void
  onResetLine?: (lineId: string) => void
  /** Hide inner summary when page already shows StatStrip */
  compactSummary?: boolean
  /** Effective qty of the comparison (previous) version, by field — null when there's nothing to compare against. */
  prevQtyByField?: Record<string, number> | null
}

export function EcoSupplyPanel({
  lines,
  editable = false,
  onChangeQty,
  onResetLine,
  compactSummary = false,
  prevQtyByField = null,
}: EcoSupplyPanelProps) {
  const { t } = useTranslation()

  const byBucket = useMemo(() => {
    const buckets = new Map<CabinBucketId, Map<EcoSupplyGroupId, EcoSupplyLine[]>>()
    for (const bucket of CABIN_BUCKET_ORDER) {
      const groups = new Map<EcoSupplyGroupId, EcoSupplyLine[]>()
      for (const g of ECO_SUPPLY_GROUP_ORDER) groups.set(g, [])
      buckets.set(bucket, groups)
    }
    for (const line of lines) {
      // Overview StatStrip only — don't list again in supply sections.
      if (
        line.field === 'prebook' ||
        line.field === 'crewCockpit' ||
        line.field === 'skyboss' ||
        line.field === 'quotaCommercial'
      ) {
        continue
      }
      if (line.qty === 0 && !line.overridden) {
        // Always keep unconfirmed / no-rule lines visible (ops must see them).
        if (!(line.noRuleConfigured || line.confirmed === false)) continue
      }
      const group = normalizeGroup(line.group)
      for (const bucket of bucketsOf(line)) {
        const groups = buckets.get(bucket)!
        const list = groups.get(group) ?? []
        list.push(line)
        groups.set(group, list)
      }
    }
    return buckets
  }, [lines])

  return (
    <div className="eco-supply">
      {!compactSummary ? (
        <div className="eco-supply__toolbar">
          <div className="eco-supply__summary eco-supply__summary--inline">
            <span className="tnum font-extrabold">{lines.filter((l) => l.qty > 0 || l.overridden).length}</span>
            <span className="text-text-secondary text-[12px] font-semibold">
              {t('catering.orders.supply.skuCount')}
            </span>
          </div>
        </div>
      ) : null}



      {CABIN_BUCKET_ORDER.map((bucket) => {
        const byGroup = byBucket.get(bucket)!
        const visibleGroups = ECO_SUPPLY_GROUP_ORDER.filter((g) => (byGroup.get(g)?.length ?? 0) > 0)
        if (visibleGroups.length === 0) return null
        const bucketLines = visibleGroups.flatMap((g) => byGroup.get(g) ?? [])
        const bucketTotal = bucketLines.reduce((s, l) => s + l.qty, 0)
        const BucketIcon = BUCKET_ICON[bucket]
        return (
          <div key={bucket} className={`eco-supply__bucket eco-supply__bucket--${bucket}`}>
            <header className="eco-supply__bucket-head">
              <span className="eco-supply__bucket-icon">
                <BucketIcon size={17} strokeWidth={2.25} />
              </span>
              <div className="eco-supply__bucket-titles">
                <h2>{bucketLabel(t, bucket)}</h2>
                <p className="eco-supply__bucket-hint">{bucketHint(t, bucket)}</p>
              </div>
              <div className="eco-supply__bucket-total">
                <b className="tnum">{bucketTotal.toLocaleString()}</b>
                <span>{t('catering.orders.supply.totalQty')}</span>
              </div>
            </header>
            <div className="eco-supply__grid">
              {visibleGroups.map((group) => {
                const groupLines = byGroup.get(group) ?? []
                const groupTotal = groupLines.reduce((s, l) => s + l.qty, 0)
                const style = GROUP_STYLE[group]
                return (
                  <section
                    key={group}
                    className="mb-3 break-inside-avoid overflow-hidden rounded-lg border border-slate-300 bg-slate-50/50"
                  >
                    <header className="flex items-center gap-2 border-b border-slate-200/70 px-3.5 py-2.5">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: style.color }}
                        aria-hidden
                      />
                      <h3 className="text-[13px] font-bold" style={{ color: style.color }}>
                        {groupLabel(t, group)}
                      </h3>
                      <span className="ml-auto shrink-0 text-[11px] font-semibold whitespace-nowrap text-slate-400 tabular-nums">
                        {t('catering.orders.supply.sectionSkuCount', { n: groupLines.length })} ·{' '}
                        {t('catering.orders.supply.sectionQty', { n: groupTotal.toLocaleString() })}
                      </span>
                    </header>
                    <ul className="divide-y divide-slate-100">
                      {groupLines.map((line) => {
                        const delta = prevQtyByField ? line.qty - (prevQtyByField[line.field] ?? 0) : null
                        const isEmpty = line.qty === 0 && !line.overridden
                        return (
                          <li
                            key={line.id}
                            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${isEmpty ? 'opacity-50' : ''}`}
                          >
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-slate-900">
                                {line.name}
                                <FormulaStatusTag line={line} />
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                {line.productCode ? (
                                  <span className="table-cell-code tnum">{line.productCode}</span>
                                ) : (
                                  <span className="text-[12px] text-slate-400">—</span>
                                )}
                                {line.unit ? (
                                  <span className="text-[12px] text-slate-400">· {line.unit}</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                              <div className="flex items-center gap-2">
                                {delta != null && delta !== 0 ? <DeltaChip value={delta} /> : null}
                                {editable ? (
                                  <>
                                    <InputNumber
                                      min={0}
                                      value={line.qty}
                                      className="!w-16 [&_input]:!font-mono [&_input]:!tabular-nums"
                                      aria-label={line.name}
                                      onChange={(v) => {
                                        if (v == null || !Number.isFinite(v)) return
                                        onChangeQty?.(line.id, Math.max(0, Math.round(v)))
                                      }}
                                    />
                                    {line.overridden ? (
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<RotateCcw size={14} />}
                                        aria-label={t('catering.orders.supply.reset')}
                                        onClick={() => onResetLine?.(line.id)}
                                      />
                                    ) : null}
                                  </>
                                ) : (
                                  <span className="font-mono text-[15px] font-extrabold tabular-nums text-slate-900">
                                    {line.qty.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {line.overridden && line.qty !== line.suggested ? (
                                <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-400">
                                  {t('catering.orders.supply.suggested', { n: line.suggested })}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
