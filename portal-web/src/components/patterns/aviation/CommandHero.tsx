import type { ReactNode } from 'react'

interface CommandHeroProps {
  title: string
  subtitle: string
  badge?: string
  map: ReactNode
  gauge: ReactNode
  ticker: ReactNode
}

export function CommandHero({ title, subtitle, badge, map, gauge, ticker }: CommandHeroProps) {
  return (
    <section className="command-hero" aria-label="Station command overview">
      <div className="command-hero__grid-bg" aria-hidden />

      <div className="command-hero__top">
        <div>
          {badge ? <span className="command-hero__badge">{badge}</span> : null}
          <h1 className="command-hero__title font-vja-heading">{title}</h1>
          <p className="command-hero__subtitle">{subtitle}</p>
        </div>
        <div className="command-hero__stripe vj-gradient-bar" aria-hidden />
      </div>

      <div className="command-hero__panels">
        <div className="command-hero__panel command-hero__panel--map">{map}</div>
        <div className="command-hero__panel command-hero__panel--gauge">{gauge}</div>
        <div className="command-hero__panel command-hero__panel--ticker">{ticker}</div>
      </div>
    </section>
  )
}
