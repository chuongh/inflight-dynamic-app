import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand'
  className?: string
}

const toneClass = {
  default: 'kpi-card--default',
  success: 'kpi-card--success',
  warning: 'kpi-card--warning',
  danger: 'kpi-card--danger',
  brand: 'kpi-card--brand',
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'default', className = '' }: KpiCardProps) {
  return (
    <article className={`kpi-card ${toneClass[tone]} ${className}`.trim()} aria-label={label}>
      <span className="kpi-card__stripe" aria-hidden />
      <span className="kpi-card__glow" aria-hidden />

      <div className="kpi-card__header">
        {Icon ? (
          <span className="kpi-card__icon">
            <Icon size={17} strokeWidth={2.25} aria-hidden />
          </span>
        ) : null}
        <p className="kpi-card__label">{label}</p>
      </div>

      <p className="kpi-card__value tnum">{value}</p>

      {hint ? (
        <p className="kpi-card__hint">
          <span className="kpi-card__hint-dot" aria-hidden />
          {hint}
        </p>
      ) : null}
    </article>
  )
}
