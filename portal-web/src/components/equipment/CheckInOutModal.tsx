import { App as AntApp, Form, Input, Modal, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import { STATIONS, type TrolleyUnit } from '@/modules/equipment/constants'
import { useCheckinTrolley, useCheckoutTrolley } from '@/modules/equipment/hooks/useEquipment'

interface CheckInOutModalProps {
  open: boolean
  mode: 'checkout' | 'checkin'
  unit: TrolleyUnit
  onClose: () => void
}

export function CheckInOutModal({ open, mode, unit, onClose }: CheckInOutModalProps) {
  const { t } = useTranslation()
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const checkout = useCheckoutTrolley()
  const checkin = useCheckinTrolley()

  const handleOk = async () => {
    const values = await form.validateFields()
    if (mode === 'checkout') {
      checkout.mutate(
        {
          code: unit.code,
          input: {
            actor: values.actor,
            flight: values.flight,
            fromStation: unit.station,
            toStation: values.toStation,
            condition: values.condition,
            note: values.note,
          },
        },
        {
          onSuccess: () => {
            message.success(t('equipment.checkinout.checkoutOk', { code: unit.code }))
            form.resetFields()
            onClose()
          },
          onError: () => message.error(t('equipment.checkinout.failed')),
        },
      )
    } else {
      checkin.mutate(
        {
          code: unit.code,
          input: {
            actor: values.actor,
            station: values.station,
            condition: values.condition,
            note: values.note,
          },
        },
        {
          onSuccess: () => {
            message.success(t('equipment.checkinout.checkinOk', { code: unit.code }))
            form.resetFields()
            onClose()
          },
          onError: () => message.error(t('equipment.checkinout.failed')),
        },
      )
    }
  }

  return (
    <Modal
      open={open}
      title={t(
        mode === 'checkout' ? 'equipment.checkinout.checkoutTitle' : 'equipment.checkinout.checkinTitle',
        { code: unit.code },
      )}
      okText={t('common.confirm')}
      confirmLoading={checkout.isPending || checkin.isPending}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ condition: 'ok' }}>
        <Form.Item name="actor" label={t('equipment.checkinout.crew')} rules={[{ required: true }]}>
          <Input placeholder="CC. Nguyễn T. Lan" />
        </Form.Item>
        {mode === 'checkout' ? (
          <>
            <Form.Item name="flight" label={t('equipment.checkinout.flight')} rules={[{ required: true }]}>
              <Input placeholder="VJ311" />
            </Form.Item>
            <Form.Item
              name="toStation"
              label={t('equipment.checkinout.toStation')}
              rules={[{ required: true }]}
            >
              <Select options={STATIONS.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            name="station"
            label={t('equipment.checkinout.atStation')}
            rules={[{ required: true }]}
            initialValue={unit.custody?.toStation ?? unit.station}
          >
            <Select options={STATIONS.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        )}
        <Form.Item name="condition" label={t('equipment.checkinout.condition')} rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'ok', label: t('equipment.checkinout.ok') },
              { value: 'damaged', label: t('equipment.checkinout.damaged') },
            ]}
          />
        </Form.Item>
        <Form.Item name="note" label={t('equipment.checkinout.note')}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
