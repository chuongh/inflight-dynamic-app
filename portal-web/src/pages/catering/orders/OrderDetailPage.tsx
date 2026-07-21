import { App as AntApp, Button, Empty } from 'antd'
import {
  ArrowRightLeft,
  ChevronLeft,
  Info,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  ShoppingBag,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/core/auth/useAuth'
import { useOrders, useSaveOrders } from '@/modules/catering/hooks/useOrders'
import type { CateringOrder, CateringOrderLine, OrderCategory } from '@/modules/catering/orderTypes'
import { categoryTotal, groupOrderFiles, lineTotal, suggestedTotal } from '@/modules/catering/orders'
import { paths } from '@/routes/paths'
import { CAT_COLOR, OrderStatusBadge, VerTag, weekdayOf } from './orderUi'
import { ReconcileDrawer } from './ReconcileDrawer'

const CATS: { key: OrderCategory; icon: React.ReactNode }[] = [
  { key: 'prebook', icon: <UtensilsCrossed size={15} className="text-vj-red" /> },
  { key: 'crew', icon: <Users size={15} className="text-vj-red" /> },
  { key: 'sales', icon: <ShoppingBag size={15} className="text-vj-red" /> },
]

export function OrderDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = AntApp.useApp()
  const { session } = useAuth()
  const { fileId } = useParams()
  const { data } = useOrders()
  const saveOrders = useSaveOrders()

  const files = useMemo(() => groupOrderFiles(data?.orders ?? []), [data])
  const file = files.find((f) => f.fileId === fileId)
  const latest = file?.latest

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const current: CateringOrder | undefined = file
    ? (file.versions.find((v) => v.version === (selectedVersion ?? latest!.version)) ?? latest)
    : undefined
  const isLatest = !!current && !!latest && current.version === latest.version
  const editable = !!current && isLatest && current.status === 'draft'

  // Local editable copy of the lines, reseeded when the shown version changes.
  const [lines, setLines] = useState<CateringOrderLine[]>([])
  const seedKey = current ? `${fileId}|${current.version}|${current.status}` : ''
  useEffect(() => {
    if (current) setLines(current.lines.map((l) => ({ ...l })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey])

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

  const setQty = (i: number, qty: number) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, qty: Math.max(0, Math.round(qty)) } : l)))
  const resetSuggested = () => setLines((prev) => prev.map((l) => ({ ...l, qty: l.suggested })))

  const shownIdx = file.versions.findIndex((v) => v.version === current.version)
  const reconcileBase = shownIdx > 0 ? file.versions[shownIdx - 1] : null

  const total = lineTotal(lines)
  const delta = total - suggestedTotal(lines)
  const catTotal = (c: OrderCategory) => categoryTotal(lines, c)

  const persist = (record: CateringOrder, extra: CateringOrder[] = []) => {
    const others = (data?.orders ?? []).filter(
      (o) => !(o.station === record.station && o.serviceDate === record.serviceDate && o.version === record.version),
    )
    saveOrders.mutate({ orders: [...others, record, ...extra] })
  }

  const saveDraft = () => {
    persist({ ...current, lines: lines.map((l) => ({ ...l })), createdAt: Date.now(), createdBy: userName() })
    message.success(t('catering.orders.savedV', { v: current.version }))
  }
  const send = () => {
    persist({ ...current, status: 'sent', lines: lines.map((l) => ({ ...l })), createdAt: Date.now(), createdBy: userName() })
    message.success(t('catering.orders.sentV', { v: current.version }))
  }
  const newRevision = () => {
    const v = latest!.version + 1
    const rec: CateringOrder = {
      ...latest!,
      id: `${file.fileId}-v${v}`,
      version: v,
      status: 'draft',
      createdAt: Date.now(),
      createdBy: userName(),
      lines: latest!.lines.map((l) => ({ ...l })),
    }
    saveOrders.mutate({ orders: [...(data?.orders ?? []), rec] })
    setSelectedVersion(v)
    message.success(t('catering.orders.revisionCreated', { v }))
  }
  function userName() {
    return session?.user.name ?? 'Catering Ops'
  }

  const lineLabel = (l: CateringOrderLine) =>
    l.category === 'prebook' ? l.name : t(`catering.orders.line.${l.name}`)

  return (
    <div className="thin-scroll h-full overflow-auto p-5">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(paths.catering.orders.list)}
            className="text-text-secondary hover:text-vj-red flex cursor-pointer items-center gap-1.5 text-[12px] font-bold"
          >
            <ChevronLeft size={14} /> {t('catering.orders.title')}
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] font-extrabold">{file.fileId}</h1>
            <OrderStatusBadge status={current.status} />
            <VerTag v={current.version} />
          </div>
          <div className="text-text-secondary mt-1 text-[12.5px] font-semibold">
            {current.station} · {t('catering.orders.serviceDate')}{' '}
            <span className="text-foreground">
              {weekdayOf(t, file.serviceDate)}, {file.serviceDate}
            </span>
          </div>
        </div>
        <Button icon={<Printer size={15} />} onClick={() => window.print()}>
          {t('catering.orders.print')}
        </Button>
      </div>

      {!isLatest ? (
        <div className="bg-muted text-text-secondary mt-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[12.5px] font-semibold">
          <Info size={15} />
          {t('catering.orders.viewingOld', { v: current.version })}
          <button
            onClick={() => setSelectedVersion(latest!.version)}
            className="text-vj-red ml-auto cursor-pointer font-bold"
          >
            {t('catering.orders.gotoLatest', { v: latest!.version })}
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_300px]">
        {/* main */}
        <div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Tile tone="tot" value={total.toLocaleString()} label={t('catering.orders.total')} />
            <Tile
              color="var(--color-vj-red)"
              value={catTotal('prebook').toLocaleString()}
              label={t('catering.orders.prebookN', { n: lines.filter((l) => l.category === 'prebook').length })}
            />
            <Tile color="var(--color-vj-red-dark)" value={catTotal('crew').toLocaleString()} label={t('catering.orders.crewLabel')} />
            <Tile color="var(--color-vj-yellow-dark)" value={catTotal('sales').toLocaleString()} label={t('catering.orders.salesLabel')} />
          </div>

          {/* composition bar */}
          <div className="mt-3.5">
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {(['prebook', 'crew', 'sales'] as OrderCategory[]).map((c) =>
                catTotal(c) > 0 ? (
                  <span key={c} style={{ width: `${(catTotal(c) / (total || 1)) * 100}%`, background: CAT_COLOR[c] }} />
                ) : null,
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <Leg color={CAT_COLOR.prebook} label={t('catering.orders.prebookShort')} n={catTotal('prebook')} />
              <Leg color={CAT_COLOR.crew} label={t('catering.orders.crewShort')} n={catTotal('crew')} />
              <Leg color={CAT_COLOR.sales} label={t('catering.orders.salesShort')} n={catTotal('sales')} />
              <span className="ml-auto text-[12px] font-bold" style={{ color: delta === 0 ? 'var(--color-text-secondary)' : delta > 0 ? 'var(--color-vj-green-dark)' : 'var(--color-vj-red-dark)' }}>
                {t('catering.orders.deltaVsSuggested')} {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>
          </div>

          {/* category sections */}
          {CATS.map(({ key, icon }) => {
            const rows = lines.map((l, i) => ({ l, i })).filter((x) => x.l.category === key)
            if (rows.length === 0) return null
            return (
              <section key={key} className="border-border mt-3.5 overflow-hidden rounded-2xl border">
                <div className="border-border bg-[#FCFDFE] flex items-center gap-2.5 border-b px-3.5 py-2.5">
                  <span className="text-text-secondary flex items-center gap-1.5 text-[11.5px] font-extrabold tracking-wide uppercase">
                    {icon}
                    {t(`catering.orders.cat.${key}`)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-extrabold tnum"
                    style={{ background: 'var(--color-vj-red-50)', color: 'var(--color-vj-red-dark)' }}
                  >
                    {t('catering.orders.portionsN', { n: catTotal(key).toLocaleString() })}
                  </span>
                </div>
                {rows.map(({ l, i }, idx) => (
                  <div key={`${l.category}-${l.name}`} className="border-border flex items-center gap-3 border-b px-3.5 py-2 last:border-b-0">
                    <span className="text-text-muted w-5 text-right text-[11px] font-extrabold tnum">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-bold">{lineLabel(l)}</span>
                        {l.pbmlCodes.slice(0, 3).map((c) => (
                          <span key={c} className="border-border text-vj-red-dark hidden shrink-0 rounded border bg-white px-1.5 text-[10px] font-bold tnum sm:inline">
                            {c}
                          </span>
                        ))}
                      </span>
                    </div>
                    {l.qty !== l.suggested ? (
                      <span
                        className="rounded px-1.5 text-[11px] font-extrabold tnum"
                        style={
                          l.qty > l.suggested
                            ? { background: 'var(--color-vj-green-muted)', color: 'var(--color-vj-green-dark)' }
                            : { background: 'var(--color-vj-red-50)', color: 'var(--color-vj-red-dark)' }
                        }
                      >
                        {l.qty > l.suggested ? `+${l.qty - l.suggested}` : l.qty - l.suggested}
                      </span>
                    ) : null}
                    <span className="text-text-muted shrink-0 text-[11px] font-semibold">
                      {t('catering.orders.suggestedShort', { n: l.suggested.toLocaleString() })}
                    </span>
                    {editable ? (
                      <QtyStepper value={l.qty} onChange={(v) => setQty(i, v)} />
                    ) : (
                      <span className="w-[92px] text-right text-[15px] font-extrabold tnum">{l.qty.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </section>
            )
          })}

          {/* actions */}
          <div className="border-border mt-[18px] flex items-center gap-2.5 border-t pt-4">
            {editable ? (
              <>
                <Button icon={<RotateCcw size={15} />} onClick={resetSuggested}>
                  {t('catering.orders.resetSuggested')}
                </Button>
                <div className="ml-auto flex items-center gap-2.5">
                  <Button icon={<Save size={16} />} loading={saveOrders.isPending} onClick={saveDraft}>
                    {t('catering.orders.saveV', { v: current.version })}
                  </Button>
                  <Button
                    type="primary"
                    icon={<Send size={16} />}
                    loading={saveOrders.isPending}
                    onClick={send}
                    style={{ background: 'var(--color-vj-green-dark)', borderColor: 'var(--color-vj-green-dark)' }}
                  >
                    {t('catering.orders.sendSupplier')}
                  </Button>
                </div>
              </>
            ) : isLatest && current.status === 'sent' ? (
              <div className="ml-auto">
                <Button type="primary" icon={<Plus size={16} />} loading={saveOrders.isPending} onClick={newRevision}>
                  {t('catering.orders.newRevision')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* right rail */}
        <div>
          <div className="border-border rounded-2xl border p-3.5">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="text-text-secondary flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide uppercase">
                <RotateCcw size={13} className="text-vj-red" />
                {t('catering.orders.versionHistory')}
              </span>
              <button
                type="button"
                onClick={() => setReconcileOpen(true)}
                className="text-vj-red hover:text-vj-red-hover ml-auto flex cursor-pointer items-center gap-1 text-[11px] font-bold"
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
                    onClick={() => setSelectedVersion(v.version)}
                    className="relative block w-full cursor-pointer pb-3.5 text-left last:pb-0"
                  >
                    <span
                      className="absolute top-1 left-[-17px] h-3 w-3 rounded-full border-2"
                      style={
                        cur
                          ? { background: 'var(--color-vj-red)', borderColor: 'var(--color-vj-red)', boxShadow: '0 0 0 3px var(--color-vj-red-50)' }
                          : sent
                            ? { background: 'var(--color-vj-green-dark)', borderColor: 'var(--color-vj-green-dark)' }
                            : { background: '#fff', borderColor: 'var(--color-border)' }
                      }
                    />
                    <span className="flex items-center gap-2 text-[12.5px] font-extrabold">
                      v{v.version} · {t(`catering.orders.status.${v.status}`)}
                    </span>
                    <span className="text-text-secondary mt-0.5 block text-[11px] font-semibold tnum">{fmtFull(v.createdAt)}</span>
                    <span className="text-text-muted block text-[11px] font-semibold">{v.createdBy}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-border mt-3.5 rounded-2xl border p-3.5">
            <div className="text-text-secondary mb-3 flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide uppercase">
              <Info size={13} className="text-vj-red" />
              {t('catering.orders.orderInfo')}
            </div>
            <Meta k={t('catering.orders.createdBy')} v={file.versions[0].createdBy} />
            <Meta k={t('catering.orders.createdAt')} v={fmtFull(file.versions[0].createdAt)} />
            <Meta k={t('catering.orders.station')} v={`${current.station}`} />
            <Meta k={t('catering.orders.dishTypes')} v={String(lines.length)} />
          </div>
        </div>
      </div>
      <ReconcileDrawer
        open={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        current={current}
        base={reconcileBase}
      />
    </div>
  )
}

function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="border-border inline-flex h-8 items-center overflow-hidden rounded-lg border bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="text-text-secondary hover:bg-muted grid h-full w-7 cursor-pointer place-items-center"
        aria-label="minus"
      >
        <Minus size={14} />
      </button>
      <input
        value={value}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        className="w-12 border-x-0 text-center text-[13px] font-extrabold tnum outline-none"
        inputMode="numeric"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="text-text-secondary hover:bg-muted grid h-full w-7 cursor-pointer place-items-center"
        aria-label="plus"
      >
        <Plus size={14} />
      </button>
    </span>
  )
}

function Tile({ value, label, color, tone }: { value: string; label: string; color?: string; tone?: 'tot' }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tone === 'tot' ? 'border-[#f5c6c4] bg-white' : 'border-border bg-[#FCFDFE]'}`}>
      <div className="text-[22px] leading-none font-extrabold tnum" style={{ color: tone === 'tot' ? 'var(--color-vj-red-dark)' : color }}>
        {value}
      </div>
      <div className="text-text-secondary mt-1.5 text-[11px] font-bold">{label}</div>
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
