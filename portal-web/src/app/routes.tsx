import { Spin } from 'antd'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/core/auth/useAuth'
import type { TrolleyUnit } from '@/modules/equipment/constants'
import {
  useRepairRequests,
  useSaveTrolleys,
  useTrolleys,
} from '@/modules/equipment/hooks/useEquipment'
import { AirportListPage } from '@/pages/airports/AirportListPage'
import { QuotaPage } from '@/pages/catering/quota/QuotaPage'
import { ConfigPage } from '@/pages/catering/config/ConfigPage'
import { GroupingPage } from '@/pages/catering/grouping/GroupingPage'
import { MealListPage } from '@/pages/catering/meals/MealListPage'
import { OrderListPage } from '@/pages/catering/orders/OrderListPage'
import { OrderDetailPage } from '@/pages/catering/orders/OrderDetailPage'
import { PermissionMatrixPage } from '@/pages/admin/PermissionMatrixPage'
import { RolesPage } from '@/pages/admin/RolesPage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { DesignSystemPage } from '@/pages/design-system/DesignSystemPage'
import { IpadDetailPage } from '@/pages/equipment/ipad/IpadDetailPage'
import { IpadPage } from '@/pages/equipment/ipad/IpadPage'
import { PosDetailPage } from '@/pages/equipment/pos/PosDetailPage'
import { PosPage } from '@/pages/equipment/pos/PosPage'
import { VendorScorecardPage } from '@/pages/equipment/report/VendorScorecardPage'
import { TrolleyDetailPage } from '@/pages/equipment/trolley/TrolleyDetailPage'
import { TrolleyListPage } from '@/pages/equipment/trolley/TrolleyListPage'
import { RepairWorkshopPage } from '@/pages/equipment/workshop/RepairWorkshopPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { paths } from '@/routes/paths'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to={paths.login} replace />
  return children
}

function PortalLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function PageLoading() {
  return (
    <div className="page-loading">
      <Spin size="large" />
    </div>
  )
}

function TrolleyListRoute() {
  const { data: trolleys = [], isLoading } = useTrolleys()
  const saveTrolleys = useSaveTrolleys()

  if (isLoading) return <PageLoading />

  return (
    <TrolleyListPage
      trolleys={trolleys}
      onTrolleysChange={(next) => saveTrolleys.mutate(next)}
    />
  )
}

function TrolleyDetailRoute() {
  const { data: trolleys = [], isLoading } = useTrolleys()
  const saveTrolleys = useSaveTrolleys()

  if (isLoading) return <PageLoading />

  return (
    <TrolleyDetailPage
      trolleys={trolleys}
      onTrolleysChange={(next: TrolleyUnit[]) => saveTrolleys.mutate(next)}
    />
  )
}

function DashboardRoute() {
  const { data: trolleys = [], isLoading: trolleysLoading } = useTrolleys()
  const { data: repairRequests = [], isLoading: requestsLoading } = useRepairRequests()

  if (trolleysLoading || requestsLoading) return <PageLoading />

  return <DashboardPage trolleys={trolleys} repairRequests={repairRequests} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.login} element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <PortalLayout />
          </RequireAuth>
        }
      >
        <Route path={paths.dashboard} element={<DashboardRoute />} />
        <Route path={paths.designSystem} element={<DesignSystemPage />} />
        <Route path={paths.equipment.pos.list} element={<PosPage />} />
        <Route path={`${paths.equipment.pos.list}/:code`} element={<PosDetailPage />} />
        <Route path={paths.equipment.ipad.list} element={<IpadPage />} />
        <Route path={`${paths.equipment.ipad.list}/:code`} element={<IpadDetailPage />} />
        <Route path={paths.equipment.workshop.list} element={<RepairWorkshopPage />} />
        <Route path={paths.equipment.report.list} element={<VendorScorecardPage />} />
        <Route path={paths.equipment.trolley.list} element={<TrolleyListRoute />} />
        <Route path={`${paths.equipment.trolley.list}/:code`} element={<TrolleyDetailRoute />} />
        <Route path={paths.airports.list} element={<AirportListPage />} />
        <Route path={paths.catering.grouping.list} element={<GroupingPage />} />
        <Route path={paths.catering.orders.list} element={<OrderListPage />} />
        <Route path={`${paths.catering.orders.list}/:fileId`} element={<OrderDetailPage />} />
        <Route path={paths.catering.meals.list} element={<MealListPage />} />
        <Route path={paths.catering.quota.list} element={<QuotaPage />} />
        <Route path={paths.catering.config.list} element={<ConfigPage />} />
        <Route path={paths.admin.users} element={<UsersPage />} />
        <Route path={paths.admin.roles} element={<RolesPage />} />
        <Route path={paths.admin.permissions} element={<PermissionMatrixPage />} />
      </Route>
      <Route path="/" element={<Navigate to={paths.login} replace />} />
      <Route path="*" element={<Navigate to={paths.login} replace />} />
    </Routes>
  )
}
