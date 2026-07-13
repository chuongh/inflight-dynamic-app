import { Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * "Later" (Wave sau) marker — flags a surface that is NOT part of the MVP so
 * end users don't mistake it for a deliverable. Used on airport-map surfaces.
 */
export function LaterTag({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={`airport-later-tag ${className}`.trim()} title={t('airports.laterHint')}>
      <Clock3 size={11} strokeWidth={2.5} aria-hidden />
      {t('airports.later')}
    </span>
  )
}
