import { Button, Input, InputNumber } from 'antd'
import { ChevronDown, Info, Pencil, Plane, Save, Sparkles, Users, Utensils } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDuration, isCateringStation, legDurationMin } from '@/modules/catering/grouping'
import type { CockpitCrewMember, RawFlight } from '@/modules/catering/groupingTypes'

interface Props {
  station: string
  flights: RawFlight[]
  running: boolean
  onRun: () => void
  /** Persist an edit to a raw flight (leg times/route/premeal) by list index. */
  onEditFlight: (index: number, patch: Partial<RawFlight>) => void
}

export function UngroupedView({ station, flights, running, onRun, onEditFlight }: Props) {
  const { t } = useTranslation()
  const aircraftCount = new Set(flights.map((f) => f.aircraft)).size
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<Set<number>>(new Set())

  const toggle = (set: Set<number>, i: number) => {
    const next = new Set(set)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    return next
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Empty-state hero */}
      <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-xl border px-6 py-9 text-center">
        <span className="bg-vj-red-50 text-vj-red grid h-16 w-16 place-items-center rounded-2xl">
          <Sparkles size={30} />
        </span>
        <h2 className="text-[19px] font-extrabold">{t('catering.grouping.ungroupedTitle')}</h2>
        <p className="text-text-secondary max-w-md text-[13.5px] font-semibold">
          {t('catering.grouping.ungroupedDesc', { count: flights.length, aircraft: aircraftCount, station })}
        </p>
        <Button
          type="primary"
          size="large"
          loading={running}
          icon={running ? undefined : <Sparkles size={17} />}
          onClick={onRun}
          className="mt-1"
        >
          {running ? t('catering.grouping.grouping') : t('catering.grouping.runGrouping')}
        </Button>
      </div>

      {/* Pending raw flights — each expands to journey · premeal · cockpit */}
      <div>
        <div className="text-text-secondary mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wide">
          <Plane size={14} className="text-vj-red" />
          {t('catering.grouping.pendingFlights', { count: flights.length })}
        </div>
        <div className={`flex flex-col gap-2 ${running ? 'pointer-events-none opacity-50' : ''}`}>
          {flights.map((f, i) => (
            <FlightCard
              key={i}
              flight={f}
              open={open.has(i)}
              editing={editing.has(i)}
              onToggleOpen={() => setOpen((prev) => toggle(prev, i))}
              onToggleEdit={() => {
                setEditing((prev) => toggle(prev, i))
                setOpen((prev) => new Set(prev).add(i))
              }}
              onEdit={(patch) => onEditFlight(i, patch)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CardProps {
  flight: RawFlight
  open: boolean
  editing: boolean
  onToggleOpen: () => void
  onToggleEdit: () => void
  onEdit: (patch: Partial<RawFlight>) => void
}

function FlightCard({ flight: f, open, editing, onToggleOpen, onToggleEdit, onEdit }: CardProps) {
  const { t } = useTranslation()
  const cat = isCateringStation(f.arr)
  const dur = formatDuration(legDurationMin(f))
  const premeal = f.premeal ?? 0
  const crew = f.cockpitCrew ?? []

  return (
    <article
      className={`border-border bg-surface overflow-hidden rounded-xl border transition-shadow ${open ? 'shadow-sm' : ''}`}
    >
      {/* Collapsed row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleOpen()
          }
        }}
        className="grid cursor-pointer select-none grid-cols-[56px_minmax(130px,180px)_1fr_auto_auto] items-center gap-4 px-4 py-3 hover:bg-[#FCFDFE]"
      >
        <div
          className={`flex h-[46px] w-[56px] flex-col items-center justify-center rounded-lg ${open ? 'bg-vj-red-50' : 'bg-muted'}`}
        >
          <b className={`text-[14px] font-extrabold tnum ${open ? 'text-vj-red-dark' : ''}`}>{f.std}</b>
          <small className="text-text-muted mt-0.5 text-[8.5px] font-extrabold uppercase tracking-wide">STD</small>
        </div>
        <div>
          <div className="flex items-center gap-2 text-[15px] font-extrabold">
            {f.flightNo}
            {f.intl ? <QtBadge /> : null}
          </div>
          <div className="text-text-secondary text-[12px] font-semibold">
            {f.aircraft} · {f.aircraftType}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[14px] font-extrabold">
          <span className="text-vj-red-dark inline-flex items-center gap-1">
            <Utensils size={12} />
            {f.dep}
          </span>
          <span className="text-text-muted font-normal">→</span>
          <span className={cat ? '' : 'text-text-muted'}>{f.arr}</span>
          <span className="text-text-secondary text-[11px] font-bold tnum">
            {f.std}–{f.sta}
          </span>
          <span className="text-text-muted text-[11px] font-bold">· {dur}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-extrabold ${
            premeal > 0
              ? 'bg-vj-red-50 text-vj-red-dark border-[#F5C6C4]'
              : 'bg-muted text-text-muted border-border'
          }`}
        >
          <Utensils size={13} />
          {t('catering.grouping.premealPrebook', { count: premeal })}
        </span>
        <span
          aria-label={t('catering.grouping.toggleDetail')}
          className={`text-text-muted grid h-9 w-[30px] place-items-center transition-transform ${open ? 'text-foreground rotate-180' : ''}`}
        >
          <ChevronDown size={19} />
        </span>
      </div>

      {/* Expanded detail */}
      {open ? (
        <div className="border-border border-t bg-[#FCFDFE] px-5 pb-5 pt-4">
          <FlightJourney flight={f} editing={editing} onEdit={onEdit} />

          {editing ? (
            <div className="bg-vj-red-50 text-vj-red-dark mt-3 flex items-center gap-2 rounded-lg border border-[#F5C6C4] px-2.5 py-2 text-[11.5px] font-semibold">
              <Info size={14} className="shrink-0" />
              {t('catering.grouping.editHint')}
            </div>
          ) : null}

          <div className="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Pre-book (premeal) */}
            <section className="border-border rounded-xl border bg-white p-3.5">
              <SectionHead
                icon={<Utensils size={14} className="text-vj-red" />}
                title={t('catering.grouping.prebookTitle')}
                sub="premeal"
              />
              <div className="flex items-center gap-3.5">
                {editing ? (
                  <InputNumber
                    size="large"
                    min={0}
                    defaultValue={premeal}
                    onChange={(v) => onEdit({ premeal: typeof v === 'number' ? v : 0 })}
                    style={{ width: 96 }}
                    aria-label={t('catering.grouping.prebookTitle')}
                  />
                ) : (
                  <div className="text-vj-red-dark flex items-baseline gap-1.5 leading-none">
                    <b className="text-[34px] font-extrabold tracking-tight tnum">{premeal}</b>
                    <span className="text-text-secondary text-[13px] font-bold">{t('catering.grouping.premealUnit')}</span>
                  </div>
                )}
                <div className="text-text-secondary text-[11.5px] font-semibold">
                  {t('catering.grouping.premealCaption')}
                </div>
              </div>
              <div className="text-text-secondary mt-3 flex items-start gap-2 text-[11.5px] font-semibold">
                <Info size={14} className="text-text-muted mt-px shrink-0" />
                {t('catering.grouping.premealPendingNote')}
              </div>
            </section>

            {/* Cockpit crew */}
            <section className="border-border rounded-xl border bg-white p-3.5">
              <SectionHead
                icon={<Users size={14} className="text-vj-red" />}
                title={t('catering.grouping.cockpitTitle')}
                sub="cockpit"
              />
              {crew.length ? (
                <div className="flex flex-col gap-2">
                  {crew.map((m) => (
                    <CrewChip key={m.code} member={m} ridingLabel={t('catering.grouping.crewRiding')} />
                  ))}
                </div>
              ) : (
                <span className="text-text-muted text-[13px] font-semibold">—</span>
              )}
            </section>
          </div>

          {/* Actions */}
          <div className="border-border mt-4 flex items-center gap-2.5 border-t border-dashed pt-3.5">
            <div className="text-text-secondary flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold">
              {t('catering.grouping.aircraft')} <b className="text-foreground font-bold">{f.aircraft} · {f.aircraftType}</b>
              <span className="bg-text-muted h-[3px] w-[3px] rounded-full" />
              {t('catering.grouping.notAssignedGroup')}
            </div>
            <div className="ml-auto">
              <Button
                size="small"
                type={editing ? 'primary' : 'default'}
                icon={editing ? <Save size={15} /> : <Pencil size={15} />}
                onClick={onToggleEdit}
              >
                {editing ? t('catering.grouping.doneEditing') : t('catering.grouping.editItinerary')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

/** Single-leg journey: DEP → flightNo → ARR. Editable in edit mode. */
function FlightJourney({
  flight: f,
  editing,
  onEdit,
}: {
  flight: RawFlight
  editing: boolean
  onEdit: (patch: Partial<RawFlight>) => void
}) {
  const { t } = useTranslation()
  const dur = formatDuration(legDurationMin(f))
  return (
    <div
      className={`flex items-center overflow-x-auto rounded-lg border bg-white px-5 py-4 ${
        editing ? 'border-dashed border-[#D6DCE5]' : 'border-border'
      }`}
    >
      <JourneyNode
        code={f.dep}
        time={f.std}
        label={t('catering.grouping.departs')}
        editing={editing}
        onCode={(v) => onEdit({ dep: v })}
        onTime={(v) => onEdit({ std: v })}
      />
      <div className="flex min-w-[130px] flex-1 flex-col items-center gap-1.5 px-4">
        {editing ? (
          <Input
            size="small"
            defaultValue={f.flightNo}
            onBlur={(e) => onEdit({ flightNo: e.target.value.trim().toUpperCase() })}
            style={{ width: 104, textAlign: 'center', fontWeight: 800 }}
            aria-label="flightNo"
          />
        ) : (
          <span className="flex items-center gap-1.5 text-[12px] font-extrabold">
            {f.flightNo}
            {f.intl ? <QtBadge /> : null}
          </span>
        )}
        <div className="fg-conn-line bg-border relative h-[2px] w-full rounded-full" />
        <span className="text-text-muted text-[10.5px] font-bold">
          {dur} {t('catering.grouping.flightShort')}
        </span>
      </div>
      <JourneyNode
        code={f.arr}
        time={f.sta}
        label={t('catering.grouping.arrives')}
        editing={editing}
        onCode={(v) => onEdit({ arr: v })}
        onTime={(v) => onEdit({ sta: v })}
      />
    </div>
  )
}

function JourneyNode({
  code,
  time,
  label,
  editing,
  onCode,
  onTime,
}: {
  code: string
  time: string
  label: string
  editing: boolean
  onCode: (v: string) => void
  onTime: (v: string) => void
}) {
  return (
    <div className="flex min-w-[74px] shrink-0 flex-col items-center gap-1">
      {editing ? (
        <>
          <Input
            size="small"
            maxLength={4}
            defaultValue={code}
            onBlur={(e) => onCode(e.target.value.trim().toUpperCase())}
            className="uppercase"
            style={{ width: 70, textAlign: 'center', fontWeight: 800 }}
            aria-label={`${label} station`}
          />
          <Input
            size="small"
            defaultValue={time}
            onBlur={(e) => onTime(e.target.value.trim())}
            style={{ width: 84, textAlign: 'center' }}
            aria-label={`${label} time`}
          />
        </>
      ) : (
        <>
          <span className="text-[20px] font-extrabold tracking-tight">{code}</span>
          <span className="text-text-secondary text-[12.5px] font-bold tnum">{time}</span>
        </>
      )}
      <span className="text-text-muted text-[9.5px] font-extrabold uppercase tracking-wide">{label}</span>
    </div>
  )
}

function QtBadge() {
  return (
    <span
      className="rounded px-1 text-[8px] font-extrabold"
      style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
    >
      QT
    </span>
  )
}

/** One named cockpit crew member — role badge + name + employee code. */
function CrewChip({ member, ridingLabel }: { member: CockpitCrewMember; ridingLabel: string }) {
  const isCaptain = member.role.startsWith('CP')
  const badgeCls = member.riding
    ? 'bg-muted text-text-secondary'
    : isCaptain
      ? 'bg-vj-red text-white'
      : 'bg-vj-red-50 text-vj-red-dark'
  return (
    <div
      className={`flex items-center gap-2 rounded-md border bg-[#FCFDFE] px-2.5 py-1.5 ${
        member.riding ? 'border-border border-dashed opacity-90' : 'border-border'
      }`}
    >
      <span
        className={`inline-flex min-w-[42px] shrink-0 justify-center rounded px-1.5 py-0.5 text-[10.5px] font-extrabold tracking-wide ${badgeCls}`}
      >
        {member.role}
      </span>
      <span className="flex-1 truncate text-[12.5px] font-extrabold" title={member.name}>
        {member.name}
      </span>
      {member.riding ? (
        <span className="bg-muted text-text-muted shrink-0 rounded px-1.5 text-[10px] font-bold">{ridingLabel}</span>
      ) : null}
      <span className="text-text-muted shrink-0 text-[11px] font-bold tnum">{member.code}</span>
    </div>
  )
}

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-text-secondary flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wide">
        {icon}
        {title}
      </span>
      {sub ? <span className="text-text-muted ml-auto text-[11px] font-semibold normal-case">{sub}</span> : null}
    </div>
  )
}
