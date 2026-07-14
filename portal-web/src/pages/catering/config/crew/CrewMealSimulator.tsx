import { Select, Tooltip } from 'antd'
import { ArrowRight, FlaskConical, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SAMPLE_ROTATIONS,
  absMinutesToLabel,
  simulateCrewMeal,
} from '@/modules/catering/crewMeal'
import type { CrewMealProfile } from '@/modules/catering/crewMealTypes'
import { MealWindowTimeline, SLOT_META } from './MealWindowTimeline'

interface Props {
  profile: CrewMealProfile
}

/** Sticky panel: runs a canned rotation through the live profile — BRule-04/26–29. */
export function CrewMealSimulator({ profile }: Props) {
  const { t } = useTranslation()
  const [rotationId, setRotationId] = useState(SAMPLE_ROTATIONS[0].id)

  const rotation = useMemo(
    () => SAMPLE_ROTATIONS.find((r) => r.id === rotationId) ?? SAMPLE_ROTATIONS[0],
    [rotationId],
  )
  const result = useMemo(() => simulateCrewMeal(rotation, profile), [rotation, profile])

  // Distinct slots hit (for the chip row), preserving window order.
  const slotHits = profile.windows
    .filter((w) => result.hits.some((h) => h.windowId === w.id))
    .map((w) => ({ slot: w.slot, count: result.hits.filter((h) => h.windowId === w.id).length }))

  return (
    <div className="border-border bg-surface rounded-xl border shadow-[var(--shadow-soft)]">
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--color-vj-red-50)] text-[color:var(--color-vj-red)]">
          <FlaskConical size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold leading-tight">{t('catering.config.crew.sim.title')}</div>
          <div className="text-text-muted text-[11.5px] leading-tight">{t('catering.config.crew.sim.subtitle')}</div>
        </div>
      </div>

      <div className="space-y-3.5 px-4 py-4">
        <label className="block">
          <span className="text-text-muted mb-1.5 block text-[11px] font-bold tracking-wide uppercase">
            {t('catering.config.crew.sim.rotation')}
          </span>
          <Select
            value={rotationId}
            onChange={setRotationId}
            className="w-full"
            options={SAMPLE_ROTATIONS.map((r) => ({ value: r.id, label: r.label }))}
          />
        </label>

        {/* Legs */}
        <div className="border-border overflow-hidden rounded-lg border">
          {rotation.legs.map((l, i) => (
            <div
              key={l.flightNo}
              className={`flex items-center gap-2 px-3 py-1.5 text-[12px] ${i > 0 ? 'border-border border-t' : ''}`}
            >
              <span className="font-semibold">{l.flightNo}</span>
              <span className="text-text-muted">{l.from}→{l.to}</span>
              <span className="tnum text-text-secondary ml-auto">
                {l.std}
                {l.depDay > 0 ? ` (+${l.depDay})` : ''} – {l.sta}
                {l.arrDay > 0 ? ` (+${l.arrDay})` : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline with duty overlay */}
        <MealWindowTimeline windows={profile.windows} dutySpan={result.dutySpan} />

        {/* Duty span */}
        <div className="text-text-secondary flex items-center gap-1.5 text-[12px]">
          <span className="text-text-muted font-semibold">{t('catering.config.crew.sim.dutySpan')}:</span>
          <span className="tnum font-semibold">{absMinutesToLabel(result.dutySpan.start)}</span>
          <ArrowRight size={12} className="text-text-muted" />
          <span className="tnum font-semibold">{absMinutesToLabel(result.dutySpan.end)}</span>
        </div>

        {/* Windows hit */}
        <div>
          <div className="text-text-muted mb-1.5 text-[11px] font-bold tracking-wide uppercase">
            {t('catering.config.crew.sim.windowsHit')}
          </div>
          {slotHits.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {slotHits.map(({ slot, count }) => {
                const meta = SLOT_META[slot]
                return (
                  <span
                    key={slot}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                    style={{ background: meta.soft, color: meta.color }}
                  >
                    {meta.icon}
                    {t(`catering.config.crew.slot.${slot}`)}
                    {count > 1 ? <span className="tnum">×{count}</span> : null}
                  </span>
                )
              })}
            </div>
          ) : (
            <div className="text-text-muted text-[12px]">{t('catering.config.crew.sim.noWindows')}</div>
          )}
        </div>

        {/* Formula */}
        <div className="border-border rounded-lg border bg-[color:var(--color-vj-red-50)]/40 px-3.5 py-3">
          <div className="flex items-center justify-center gap-2 text-center">
            <div>
              <div className="text-[color:var(--color-vj-red)] tnum text-[20px] font-extrabold leading-none">
                {result.uniquePeople}
              </div>
              <div className="text-text-muted mt-1 text-[10px] font-semibold tracking-wide uppercase">
                {t('catering.config.crew.sim.people')}
              </div>
            </div>
            <span className="text-text-muted pb-3 text-[16px] font-bold">×</span>
            <div>
              <div className="text-[color:var(--color-vj-red)] tnum text-[20px] font-extrabold leading-none">
                {result.windowsHit}
              </div>
              <div className="text-text-muted mt-1 text-[10px] font-semibold tracking-wide uppercase">
                {t('catering.config.crew.sim.windows')}
              </div>
            </div>
            <span className="text-text-muted pb-3 text-[16px] font-bold">=</span>
            <div>
              <div className="tnum text-[26px] font-extrabold leading-none">{result.meals}</div>
              <div className="text-text-muted mt-1 text-[10px] font-semibold tracking-wide uppercase">
                {t('catering.config.crew.sim.meals')}
              </div>
            </div>
          </div>
          {result.countedRows !== result.uniquePeople ? (
            <div className="text-text-muted mt-2 flex items-center justify-center gap-1 text-[11px]">
              <Info size={12} />
              {t('catering.config.crew.sim.dedupeHint', {
                rows: result.countedRows,
                people: result.uniquePeople,
              })}
            </div>
          ) : null}
        </div>

        {rotation.note ? (
          <Tooltip title={rotation.note}>
            <div className="text-text-muted flex items-start gap-1.5 text-[11.5px] leading-snug">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>{rotation.note}</span>
            </div>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}
