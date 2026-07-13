import {
  AlertTriangle,
  Bell,
  ChevronRight,
  ClipboardList,
  Filter,
  ScanLine,
  ShoppingCart,
  User,
  Wrench,
} from 'lucide-react'
import { EquipmentBadge, RepairRequestBadge } from '@/components/primitives/Badge'
import { DaysBadge } from '@/components/primitives/DaysBadge'
import { vjBrand, vjMobile, vjSemantic, type EquipmentStatusKey } from '@/design-system'

const TAB_ITEMS = [
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, active: true },
  { id: 'fleet', label: 'Fleet', icon: ShoppingCart, active: false },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, active: false },
  { id: 'me', label: 'Me', icon: User, active: false },
] as const

const TASKS: {
  id: string
  code: string
  title: string
  station: string
  status: EquipmentStatusKey
  days: number
  priority: 'normal' | 'urgent'
}[] = [
  {
    id: '1',
    code: 'VJ-TC-0042',
    title: 'Pre-flight trolley check',
    station: 'SGN · Gate A12',
    status: 'service',
    days: 2,
    priority: 'normal',
  },
  {
    id: '2',
    code: 'VJ-TC-0118',
    title: 'Move cart to repair bay',
    station: 'HAN · Bay 3',
    status: 'repairing',
    days: 9,
    priority: 'urgent',
  },
  {
    id: '3',
    code: 'VJ-TC-0201',
    title: 'Tag out of service unit',
    station: 'DAD · Store',
    status: 'not-service',
    days: 16,
    priority: 'urgent',
  },
]

/**
 * Soft UI Evolution + VJA brand — Ops / ground / cabin-adjacent task home.
 * Matches Ops Portal domain (equipment + status), not consumer booking.
 * Chrome: gradient header only · light tab bar · active #F02823.
 */
export function MobileDesignPreview() {
  const m = vjMobile
  const s = vjSemantic
  const gutter = m.screen.gutter

  return (
    <div className="ds-mobile-stage">
      <aside className="ds-mobile-spec" aria-label="Mobile token summary">
        <p className="ds-mobile-spec__title">Ops mobile · vjMobile</p>
        <dl className="ds-mobile-spec__list">
          <div>
            <dt>Audience</dt>
            <dd>Ops / crew</dd>
          </div>
          <div>
            <dt>Header</dt>
            <dd>gradient.sidebar</dd>
          </div>
          <div>
            <dt>Tab bar</dt>
            <dd>Surface + red</dd>
          </div>
          <div>
            <dt>Touch</dt>
            <dd>≥ {m.touchTarget.min}pt</dd>
          </div>
          <div>
            <dt>Body</dt>
            <dd>{m.typography.body}px</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Badge + label</dd>
          </div>
        </dl>
        <p className="ds-mobile-spec__hint">
          Wiki tokens OK · Product UI = ops task list (not consumer booking)
        </p>
      </aside>

      <div className="ds-mobile-device" aria-label="Ops mobile tasks preview">
        <div className="ds-mobile-device__bezel">
          <div className="ds-mobile-device__notch" aria-hidden />

          <div className="ds-mobile-device__screen">
            <div className="ds-mobile-chrome">
              <div className="ds-mobile-status" aria-hidden>
                <span className="ds-mobile-status__time">9:41</span>
                <span className="ds-mobile-status__icons">
                  <span className="ds-mobile-status__signal" />
                  <span className="ds-mobile-status__wifi" />
                  <span className="ds-mobile-status__battery" />
                </span>
              </div>

              <header className="ds-mobile-header" style={{ minHeight: m.navigation.headerHeight }}>
                <div className="ds-mobile-header__inner" style={{ paddingInline: gutter }}>
                  <div className="ds-mobile-header__brand">
                    <VietJetLogoCompact onChrome />
                    <div className="ds-mobile-header__greet">
                      <span className="ds-mobile-header__eyebrow">SGN · Shift A</span>
                      <span
                        className="ds-mobile-header__title"
                        style={{ fontSize: m.typography.headline }}
                      >
                        Ops Tasks
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ds-mobile-icon-btn"
                    style={{ minWidth: m.touchTarget.min, minHeight: m.touchTarget.min }}
                    aria-label="Notifications"
                  >
                    <Bell size={m.icon.md} strokeWidth={m.icon.strokeWidth} />
                    <span className="ds-mobile-icon-btn__dot" aria-hidden />
                  </button>
                </div>
              </header>
            </div>

            <div
              className="ds-mobile-scroll ds-mobile-scroll--home"
              style={{
                paddingInline: gutter,
                paddingTop: gutter,
                paddingBottom: m.navigation.bottomNavHeight + 24,
              }}
            >
              <div className="ds-mobile-ops-summary">
                <div className="ds-mobile-ops-kpi">
                  <strong>12</strong>
                  <span>Open</span>
                </div>
                <div className="ds-mobile-ops-kpi ds-mobile-ops-kpi--warn">
                  <strong>3</strong>
                  <span>Urgent</span>
                </div>
                <div className="ds-mobile-ops-kpi ds-mobile-ops-kpi--ok">
                  <strong>28</strong>
                  <span>Done</span>
                </div>
              </div>

              <div className="ds-mobile-ops-toolbar">
                <div className="ds-mobile-ops-chips" role="tablist" aria-label="Task filters">
                  <button type="button" className="ds-mobile-chip ds-mobile-chip--active" role="tab" aria-selected>
                    All
                  </button>
                  <button type="button" className="ds-mobile-chip" role="tab">
                    Repairing
                  </button>
                  <button type="button" className="ds-mobile-chip" role="tab">
                    Out
                  </button>
                </div>
                <button
                  type="button"
                  className="ds-mobile-filter-btn"
                  style={{ minWidth: m.touchTarget.min, minHeight: m.touchTarget.min }}
                  aria-label="Filter tasks"
                >
                  <Filter size={m.icon.sm} strokeWidth={m.icon.strokeWidth} />
                </button>
              </div>

              <div className="ds-mobile-section-head" style={{ marginTop: 4 }}>
                <h2 style={{ fontSize: m.typography.headline }}>Today</h2>
                <span className="ds-mobile-ops-count">3 tasks</span>
              </div>

              <ul className="ds-mobile-task-list" style={{ marginTop: 10 }}>
                {TASKS.map((task) => (
                  <li key={task.id}>
                    <button type="button" className="ds-mobile-task" style={{ borderRadius: s.radius.lg }}>
                      <div className="ds-mobile-task__top">
                        <span className="ds-mobile-task__code">{task.code}</span>
                        {task.priority === 'urgent' ? (
                          <span className="ds-mobile-task__urgent">Urgent</span>
                        ) : null}
                      </div>
                      <p
                        className="ds-mobile-task__title"
                        style={{ fontSize: m.typography.body, lineHeight: m.typography.bodyLineHeight }}
                      >
                        {task.title}
                      </p>
                      <p
                        className="ds-mobile-task__meta"
                        style={{ fontSize: m.typography.caption }}
                      >
                        {task.station}
                      </p>
                      <div className="ds-mobile-task__footer">
                        <div className="ds-mobile-task__badges">
                          <EquipmentBadge status={task.status} />
                          <DaysBadge days={task.days} />
                        </div>
                        <ChevronRight
                          size={m.icon.sm}
                          strokeWidth={m.icon.strokeWidth}
                          className="ds-mobile-task__chev"
                          aria-hidden
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="ds-mobile-section-head" style={{ marginTop: 18 }}>
                <h2 style={{ fontSize: m.typography.headline }}>Repair queue</h2>
                <RepairRequestBadge status="open" />
              </div>
              <article className="ds-mobile-repair" style={{ borderRadius: s.radius.lg, marginTop: 10 }}>
                <div className="ds-mobile-repair__row">
                  <Wrench size={m.icon.md} strokeWidth={m.icon.strokeWidth} aria-hidden />
                  <div>
                    <p style={{ fontSize: m.typography.body, fontWeight: 600, margin: 0 }}>RR-2026-00012</p>
                    <p style={{ fontSize: m.typography.caption, color: s.neutral.textSecondary, margin: '4px 0 0' }}>
                      3 units · ABC Repair · ETA 16:00
                    </p>
                  </div>
                </div>
              </article>

              <button
                type="button"
                className="ds-mobile-btn ds-mobile-btn--primary"
                style={{
                  minHeight: m.touchTarget.min,
                  borderRadius: s.radius.md,
                  fontSize: m.typography.body,
                  marginTop: gutter,
                }}
              >
                <ScanLine size={18} strokeWidth={2} aria-hidden />
                Scan trolley
              </button>
            </div>

            <nav
              className="ds-mobile-tabbar"
              style={{ minHeight: m.navigation.bottomNavHeight }}
              aria-label="Ops bottom navigation"
            >
              <div className="ds-mobile-tabbar__tabs">
                {TAB_ITEMS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`ds-mobile-tab${tab.active ? ' ds-mobile-tab--active' : ''}`}
                      style={{ minHeight: m.touchTarget.min }}
                      aria-current={tab.active ? 'page' : undefined}
                    >
                      <Icon size={m.navigation.tabIconSize} strokeWidth={m.icon.strokeWidth} />
                      <span style={{ fontSize: m.typography.footnote }}>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="ds-mobile-tabbar__home-indicator" aria-hidden />
            </nav>
          </div>
        </div>
        <p className="ds-mobile-device__caption">390 × 844 · Ops / crew tasks</p>
      </div>
    </div>
  )
}

function VietJetLogoCompact({ onChrome = false }: { onChrome?: boolean }) {
  const fill = onChrome ? '#FFFFFF' : vjBrand.colors.red
  return (
    <svg width="32" height="14" viewBox="0 0 115 20" fill="none" aria-hidden>
      <path
        d="M4.806 18.344H1.51L0 2.914h3.57l.618 10.464L9.2 2.914h3.639L4.806 18.344Z"
        fill={fill}
      />
      <path
        d="M27.6 10h-7.346c-.069 1.523.618 2.649 2.472 2.649 1.304 0 2.609-.397 3.295-.662l.343 2.185c-1.03.464-2.609.861-4.463.861-3.158 0-4.943-1.722-4.943-4.636 0-1.788.618-3.775 1.717-5.166C19.705 3.576 21.559 2.583 23.824 2.583c2.747 0 4.326 1.523 4.326 4.238 0 .662-.206 2.119-.55 3.179Zm-4.188-5.364c-1.03 0-1.922.662-2.54 1.854-.275.53-.275.662-.481 1.258h4.325c.069-.331.206-.928.206-1.325.069-1.192-.48-1.788-1.51-1.788Z"
        fill={fill}
      />
    </svg>
  )
}
