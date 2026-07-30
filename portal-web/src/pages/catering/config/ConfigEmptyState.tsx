import { Button } from 'antd'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  message: string
  /** Optional dashed Add CTA when editing. */
  actionLabel?: string
  onAction?: () => void
  /** Extra node below the message (e.g. custom CTA). */
  children?: ReactNode
}

/** Shared empty surface for config lists. */
export function ConfigEmptyState({ message, actionLabel, onAction, children }: Props) {
  return (
    <div className="border-border text-text-muted rounded-xl border border-dashed px-4 py-8 text-center text-[13px]">
      <p className="m-0">{message}</p>
      {actionLabel && onAction ? (
        <Button type="dashed" icon={<Plus size={15} />} onClick={onAction} className="mt-3">
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </div>
  )
}
