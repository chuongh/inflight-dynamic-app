import { Button, Drawer, Empty } from 'antd'
import { ArrowRightLeft, ChevronDown, ChevronRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changedLines, changedLinesFromLines } from '@/modules/catering/orderSnapshot'
import type { CateringOrder, OrderCategory } from '@/modules/catering/orderTypes'

interface ReconcileDrawerProps {
  open: boolean
  onClose: () => void
  /** The version being reconciled (its breakdown is the "to" side). */
  current: CateringOrder
  /** The comparison base (previous version) — null when `current` is the first version. */
  base: CateringOrder | null
}

/** Read-only version-delta reconciliation: what changed between two order versions,
 *  attributed down to the flight. Only changed lines are listed. */
export function ReconcileDrawer({ open, onClose, current, base }: ReconcileDrawerProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Prefer per-flight deltas from the breakdown snapshot; fall back to a
  // line-level diff for legacy versions that have no (or unchanged) breakdown.
  const changed = useMemo(() => {
    if (!base) return []
    const byBreakdown =
      base.breakdown && current.breakdown ? changedLines(base.breakdown, current.breakdown) : []
    return byBreakdown.length > 0 ? byBreakdown : changedLinesFromLines(base.lines, current.lines)
  }, [base, current])
  const net = changed.reduce((s, c) => s + c.delta, 0)

  const label = (category: OrderCategory, name: string) =>
    category === 'prebook' ? name : t(`catering.orders.line.${name}`)

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const exportCsv = () => {
    const head = ['Dish', 'Category', 'From', 'To', 'Delta', 'Flight', 'Dep', 'Arr', 'FlightDelta']
    const rows: string[][] = [head]
    for (const line of changed)
      for (const f of line.flights)
        rows.push([
          label(line.category, line.name), line.category,
          String(line.from), String(line.to), String(line.delta),
          f.flightNo ?? '', f.dep ?? '', f.arr ?? '', String(f.delta),
        ])
    const cell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
    const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reconcile-${current.id}-v${base?.version ?? 0}-to-v${current.version}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const title = (
    <div className="flex items-center gap-2.5">
      <ArrowRightLeft size={18} className="text-vj-red" />
      <div>
        <div className="text-[14px] font-extrabold text-foreground">{t('catering.orders.reconcile.title')}</div>
        {base ? (
          <div className="text-text-secondary text-[11.5px] font-semibold">
            {t('catering.orders.reconcile.subtitleVs', { cur: current.version, base: base.version })}
          </div>
        ) : null}
      </div>
    </div>
  )

  const netChipCls = net >= 0 ? 'bg-vj-green-muted text-vj-green-dark' : 'bg-vj-red-50 text-vj-red-dark'
  const hasChanges = !!base && changed.length > 0

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      styles={{ wrapper: { width: 480 }, body: { padding: 0 } }}
      footer={
        hasChanges ? (
          <div className="flex items-center gap-2.5">
            <span className="text-text-secondary text-[12px] font-semibold">{t('catering.orders.reconcile.netDelta')}</span>
            <span className={`tnum rounded-full px-2.5 py-1 text-[12.5px] font-extrabold ${netChipCls}`}>
              {net > 0 ? '+' : ''}{net} {t('catering.orders.reconcile.portionsN', { n: '' }).trim()}
            </span>
            <Button className="ml-auto" icon={<Download size={14} />} onClick={exportCsv}>
              {t('catering.orders.reconcile.exportCsv')}
            </Button>
          </div>
        ) : null
      }
    >
      {!base ? (
        <div className="py-16">
          <Empty description={t('catering.orders.reconcile.firstVersion')} />
        </div>
      ) : changed.length === 0 ? (
        <div className="py-16">
          <Empty description={t('catering.orders.reconcile.noChanges', { cur: current.version, base: base.version })} />
        </div>
      ) : (
        <>
          <div className="border-border bg-[#f8fafc] flex items-center gap-3 border-b px-4 py-2.5 text-[12px]">
            <span className={`tnum rounded-full px-2 py-0.5 text-[11.5px] font-extrabold ${netChipCls}`}>
              Δ {net > 0 ? '+' : ''}{net}
            </span>
            <span className="text-text-secondary font-semibold">
              {t('catering.orders.reconcile.linesChanged', { n: changed.length })}
            </span>
          </div>

          {changed.map((line) => {
            const key = `${line.category} ${line.name}`
            const hasFlights = line.flights.length > 0
            const isOpen = hasFlights && expanded.has(key)
            const up = line.delta > 0
            const chip = up ? 'bg-vj-green-muted text-vj-green-dark' : 'bg-vj-red-50 text-vj-red-dark'
            const edge = up ? 'border-vj-green' : 'border-vj-red'
            const rowInner = (
              <>
                {hasFlights ? (
                  isOpen ? (
                    <ChevronDown size={15} className="text-text-muted shrink-0" />
                  ) : (
                    <ChevronRight size={15} className="text-text-muted shrink-0" />
                  )
                ) : (
                  <span className="shrink-0" style={{ width: 15 }} />
                )}
                <span className="text-[13px] font-bold text-foreground">{label(line.category, line.name)}</span>
                <span className="ml-auto flex items-center gap-2.5">
                  <span className="text-text-secondary tnum text-[11.5px] font-semibold">
                    {line.from} → <b className="text-foreground">{line.to}</b>
                  </span>
                  <span className={`tnum rounded-full px-2 py-0.5 text-[11.5px] font-extrabold ${chip}`}>
                    {up ? '+' : ''}{line.delta}
                  </span>
                </span>
              </>
            )
            return (
              <div key={key} className={`border-border border-b border-l-2 ${edge}`}>
                {hasFlights ? (
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="hover:bg-muted/40 flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left"
                  >
                    {rowInner}
                  </button>
                ) : (
                  <div className="flex w-full items-center gap-2 px-3.5 py-2.5">{rowInner}</div>
                )}
                {isOpen ? (
                  <div className="bg-[#fafcfe] px-3.5 pb-2.5 pl-9">
                    {line.flights.map((f) => {
                      const fup = f.delta > 0
                      return (
                        <div key={`${f.groupId}-${f.flightNo ?? ''}`} className="flex items-center gap-2 py-1 text-[11.5px]">
                          <span className="tnum w-[54px] font-bold text-foreground">{f.flightNo ?? '—'}</span>
                          <span className="text-text-secondary">{f.dep && f.arr ? `${f.dep}→${f.arr}` : ''}</span>
                          <span className="ml-auto flex items-center gap-2">
                            <span className="text-text-muted tnum">{f.from}→{f.to}</span>
                            <span className={`tnum font-extrabold ${fup ? 'text-vj-green-dark' : 'text-vj-red-dark'}`}>
                              {fup ? '+' : ''}{f.delta}
                            </span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </>
      )}
    </Drawer>
  )
}
