import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

export function formatRelativeAgoWithT(timestamp: number, t: TFunction, now = Date.now()) {
  const diffMs = Math.max(0, now - timestamp)
  const dayMs = 86_400_000
  const days = Math.floor(diffMs / dayMs)

  if (days < 1) return t('time.today')
  if (days < 30) return t('time.daysAgo', { count: days })
  if (days < 365) return t('time.monthsAgo', { count: Math.floor(days / 30) })
  return t('time.yearsAgo', { count: Math.floor(days / 365) })
}

export function useFormatters() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('vi') ? 'vi-VN' : 'en-GB'

  const formatDate = useCallback(
    (timestamp: number) =>
      new Date(timestamp).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [locale],
  )

  const formatDateDMY = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }, [])

  const formatRelativeAgo = useCallback(
    (timestamp: number, now = Date.now()) => formatRelativeAgoWithT(timestamp, t, now),
    [t],
  )

  return { formatDate, formatDateDMY, formatRelativeAgo }
}
