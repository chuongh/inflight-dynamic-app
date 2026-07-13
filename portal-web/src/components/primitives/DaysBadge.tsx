import { vjTokens } from '../../design-system/tokens'

interface DaysBadgeProps {
  days: number
  className?: string
}

function resolveSla(days: number) {
  if (days >= 14) return vjTokens.color.sla.critical
  if (days >= 7) return vjTokens.color.sla.warning
  return vjTokens.color.sla.normal
}

export function DaysBadge({ days, className = '' }: DaysBadgeProps) {
  const token = resolveSla(days)

  return (
    <span
      className={`tnum inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${className}`}
      style={{
        background: token.bg,
        color: token.text,
        borderColor: token.border,
      }}
    >
      {days}d
    </span>
  )
}
