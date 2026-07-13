import { Form, Modal, Select } from 'antd'
import { Trans, useTranslation } from 'react-i18next'
import { VENDORS } from '@/modules/equipment/constants'

export interface SendToRepairFormValues {
  vendor: string
}

interface SendToRepairModalProps {
  open: boolean
  unitCount: number
  unitLabel?: string
  onCancel: () => void
  onSubmit: (values: SendToRepairFormValues) => void
}

export function SendToRepairModal({
  open,
  unitCount,
  unitLabel,
  onCancel,
  onSubmit,
}: SendToRepairModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<SendToRepairFormValues>()
  const resolvedUnitLabel = unitLabel ?? t('common.units')

  return (
    <Modal
      open={open}
      title={t('equipment.sendToRepair.title')}
      okText={t('equipment.sendToRepair.confirm')}
      okButtonProps={{ type: 'primary' }}
      cancelText={t('common.cancel')}
      onCancel={() => {
        form.resetFields()
        onCancel()
      }}
      onOk={() => {
        form.validateFields().then((values) => {
          onSubmit(values)
          form.resetFields()
        })
      }}
      destroyOnClose
    >
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        <Trans
          i18nKey="equipment.sendToRepair.body"
          values={{ count: unitCount, unitLabel: resolvedUnitLabel }}
          components={{ strong: <span className="font-semibold text-vj-dark" /> }}
        />
      </p>

      <Form form={form} layout="vertical">
        <Form.Item
          name="vendor"
          label={t('equipment.sendToRepair.vendorLabel')}
          rules={[{ required: true, message: t('equipment.sendToRepair.vendorRequired') }]}
        >
          <Select
            placeholder={t('equipment.sendToRepair.vendorPlaceholder')}
            options={VENDORS.map((vendor) => ({ value: vendor, label: vendor }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
