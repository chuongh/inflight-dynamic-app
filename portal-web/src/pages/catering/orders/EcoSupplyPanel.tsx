import { Button, InputNumber, Tag } from 'antd'
import { RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { EcoSupplyGroupId, EcoSupplyLine } from '@/modules/catering/orderTypes'
import { ECO_SUPPLY_GROUP_ORDER } from '@/modules/catering/supplier/ecoSupplyRegistry'

/** Section header tint per category — reuses the Meal Catalog palette so the two screens read as one system. */
export const GROUP_STYLE: Record<EcoSupplyGroupId, { bg: string; color: string; border: string }> = {
  ...MEAL_CATEGORY_STYLE,
  amenity: { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
  amenity_composition: { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
  other: { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
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
export function normalizeGroup(group: string): EcoSupplyGroupId {
  const legacy: Record<string, EcoSupplyGroupId> = {
    hotmeal: 'eco_main',
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

interface EcoSupplyPanelProps {
  lines: EcoSupplyLine[]
  editable?: boolean
  onChangeQty?: (lineId: string, qty: number) => void
  onResetLine?: (lineId: string) => void
  /** Hide inner summary when page already shows StatStrip */
  compactSummary?: boolean
}

export function EcoSupplyPanel({
  lines,
  editable = false,
  onChangeQty,
  onResetLine,
  compactSummary = false,
}: EcoSupplyPanelProps) {
  const { t } = useTranslation()
  const [showZero, setShowZero] = useState(false)

  const byGroup = useMemo(() => {
    const map = new Map<EcoSupplyGroupId, EcoSupplyLine[]>()
    for (const g of ECO_SUPPLY_GROUP_ORDER) map.set(g, [])
    for (const line of lines) {
      // Prebook total lives on the overview StatStrip — never list it again below.
      if (line.field === 'prebook') continue
      if (!showZero && line.qty === 0 && !line.overridden) {
        // Keep manual §1.5 placeholders visible so ops can enter qty.
        const isManualPlaceholder =
          line.suggested === 0 && line.source.toLowerCase().includes('manual')
        if (!isManualPlaceholder) continue
      }
      const group = normalizeGroup(line.group)
      const list = map.get(group) ?? []
      list.push(line)
      map.set(group, list)
    }
    return map
  }, [lines, showZero])

  const visibleGroups = ECO_SUPPLY_GROUP_ORDER.filter((g) => (byGroup.get(g)?.length ?? 0) > 0)

  return (
    <div className="eco-supply">
      <div className="eco-supply__toolbar">
        {!compactSummary ? (
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
                  <section key={group} className="eco-supply__section">
                    <header
                      className="eco-supply__section-head"
                      style={
                        {
                          '--section-bg': style.bg,
                          '--section-color': style.color,
                          '--section-dot': style.color,
                        } as CSSProperties
                      }
                    >
                      <span className="eco-supply__section-dot" />
                      <h3>{groupLabel(t, group)}</h3>
                      <span className="eco-supply__section-total text-text-secondary tnum text-[11.5px] font-bold">
                        {t('catering.orders.byFlight.groupSkuCount', { n: groupLines.length })} ·{' '}
                        {t('catering.orders.byFlight.groupQty', { n: groupTotal.toLocaleString() })}
                      </span>
                    </header>
                    <ul className="eco-supply__list">
                      {groupLines.map((line) => (
                        <li key={line.id} className="eco-supply__row">
                          <div className="eco-supply__meta">
                            <div className="eco-supply__name">
                              {line.name}
                              <FormulaStatusTag line={line} />
                              {line.overridden ? (
                                <Tag color="warning" className="!ml-2 !text-[11px]">
                                  {t('catering.orders.supply.edited')}
                                </Tag>
                              ) : null}
                            </div>
                            <div className="eco-supply__sub">
                              {line.productCode ? (
                                <span className="table-cell-code tnum">{line.productCode}</span>
                              ) : (
                                <span className="text-text-muted text-[12px]">—</span>
                              )}
                              {line.unit ? (
                                <span className="text-text-muted text-[12px]">· {line.unit}</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="eco-supply__qty">
                            {editable ? (
                              <div className="eco-supply__qty-edit">
                                <InputNumber
                                  min={0}
                                  value={line.qty}
                                  className="eco-supply__input"
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
                              </div>
                            ) : (
                              <span className="eco-supply__qty-value tnum">{line.qty}</span>
                            )}
                            {line.overridden && line.qty !== line.suggested ? (
                              <span className="eco-supply__suggested tnum">
                                {t('catering.orders.supply.suggested', { n: line.suggested })}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
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
