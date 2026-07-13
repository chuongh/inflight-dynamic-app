import { App as AntApp, ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import viVN from 'antd/locale/vi_VN'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { vietjetAntTheme } from './theme'

interface VietJetThemeProviderProps {
  children: ReactNode
}

export function VietJetThemeProvider({ children }: VietJetThemeProviderProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('vi') ? viVN : enUS

  return (
    <ConfigProvider
      theme={vietjetAntTheme}
      locale={locale}
      tag={{ variant: 'outlined' }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}
