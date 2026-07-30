import { Alert, App as AntApp, Button, Empty, Tabs } from 'antd'
import { ArrowRightLeft, Printer, RefreshCw, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailHero } from '@/components/patterns/DetailHero'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { useAuth } from '@/core/auth/useAuth'
import { activeCrewMealVersion, profileFor } from '@/modules/catering/crewMeal'
import { groupOrigin } from '@/modules/catering/grouping'
import { useAmenityCatalogData, useMealCatalogData } from '@/modules/catering/hooks/useCatalog'
import { useCrewMealConfigData } from '@/modules/catering/hooks/useCrewMealConfig'
import { useFlightGroups } from '@/modules/catering/hooks/useFlightGroups'
import { useMeals } from '@/modules/catering/hooks/useMeals'
import { useOrders, useSaveOrders } from '@/modules/catering/hooks/useOrders'
import { useSupplierRuleConfigData } from '@/modules/catering/hooks/useSupplierRuleConfig'
import type {
  CateringOrder,
  EcoSupplyFlightBreakdown,
  EcoSupplyLine,
} from '@/modules/catering/orderTypes'
import { groupOrderFiles, makeCodeOf } from '@/modules/catering/orders'
import { buildOrderSnapshot } from '@/modules/catering/orderSnapshot'
import { DEFAULT_ECO_AMENITY_CONFIG } from '@/modules/catering/supplier/amenityDefaults'
import { buildEcoSupplySnapshot } from '@/modules/catering/supplier/buildEcoSupplySnapshot'
import { DEFAULT_ECO_QUANTITY_RULES } from '@/modules/catering/supplier/ecoQuantityEval'
import { flightGroupsToSupplierInputs } from '@/modules/catering/supplier/fromFlightGroup'
import type { SupplierFlightInput } from '@/modules/catering/supplier/types'
import { activeSupplierRuleVersion } from '@/modules/catering/supplierRuleConfig'
import { paths } from '@/routes/paths'
import { applySupplierEdits, buildPlannerWorkspace } from '../planner/plannerModel'
import { EcoSupplyPanel } from './EcoSupplyPanel'
import { FlightBreakdownPanel } from './FlightBreakdownPanel'
import { OrderStatStrip, OrderStatusBadge, StatTrendValue, VerTag, weekdayOf } from './orderUi'
import { ReconcileDrawer } from './ReconcileDrawer'
import './eco-supply.css'

async function loadExportServices() {
  const [download, eco, sbb] = await Promise.all([
    import('@/modules/catering/supplier/export/download'),
    import('@/modules/catering/supplier/export/ecoWorkbook'),
    import('@/modules/catering/supplier/export/sbbWorkbook'),
  ])
  return {
    buildEcoWorkbook: eco.buildEcoWorkbook,
    buildSbbWorkbook: sbb.buildSbbWorkbook,
    buildSupplierExportFilename: download.buildSupplierExportFilename,
    downloadXlsx: download.downloadXlsx,
  }
}

export function OrderDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = AntApp.useApp()
  const { session, hasPermission } = useAuth()
  const { fileId } = useParams()
  const { data } = useOrders()
  const saveOrders = useSaveOrders()
  const { data: flightGroupsData } = useFlightGroups()
  const { data: supplierRuleData } = useSupplierRuleConfigData()
  const { data: mealCatalog } = useMealCatalogData()
  const { data: amenityCatalog } = useAmenityCatalogData()
  const { data: crewCfg } = useCrewMealConfigData()
  const { data: legacyMealCatalog } = useMeals()

  const files = useMemo(() => groupOrderFiles(data?.orders ?? []), [data])
  const file = files.find((f) => f.fileId === fileId)
  const latest = file?.latest

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)

  const current: CateringOrder | undefined = file
    ? (file.versions.find((v) => v.version === (selectedVersion ?? latest!.version)) ?? latest)
    : undefined
  const isLatest = !!current && !!latest && current.version === latest.version
  const editable = !!current && isLatest && current.status === 'draft'
  const canFinalize = hasPermission('catering.finalize')

  const day = useMemo(
    () => flightGroupsData?.days.find((d) => d.serviceDate === current?.serviceDate),
    [flightGroupsData, current?.serviceDate],
  )
  const activeRules = useMemo(
    () => activeSupplierRuleVersion(supplierRuleData?.versions ?? []),
    [supplierRuleData],
  )
  const crewMealProfile = useMemo(() => {
    const version = activeCrewMealVersion(crewCfg?.versions ?? [])
    const profile = version ? profileFor(version, 'cockpit') : undefined
    return profile?.enabled ? profile : null
  }, [crewCfg])

  const { inputs, pendingCount } = useMemo(() => {
    if (!day || !current) return { inputs: [], pendingCount: 0 }
    return flightGroupsToSupplierInputs(day, current.station)
  }, [day, current])

  const workspace = useMemo(() => {
    if (!inputs.length || !activeRules) return null
    const base = buildPlannerWorkspace(
      inputs,
      activeRules.ecoRouteRules,
      activeRules.sbbLookups,
    )
    return applySupplierEdits(base, current?.supplierEdits)
  }, [inputs, activeRules, current?.supplierEdits])

  const computedEcoSupply = useMemo(() => {
    if (!day || !current) return null
    const saved = current.ecoSupplyLines
    const hasCrew =
      !crewMealProfile || !!saved?.some((l) => l.field === 'crewCockpit')
    if (saved?.length && hasFreshByFlightShape(current.ecoSupplyByFlight) && hasCrew) return null
    return buildEcoSupplySnapshot({
      day,
      station: current.station,
      mealCatalog,
      amenityCatalog,
      ecoRouteRules: activeRules?.ecoRouteRules ?? null,
      quantityConfig: {
        amenity: activeRules?.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG,
        quantityRules: activeRules?.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES,
      },
      crewMealProfile,
    })
  }, [current, day, mealCatalog, amenityCatalog, activeRules, crewMealProfile])

  const ecoSupplyByFlight = hasFreshByFlightShape(current?.ecoSupplyByFlight)
    ? current!.ecoSupplyByFlight!
    : (computedEcoSupply?.byFlight ?? [])

  const ecoSupplyLines = useMemo(() => {
    const saved = current?.ecoSupplyLines
    const computed = computedEcoSupply?.lines
    let base: EcoSupplyLine[]
    if (!saved?.length) base = computed ?? []
    else if (!crewMealProfile || saved.some((l) => l.field === 'crewCockpit')) base = saved
    else {
      const crewLine = computed?.find((l) => l.field === 'crewCockpit')
      base = crewLine ? [...saved, crewLine] : saved
    }
    return applyByFlightEditsToLines(
      base,
      ecoSupplyByFlight,
      current?.ecoSupplyByFlightEdits,
    )
  }, [
    current?.ecoSupplyLines,
    current?.ecoSupplyByFlightEdits,
    computedEcoSupply,
    crewMealProfile,
    ecoSupplyByFlight,
  ])

  const showEcoSupply = ecoSupplyLines.length > 0

  const shownIdx = file ? file.versions.findIndex((v) => v.version === current?.version) : -1
  const reconcileBase = file && shownIdx > 0 ? file.versions[shownIdx - 1] : null

  /** Effective (post-override) ECO supply lines/cells for the comparison version — null when there's nothing to compare against (first version). */
  const prevQtyByField = useMemo(() => {
    if (!reconcileBase) return null
    const map: Record<string, number> = {}
    for (const l of effectiveLinesFor(reconcileBase)) map[l.field] = l.qty
    return map
  }, [reconcileBase])

  const prevByFlightCells = useMemo(() => {
    if (!reconcileBase) return null
    return effectiveByFlightCells(reconcileBase)
  }, [reconcileBase])

  const mealStats = useMemo(() => computeMealStats(ecoSupplyLines, inputs), [ecoSupplyLines, inputs])

  /** Same KPIs for the comparison (previous) version — null when there's nothing to compare against. */
  const prevMealStats = useMemo(
    () => (reconcileBase ? computeMealStats(effectiveLinesFor(reconcileBase), inputs) : null),
    [reconcileBase, inputs],
  )

  if (!file || !current) {
    return (
      <div className="py-24">
        <Empty description={t('catering.orders.notFound')} />
        <div className="mt-4 text-center">
          <Button onClick={() => navigate(paths.catering.orders.list)}>{t('catering.orders.backToList')}</Button>
        </div>
      </div>
    )
  }

  const persist = (record: CateringOrder, extra: CateringOrder[] = []) => {
    const others = (data?.orders ?? []).filter(
      (o) => !(o.station === record.station && o.serviceDate === record.serviceDate && o.version === record.version),
    )
    saveOrders.mutate({ orders: [...others, record, ...extra] })
  }

  const patchEcoSupplyQty = (lineId: string, qty: number) => {
    if (!editable) return
    const base = current.ecoSupplyLines ?? ecoSupplyLines
    if (!base.length) return
    persist({
      ...current,
      ecoSupplyLines: base.map((line) =>
        line.id === lineId ? { ...line, qty, overridden: qty !== line.suggested } : line,
      ),
    })
  }

  const resetEcoSupplyLine = (lineId: string) => {
    if (!editable) return
    const base = current.ecoSupplyLines ?? ecoSupplyLines
    if (!base.length) return
    persist({
      ...current,
      ecoSupplyLines: base.map((line) =>
        line.id === lineId ? { ...line, qty: line.suggested, overridden: false } : line,
      ),
    })
  }

  const patchByFlightQty = (groupId: string, field: string, qty: number) => {
    if (!editable) return
    const edits = { ...current.ecoSupplyByFlightEdits }
    edits[groupId] = { ...edits[groupId], [field]: qty }
    persist({ ...current, ecoSupplyByFlightEdits: edits })
  }

  const resetByFlightQty = (groupId: string, field: string) => {
    if (!editable) return
    const edits = { ...current.ecoSupplyByFlightEdits }
    if (!edits[groupId]) return
    const groupEdits = { ...edits[groupId] }
    delete groupEdits[field]
    if (Object.keys(groupEdits).length === 0) delete edits[groupId]
    else edits[groupId] = groupEdits
    persist({ ...current, ecoSupplyByFlightEdits: edits })
  }

  const send = async () => {
    if (!editable || !canFinalize) return
    setSending(true)
    try {
      if (workspace && activeRules) {
        const services = await loadExportServices()
        const ecoBytes = await services.buildEcoWorkbook(workspace.ecoRows)
        services.downloadXlsx(
          ecoBytes,
          services.buildSupplierExportFilename(current.station, 'eco', current.serviceDate),
        )
        if (workspace.sbbRows.length > 0) {
          const sbbBytes = await services.buildSbbWorkbook(workspace.sbbRows, activeRules.sbbLookups)
          if (sbbBytes) {
            services.downloadXlsx(
              sbbBytes,
              services.buildSupplierExportFilename(current.station, 'sbb', current.serviceDate),
            )
          }
        }
      }
      persist({ ...current, status: 'sent', createdAt: Date.now(), createdBy: userName() })
      message.success(t('catering.orders.sentV', { v: current.version }))
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('catering.orders.supplier.exportFailed'),
      )
    } finally {
      setSending(false)
    }
  }

  function userName() {
    return session?.user.name ?? 'Catering Ops'
  }

  /** Re-snapshot the day's CONFIRMED groups into a fresh draft version, on top of a sent order. */
  const createNewVersion = () => {
    if (!isLatest || current.status !== 'sent' || !canFinalize || !day) return
    const confirmed = day.groups.filter((g) => groupOrigin(g) === current.station && g.confirmed)
    if (confirmed.length === 0) {
      message.warning(t('catering.orders.needConfirmed'))
      return
    }
    setCreatingVersion(true)
    try {
      const { lines, breakdown } = buildOrderSnapshot(confirmed, crewMealProfile ?? undefined, makeCodeOf(legacyMealCatalog))
      const { lines: ecoSupplyLines, byFlight: ecoSupplyByFlight } = buildEcoSupplySnapshot({
        day,
        station: current.station,
        mealCatalog,
        amenityCatalog,
        ecoRouteRules: activeRules?.ecoRouteRules ?? null,
        quantityConfig: {
          amenity: activeRules?.ecoAmenity ?? DEFAULT_ECO_AMENITY_CONFIG,
          quantityRules: activeRules?.ecoQuantityRules ?? DEFAULT_ECO_QUANTITY_RULES,
        },
        crewMealProfile,
      })
      const version = current.version + 1
      const record: CateringOrder = {
        id: `${file.fileId}-v${version}`,
        version,
        serviceDate: current.serviceDate,
        station: current.station,
        createdAt: Date.now(),
        createdBy: userName(),
        status: 'draft',
        lines,
        breakdown,
        ecoSupplyLines,
        ecoSupplyByFlight,
      }
      saveOrders.mutate(
        { orders: [...(data?.orders ?? []), record] },
        {
          onSuccess: () => {
            setSelectedVersion(version)
            message.success(t('catering.orders.revisionCreated', { v: version }))
          },
        },
      )
    } finally {
      setCreatingVersion(false)
    }
  }

  return (
    <div className="thin-scroll h-full overflow-auto p-5">
      <DetailHero
        backTo={paths.catering.orders.list}
        backLabel={t('catering.orders.title')}
        title={file.fileId}
        badge={
          <span className="inline-flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={current.status} />
            <VerTag v={current.version} />
          </span>
        }
        meta={
          <span>
            {current.station} · {t('catering.orders.serviceDate')}{' '}
            <strong className="text-foreground font-bold">
              {weekdayOf(t, file.serviceDate)}, {file.serviceDate}
            </strong>
            {inputs.length > 0 ? (
              <span className="text-text-secondary">
                {' '}
                · {t('catering.orders.supplier.flightsN', { n: inputs.length })}
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            <Button icon={<Printer size={15} />} onClick={() => window.print()}>
              {t('catering.orders.print')}
            </Button>
            {isLatest && current.status === 'sent' && canFinalize ? (
              <Button
                icon={<RefreshCw size={15} />}
                loading={creatingVersion || saveOrders.isPending}
                onClick={createNewVersion}
              >
                {t('catering.orders.newRevision')}
              </Button>
            ) : null}
            {editable && canFinalize && showEcoSupply ? (
              <Button
                type="primary"
                icon={<Send size={16} />}
                loading={sending || saveOrders.isPending}
                onClick={() => void send()}
                style={{ background: 'var(--color-vj-green-dark)', borderColor: 'var(--color-vj-green-dark)' }}
              >
                {t('catering.orders.sendSupplier')}
              </Button>
            ) : null}
          </>
        }
      />

      {!isLatest ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message={t('catering.orders.viewingOld', { v: current.version })}
          action={
            <button
              type="button"
              onClick={() => setSelectedVersion(latest!.version)}
              className="text-planner-accent hover:text-planner-ink cursor-pointer text-[12px] font-bold"
            >
              {t('catering.orders.gotoLatest', { v: latest!.version })}
            </button>
          }
        />
      ) : null}

      {pendingCount > 0 ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message={t('catering.orders.supplier.pendingBanner', { n: pendingCount })}
          action={
            <Link
              to={paths.catering.grouping.list}
              className="text-planner-accent hover:text-planner-ink cursor-pointer text-[12px] font-bold"
            >
              {t('catering.orders.supplier.openGrouping')}
            </Link>
          }
        />
      ) : null}

      {showEcoSupply ? (
        <>
          <p className="order-section-label mb-2">{t('catering.orders.supply.sectionOverview')}</p>
          <OrderStatStrip
            className="mb-5"
            columns={3}
            items={[
              {
                label: t('catering.orders.supply.kpiTotalMeals'),
                value: (
                  <StatTrendValue
                    value={mealStats.totalMeals}
                    delta={prevMealStats ? mealStats.totalMeals - prevMealStats.totalMeals : null}
                  />
                ),
                featured: true,
                hint: t('catering.orders.supply.kpiTotalMealsHint'),
              },
              {
                label: t('catering.orders.supply.kpiPrebook'),
                value: (
                  <StatTrendValue
                    value={mealStats.prebook}
                    delta={prevMealStats ? mealStats.prebook - prevMealStats.prebook : null}
                  />
                ),
              },
              {
                label: t('catering.orders.supply.kpiCrew'),
                value: (
                  <StatTrendValue
                    value={mealStats.crew}
                    delta={prevMealStats ? mealStats.crew - prevMealStats.crew : null}
                  />
                ),
              },
              {
                label: t('catering.orders.supply.kpiSkyboss'),
                value: (
                  <StatTrendValue
                    value={mealStats.skyboss}
                    delta={prevMealStats ? mealStats.skyboss - prevMealStats.skyboss : null}
                  />
                ),
              },
              {
                label: t('catering.orders.supply.kpiSkybossBusiness'),
                value: (
                  <StatTrendValue
                    value={mealStats.skybossBusiness}
                    delta={prevMealStats ? mealStats.skybossBusiness - prevMealStats.skybossBusiness : null}
                  />
                ),
              },
              {
                label: t('catering.orders.supply.kpiQuota'),
                value: (
                  <StatTrendValue
                    value={mealStats.quotaCommercial}
                    delta={prevMealStats ? mealStats.quotaCommercial - prevMealStats.quotaCommercial : null}
                  />
                ),
                hint: t('catering.orders.supply.kpiQuotaHint'),
              },
            ]}
          />

          <div className="order-supply-layout">
            <div className="order-supply-layout__main">
              <Tabs
                items={[
                  {
                    key: 'supply',
                    label: t('catering.orders.supply.sectionBreakdown'),
                    children: (
                      <EcoSupplyPanel
                        lines={ecoSupplyLines}
                        editable={editable}
                        onChangeQty={patchEcoSupplyQty}
                        onResetLine={resetEcoSupplyLine}
                        compactSummary
                        prevQtyByField={prevQtyByField}
                      />
                    ),
                  },
                  {
                    key: 'byFlight',
                    label: t('catering.orders.byFlight.title'),
                    children: (
                      <FlightBreakdownPanel
                        byFlight={ecoSupplyByFlight}
                        lines={ecoSupplyLines}
                        editable={editable}
                        edits={current.ecoSupplyByFlightEdits}
                        onChangeQty={patchByFlightQty}
                        onResetField={resetByFlightQty}
                        prevByFlightCells={prevByFlightCells}
                      />
                    ),
                  },
                ]}
              />
            </div>

            <aside className="order-supply-layout__side">
              <p className="order-section-label">{t('catering.orders.supply.sectionMeta')}</p>
              <SurfaceCard title={t('catering.orders.versionHistory')}>
                <div className="-mt-1 mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReconcileOpen(true)}
                    className="text-planner-accent hover:text-planner-ink inline-flex cursor-pointer items-center gap-1 text-[12px] font-bold"
                  >
                    <ArrowRightLeft size={12} /> {t('catering.orders.reconcile.open')}
                  </button>
                </div>
                <div className="relative pl-5">
                  <span className="bg-border absolute top-1 bottom-1 left-[6px] w-0.5" />
                  {[...file.versions].reverse().map((v) => {
                    const cur = v.version === current.version
                    const sent = v.status === 'sent'
                    return (
                      <button
                        key={v.version}
                        type="button"
                        onClick={() => setSelectedVersion(v.version)}
                        className="relative block w-full cursor-pointer pb-3.5 text-left last:pb-0"
                      >
                        <span
                          className="absolute top-1 left-[-17px] h-3 w-3 rounded-full border-2"
                          style={
                            cur
                              ? {
                                  background: 'var(--color-planner-accent)',
                                  borderColor: 'var(--color-planner-accent)',
                                  boxShadow: '0 0 0 3px var(--color-planner-accent-soft)',
                                }
                              : sent
                                ? {
                                    background: 'var(--color-vj-green-dark)',
                                    borderColor: 'var(--color-vj-green-dark)',
                                  }
                                : { background: '#fff', borderColor: 'var(--color-border)' }
                          }
                        />
                        <span className="flex items-center gap-2 text-[12.5px] font-extrabold">
                          v{v.version} · {t(`catering.orders.status.${v.status}`)}
                        </span>
                        <span className="text-text-secondary mt-0.5 block text-[11px] font-semibold tnum">
                          {fmtFull(v.createdAt)}
                        </span>
                        <span className="text-text-muted block text-[11px] font-semibold">{v.createdBy}</span>
                      </button>
                    )
                  })}
                </div>
              </SurfaceCard>

              <SurfaceCard title={t('catering.orders.orderInfo')}>
                <Meta k={t('catering.orders.createdBy')} v={file.versions[0].createdBy} />
                <Meta k={t('catering.orders.createdAt')} v={fmtFull(file.versions[0].createdAt)} />
                <Meta k={t('catering.orders.station')} v={current.station} />
                <Meta
                  k={t('catering.orders.supply.skuCount')}
                  v={String(ecoSupplyLines.filter((l) => l.qty > 0 || l.overridden).length)}
                />
              </SurfaceCard>
            </aside>
          </div>
        </>
      ) : (
        <Empty className="py-16" description={t('catering.orders.supplier.emptySupplier')}>
          <Link to={paths.catering.grouping.list}>
            <Button type="primary">{t('catering.orders.supplier.openGrouping')}</Button>
          </Link>
        </Empty>
      )}

      <ReconcileDrawer
        open={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        current={current}
        base={reconcileBase}
      />
    </div>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-border flex justify-between border-b border-dashed py-1.5 text-[12px] last:border-b-0">
      <span className="text-text-secondary font-semibold">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  )
}

function fmtFull(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Older saved orders persisted a per-leg `ecoSupplyByFlight` shape (no `legs`
 * array) — using that stale shape crashes `FlightBreakdownPanel`, which reads
 * `f.legs`. Treat it as absent so the snapshot recomputes in the current shape.
 */
function hasFreshByFlightShape(
  fb: CateringOrder['ecoSupplyByFlight'],
): boolean {
  return !!fb?.length && fb.every((f) => Array.isArray(f.legs) && f.legs.length > 0)
}

/**
 * Per-flight-group edits always win for their group; the order-wide total for an
 * edited field is recomputed as the sum of each group's effective value.
 */
function applyByFlightEditsToLines(
  lines: EcoSupplyLine[],
  byFlight: EcoSupplyFlightBreakdown[],
  edits: CateringOrder['ecoSupplyByFlightEdits'],
): EcoSupplyLine[] {
  if (!edits) return lines
  const editedFields = new Set(Object.values(edits).flatMap((e) => Object.keys(e)))
  if (editedFields.size === 0) return lines
  return lines.map((line) => {
    if (!editedFields.has(line.field)) return line
    const total = byFlight.reduce((sum, f) => {
      const override = edits[f.groupId]?.[line.field]
      if (override != null) return sum + override
      if (line.field.startsWith('amenityPackage')) {
        const pkg = f.amenityPackages?.find((p) => `amenityPackage${p.id}` === line.field)
        return sum + (pkg?.count ?? 0)
      }
      return sum + (f.cells[line.field] ?? 0)
    }, 0)
    return { ...line, qty: total, overridden: true }
  })
}

function computeMealStats(lines: EcoSupplyLine[], inputs: SupplierFlightInput[]) {
  const hotmealBread = lines
    .filter((l) => l.group === 'main' || l.group === 'vegetarian' || l.group === 'bread')
    .reduce((s, l) => s + l.qty, 0)
  const prebook = lines.find((l) => l.field === 'prebook')?.qty ?? 0
  const skyboss = lines.find((l) => l.field === 'skyboss')?.qty ?? 0
  const skybossBusiness = inputs.reduce((s, i) => s + (i.businessPax ?? 0), 0)
  const crew = lines.find((l) => l.field === 'crewCockpit')?.qty ?? 0
  const quotaCommercial =
    inputs.reduce((s, i) => s + (i.quotaCommercial ?? 0), 0) ||
    (lines.find((l) => l.field === 'quotaCommercial')?.qty ?? 0)
  const totalMeals = hotmealBread + crew
  return { totalMeals, prebook, skyboss, skybossBusiness, crew, quotaCommercial }
}

/** An order version's ECO supply lines with its own per-flight-group edits folded in — the same effective numbers that version showed at the time. */
function effectiveLinesFor(order: CateringOrder | null): EcoSupplyLine[] {
  if (!order?.ecoSupplyLines?.length) return []
  const byFlight = hasFreshByFlightShape(order.ecoSupplyByFlight) ? order.ecoSupplyByFlight! : []
  return applyByFlightEditsToLines(order.ecoSupplyLines, byFlight, order.ecoSupplyByFlightEdits)
}

/** An order version's per-flight-group cells with its own per-group edits folded in, keyed by groupId → field → qty. */
function effectiveByFlightCells(order: CateringOrder | null): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {}
  if (!order || !hasFreshByFlightShape(order.ecoSupplyByFlight)) return map
  const edits = order.ecoSupplyByFlightEdits ?? {}
  for (const f of order.ecoSupplyByFlight!) {
    const cells: Record<string, number> = { ...f.cells }
    for (const p of f.amenityPackages ?? []) cells[`amenityPackage${p.id}`] = p.count
    const groupEdits = edits[f.groupId]
    if (groupEdits) for (const [field, qty] of Object.entries(groupEdits)) cells[field] = qty
    map[f.groupId] = cells
  }
  return map
}
