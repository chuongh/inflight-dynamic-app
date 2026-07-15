import { ChevronDown, Plane, Users, Utensils } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAirports } from '@/modules/airports/hooks/useAirports'
import { formatDuration, isCateringStation, legDurationMin } from '@/modules/catering/grouping'
import type { CockpitCrewMember, RawFlight } from '@/modules/catering/groupingTypes'
import { cateringStationSet } from '@/modules/catering/stations'

interface Props {
  flights: RawFlight[]
  /** Dims the list while AI grouping runs — the trigger lives in the page header. */
  running: boolean
  /** Hide the built-in "N flights pending grouping" header when a parent supplies one. */
  hideHeader?: boolean
}

export function UngroupedView({ flights, running, hideHeader = false }: Props) {
  const { t } = useTranslation()
  const { data: airports } = useAirports()
  const cateringSet = cateringStationSet(airports ?? [])
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div className="flex flex-col gap-4">
      {/* Pending raw flights — each expands to journey · premeal · cockpit */}
      <div>
        {hideHeader ? null : (
          <div className="text-text-secondary mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wide">
            <Plane size={14} className="text-vj-red" />
            {t('catering.grouping.pendingFlights', { count: flights.length })}
          </div>
        )}
        <div className={`flex flex-col gap-2 ${running ? 'pointer-events-none opacity-50' : ''}`}>
          {flights.map((f, i) => (
            <FlightCard
              key={i}
              flight={f}
              cateringSet={cateringSet}
              open={open.has(i)}
              onToggleOpen={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CardProps {
  flight: RawFlight
  cateringSet: Set<string>
  open: boolean
  onToggleOpen: () => void
}

function FlightCard({ flight: f, cateringSet, open, onToggleOpen }: CardProps) {
  const { t } = useTranslation()
  const cat = isCateringStation(f.arr, cateringSet)
  const dur = formatDuration(legDurationMin(f))
  const premeal = f.premeal ?? 0
  const meals = f.meals ?? []
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
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-extrabold">
            {f.flightNo}
            {f.intl ? <QtBadge /> : null}
          </div>
          <div className="text-text-secondary truncate text-[12px] font-semibold">
            {f.aircraft} · {f.aircraftType}
          </div>
          {f.purser ? (
            <div className="text-text-secondary mt-0.5 truncate text-[11.5px] font-semibold" title={f.purser}>
              {t('catering.grouping.purser')} · <span className="text-foreground">{f.purser}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[14px] font-extrabold">
          <span className="text-vj-red-dark inline-flex items-center gap-1">
            <Utensils size={12} />
            {f.dep}
          </span>
          <span className="text-text-muted font-normal">→</span>
          <span className={cat ? '' : 'text-text-muted'}>{f.arr}</span>
          <span className="text-text-secondary text-[11px] font-bold tnum">
            {f.std}
            <Nd on={f.stdNextDay} />–{f.sta}
            <Nd on={f.staNextDay} />
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

      {/* Expanded detail — compact, read-only */}
      {open ? (
        <div className="border-border border-t bg-[#FCFDFE] px-4 pb-3.5 pt-3">
          {/* Slim journey strip: DEP · flight · ARR */}
          <div className="border-border flex items-center gap-2 overflow-x-auto rounded-lg border bg-white px-4 py-2">
            <div className="flex shrink-0 flex-col items-center">
              <span className="text-[16px] font-extrabold leading-none tracking-tight">{f.dep}</span>
              <span className="text-text-secondary mt-1 text-[11px] font-bold tnum">
                {f.std}
                <Nd on={f.stdNextDay} />
              </span>
            </div>
            <div className="flex min-w-[96px] flex-1 flex-col items-center gap-1 px-2">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold">
                {f.flightNo}
                {f.intl ? <QtBadge /> : null}
              </span>
              <div className="fg-conn-line bg-border relative h-[2px] w-full rounded-full" />
              <span className="text-text-muted text-[10px] font-bold">
                {dur} {t('catering.grouping.flightShort')}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-center">
              <span className="text-[16px] font-extrabold leading-none tracking-tight">{f.arr}</span>
              <span className="text-text-secondary mt-1 text-[11px] font-bold tnum">
                {f.sta}
                <Nd on={f.staNextDay} />
              </span>
            </div>
          </div>

          {/* Pre-book dishes | cockpit crew */}
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-[1.4fr_1fr]">
            <section className="border-border rounded-xl border bg-white p-3">
              <SectionHead
                icon={<Utensils size={14} className="text-vj-red" />}
                title={t('catering.grouping.prebookTitle')}
                sub={t('catering.grouping.premealN', { count: premeal })}
              />
              {meals.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {meals.map((m) => (
                    <span
                      key={m.name}
                      className="border-border inline-flex items-center gap-1.5 rounded-lg border bg-[#FCFDFE] px-2 py-1 text-[12px] font-semibold"
                    >
                      {m.name}
                      <span className="bg-vj-red-50 text-vj-red-dark rounded px-1.5 text-[11px] font-extrabold tnum">
                        {m.count}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-vj-red-dark flex items-baseline gap-1.5 leading-none">
                  <b className="text-[26px] font-extrabold tracking-tight tnum">{premeal}</b>
                  <span className="text-text-secondary text-[12px] font-bold">{t('catering.grouping.premealUnit')}</span>
                </div>
              )}
            </section>

            <section className="border-border rounded-xl border bg-white p-3">
              <SectionHead
                icon={<Users size={14} className="text-vj-red" />}
                title={t('catering.grouping.cockpitTitle')}
                sub="cockpit"
              />
              {crew.length ? (
                <div className="flex flex-col gap-1.5">
                  {crew.map((m) => (
                    <CrewChip key={m.code} member={m} ridingLabel={t('catering.grouping.crewRiding')} />
                  ))}
                </div>
              ) : (
                <span className="text-text-muted text-[13px] font-semibold">—</span>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </article>
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

/** Next-day (+1) superscript for an overnight departure/arrival time. */
function Nd({ on }: { on?: boolean }) {
  return on ? <sup className="text-vj-red font-extrabold">+1</sup> : null
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
    <div className="mb-2 flex items-center gap-2">
      <span className="text-text-secondary flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wide">
        {icon}
        {title}
      </span>
      {sub ? <span className="text-text-muted ml-auto text-[11px] font-semibold normal-case">{sub}</span> : null}
    </div>
  )
}
