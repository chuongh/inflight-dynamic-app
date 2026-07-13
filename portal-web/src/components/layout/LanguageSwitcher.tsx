import { Select } from 'antd'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { setAppLocale, type AppLocale } from '@/i18n'

const OPTIONS: { value: AppLocale; labelKey: string }[] = [
  { value: 'en', labelKey: 'common.english' },
  { value: 'vi', labelKey: 'common.vietnamese' },
]

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = i18n.language.startsWith('vi') ? 'vi' : 'en'

  return (
    <Select
      size="small"
      value={current}
      aria-label={t('common.language')}
      className="language-switcher"
      style={{ minWidth: 120 }}
      suffixIcon={<Languages size={14} aria-hidden />}
      options={OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
      onChange={(value: AppLocale) => setAppLocale(value)}
    />
  )
}
