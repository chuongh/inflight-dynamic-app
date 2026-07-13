import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, badge, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__main">
        {badge ? <span className="page-header__badge">{badge}</span> : null}
        <h1 className="page-header__title font-vja-heading">{title}</h1>
        {description ? <p className="page-header__desc">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  )
}
