/**
 * Shared UI atoms for the UC-09 IAM admin screens (Users / Roles / Matrix).
 * Colours come only from VJA tokens (VJ-DS-GLOBAL-001) — no raw hex.
 */
import type { ReactNode } from 'react'
import type { ModuleCode, Platform, Wave } from '@/core/permissions'

export const MODULE_LABELS: Record<ModuleCode, string> = {
  M1: 'M1 · Identity & Admin',
  M2: 'M2 · Boarding & Passenger',
  M3: 'M3 · Ops Ride & Map',
  M4: 'M4 · Catering, Sales & Supply',
  M5: 'M5 · Equipment',
}

const PILL_BASE =
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap'

export function Pill({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <span className={`${PILL_BASE} ${className}`}>{children}</span>
}

/** MVP (green) vs Wave sau (yellow). */
export function WaveBadge({ wave }: { wave: Wave }) {
  if (wave === 'later') {
    return (
      <Pill className="border-vj-yellow-border bg-vj-yellow-muted text-vj-yellow-dark">
        Wave sau
      </Pill>
    )
  }
  return (
    <Pill className="border-vj-green-muted bg-vj-green-muted text-vj-green-dark">MVP</Pill>
  )
}

const PLATFORM_LABEL: Record<Platform, string> = {
  web: 'Web',
  mobile: 'Mobile',
  both: 'Web + Mobile',
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <Pill className="border-[color:var(--color-border)] bg-[var(--color-muted)] text-[color:var(--color-text-secondary)]">
      {PLATFORM_LABEL[platform]}
    </Pill>
  )
}

/** Employee / permission code, tabular mono. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <span className="tnum font-mono text-[12px] font-semibold text-vj-red-dark">{children}</span>
  )
}

/** Small round grant marker for the permission matrix. */
export function GrantDot() {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full bg-vj-red align-middle"
      aria-label="granted"
    />
  )
}

/** Role chip: red dot + role name on a muted surface. */
export function RoleTag({ label, external }: { label: string; external?: boolean }) {
  return (
    <Pill className="border-[color:var(--color-border)] bg-[var(--color-muted)] text-vj-dark">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-vj-red" />
      {label}
      {external ? <span className="text-[10px] font-medium text-vj-yellow-dark">· ext</span> : null}
    </Pill>
  )
}
