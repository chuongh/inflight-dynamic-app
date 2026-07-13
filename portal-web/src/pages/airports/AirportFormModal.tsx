import { Form, Input, Modal, Select, Switch } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Airport, AirportFormValues } from '@/modules/airports/types'

interface AirportFormModalProps {
  open: boolean
  mode: 'add' | 'edit'
  airport?: Airport | null
  /** IATA codes already in use — for uniqueness validation on add. */
  existingCodes: string[]
  onCancel: () => void
  onSubmit: (values: AirportFormValues) => void
}

const DEFAULTS: AirportFormValues = {
  code: '',
  icao: '',
  name: '',
  city: '',
  country: 'Việt Nam',
  kind: 'domestic',
  hasCatering: false,
  status: 'active',
  note: '',
}

export function AirportFormModal({
  open,
  mode,
  airport,
  existingCodes,
  onCancel,
  onSubmit,
}: AirportFormModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<AirportFormValues>()

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && airport) {
      form.setFieldsValue({ ...DEFAULTS, ...airport })
    } else {
      form.resetFields()
      form.setFieldsValue(DEFAULTS)
    }
  }, [open, mode, airport, form])

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit({ ...values, code: values.code.trim().toUpperCase() })
    })
  }

  const kindOptions = [
    { value: 'domestic', label: t('airports.kind.domestic') },
    { value: 'international', label: t('airports.kind.international') },
  ]
  const statusOptions = [
    { value: 'active', label: t('airports.status.active') },
    { value: 'draft', label: t('airports.status.draft') },
    { value: 'inactive', label: t('airports.status.inactive') },
  ]

  return (
    <Modal
      open={open}
      title={mode === 'add' ? t('airports.form.addTitle') : t('airports.form.editTitle')}
      okText={t('airports.form.save')}
      cancelText={t('common.cancel')}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
      width={620}
    >
      <Form form={form} layout="vertical" requiredMark className="pt-2" initialValues={DEFAULTS}>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="code"
            label={t('airports.form.code')}
            tooltip={t('airports.form.codeHint')}
            rules={[
              { required: true, message: t('airports.form.required') },
              { pattern: /^[A-Za-z]{3}$/, message: t('airports.form.codePattern') },
              {
                validator: (_rule, value) => {
                  if (mode === 'edit') return Promise.resolve()
                  const code = (value ?? '').trim().toUpperCase()
                  return existingCodes.includes(code)
                    ? Promise.reject(new Error(t('airports.form.codeExists')))
                    : Promise.resolve()
                },
              },
            ]}
          >
            <Input
              placeholder="SGN"
              maxLength={3}
              disabled={mode === 'edit'}
              className="uppercase"
            />
          </Form.Item>

          <Form.Item name="icao" label={t('airports.form.icao')}>
            <Input placeholder="VVTS" maxLength={4} className="uppercase" />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('airports.form.name')}
            rules={[{ required: true, message: t('airports.form.required') }]}
            className="sm:col-span-2"
          >
            <Input placeholder={t('airports.form.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="city"
            label={t('airports.form.city')}
            rules={[{ required: true, message: t('airports.form.required') }]}
          >
            <Input placeholder="TP. Hồ Chí Minh" />
          </Form.Item>

          <Form.Item name="country" label={t('airports.form.country')}>
            <Input placeholder="Việt Nam" />
          </Form.Item>

          <Form.Item name="kind" label={t('airports.form.kind')}>
            <Select options={kindOptions} />
          </Form.Item>

          <Form.Item name="status" label={t('airports.form.status')}>
            <Select options={statusOptions} />
          </Form.Item>
        </div>

        <Form.Item
          name="hasCatering"
          valuePropName="checked"
          className="airport-form__catering"
        >
          <CateringField />
        </Form.Item>

        <Form.Item name="note" label={t('airports.form.note')} className="mt-1">
          <Input.TextArea rows={2} placeholder={t('airports.form.notePlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/**
 * Catering switch rendered as a labelled row (controlled by Form.Item's
 * checked/onChange injected props).
 */
function CateringField({
  checked,
  onChange,
}: {
  checked?: boolean
  onChange?: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="airport-toggle-row">
      <Switch checked={checked} onChange={onChange} />
      <div>
        <div className="airport-toggle-row__title">{t('airports.form.catering')}</div>
        <div className="airport-toggle-row__desc">{t('airports.form.cateringHint')}</div>
      </div>
    </div>
  )
}
