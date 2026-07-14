import { Form, Input, Modal } from 'antd'
import { Trans, useTranslation } from 'react-i18next'
import { formatEquipmentCodes } from '@/modules/equipment/repairRequest'
import type { CompleteRepairRequestInput, RepairRequest } from '@/modules/equipment/types'

const { TextArea } = Input

interface CompleteRepairModalProps {
  open: boolean
  request: RepairRequest | null
  onClose: () => void
  onSubmit: (input: CompleteRepairRequestInput) => void
}

export function CompleteRepairModal({ open, request, onClose, onSubmit }: CompleteRepairModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<CompleteRepairRequestInput>()

  return (
    <Modal
      open={open}
      title={t('equipment.workshop.completeModal.title')}
      okText={t('equipment.workshop.completeModal.confirm')}
      okButtonProps={{ type: 'primary' }}
      cancelText={t('common.cancel')}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      onOk={() => {
        form.validateFields().then((values) => {
          onSubmit(values)
          form.resetFields()
        })
      }}
      destroyOnClose
    >
      {request ? (
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          <Trans
            i18nKey="equipment.workshop.completeModal.body"
            values={{ codes: formatEquipmentCodes(request.equipmentCodes), vendor: request.vendor }}
            components={{ strong: <span className="font-semibold text-vj-dark" /> }}
          />
        </p>
      ) : null}

      <Form form={form} layout="vertical">
        <Form.Item
          name="repairContent"
          label={t('equipment.workshop.completeModal.repairContentLabel')}
          rules={[{ required: true, message: t('equipment.workshop.completeModal.repairContentRequired') }]}
        >
          <TextArea
            rows={3}
            placeholder={t('equipment.workshop.completeModal.repairContentPlaceholder')}
          />
        </Form.Item>
        <Form.Item
          name="rootCause"
          label={t('equipment.workshop.completeModal.rootCauseLabel')}
          rules={[{ required: true, message: t('equipment.workshop.completeModal.rootCauseRequired') }]}
        >
          <TextArea
            rows={3}
            placeholder={t('equipment.workshop.completeModal.rootCausePlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
