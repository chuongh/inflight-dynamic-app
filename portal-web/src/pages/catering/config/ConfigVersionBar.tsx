import { Popover, Select } from 'antd'
import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { VersionStatus } from '@/modules/catering/types'

const STATUS_DOT: Record<VersionStatus, string> = {
  active: '#16a34a',
  scheduled: '#2563eb',
  superseded: '#9ca3af',
  draft: '#c9a000',
}

export interface ConfigVersionOption {
  id: string
  status: VersionStatus
  effectiveFrom: string
  effectiveTo?: string | null
  updatedBy: string
  updatedAt: string
  note?: string
}

function Dot({ status }: { status: VersionStatus }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: STATUS_DOT[status] }}
      aria-hidden
    />
  )
}

interface Props {
  versions: ConfigVersionOption[]
  value: string
  onChange: (id: string) => void
  /** Optional aria for the version select (e.g. supplier-specific). */
  selectAriaLabel?: string
}

/** Quiet version chrome shared by commercial, grouping, supplier, and crew tabs. */
export function ConfigVersionBar({ versions, value, onChange, selectAriaLabel }: Props) {
  const { t } = useTranslation()
  const viewing = versions.find((v) => v.id === value) ?? versions[0]
  if (!viewing) return null

  const effRange = `${viewing.effectiveFrom} → ${viewing.effectiveTo ?? t('catering.quota.untilNextShort')}`

  const renderVersion = (v: ConfigVersionOption) => (
    <span className="inline-flex items-center gap-2">
      <Dot status={v.status} /> {v.id} · {t(`catering.quota.status.${v.status}`)}
    </span>
  )

  return (
    <div className="config-version-bar">
      <Select
        variant="borderless"
        value={viewing.id}
        onChange={onChange}
        style={{ minWidth: 140 }}
        optionLabelProp="label"
        aria-label={selectAriaLabel}
        options={versions.map((v) => ({ value: v.id, label: renderVersion(v) }))}
      />
      <span className="config-version-bar__sep">·</span>
      <span className="tnum">{effRange}</span>
      <Popover
        placement="bottomLeft"
        trigger="click"
        content={
          <div className="max-w-xs space-y-1 text-[12.5px] leading-relaxed">
            <div>
              {t('catering.config.updatedMeta', {
                by: viewing.updatedBy,
                at: viewing.updatedAt,
              })}
            </div>
            {viewing.note ? <div className="text-text-muted">{viewing.note}</div> : null}
          </div>
        }
      >
        <button
          type="button"
          className="text-text-muted hover:text-foreground hover:bg-background inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg transition-colors"
          aria-label={t('catering.quota.detailsAria')}
        >
          <Info size={14} />
        </button>
      </Popover>
    </div>
  )
}
