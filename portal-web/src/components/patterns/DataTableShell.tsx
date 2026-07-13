import type { ReactNode } from 'react'

interface DataTableShellProps {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function DataTableShell({ children, footer, className = '' }: DataTableShellProps) {
  return (
    <>
      <div className={`data-table-wrap ${className}`}>{children}</div>
      {footer ? <div className="page-shell__footer">{footer}</div> : null}
    </>
  )
}
