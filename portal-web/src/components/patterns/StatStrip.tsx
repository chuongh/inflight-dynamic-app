import type { ReactNode } from 'react'
import './stat-strip.css'

export type StatStripTone = 'default' | 'accent' | 'success' | 'muted' | 'warning'

export type StatStripItem = {
  label: string
  value: ReactNode
  tone?: StatStripTone
  hint?: string
  /** Soft brand-tinted border — use on the lead metric. */
  featured?: boolean
}

/** Compact metric cards — value-first, minimal chrome (Supplier / Airport overview). */
export function StatStrip({
  items,
  footer,
  className = '',
  columns,
}: {
  items: StatStripItem[]
  footer?: ReactNode
  className?: string
  /** Desktop column count; defaults to item length (2–4). */
  columns?: 2 | 3 | 4
}) {
  const cols = columns ?? (Math.min(4, Math.max(2, items.length)) as 2 | 3 | 4)
  return (
    <section className={`stat-strip ${className}`.trim()} aria-label="Overview">
      <div className={`stat-strip__metrics stat-strip__metrics--${cols}`}>
        {items.map((item) => (
          <article
            key={item.label}
            className={`stat-strip__item${item.featured ? ' stat-strip__item--featured' : ''}`}
          >
            <p
              className={`stat-strip__value${
                item.tone && item.tone !== 'default' ? ` stat-strip__value--${item.tone}` : ''
              }`}
            >
              {item.value}
            </p>
            <p className="stat-strip__label" title={item.label}>
              {item.label}
            </p>
            {item.hint ? <p className="stat-strip__hint">{item.hint}</p> : null}
          </article>
        ))}
      </div>
      {footer ? <div className="stat-strip__footer">{footer}</div> : null}
    </section>
  )
}
