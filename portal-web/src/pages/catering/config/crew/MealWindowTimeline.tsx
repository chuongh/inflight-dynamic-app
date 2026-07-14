import { Moon, Sun, Sunrise, Sunset } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MealWindow } from '@/modules/catering/crewMealTypes'
import { hhmmToMinutes, windowCrossesMidnight } from '@/modules/catering/crewMeal'

/** Brand-token accent + icon per meal slot. */
export const SLOT_META: Record<
  MealWindow['slot'],
  { color: string; soft: string; icon: ReactNode }
> = {
  morning: { color: 'var(--color-vj-yellow-dark)', soft: 'var(--color-vj-yellow-muted)', icon: <Sunrise size={15} strokeWidth={2} /> },
  noon: { color: 'var(--color-vj-red)', soft: 'var(--color-vj-red-50)', icon: <Sun size={15} strokeWidth={2} /> },
  evening: { color: 'var(--color-vj-red-dark)', soft: 'var(--color-vj-red-50)', icon: <Sunset size={15} strokeWidth={2} /> },
  night: { color: 'var(--color-vj-dark)', soft: '#eceef2', icon: <Moon size={15} strokeWidth={2} /> },
}

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

interface Block {
  windowId: string
  slot: MealWindow['slot']
  leftPct: number
  widthPct: number
}

/** Split each window into 1–2 positioned blocks (a wrapping window yields two). */
function blocksFor(windows: MealWindow[]): Block[] {
  const out: Block[] = []
  for (const w of windows) {
    const start = hhmmToMinutes(w.start)
    const end = hhmmToMinutes(w.end)
    if (windowCrossesMidnight(w)) {
      out.push({ windowId: w.id, slot: w.slot, leftPct: (start / 1440) * 100, widthPct: ((1440 - start) / 1440) * 100 })
      if (end > 0) out.push({ windowId: `${w.id}-wrap`, slot: w.slot, leftPct: 0, widthPct: (end / 1440) * 100 })
    } else {
      out.push({ windowId: w.id, slot: w.slot, leftPct: (start / 1440) * 100, widthPct: ((end - start) / 1440) * 100 })
    }
  }
  return out
}

interface Props {
  windows: MealWindow[]
  /** Optional duty span overlay (absolute minutes from base-day midnight), clipped to 0–24h. */
  dutySpan?: { start: number; end: number }
}

/** A 24-hour band that renders the four meal windows (and, optionally, a duty span). */
export function MealWindowTimeline({ windows, dutySpan }: Props) {
  const blocks = blocksFor(windows)

  // Duty overlay clamped into the base 24h for a legible marker.
  const duty =
    dutySpan != null
      ? {
          leftPct: (Math.max(0, Math.min(1440, dutySpan.start)) / 1440) * 100,
          widthPct:
            ((Math.max(0, Math.min(1440, dutySpan.end)) -
              Math.max(0, Math.min(1440, dutySpan.start))) /
              1440) *
            100,
        }
      : null

  return (
    <div className="select-none">
      <div className="border-border bg-background relative h-11 overflow-hidden rounded-lg border">
        {/* Hour gridlines */}
        {HOUR_TICKS.slice(1, -1).map((h) => (
          <span
            key={h}
            className="absolute top-0 bottom-0 w-px bg-[color:var(--color-border)]"
            style={{ left: `${(h / 24) * 100}%` }}
            aria-hidden
          />
        ))}

        {/* Meal-window blocks */}
        {blocks.map((b) => {
          const meta = SLOT_META[b.slot]
          return (
            <span
              key={b.windowId}
              className="absolute top-1 bottom-1 rounded-md"
              style={{
                left: `${b.leftPct}%`,
                width: `${b.widthPct}%`,
                background: meta.soft,
                boxShadow: `inset 0 0 0 1.5px ${meta.color}`,
              }}
              aria-hidden
            >
              <span className="absolute inset-0 flex items-center justify-center" style={{ color: meta.color }}>
                {b.widthPct > 6 ? meta.icon : null}
              </span>
            </span>
          )
        })}

        {/* Duty span overlay */}
        {duty && duty.widthPct > 0 ? (
          <span
            className="pointer-events-none absolute top-0 bottom-0 border-x-2 border-dashed border-[color:var(--color-vj-red)] bg-[color:var(--color-vj-red)]/8"
            style={{ left: `${duty.leftPct}%`, width: `${duty.widthPct}%` }}
            aria-hidden
          />
        ) : null}
      </div>

      {/* Hour axis */}
      <div className="text-text-muted relative mt-1 h-4 text-[10px] tnum">
        {HOUR_TICKS.map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {String(h).padStart(2, '0')}
          </span>
        ))}
      </div>
    </div>
  )
}
