import type { ReactNode } from 'react'
import { FilterBar } from './FilterBar'
import { PageHeader } from './PageHeader'

interface ListPageLayoutProps {
  badge?: string
  title: string
  description?: string
  actions?: ReactNode
  filterBar: ReactNode
  filterBarClassName?: string
  children: ReactNode
  footer?: ReactNode
  modals?: ReactNode
}

/** ui-ux-pro-max list page shell — matches DesignSystemPage header + density 8 layout */
export function ListPageLayout({
  badge = 'Equipment',
  title,
  description,
  actions,
  filterBar,
  filterBarClassName,
  children,
  footer,
  modals,
}: ListPageLayoutProps) {
  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader badge={badge} title={title} description={description} actions={actions} />
        <FilterBar className={filterBarClassName}>{filterBar}</FilterBar>
        <div className="data-table-wrap data-table-wrap--ops">{children}</div>
      </div>
      {footer ? <div className="page-shell__footer">{footer}</div> : null}
      {modals}
    </div>
  )
}
