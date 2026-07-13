import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/core/auth/AuthProvider'
import { QueryProvider } from '@/core/api/QueryProvider'
import { VietJetThemeProvider } from '@/design-system/VietJetThemeProvider'
import { AppRoutes } from '@/app/routes'

export default function App() {
  return (
    <VietJetThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryProvider>
    </VietJetThemeProvider>
  )
}
