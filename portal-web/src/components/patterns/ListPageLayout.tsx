import type { ReactNode } from 'react'
import { DataTableShell } from './DataTableShell'
import { FilterBar } from './FilterBar'
import { PageHeader } from './PageHeader'

interface ListPageLayoutProps {
  badge?: string
  title: string
  description?: string
  actions?: ReactNode
  filterBar: ReactNode
  filterBarClassName?: string
  /** Optional KPI strip / content above the design-system data table. */
  lead?: ReactNode
  children: ReactNode
  footer?: ReactNode
  modals?: ReactNode
}

/**
 * Shared list page shell — Design System data table pattern:
 * PageHeader → FilterBar → optional lead → DataTableShell(table) → footer
 */
export function ListPageLayout({
  badge = 'Equipment',
  title,
  description,
  actions,
  filterBar,
  filterBarClassName,
  lead,
  children,
  footer,
  modals,
}: ListPageLayoutProps) {
  return (
    <div className="page-shell page-shell--list">
      <div className="thin-scroll page-shell__body">
        <PageHeader badge={badge} title={title} description={description} actions={actions} />
        <FilterBar className={filterBarClassName}>{filterBar}</FilterBar>
        {lead ? <div className="page-shell__lead">{lead}</div> : null}
        <DataTableShell>{children}</DataTableShell>
      </div>
      {footer ? <div className="page-shell__footer">{footer}</div> : null}
      {modals}
    </div>
  )
}
