import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import { RULE_KINDS } from '@/modules/catering/config'
import type { RuleKind } from '@/modules/catering/configTypes'
import { KIND_ICON, accentForKind } from './ruleMeta'

interface Props {
  open: boolean
  onClose: () => void
  onPick: (kind: RuleKind) => void
}

export function RulePickerModal({ open, onClose, onPick }: Props) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnHidden
      title={t('catering.config.pickerTitle')}
    >
      <p className="text-text-muted mt-0 mb-3 text-[13px]">{t('catering.config.pickerSubtitle')}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RULE_KINDS.map((kind) => {
          const accent = accentForKind(kind)
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onPick(kind)}
              className="border-border hover:border-vj-red group flex cursor-pointer flex-col gap-2 rounded-xl border bg-surface p-3.5 text-left transition-colors"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: accent.bg, color: accent.color }}
                aria-hidden
              >
                {KIND_ICON[kind]}
              </span>
              <span className="text-[14px] font-bold">{t(`catering.config.kind.${kind}.name`)}</span>
              <span className="text-text-muted text-[12px] leading-snug">
                {t(`catering.config.kind.${kind}.desc`)}
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
