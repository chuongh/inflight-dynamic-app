import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/i18n'
import { ensureCateringDemoReseed } from '@/mock-data/loaders/clearCateringDemoCaches'
import App from '@/app/App.tsx'

ensureCateringDemoReseed()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
