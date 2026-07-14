import { Button, Checkbox, Drawer, Input, InputNumber, Segmented, Select, Space, Switch } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ALL_STATUSES } from '@/modules/catering/config'
import type { FlightScope, FlightStatus, Rule } from '@/modules/catering/configTypes'
import { TIME_RE } from '@/modules/catering/constants'
import { KIND_ICON, accentForKind } from './ruleMeta'

interface Props {
  open: boolean
  rule: Rule | null
  onClose: () => void
  onSave: (rule: Rule) => void
}

const SCOPES: FlightScope[] = ['DOM', 'INT', 'ALL']

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold">{label}</span>
      {children}
      {hint ? <span className="text-text-muted mt-1 block text-[11.5px]">{hint}</span> : null}
    </label>
  )
}

export function RuleEditorDrawer({ open, rule, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Rule | null>(rule)

  useEffect(() => {
    setDraft(rule)
  }, [rule])

  if (!draft) return null

  const accent = accentForKind(draft.kind)
  const patch = (partial: Partial<Rule>) =>
    setDraft((d) => (d ? ({ ...d, ...partial } as Rule) : d))

  const timeInvalid = draft.kind === 'time_exclusion' && !TIME_RE.test(draft.fromTime)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={420}
      destroyOnHidden
      title={
        <span className="inline-flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: accent.bg, color: accent.color }}
            aria-hidden
          >
            {KIND_ICON[draft.kind]}
          </span>
          {t(`catering.config.kind.${draft.kind}.name`)}
        </span>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" disabled={timeInvalid} onClick={() => onSave(draft)}>
            {t('catering.config.form.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-text-muted mt-0 text-[12.5px] leading-relaxed">
          {t(`catering.config.kind.${draft.kind}.desc`)}
        </p>

        {draft.kind === 'threshold_reduction' ? (
          <>
            <Field label={t('catering.config.form.metric')}>
              <Select
                value={draft.metric}
                onChange={(v) => patch({ metric: v })}
                className="w-full"
                options={[{ value: 'prebook', label: t('catering.config.metric.prebook') }]}
              />
            </Field>
            <Field label={t('catering.config.form.threshold')}>
              <InputNumber
                min={0}
                value={draft.threshold}
                onChange={(v) => patch({ threshold: Number(v ?? 0) })}
                className="w-full"
                addonBefore="≥"
              />
            </Field>
            <Field label={t('catering.config.form.reduceTo')}>
              <InputNumber
                min={0}
                max={100}
                value={draft.reducePct}
                onChange={(v) => patch({ reducePct: Number(v ?? 0) })}
                className="w-full"
                addonAfter="%"
              />
            </Field>
          </>
        ) : null}

        {draft.kind === 'time_exclusion' ? (
          <>
            <Field label={t('catering.config.form.scope')}>
              <Segmented<FlightScope>
                block
                value={draft.scope}
                onChange={(v) => patch({ scope: v })}
                options={SCOPES.map((s) => ({ value: s, label: t(`catering.config.scope.${s}`) }))}
              />
            </Field>
            <Field label={t('catering.config.form.fromTime')} hint={t('catering.config.form.timeHint')}>
              <Input
                value={draft.fromTime}
                status={timeInvalid ? 'error' : undefined}
                onChange={(e) => patch({ fromTime: e.target.value })}
                placeholder="21:00"
                style={{ width: 140 }}
              />
              {timeInvalid ? (
                <span className="mt-1 block text-[11.5px] font-semibold text-[color:var(--color-vj-red-dark)]">
                  {t('catering.config.form.invalidTime')}
                </span>
              ) : null}
            </Field>
          </>
        ) : null}

        {draft.kind === 'status_exclusion' ? (
          <Field label={t('catering.config.form.statuses')}>
            <Checkbox.Group
              value={draft.statuses}
              onChange={(v) => patch({ statuses: v as FlightStatus[] })}
            >
              <Space direction="vertical" size={8}>
                {ALL_STATUSES.map((s) => (
                  <Checkbox key={s} value={s}>
                    {t(`catering.config.status.${s}`)}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Field>
        ) : null}

        {draft.kind === 'scope_note' ? (
          <Field label={t('catering.config.form.noteText')}>
            <Input.TextArea
              value={draft.text}
              onChange={(e) => patch({ text: e.target.value })}
              placeholder={t('catering.config.form.notePlaceholder')}
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Field>
        ) : null}

        {draft.kind === 'group_by_purser' ? (
          <div className="border-border bg-background text-text-muted rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed">
            {t('catering.config.form.purserNote')}
          </div>
        ) : null}

        {draft.kind === 'group_by_flight_hour' ? (
          <>
            <Field label={t('catering.config.form.maxHours')} hint={t('catering.config.form.maxHoursHint')}>
              <InputNumber
                min={1}
                max={24}
                value={draft.maxHours}
                onChange={(v) => patch({ maxHours: Number(v ?? 1) })}
                className="w-full"
                addonAfter={t('catering.config.form.hoursUnit')}
              />
            </Field>
            <div className="border-border bg-background text-text-muted rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed">
              {t('catering.config.form.cateringStartNote')}
            </div>
          </>
        ) : null}

        <div className="border-border flex items-center justify-between border-t pt-4">
          <span className="text-[12.5px] font-bold">
            {draft.enabled ? t('catering.config.enabled') : t('catering.config.disabled')}
          </span>
          <Switch checked={draft.enabled} onChange={(v) => patch({ enabled: v })} />
        </div>
      </div>
    </Drawer>
  )
}
