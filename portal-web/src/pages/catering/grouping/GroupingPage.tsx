import { App as AntApp, Button, Input, Segmented, Spin, Tooltip } from 'antd'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  MapPin,
  Package,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/patterns/PageHeader'
import { useAuth } from '@/core/auth/useAuth'
import { activeConfigVersion } from '@/modules/catering/config'
import type { GroupByFlightHourRule } from '@/modules/catering/configTypes'
import { activeCrewMealVersion, profileFor } from '@/modules/catering/crewMeal'
import {
  autoGroupFlights,
  isReview,
  mergeGroups,
  moveLeg,
  sortForReview,
  splitGroupAt,
} from '@/modules/catering/grouping'
import type { FlightGroup } from '@/modules/catering/groupingTypes'
import { useCrewMealConfigData } from '@/modules/catering/hooks/useCrewMealConfig'
import { useFlightGroups, useSaveFlightGroups } from '@/modules/catering/hooks/useFlightGroups'
import { useMeals } from '@/modules/catering/hooks/useMeals'
import { useOrders, useSaveOrders } from '@/modules/catering/hooks/useOrders'
import { useQuotaData } from '@/modules/catering/hooks/useQuota'
import { useRuleConfigData } from '@/modules/catering/hooks/useRuleConfig'
import { buildOrderLines, groupOrderFiles, makeCodeOf, orderFileId } from '@/modules/catering/orders'
import { activeVersion as activeQuotaVersion } from '@/modules/catering/quota'
import { getSeedDataset } from '@/mock-data/loaders/loadFlightGroups'
import { paths } from '@/routes/paths'
import { GroupCard } from './GroupCard'
import { UngroupedView } from './UngroupedView'

type FilterKey = 'all' | 'review' | 'confirmed'

export function GroupingPage() {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data, isLoading } = useFlightGroups()
  const saveGroups = useSaveFlightGroups()
  const { data: ordersData } = useOrders()
  const saveOrders = useSaveOrders()
  const { data: catalog } = useMeals()
  const { data: crewCfg } = useCrewMealConfigData()
  const { data: ruleCfg } = useRuleConfigData()
  const { data: quotaData } = useQuotaData()

  const [selectedDate, setSelectedDate] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [opened, setOpened] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Set<string>>(new Set())
  const [running, setRunning] = useState(false)

  const days = useMemo(() => data?.days ?? [], [data])
  const day = useMemo(
    () => days.find((d) => d.serviceDate === selectedDate) ?? days[0],
    [days, selectedDate],
  )
  const dayIndex = day ? days.findIndex((d) => d.serviceDate === day.serviceDate) : -1
  const groups = day?.groups ?? []

  const numberOf = useMemo(() => {
    const map = new Map(groups.map((g, i) => [g.id, i + 1]))
    return (id: string) => map.get(id) ?? 0
  }, [groups])

  const reviewCount = groups.filter(isReview).length
  const confirmedCount = groups.filter((g) => g.confirmed).length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = groups.filter((g) => {
      if (filter === 'review' && !isReview(g)) return false
      if (filter === 'confirmed' && !g.confirmed) return false
      if (q) {
        const hay = `${g.aircraft} ${g.purser} ${g.purserCode} ${g.legs
          .map((l) => `${l.flightNo}${l.dep}${l.arr}`)
          .join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    return sortForReview(filtered)
  }, [groups, filter, query])

  const commit = (nextGroups: FlightGroup[], toast?: string) => {
    if (!data || !day) return
    const nextDays = data.days.map((d) =>
      d.serviceDate === day.serviceDate ? { ...d, groups: nextGroups } : d,
    )
    saveGroups.mutate({ ...data, days: nextDays }, { onSuccess: () => toast && message.success(toast) })
  }

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const goDay = (delta: number) => {
    const next = days[dayIndex + delta]
    if (!next) return
    setSelectedDate(next.serviceDate)
    setFilter('all')
    setQuery('')
    setOpened(new Set())
    setEditing(new Set())
  }

  const runGrouping = () => {
    if (!data || !day) return
    setRunning(true)
    window.setTimeout(() => {
      // Drive the split behaviour from the active Commercial rule config.
      const rules = activeConfigVersion(ruleCfg?.versions ?? [])?.rules ?? []
      const groupByPurser = rules.some((r) => r.kind === 'group_by_purser' && r.enabled)
      const hourRule = rules.find((r) => r.kind === 'group_by_flight_hour' && r.enabled) as
        | GroupByFlightHourRule
        | undefined
      // Per-flight onboard-sales quota from the active inflight-quota version.
      const quotaRows = activeQuotaVersion(quotaData?.versions ?? [])?.rows ?? []
      const quotaByFlightNo = new Map(
        quotaRows.map((r) => [r.flightNo, { hotmeal: r.hotmeal, banhMi: r.banhMi, traSua: r.traSua }]),
      )
      const grouped = autoGroupFlights(day.ungroupedFlights ?? [], {
        station: data.station,
        groupByPurser,
        maxHours: hourRule?.maxHours,
        quotaByFlightNo,
      })
      const nextDays = data.days.map((d) =>
        d.serviceDate === day.serviceDate
          ? {
              ...d,
              status: 'grouped' as const,
              groups: grouped,
              ungroupedFlights: undefined,
              aiGroupedAt: t('catering.grouping.justNow'),
              aiAccuracy: 90,
            }
          : d,
      )
      saveGroups.mutate(
        { ...data, days: nextDays },
        { onSuccess: () => message.success(t('catering.grouping.groupedToast', { count: grouped.length })) },
      )
      setRunning(false)
    }, 1100)
  }

  const handleConfirm = (id: string) => {
    const g = groups.find((x) => x.id === id)
    if (!g) return
    const willConfirm = !g.confirmed
    if (willConfirm) {
      setEditing((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
    commit(
      groups.map((x) => (x.id === id ? { ...x, confirmed: willConfirm } : x)),
      willConfirm ? t('catering.grouping.confirmedToast', { n: numberOf(id), ac: g.aircraft }) : undefined,
    )
  }

  const handleMarkCorrect = (id: string) =>
    commit(
      groups.map((x) => (x.id === id ? { ...x, confidence: 'high', reviewNote: undefined } : x)),
      t('catering.grouping.markedCorrect'),
    )

  const handleSplit = (id: string, at: number) => {
    commit(splitGroupAt(groups, id, at), t('catering.grouping.splitDone'))
    setOpened((prev) => new Set(prev).add(id))
  }

  const handleMerge = (sourceId: string, targetId: string) => {
    commit(mergeGroups(groups, targetId, sourceId), t('catering.grouping.mergeDone', { n: numberOf(targetId) }))
    setEditing((prev) => {
      const next = new Set(prev)
      next.delete(sourceId)
      return next
    })
  }

  const handleMoveLeg = (sourceId: string, legIndex: number, destId: string) => {
    const leg = groups.find((g) => g.id === sourceId)?.legs[legIndex]
    commit(
      moveLeg(groups, sourceId, legIndex, destId),
      t('catering.grouping.moveDone', { flight: leg?.flightNo ?? '', n: numberOf(destId) }),
    )
    setOpened((prev) => new Set(prev).add(destId))
  }

  const confirmAll = () => {
    commit(
      groups.map((g) => ({ ...g, confirmed: true })),
      t('catering.grouping.confirmedAll'),
    )
    setEditing(new Set())
  }

  const collapseAll = () => {
    setOpened(new Set())
    setEditing(new Set())
  }

  /** Revert the current day to its original seed (ungrouped) state — for re-testing AI grouping. */
  const handleResetDay = () => {
    if (!data || !day) return
    const seedDay = getSeedDataset().days.find((d) => d.serviceDate === day.serviceDate)
    if (!seedDay) return
    const restored = JSON.parse(JSON.stringify(seedDay)) as typeof seedDay
    const nextDays = data.days.map((d) => (d.serviceDate === day.serviceDate ? restored : d))
    saveGroups.mutate(
      { ...data, days: nextDays },
      { onSuccess: () => message.success(t('catering.grouping.resetDone')) },
    )
    setOpened(new Set())
    setEditing(new Set())
    setFilter('all')
    setQuery('')
  }

  /** Build (or reopen) the day's supplier order from the CONFIRMED groups. */
  const handleCreateOrder = () => {
    if (!data || !day) return
    const confirmed = groups.filter((g) => g.confirmed)
    if (confirmed.length === 0) {
      message.warning(t('catering.orders.needConfirmed'))
      return
    }
    const fileId = orderFileId(data.station, day.serviceDate)
    const files = groupOrderFiles(ordersData?.orders ?? [])
    const existing = files.find((f) => f.fileId === fileId)
    // A draft already open for this day → just go edit it.
    if (existing && existing.latest.status === 'draft') {
      navigate(paths.catering.orders.detail(fileId))
      return
    }
    const crewVersion = activeCrewMealVersion(crewCfg?.versions ?? [])
    const profile = crewVersion ? profileFor(crewVersion, 'cockpit') : undefined
    const lines = buildOrderLines(confirmed, profile, makeCodeOf(catalog))
    const version = (existing?.latest.version ?? 0) + 1
    saveOrders.mutate(
      {
        orders: [
          ...(ordersData?.orders ?? []),
          {
            id: `${fileId}-v${version}`,
            version,
            serviceDate: day.serviceDate,
            station: data.station,
            createdAt: Date.now(),
            createdBy: session?.user.name ?? 'Catering Ops',
            status: 'draft' as const,
            lines,
          },
        ],
      },
      { onSuccess: () => navigate(paths.catering.orders.detail(fileId)) },
    )
  }

  if (isLoading || !data || !day) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    )
  }

  const isGrouped = day.status === 'grouped'

  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader
          title={t('catering.grouping.title')}
          actions={
            isGrouped ? (
              <div className="flex items-center gap-2.5">
                <span className="text-text-secondary inline-flex items-center gap-1.5 text-[12px] font-bold">
                  <Sparkles size={15} className="text-vj-red" />
                  {t('catering.grouping.aiMeta', { at: day.aiGroupedAt, acc: day.aiAccuracy })}
                </span>
                <Button icon={<RotateCcw size={15} />} onClick={handleResetDay}>
                  {t('catering.grouping.reset')}
                </Button>
              </div>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={running}
                icon={running ? undefined : <Sparkles size={17} />}
                onClick={runGrouping}
              >
                {running ? t('catering.grouping.grouping') : t('catering.grouping.runGrouping')}
              </Button>
            )
          }
        />

        <div className="flex flex-col gap-4">
          {/* Context bar with day switcher */}
          <div className="border-border bg-surface flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-[13px] font-semibold">
            <span className="text-vj-red inline-flex items-center gap-1.5">
              <MapPin size={16} />
              <span className="text-foreground font-extrabold">{data.station}</span>
              <span className="text-text-secondary">· {data.stationName}</span>
            </span>
            <span className="bg-border h-1 w-1 rounded-full" />
            <span className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => goDay(-1)}
                disabled={dayIndex <= 0}
                aria-label={t('catering.grouping.prevDay')}
                className="text-text-muted hover:text-vj-red enabled:hover:bg-vj-red-50 grid h-7 w-7 place-items-center rounded-md transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-foreground font-extrabold">
                {day.serviceWeekday}, {day.serviceDate}
              </span>
              <button
                type="button"
                onClick={() => goDay(1)}
                disabled={dayIndex >= days.length - 1}
                aria-label={t('catering.grouping.nextDay')}
                className="text-text-muted hover:text-vj-red enabled:hover:bg-vj-red-50 grid h-7 w-7 place-items-center rounded-md transition-colors disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </span>
            {isGrouped ? (
              <>
                <span className="bg-border h-1 w-1 rounded-full" />
                <span>
                  <span className="text-foreground font-extrabold">{groups.length}</span>{' '}
                  {t('catering.grouping.groupsToPrep')}
                </span>
              </>
            ) : null}
          </div>

          {isGrouped ? (
            <>
              {/* Review alert */}
              {reviewCount > 0 ? (
                <div className="bg-vj-yellow-muted border-vj-yellow-border text-vj-yellow-dark flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-[13.5px] font-semibold">
                  <AlertTriangle size={19} className="shrink-0" />
                  <span>
                    <span className="text-foreground font-extrabold">{reviewCount}</span>{' '}
                    {t('catering.grouping.reviewAlert')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilter('review')}
                    className="border-vj-yellow-border text-vj-yellow-dark hover:bg-vj-yellow-muted ml-auto shrink-0 cursor-pointer rounded-md border bg-white px-3 py-1.5 text-[12.5px] font-extrabold"
                  >
                    {t('catering.grouping.onlyReview')}
                  </button>
                </div>
              ) : null}

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <Segmented<FilterKey>
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'all', label: `${t('catering.grouping.filterAll')} (${groups.length})` },
                    { value: 'review', label: `${t('catering.grouping.filterReview')} (${reviewCount})` },
                    { value: 'confirmed', label: `${t('catering.grouping.filterConfirmed')} (${confirmedCount})` },
                  ]}
                />
                <Input
                  allowClear
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('catering.grouping.searchPlaceholder')}
                  prefix={<Search className="text-text-muted h-4 w-4" />}
                  style={{ width: 260 }}
                />
                <div className="ml-auto">
                  <Button type="text" icon={<ChevronsDownUp size={15} />} onClick={collapseAll}>
                    {t('catering.grouping.collapseAll')}
                  </Button>
                </div>
              </div>

              {/* Group list */}
              <div className="flex flex-col gap-2">
                {visible.length ? (
                  visible.map((g) => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      number={numberOf(g.id)}
                      open={opened.has(g.id)}
                      editing={editing.has(g.id)}
                      allGroups={groups}
                      numberOf={numberOf}
                      onToggleOpen={() => setOpened((prev) => toggle(prev, g.id))}
                      onToggleEdit={() => {
                        setEditing((prev) => toggle(prev, g.id))
                        setOpened((prev) => new Set(prev).add(g.id))
                      }}
                      onConfirm={() => handleConfirm(g.id)}
                      onMarkCorrect={() => handleMarkCorrect(g.id)}
                      onSplit={(at) => handleSplit(g.id, at)}
                      onMergeInto={(targetId) => handleMerge(g.id, targetId)}
                      onMoveLeg={(legIndex, destId) => handleMoveLeg(g.id, legIndex, destId)}
                    />
                  ))
                ) : (
                  <div className="text-text-secondary py-14 text-center">
                    {t('catering.grouping.emptyFiltered')}
                  </div>
                )}
              </div>
            </>
          ) : (
            <UngroupedView flights={day.ungroupedFlights ?? []} running={running} />
          )}
        </div>
      </div>

      {/* Sticky footer — only when grouped */}
      {isGrouped ? (
        <div className="page-shell__footer">
          <div className="flex items-center gap-3">
            <div className="bg-muted h-[7px] w-[120px] overflow-hidden rounded-full">
              <span
                className="bg-vj-green block h-full rounded-full transition-[width] duration-300"
                style={{ width: `${groups.length ? (confirmedCount / groups.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-text-secondary text-[12.5px] font-bold">
              <span className="text-foreground">{confirmedCount}</span>/{groups.length}{' '}
              {t('catering.grouping.confirmedProgress')}
            </span>
            <span className="text-[13px] font-bold">
              · <span className="text-[16px]">{groups.length}</span> {t('catering.grouping.groupsToPrep')}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Tooltip title={t('catering.grouping.confirmAllTip')}>
              <Button icon={<CheckCircle2 size={17} />} onClick={confirmAll} size="large">
                {t('catering.grouping.confirmAll')}
              </Button>
            </Tooltip>
            <Button
              type="primary"
              size="large"
              icon={<Package size={17} />}
              loading={saveOrders.isPending}
              onClick={handleCreateOrder}
            >
              {t('catering.grouping.createOrder')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
