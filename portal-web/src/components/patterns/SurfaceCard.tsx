import type { ReactNode } from 'react'

interface SurfaceCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  padding?: 'none' | 'md'
}

export function SurfaceCard({
  title,
  description,
  children,
  className = '',
  padding = 'md',
}: SurfaceCardProps) {
  return (
    <section className={`surface-card ${padding === 'none' ? 'surface-card--flat' : ''} ${className}`}>
      {title ? (
        <header className="surface-card__header">
          <h2 className="surface-card__title">{title}</h2>
          {description ? <p className="surface-card__desc">{description}</p> : null}
        </header>
      ) : null}
      <div className={padding === 'none' ? '' : 'surface-card__body'}>{children}</div>
    </section>
  )
}
