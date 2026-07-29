import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  SlidersHorizontal,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Palette,
  Search,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Tablet,
  User,
  Users,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/useAuth'
import { NAV_SECTION_KEYS, PORTAL_MODULES, moduleVisible } from '@/core/modules/registry'
import { VietJetLogo } from '@/components/brand/VietJetLogo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { paths } from '@/routes/paths'

const ICONS: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard size={18} strokeWidth={2} />,
  'design-system': <Palette size={18} strokeWidth={2} />,
  equipment: <ShoppingCart size={18} strokeWidth={2} />,
  catering: <UtensilsCrossed size={18} strokeWidth={2} />,
  catalog: <BookOpen size={18} strokeWidth={2} />,
  'catering-quota': <ClipboardList size={16} strokeWidth={2} />,
  'catering-config': <SlidersHorizontal size={16} strokeWidth={2} />,
  airports: <Building2 size={18} strokeWidth={2} />,
  'trolley-carts': <ShoppingCart size={16} strokeWidth={2} />,
  pos: <CreditCard size={16} strokeWidth={2} />,
  ipad: <Tablet size={16} strokeWidth={2} />,
  workshop: <Wrench size={16} strokeWidth={2} />,
  scorecard: <ClipboardList size={16} strokeWidth={2} />,
  administration: <Shield size={18} strokeWidth={2} />,
  'iam-users': <Users size={16} strokeWidth={2} />,
  'iam-roles': <ShieldCheck size={16} strokeWidth={2} />,
  'iam-permissions': <KeyRound size={16} strokeWidth={2} />,
}

interface AppShellProps {
  children: ReactNode
}

function resolveSelection(pathname: string) {
  if (pathname.startsWith(paths.designSystem)) return { selectedKey: 'design-system', ...NAV_SECTION_KEYS['design-system'] }
  if (pathname.startsWith(paths.dashboard)) return { selectedKey: 'dashboard', ...NAV_SECTION_KEYS.dashboard }
  if (pathname.startsWith(paths.equipment.pos.list)) return { selectedKey: 'pos', ...NAV_SECTION_KEYS.pos }
  if (pathname.startsWith(paths.equipment.ipad.list)) return { selectedKey: 'ipad', ...NAV_SECTION_KEYS.ipad }
  if (pathname.startsWith(paths.equipment.workshop.list)) return { selectedKey: 'workshop', ...NAV_SECTION_KEYS.workshop }
  if (pathname.startsWith(paths.equipment.report.list)) return { selectedKey: 'scorecard', ...NAV_SECTION_KEYS.scorecard }
  if (pathname.startsWith(paths.equipment.trolley.list)) return { selectedKey: 'trolley-carts', ...NAV_SECTION_KEYS['trolley-carts'] }
  if (pathname.startsWith(paths.catering.catalog.amenity)) return { selectedKey: 'catalog-amenity', ...NAV_SECTION_KEYS['catalog-amenity'] }
  if (pathname.startsWith(paths.catering.catalog.combos)) return { selectedKey: 'catalog-combos', ...NAV_SECTION_KEYS['catalog-combos'] }
  if (pathname.startsWith(paths.catering.catalog.mealsSbb)) return { selectedKey: 'catalog-meals-sbb', ...NAV_SECTION_KEYS['catalog-meals-sbb'] }
  if (pathname.startsWith(paths.catering.catalog.meals)) return { selectedKey: 'catalog-meals', ...NAV_SECTION_KEYS['catalog-meals'] }
  if (pathname.startsWith(paths.catering.config.list)) return { selectedKey: 'catering-config', ...NAV_SECTION_KEYS['catering-config'] }
  if (pathname.startsWith(paths.catering.quota.list)) return { selectedKey: 'catering-quota', ...NAV_SECTION_KEYS['catering-quota'] }
  if (pathname.startsWith(paths.catering.orders.list)) return { selectedKey: 'catering-orders', ...NAV_SECTION_KEYS['catering-orders'] }
  if (pathname.startsWith(paths.catering.grouping.list)) return { selectedKey: 'catering-grouping', ...NAV_SECTION_KEYS['catering-grouping'] }
  if (pathname.startsWith(paths.airports.list)) return { selectedKey: 'airports', ...NAV_SECTION_KEYS.airports }
  if (pathname.startsWith(paths.admin.users)) return { selectedKey: 'iam-users', ...NAV_SECTION_KEYS['iam-users'] }
  if (pathname.startsWith(paths.admin.roles)) return { selectedKey: 'iam-roles', ...NAV_SECTION_KEYS['iam-roles'] }
  if (pathname.startsWith(paths.admin.permissions)) return { selectedKey: 'iam-permissions', ...NAV_SECTION_KEYS['iam-permissions'] }
  return { selectedKey: 'dashboard', ...NAV_SECTION_KEYS.dashboard }
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { session, logout } = useAuth()
  /** Icon rail by default; expands to full labels on hover / keyboard focus. */
  const [sidebarOpen, setSidebarOpen] = useState(false)
  /** Parent sections the user has toggled open/closed. */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const userPermissions = session?.user.permissions
  const { selectedKey, sectionTitleKey, moduleLabelKey } = resolveSelection(location.pathname)
  const sectionTitle = t(sectionTitleKey)
  const moduleLabel = moduleLabelKey ? t(moduleLabelKey) : ''
  const compact = !sidebarOpen

  const visibleModules = useMemo(
    () => PORTAL_MODULES.filter((module) => moduleVisible(module, userPermissions ?? [])),
    [userPermissions],
  )

  const parentOfSelected = useMemo(
    () =>
      PORTAL_MODULES.find((module) => module.children?.some((child) => child.id === selectedKey))
        ?.id ?? null,
    [selectedKey],
  )

  // Keep the active route's parent expanded.
  useEffect(() => {
    if (!parentOfSelected) return
    setOpenGroups((prev) =>
      prev[parentOfSelected] ? prev : { ...prev, [parentOfSelected]: true },
    )
  }, [parentOfSelected])

  const initials = session?.user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    logout()
    navigate(paths.login, { replace: true })
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User size={14} />,
      label: session?.user.name,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: t('common.signOut'),
      danger: true,
      onClick: handleLogout,
    },
  ]

  const navigateToKey = (key: string) => {
    const parentWithChild = PORTAL_MODULES.find((module) =>
      module.children?.some((child) => child.id === key),
    )
    const child = parentWithChild?.children?.find((c) => c.id === key)
    if (child) {
      navigate(child.path)
      return
    }
    const top = PORTAL_MODULES.find((m) => m.id === key)
    if (top?.path && !top.disabled) navigate(top.path)
  }

  const isChildOfModule = (moduleId: string) => {
    const module = PORTAL_MODULES.find((m) => m.id === moduleId)
    return module?.children?.some((child) => child.id === selectedKey) ?? false
  }

  const isGroupExpanded = (moduleId: string) => {
    if (openGroups[moduleId] !== undefined) return openGroups[moduleId]
    return isChildOfModule(moduleId)
  }

  const toggleGroup = (moduleId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [moduleId]: !isGroupExpanded(moduleId),
    }))
  }

  return (
    <div className="admin-shell">
      <div className="admin-sidebar-slot">
        <aside
          className={`admin-sidebar ${compact ? 'admin-sidebar--compact' : 'admin-sidebar--expanded'}`}
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          onFocusCapture={() => setSidebarOpen(true)}
          onBlurCapture={(event) => {
            const next = event.relatedTarget
            if (next instanceof Node && event.currentTarget.contains(next)) return
            setSidebarOpen(false)
          }}
        >
          <div className="admin-sidebar__brand">
            <VietJetLogo size="lg" variant="white" />
          </div>

          <nav className="admin-sidebar__nav thin-scroll">
            {visibleModules.map((module) => {
              const moduleLabelText = t(module.labelKey)
              if (module.children) {
                const children = module.children.filter((child) =>
                  userPermissions?.includes(child.permission),
                )
                const expanded = isGroupExpanded(module.id)
                const parentActive = isChildOfModule(module.id)
                return (
                  <div key={module.id} className="admin-nav-group">
                    <button
                      type="button"
                      className={`admin-nav-item ${expanded || parentActive ? 'admin-nav-item--open' : ''}`}
                      onClick={() => {
                        if (compact) {
                          navigateToKey(module.id)
                          return
                        }
                        toggleGroup(module.id)
                      }}
                      title={compact ? moduleLabelText : undefined}
                      aria-expanded={compact ? undefined : expanded}
                      aria-controls={compact ? undefined : `nav-group-${module.id}`}
                    >
                      <span className="admin-nav-item__icon">{ICONS[module.id]}</span>
                      <span className="admin-nav-item__label">{moduleLabelText}</span>
                      {!compact ? (
                        <ChevronDown
                          size={16}
                          strokeWidth={2}
                          className={`admin-nav-item__chevron ${expanded ? 'admin-nav-item__chevron--open' : ''}`}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    {!compact && expanded ? (
                      <div id={`nav-group-${module.id}`} className="admin-nav-group__children">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            className={`admin-nav-item admin-nav-item--child ${
                              selectedKey === child.id ? 'admin-nav-item--active' : ''
                            }`}
                            onClick={() => navigateToKey(child.id)}
                          >
                            <span className="admin-nav-item__icon">{ICONS[child.id]}</span>
                            <span className="admin-nav-item__label">{t(child.labelKey)}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              }

              return (
                <div key={module.id} className="admin-nav-group">
                  <button
                    type="button"
                    className={`admin-nav-item ${
                      selectedKey === module.id ? 'admin-nav-item--active' : ''
                    }`}
                    disabled={module.disabled}
                    onClick={() => !module.disabled && navigateToKey(module.id)}
                    title={compact ? moduleLabelText : undefined}
                  >
                    <span className="admin-nav-item__icon">{ICONS[module.id]}</span>
                    <span className="admin-nav-item__label">{moduleLabelText}</span>
                  </button>
                </div>
              )
            })}
          </nav>
        </aside>
      </div>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__breadcrumb">
            {moduleLabel ? (
              <>
                <span>{moduleLabel}</span>
                <span className="admin-topbar__breadcrumb-sep">/</span>
                <span className="admin-topbar__breadcrumb-current">{sectionTitle}</span>
              </>
            ) : (
              <span className="admin-topbar__breadcrumb-current">{sectionTitle}</span>
            )}
          </div>

          <div className="admin-topbar__search" role="search" aria-label={t('nav.quickSearch')}>
            <Search size={15} aria-hidden />
            <span>{t('nav.quickSearchPlaceholder')}</span>
          </div>

          <div className="admin-topbar__actions">
            <LanguageSwitcher />
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <button type="button" className="admin-topbar__user" aria-label={t('nav.userMenu')}>
                <span className="admin-topbar__avatar">{initials ?? 'NV'}</span>
                <div className="admin-topbar__user-info">
                  <div className="admin-topbar__user-name">{session?.user.name}</div>
                  <div className="admin-topbar__user-role">{session?.user.jobTitle}</div>
                </div>
              </button>
            </Dropdown>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
