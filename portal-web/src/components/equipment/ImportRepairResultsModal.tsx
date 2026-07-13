import { Button, Input, Space } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function ImportRepairResultsModal({
  onImport,
}: {
  onImport: (text: string) => void
}) {
  const { t } = useTranslation()
  const [csv, setCsv] = useState('')

  return (
    <Space direction="vertical" className="w-full" size={12}>
      <p className="text-xs text-[var(--color-text-secondary)]">{t('equipment.importRepair.hint')}</p>
      <Input.TextArea
        rows={6}
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        placeholder={t('equipment.importRepair.placeholder')}
        style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
      />
      <Button type="primary" disabled={!csv.trim()} onClick={() => onImport(csv)}>
        {t('common.import')}
      </Button>
    </Space>
  )
}
