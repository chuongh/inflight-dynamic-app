import { CircleHelp } from 'lucide-react'
import type { SupplierCell } from '@/modules/catering/supplier/types'

export function CellValue({ cell }: { cell: SupplierCell<number> }) {
  if (cell.value == null) {
    return (
      <span className="planner-cell-value planner-cell-value--unknown">
        <CircleHelp size={13} aria-hidden="true" />
        Chưa có
      </span>
    )
  }
  return (
    <span className="planner-cell-value">
      {cell.value.toLocaleString('vi-VN')}
    </span>
  )
}
