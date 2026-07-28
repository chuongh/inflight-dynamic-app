import { Alert, App as AntApp, Button, Empty, Segmented } from 'antd'
import {
  ArrowRightLeft,
  FileSpreadsheet,
  PlaneTakeoff,
  Printer,
  Send,
  ShoppingBag,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailHero } from '@/components/patterns/DetailHero'
import { KpiCard } from '@/components/patterns/KpiCard'
import { SurfaceCard } from '@/components/patterns/SurfaceCard'
import { useAuth } from '@/core/auth/useAuth'
import { useFlightGroups } from '@/modules/catering/hooks/useFlightGroups'
import { useOrders, useSaveOrders } from '@/modules/catering/hooks/useOrders'
import { useSupplierRuleConfigData } from '@/modules/catering/hooks/useSupplierRuleConfig'
import type { CateringOrder, CateringOrderLine, OrderCategory, OrderSourceCell } from '@/modules/catering/orderTypes'
import { categoryTotal, groupOrderFiles, lineTotal, suggestedTotal } from '@/modules/catering/orders'
import { deriveLines } from '@/modules/catering/orderSnapshot'
import { flightGroupsToSupplierInputs } from '@/modules/catering/supplier/fromFlightGroup'
import { activeSupplierRuleVersion } from '@/modules/catering/supplierRuleConfig'
import { paths } from '@/routes/paths'
import { PlannerFlightEditor, type PlannerCellChange } from '../planner/PlannerFlightEditor'
import { PlannerFlightRail } from '../planner/PlannerFlightRail'
import {
  applySupplierEdits,
  buildPlannerWorkspace,
  derivePlannerContext,
  rollupDishOverview,
  selectPlannerFlight,
  type SupplierEdits,
} from '../planner/plannerModel'
import '../planner/planner.css'
import { CAT_COLOR, OrderStatusBadge, VerTag, weekdayOf } from './orderUi'
import { DishOverviewCockpit } from './DishOverviewCockpit'
import { FlightMealEditorDrawer } from './FlightMealEditorDrawer'
import { ReconcileDrawer } from './ReconcileDrawer'

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

  const files = useMemo(() => groupOrderFiles(data?.orders ?? []), [data])
  const file = files.find((f) => f.fileId === fileId)
  const latest = file?.latest

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [flightEditOpen, setFlightEditOpen] = useState(false)
  const [selectedFlightKey, setSelectedFlightKey] = useState('')
  const [sending, setSending] = useState(false)
  const [detailTab, setDetailTab] = useState<'dishes' | 'supplier'>('dishes')

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

  const selectedFlight = workspace
    ? selectPlannerFlight(workspace.flights, selectedFlightKey)
    : undefined
  const plannerContext = useMemo(
    () => (workspace ? derivePlannerContext(workspace.flights) : null),
    [workspace],
  )
  const dishRollup = useMemo(
    () => (workspace ? rollupDishOverview(workspace.flights) : null),
    [workspace],
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

  // Lines are derived (read-only) — all edits go through the flight editor.
  const lines = current.lines
  const hasSupplierInputs = inputs.length > 0
  const useSupplierRollup = !!dishRollup && dishRollup.sections.length > 0

  const shownIdx = file.versions.findIndex((v) => v.version === current.version)
  const reconcileBase = shownIdx > 0 ? file.versions[shownIdx - 1] : null

  const total = useSupplierRollup ? dishRollup!.total : lineTotal(lines)
  const delta = useSupplierRollup ? 0 : total - suggestedTotal(lines)
  const catTotal = (c: OrderCategory) => {
    if (!useSupplierRollup || !dishRollup) return categoryTotal(lines, c)
    if (c === 'prebook') return dishRollup.ecoMeals
    if (c === 'sales') return dishRollup.ecoCommercial + dishRollup.sbbMeals
    return 0
  }

  const persist = (record: CateringOrder, extra: CateringOrder[] = []) => {
    const others = (data?.orders ?? []).filter(
      (o) => !(o.station === record.station && o.serviceDate === record.serviceDate && o.version === record.version),
    )
    saveOrders.mutate({ orders: [...others, record, ...extra] })
  }

  const patchSupplierEdit = (change: PlannerCellChange) => {
    if (!editable) return
    const prev: SupplierEdits = current.supplierEdits ?? {}
    const flight = prev[change.flightKey] ?? {}
    const productPatch = {
      ...flight[change.product],
      [change.field]: change.value,
    }
    const next: SupplierEdits = {
      ...prev,
      [change.flightKey]: {
        ...flight,
        [change.product]: productPatch,
      },
    }
    persist({ ...current, supplierEdits: next })
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
          const sbbBytes = await services.buildSbbWorkbook(
            workspace.sbbRows,
            activeRules.sbbLookups,
          )
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
        error instanceof Error
          ? error.message
          : t('catering.orders.supplier.exportFailed'),
      )
    } finally {
      setSending(false)
    }
  }

  const createVersionFromBreakdown = (nextBreakdown: OrderSourceCell[]) => {
    const v = latest!.version + 1
    const codeOf = (name: string) =>
      current!.lines.find((l) => l.category === 'prebook' && l.name === name)?.productCodes ?? []
    const rec: CateringOrder = {
      ...latest!,
      id: `${file.fileId}-v${v}`,
      version: v,
      status: 'draft',
      createdAt: Date.now(),
      createdBy: userName(),
      breakdown: nextBreakdown,
      lines: deriveLines(nextBreakdown, codeOf),
    }
    saveOrders.mutate({ orders: [...(data?.orders ?? []), rec] })
    setSelectedVersion(v)
    setFlightEditOpen(false)
    message.success(t('catering.orders.editByFlight.created', { v }))
  }
  function userName() {
    return session?.user.name ?? 'Catering Ops'
  }

  const lineLabel = (l: CateringOrderLine) =>
    l.category === 'prebook' ? l.name : t(`catering.orders.line.${l.name}`)

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
          </span>
        }
        actions={
          <Button icon={<Printer size={15} />} onClick={() => window.print()}>
            {t('catering.orders.print')}
          </Button>
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

      <div className="kpi-grid kpi-grid--4 mb-4">
        <KpiCard icon={ShoppingBag} tone="default" value={total.toLocaleString()} label={t('catering.orders.total')} />
        <KpiCard
          icon={UtensilsCrossed}
          tone="brand"
          value={catTotal('prebook').toLocaleString()}
          label={
            useSupplierRollup
              ? t('catering.orders.supplier.kpiEcoMeals')
              : t('catering.orders.prebookN', { n: lines.filter((l) => l.category === 'prebook').length })
          }
        />
        <KpiCard
          icon={Users}
          tone="default"
          value={catTotal('crew').toLocaleString()}
          label={
            useSupplierRollup ? t('catering.orders.supplier.kpiCrewNa') : t('catering.orders.crewLabel')
          }
        />
        <KpiCard
          icon={ShoppingBag}
          tone="warning"
          value={catTotal('sales').toLocaleString()}
          label={
            useSupplierRollup ? t('catering.orders.supplier.kpiSbbSales') : t('catering.orders.salesLabel')
          }
        />
      </div>

      <SurfaceCard className="mb-4" padding="md">
        <div className="bg-muted flex h-2.5 overflow-hidden rounded-full">
          {useSupplierRollup && dishRollup ? (
            <>
              {dishRollup.ecoMeals > 0 ? (
                <span style={{ width: `${(dishRollup.ecoMeals / (total || 1)) * 100}%`, background: CAT_COLOR.prebook }} />
              ) : null}
              {dishRollup.ecoCommercial > 0 ? (
                <span
                  style={{ width: `${(dishRollup.ecoCommercial / (total || 1)) * 100}%`, background: CAT_COLOR.crew }}
                />
              ) : null}
              {dishRollup.sbbMeals > 0 ? (
                <span style={{ width: `${(dishRollup.sbbMeals / (total || 1)) * 100}%`, background: CAT_COLOR.sales }} />
              ) : null}
            </>
          ) : (
            (['prebook', 'crew', 'sales'] as OrderCategory[]).map((c) =>
              catTotal(c) > 0 ? (
                <span key={c} style={{ width: `${(catTotal(c) / (total || 1)) * 100}%`, background: CAT_COLOR[c] }} />
              ) : null,
            )
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {useSupplierRollup && dishRollup ? (
            <>
              <Leg color={CAT_COLOR.prebook} label={t('catering.orders.supplier.kpiEcoMeals')} n={dishRollup.ecoMeals} />
              <Leg
                color={CAT_COLOR.crew}
                label={t('catering.orders.supplier.kpiEcoCommercial')}
                n={dishRollup.ecoCommercial}
              />
              <Leg color={CAT_COLOR.sales} label={t('catering.orders.supplier.kpiSbbSales')} n={dishRollup.sbbMeals} />
            </>
          ) : (
            <>
              <Leg color={CAT_COLOR.prebook} label={t('catering.orders.prebookShort')} n={catTotal('prebook')} />
              <Leg color={CAT_COLOR.crew} label={t('catering.orders.crewShort')} n={catTotal('crew')} />
              <Leg color={CAT_COLOR.sales} label={t('catering.orders.salesShort')} n={catTotal('sales')} />
              <span
                className="ml-auto text-[12px] font-bold"
                style={{
                  color:
                    delta === 0
                      ? 'var(--color-text-secondary)'
                      : delta > 0
                        ? 'var(--color-vj-green-dark)'
                        : 'var(--color-vj-red-dark)',
                }}
              >
                {t('catering.orders.deltaVsSuggested')} {delta > 0 ? `+${delta}` : delta}
              </span>
            </>
          )}
        </div>
      </SurfaceCard>

      <div className="mb-4">
        <Segmented<'dishes' | 'supplier'>
          value={detailTab}
          onChange={setDetailTab}
          options={[
            {
              value: 'dishes',
              label: (
                <span className="inline-flex items-center gap-1.5 px-1">
                  <UtensilsCrossed size={14} aria-hidden />
                  {t('catering.orders.supplier.tabDishes')}
                </span>
              ),
            },
            {
              value: 'supplier',
              label: (
                <span className="inline-flex items-center gap-1.5 px-1">
                  <FileSpreadsheet size={14} aria-hidden />
                  {t('catering.orders.supplier.tabSupplier')}
                  {workspace ? (
                    <span className="text-text-muted tnum text-[11px] font-bold">· {workspace.flights.length}</span>
                  ) : null}
                </span>
              ),
            },
          ]}
        />
      </div>

      {detailTab === 'dishes' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <DishOverviewCockpit
            rollup={useSupplierRollup ? dishRollup : null}
            lines={lines}
            lineLabel={lineLabel}
            catTotal={catTotal}
            onGotoSupplier={() => setDetailTab('supplier')}
            showSupplierCta={hasSupplierInputs}
            editByFlight={
              isLatest && current.breakdown && !hasSupplierInputs ? (
                <div className="border-border flex items-center gap-2.5 border-t pt-4">
                  <Button icon={<PlaneTakeoff size={15} />} onClick={() => setFlightEditOpen(true)}>
                    {t('catering.orders.editByFlight.open')}
                  </Button>
                </div>
              ) : null
            }
          />

          <div className="flex flex-col gap-3.5">
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
              <Meta k={t('catering.orders.station')} v={`${current.station}`} />
              <Meta k={t('catering.orders.dishTypes')} v={String(lines.length)} />
            </SurfaceCard>
          </div>
        </div>
      ) : (
        <div className="order-supplier-tab">
          {pendingCount > 0 ? (
            <Alert
              type="info"
              showIcon
              className="mb-3"
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

          {workspace && selectedFlight && plannerContext ? (
            <div className="planner-workspace planner-workspace--tab planner-workspace--editor-first">
              <div className="planner-workspace__split planner-workspace__split--editor-first">
                <PlannerFlightRail
                  flights={workspace.flights}
                  context={plannerContext}
                  selectedKey={selectedFlight.key}
                  onSelect={setSelectedFlightKey}
                  layout="rail"
                />
                <aside
                  className="planner-workspace__editor-pane"
                  aria-label={`${t('catering.orders.supplier.editorTitle')} · ${selectedFlight.flightNo}`}
                >
                  <PlannerFlightEditor
                    flight={selectedFlight}
                    context={plannerContext}
                    editable={editable}
                    onCellChange={patchSupplierEdit}
                  />
                </aside>
              </div>
            </div>
          ) : (
            <Empty className="py-16" description={t('catering.orders.supplier.emptySupplier')}>
              <Link to={paths.catering.grouping.list}>
                <Button type="primary">{t('catering.orders.supplier.openGrouping')}</Button>
              </Link>
            </Empty>
          )}

          {editable && canFinalize && workspace ? (
            <div className="order-supplier-tab__footer">
              <span className="text-text-secondary text-[12px] font-semibold">
                {t('catering.orders.supplier.flightsN', { n: workspace.flights.length })}
                {pendingCount > 0
                  ? ` · ${t('catering.orders.supplier.pendingShort', { n: pendingCount })}`
                  : null}
              </span>
              <Button
                type="primary"
                icon={<Send size={16} />}
                loading={sending || saveOrders.isPending}
                onClick={() => void send()}
                style={{ background: 'var(--color-vj-green-dark)', borderColor: 'var(--color-vj-green-dark)' }}
              >
                {t('catering.orders.sendSupplier')}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <ReconcileDrawer
        open={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        current={current}
        base={reconcileBase}
      />
      <FlightMealEditorDrawer
        open={flightEditOpen}
        onClose={() => setFlightEditOpen(false)}
        current={current}
        onCreateVersion={createVersionFromBreakdown}
        pending={saveOrders.isPending}
      />
    </div>
  )
}

function Leg({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <span className="text-text-secondary inline-flex items-center gap-1.5 text-[12px] font-bold">
      <span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />
      {label} <b className="text-foreground tnum">{n.toLocaleString()}</b>
    </span>
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
