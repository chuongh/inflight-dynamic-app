import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import vi from './locales/vi.json'

export const LOCALE_STORAGE_KEY = 'vj-portal-locale'
export const SUPPORTED_LOCALES = ['en', 'vi'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

function detectLocale(): AppLocale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored === 'en' || stored === 'vi') return stored
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: detectLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n

export function setAppLocale(locale: AppLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  void i18n.changeLanguage(locale)
}
