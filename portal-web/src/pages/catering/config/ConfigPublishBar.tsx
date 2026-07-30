import { Button, DatePicker, Space } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

dayjs.extend(customParseFormat)

const DMY = 'DD/MM/YYYY'

function parseDmy(dmy: string): Dayjs | null {
  if (!dmy.trim()) return null
  const d = dayjs(dmy, DMY, true)
  return d.isValid() ? d : null
}

interface Props {
  effDate: string
  onEffDateChange: (dmy: string) => void
  onCancel: () => void
  onPublish: () => void
  publishing?: boolean
  /** Extra disable (e.g. invalid crew window times). */
  publishDisabled?: boolean
}

/** Sticky publish chrome — DatePicker + hint + Cancel / Publish. */
export function ConfigPublishBar({
  effDate,
  onEffDateChange,
  onCancel,
  onPublish,
  publishing = false,
  publishDisabled = false,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="quota-sticky-bar">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div>
          <label className="text-text-muted mb-1 block text-[11.5px] font-bold" htmlFor="config-eff-from">
            {t('catering.config.effectiveFrom')}
          </label>
          <DatePicker
            id="config-eff-from"
            format={DMY}
            value={parseDmy(effDate)}
            onChange={(d) => onEffDateChange(d ? d.format(DMY) : '')}
            style={{ width: 150 }}
          />
        </div>
        <div className="text-text-muted max-w-[34ch] text-[12.5px] font-medium">
          {t('catering.config.publishHint')}
        </div>
        <div className="ml-auto">
          <Space>
            <Button icon={<X size={14} />} onClick={onCancel} disabled={publishing}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              disabled={!effDate.trim() || publishDisabled}
              loading={publishing}
              onClick={onPublish}
            >
              {t('catering.config.publish')}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  )
}
