import { useTranslation } from 'react-i18next'
import { setAppLocale, type AppLocale } from '@/i18n'

const OPTIONS: { value: AppLocale; short: string; labelKey: string }[] = [
  { value: 'en', short: 'EN', labelKey: 'common.english' },
  { value: 'vi', short: 'VI', labelKey: 'common.vietnamese' },
]

interface LanguageSwitcherProps {
  className?: string
}

/**
 * Compact EN/VI toggle — avoid Ant Select here: changing locale remounts
 * ConfigProvider and tears down an open Select dropdown (crash / freeze).
 */
export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const current: AppLocale = i18n.language.startsWith('vi') ? 'vi' : 'en'

  return (
    <div
      className={`language-switcher ${className}`.trim()}
      role="group"
      aria-label={t('common.language')}
    >
      {OPTIONS.map((opt) => {
        const active = current === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            className={`language-switcher__opt${active ? ' language-switcher__opt--active' : ''}`}
            aria-pressed={active}
            aria-label={t(opt.labelKey)}
            onClick={() => {
              if (!active) setAppLocale(opt.value)
            }}
          >
            {opt.short}
          </button>
        )
      })}
    </div>
  )
}
