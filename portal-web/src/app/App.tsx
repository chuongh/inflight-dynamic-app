import { HashRouter } from 'react-router-dom'
import { AuthProvider } from '@/core/auth/AuthProvider'
import { QueryProvider } from '@/core/api/QueryProvider'
import { VietJetThemeProvider } from '@/design-system/VietJetThemeProvider'
import { AppRoutes } from '@/app/routes'

export default function App() {
  return (
    <VietJetThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {/* HashRouter: robust for GitHub Pages under a sub-path (no server-side
              rewrite / 404.html trick needed — deep links & refresh always work). */}
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AuthProvider>
      </QueryProvider>
    </VietJetThemeProvider>
  )
}
