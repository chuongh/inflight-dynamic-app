/**
 * OPP-016 — RBAC model (Role-Based Access Control)
 * ------------------------------------------------------------------
 * World-standard RBAC per NIST RBAC / ISO 27001 A.5.15 (access control)
 * & A.8.3 (information access restriction), as referenced by UC-01 / UC-09.
 *
 *   User ──(assigned)──> Role ──(grants)──> Permission[]
 *
 * - Permission = the smallest unit of access: `<domain>.<resource>.<action>`.
 *   Each has a human `name` + `description` (shown in UC-09 admin UI and used
 *   to review coverage with end users).
 * - Role = a job function that bundles permissions (least-privilege).
 * - A user is assigned exactly ONE primary role (AuthUser.roleId); the JWT
 *   carries the resolved permission[] (UC-01). Role→permission assignment is
 *   administered in UC-09 (Web Portal, Admin only, audit-logged).
 *
 * Modules: M1 Identity/Admin · M2 Boarding & Passenger · M3 Ride & Map ·
 *          M4 Catering/Sales/Supply · M5 Equipment.
 *
 * The full human-readable catalogs (users / roles / permissions / matrix)
 * live alongside this file in `RBAC.md`.
 */

export type ModuleCode = 'M1' | 'M2' | 'M3' | 'M4' | 'M5'
export type Platform = 'web' | 'mobile' | 'both'
export type Wave = 'mvp' | 'later'

export interface PermissionMeta {
  /** Short human label (imperative), shown in the UC-09 permission picker. */
  name: string
  /** One-line explanation of what the permission grants. */
  description: string
  /** Owning OPP-016 module. */
  module: ModuleCode
  /** Functional domain within the module. */
  domain:
    | 'portal'
    | 'admin'
    | 'boarding'
    | 'passenger'
    | 'ride'
    | 'map'
    | 'catering'
    | 'sales'
    | 'supply'
    | 'equipment'
  /** Where the permission is exercised. */
  platform: Platform
  /** Delivery wave. */
  wave: Wave
}

/**
 * Permission catalog — the single source of truth.
 * Keys are stable and referenced by route guards & the module registry; do not
 * rename an existing key (add a new one and migrate) — it breaks access checks.
 */
export const PERMISSIONS = {
  // ── M1 · Portal & Identity/Admin ──────────────────────────────────────────
  'portal.dashboard.view': {
    name: 'View dashboard',
    description: 'Open the operations dashboard and its KPI / station widgets.',
    module: 'M1',
    domain: 'portal',
    platform: 'web',
    wave: 'mvp',
  },
  'portal.notifications.receive': {
    name: 'Receive notifications',
    description: 'Receive operational push / in-app notifications addressed to the user.',
    module: 'M1',
    domain: 'portal',
    platform: 'both',
    wave: 'mvp',
  },
  'admin.users.read': {
    name: 'View staff directory',
    description: 'Browse the list of staff (employee code, name, department, job title).',
    module: 'M1',
    domain: 'admin',
    platform: 'web',
    wave: 'mvp',
  },
  'admin.users.manage': {
    name: 'Manage staff & assignments',
    description: 'Create / edit staff records and assign a role to a user (UC-09).',
    module: 'M1',
    domain: 'admin',
    platform: 'web',
    wave: 'mvp',
  },
  'admin.roles.manage': {
    name: 'Manage roles & permissions',
    description: 'Create / edit roles and map permissions to roles (UC-09).',
    module: 'M1',
    domain: 'admin',
    platform: 'web',
    wave: 'mvp',
  },
  'admin.audit.view': {
    name: 'View audit log',
    description: 'Read the audit trail of authorization and administrative changes.',
    module: 'M1',
    domain: 'admin',
    platform: 'web',
    wave: 'mvp',
  },

  // ── M2 · Boarding & Passenger service ─────────────────────────────────────
  'boarding.scan': {
    name: 'Scan boarding pass',
    description: 'Scan boarding passes and validate passengers against the served flight (UC-02).',
    module: 'M2',
    domain: 'boarding',
    platform: 'mobile',
    wave: 'mvp',
  },
  'boarding.case.view': {
    name: 'View boarding cases',
    description: 'See wrong-boarding alerts and their case status.',
    module: 'M2',
    domain: 'boarding',
    platform: 'mobile',
    wave: 'mvp',
  },
  'boarding.case.handle': {
    name: 'Handle boarding cases',
    description: 'Accept, block, re-route and close wrong-boarding cases (Supervisor only, UC-12).',
    module: 'M2',
    domain: 'boarding',
    platform: 'mobile',
    wave: 'mvp',
  },
  'passenger.profile.view': {
    name: 'View passenger profile',
    description: 'View the unified passenger profile incl. SSR / pre-meal (PII — crew of the flight only, UC-03).',
    module: 'M2',
    domain: 'passenger',
    platform: 'mobile',
    wave: 'mvp',
  },
  'passenger.service.update': {
    name: 'Update passenger service',
    description: 'Mark passenger service delivered and sync per leg (UC-03).',
    module: 'M2',
    domain: 'passenger',
    platform: 'mobile',
    wave: 'mvp',
  },
  'passenger.manifest.load': {
    name: 'Load flight manifest',
    description: 'Load and lock the shared flight-manifest snapshot for the crew (Purser, UC-03).',
    module: 'M2',
    domain: 'passenger',
    platform: 'mobile',
    wave: 'mvp',
  },

  // ── M3 · Ops Ride & Airport map (Wave sau) ────────────────────────────────
  'ride.request.create': {
    name: 'Book airside ride',
    description: 'Request an airside pickup/dropoff; system auto-assigns a driver (UC-04).',
    module: 'M3',
    domain: 'ride',
    platform: 'mobile',
    wave: 'later',
  },
  'ride.task.drive': {
    name: 'Drive ride tasks',
    description: 'Accept, navigate and complete airside ride tasks as a driver (UC-05).',
    module: 'M3',
    domain: 'ride',
    platform: 'mobile',
    wave: 'later',
  },
  'map.dispatch.manage': {
    name: 'Manage map & dispatch',
    description: 'Draw/publish the airport map and dispatch rides in realtime (UC-08).',
    module: 'M3',
    domain: 'map',
    platform: 'web',
    wave: 'later',
  },
  'dispatch.read': {
    name: 'View dispatch board',
    description: 'View the realtime dispatch board (driver positions & running trips).',
    module: 'M3',
    domain: 'map',
    platform: 'web',
    wave: 'later',
  },
  'airports.read': {
    name: 'View airports',
    description: 'View airport / station master data.',
    module: 'M3',
    domain: 'map',
    platform: 'web',
    wave: 'mvp',
  },
  'airports.manage': {
    name: 'Manage airports',
    description:
      'Add / edit airport master data incl. the catering flag, and set up the airport map (points / zones — WP-B).',
    module: 'M3',
    domain: 'map',
    platform: 'web',
    wave: 'mvp',
  },

  // ── M4 · Catering, Sales & Supply ─────────────────────────────────────────
  'catering.read': {
    name: 'View catering',
    description: 'View catering plans, meal figures and amenity stock.',
    module: 'M4',
    domain: 'catering',
    platform: 'web',
    wave: 'mvp',
  },
  'catering.plan.compute': {
    name: 'Compute meal plan',
    description: 'Compute meals to prepare per aircraft/day (pre-meal + upsell + crew meals, UC-06).',
    module: 'M4',
    domain: 'catering',
    platform: 'web',
    wave: 'mvp',
  },
  'catering.quota.manage': {
    name: 'Manage upsell quota',
    description: 'Review / edit and version the upsell (catering) quota dataset (UC-10, Commercial).',
    module: 'M4',
    domain: 'catering',
    platform: 'web',
    wave: 'mvp',
  },
  'catering.finalize': {
    name: 'Finalize catering figures',
    description: 'Lock the 15:00 T-1 meal figures to the supplier and track Delta View (UC-18).',
    module: 'M4',
    domain: 'catering',
    platform: 'web',
    wave: 'mvp',
  },
  'catering.amenities.declare': {
    name: 'Declare amenities',
    description: 'Declare remaining amenities per leg; updates stock (UC-16, crew).',
    module: 'M4',
    domain: 'catering',
    platform: 'mobile',
    wave: 'mvp',
  },
  'catering.vip.manage': {
    name: 'Manage VIP supplements',
    description: 'Create VIP / SkyBoss supplement requests and notify Supply + Crew (UC-17).',
    module: 'M4',
    domain: 'catering',
    platform: 'both',
    wave: 'mvp',
  },
  'sales.read': {
    name: 'View sales',
    description: 'Open the onboard-sales dashboard (quantities + revenue by currency, UC-11).',
    module: 'M4',
    domain: 'sales',
    platform: 'web',
    wave: 'mvp',
  },
  'sales.declare': {
    name: 'Declare goods sold',
    description: 'Declare goods sold per leg with amount and currency (UC-07, crew).',
    module: 'M4',
    domain: 'sales',
    platform: 'mobile',
    wave: 'mvp',
  },
  'sales.report.confirm': {
    name: 'Confirm sales handover',
    description: 'Aggregate trolley sales and confirm the sales handover report (Purser, UC-07).',
    module: 'M4',
    domain: 'sales',
    platform: 'mobile',
    wave: 'mvp',
  },
  'supply.request.create': {
    name: 'Create supply request',
    description: 'Create a pre-flight supply / equipment supplement request (UC-20).',
    module: 'M4',
    domain: 'supply',
    platform: 'both',
    wave: 'mvp',
  },
  'supply.request.process': {
    name: 'Process supply request',
    description: 'Process / approve and update the status of supplement requests (Supply dept, UC-20).',
    module: 'M4',
    domain: 'supply',
    platform: 'web',
    wave: 'mvp',
  },
  'supply.cart.receive': {
    name: 'Receive cart',
    description: 'Receive & reconcile the packed cart at flight start; dual sign-off on mismatch (Purser, UC-21).',
    module: 'M4',
    domain: 'supply',
    platform: 'mobile',
    wave: 'mvp',
  },

  // ── M5 · Equipment management ─────────────────────────────────────────────
  'equipment.read': {
    name: 'View equipment',
    description: 'View equipment list, status and history timeline (UC-15).',
    module: 'M5',
    domain: 'equipment',
    platform: 'web',
    wave: 'mvp',
  },
  'equipment.edit': {
    name: 'Manage equipment',
    description: 'Register and edit equipment master data — carts / POS / iPad (UC-22, UC-15).',
    module: 'M5',
    domain: 'equipment',
    platform: 'web',
    wave: 'mvp',
  },
  'equipment.maintenance': {
    name: 'Manage maintenance',
    description: 'Send equipment to repair and update repair status / results (UC-23).',
    module: 'M5',
    domain: 'equipment',
    platform: 'web',
    wave: 'mvp',
  },
  'equipment.defect.manage': {
    name: 'Manage defect catalog',
    description: 'Maintain the defect catalog and cart/POS quota master data (UC-15).',
    module: 'M5',
    domain: 'equipment',
    platform: 'web',
    wave: 'mvp',
  },
  'equipment.report.view': {
    name: 'View fault reports',
    description: 'View equipment fault / repair-history reports (UC-15, UC-23).',
    module: 'M5',
    domain: 'equipment',
    platform: 'web',
    wave: 'mvp',
  },
  'equipment.handover': {
    name: 'Hand over equipment',
    description: 'Hand over / receive a cart, POS or iPad with two-party confirm (UC-13, UC-24, crew).',
    module: 'M5',
    domain: 'equipment',
    platform: 'mobile',
    wave: 'mvp',
  },
  'equipment.defect.report': {
    name: 'Report equipment defect',
    description: 'Report equipment damage on the spot with photo & defect reason (UC-14, crew).',
    module: 'M5',
    domain: 'equipment',
    platform: 'mobile',
    wave: 'mvp',
  },
} as const satisfies Record<string, PermissionMeta>

export type PermissionKey = keyof typeof PERMISSIONS

/** All permission keys (used to grant the Admin superuser role every permission). */
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[]

// ── Permission bundles (compose roles from these; keeps mapping DRY) ─────────
const CABIN_CREW_PERMISSIONS: PermissionKey[] = [
  'portal.notifications.receive',
  'passenger.profile.view',
  'passenger.service.update',
  'sales.declare',
  'catering.amenities.declare',
  'equipment.handover',
  'equipment.defect.report',
  'supply.request.create',
]

export type RoleId =
  | 'admin'
  | 'equipment_staff'
  | 'viewer'
  | 'ifs_backoffice'
  | 'catering_ops'
  | 'commercial'
  | 'operations'
  | 'supply'
  | 'dispatcher'
  | 'boarding_agent'
  | 'gate_supervisor'
  | 'cabin_crew'
  | 'purser'
  | 'driver'
  | 'supplier'

export interface RoleDefinition {
  id: RoleId
  /** English label (system). */
  label: string
  /** Vietnamese label (matches OPP-016 persona naming — for end-user review). */
  labelVi: string
  /** What the role is for. */
  description: string
  /** Primary platform the role works on. */
  platform: Platform
  /** Delivery wave for this persona. */
  wave: Wave
  /** True for external (non-employee) accounts, e.g. suppliers. */
  external?: boolean
  permissions: PermissionKey[]
}

/**
 * Role catalog + role→permission mapping.
 * Roles are job functions derived from the OPP-016 personas; use this list to
 * validate coverage with end users ("is every real job covered?").
 */
export const ROLES: Record<RoleId, RoleDefinition> = {
  admin: {
    id: 'admin',
    label: 'System Administrator',
    labelVi: 'Quản trị hệ thống',
    description: 'Full access. Administers staff, roles and permissions (UC-09); superuser.',
    platform: 'web',
    wave: 'mvp',
    permissions: ALL_PERMISSIONS,
  },
  ifs_backoffice: {
    id: 'ifs_backoffice',
    label: 'IFS Back Office',
    labelVi: 'IFS — Điều hành (BackOffice)',
    description:
      'In-flight service back office: catering compute/finalize, VIP supplements, equipment oversight.',
    platform: 'web',
    wave: 'mvp',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'catering.read',
      'catering.plan.compute',
      'catering.finalize',
      'catering.vip.manage',
      'sales.read',
      'supply.request.create',
      'equipment.read',
      'equipment.report.view',
    ],
  },
  catering_ops: {
    id: 'catering_ops',
    label: 'Catering Operations',
    labelVi: 'Vận hành suất ăn',
    description: 'Computes and reviews meal-preparation figures per aircraft (UC-06).',
    platform: 'web',
    wave: 'mvp',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'catering.read',
      'catering.plan.compute',
    ],
  },
  commercial: {
    id: 'commercial',
    label: 'Commercial',
    labelVi: 'Team Commercial',
    description: 'Owns the upsell (catering) quota and reviews onboard-sales performance.',
    platform: 'web',
    wave: 'mvp',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'catering.read',
      'catering.quota.manage',
      'sales.read',
    ],
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    labelVi: 'Vận hành',
    description: 'Cross-module operations oversight: reviews plans, sales, equipment and dispatch.',
    platform: 'web',
    wave: 'mvp',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'catering.read',
      'sales.read',
      'equipment.read',
      'equipment.report.view',
      'airports.read',
      'airports.manage',
      'dispatch.read',
      'ride.request.create',
    ],
  },
  equipment_staff: {
    id: 'equipment_staff',
    label: 'Equipment Staff',
    labelVi: 'NV thiết bị (IFS)',
    description: 'IFS equipment department: master data, registration, maintenance and defects (M5).',
    platform: 'web',
    wave: 'mvp',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'equipment.read',
      'equipment.edit',
      'equipment.maintenance',
      'equipment.defect.manage',
      'equipment.report.view',
      'airports.read',
    ],
  },
  supply: {
    id: 'supply',
    label: 'Supply',
    labelVi: 'Bộ phận cung ứng',
    description: 'Receives and processes supplement requests; coordinates trolley / amenity supply.',
    platform: 'web',
    wave: 'mvp',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'supply.request.create',
      'supply.request.process',
      'catering.read',
    ],
  },
  dispatcher: {
    id: 'dispatcher',
    label: 'Dispatcher / Map Admin',
    labelVi: 'Điều phối viên / Admin bản đồ',
    description: 'Draws & publishes the airport map and dispatches Ops Ride in realtime (UC-08).',
    platform: 'web',
    wave: 'later',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'map.dispatch.manage',
      'dispatch.read',
      'airports.read',
      'airports.manage',
    ],
  },
  boarding_agent: {
    id: 'boarding_agent',
    label: 'Boarding Agent',
    labelVi: 'Nhân viên cổng',
    description: 'Scans boarding passes at the gate and raises wrong-boarding alerts (UC-02).',
    platform: 'mobile',
    wave: 'mvp',
    permissions: ['portal.notifications.receive', 'boarding.scan', 'boarding.case.view'],
  },
  gate_supervisor: {
    id: 'gate_supervisor',
    label: 'Gate Supervisor',
    labelVi: 'Supervisor cổng',
    description: 'Handles escalated wrong-boarding cases: block, re-route and close (UC-12).',
    platform: 'mobile',
    wave: 'mvp',
    permissions: [
      'portal.notifications.receive',
      'boarding.scan',
      'boarding.case.view',
      'boarding.case.handle',
    ],
  },
  cabin_crew: {
    id: 'cabin_crew',
    label: 'Cabin Crew',
    labelVi: 'Tiếp viên',
    description:
      'Flight attendant: passenger service, onboard sales, amenities and device handling on board.',
    platform: 'mobile',
    wave: 'mvp',
    permissions: CABIN_CREW_PERMISSIONS,
  },
  purser: {
    id: 'purser',
    label: 'Purser (Lead Cabin Crew)',
    labelVi: 'Tiếp viên trưởng',
    description:
      'Lead cabin crew: everything a cabin crew does, plus manifest snapshot, sales handover and cart receiving.',
    platform: 'mobile',
    wave: 'mvp',
    permissions: [
      ...CABIN_CREW_PERMISSIONS,
      'passenger.manifest.load',
      'sales.report.confirm',
      'supply.cart.receive',
    ],
  },
  driver: {
    id: 'driver',
    label: 'Airside Driver',
    labelVi: 'Tài xế sân bay',
    description: 'Accepts and performs airside ride tasks (UC-05).',
    platform: 'mobile',
    wave: 'later',
    permissions: ['portal.notifications.receive', 'ride.task.drive'],
  },
  supplier: {
    id: 'supplier',
    label: 'External Supplier',
    labelVi: 'Nhà cung ứng (ngoài)',
    description: 'External vendor: creates supplement requests and reads finalized catering figures.',
    platform: 'web',
    wave: 'later',
    external: true,
    permissions: ['portal.notifications.receive', 'supply.request.create', 'catering.read'],
  },
  viewer: {
    id: 'viewer',
    label: 'Viewer',
    labelVi: 'Người xem (read-only)',
    description: 'Read-only access to dashboards and reports; makes no changes.',
    platform: 'web',
    wave: 'mvp',
    permissions: [
      'portal.dashboard.view',
      'portal.notifications.receive',
      'equipment.read',
      'equipment.report.view',
      'catering.read',
      'sales.read',
    ],
  },
}

/** Stable display order (grouped web office → equipment → mobile ops → external). */
export const ROLE_ORDER: RoleId[] = [
  'admin',
  'ifs_backoffice',
  'catering_ops',
  'commercial',
  'operations',
  'equipment_staff',
  'supply',
  'dispatcher',
  'boarding_agent',
  'gate_supervisor',
  'cabin_crew',
  'purser',
  'driver',
  'supplier',
  'viewer',
]

export function permissionsForRole(roleId: RoleId): PermissionKey[] {
  return ROLES[roleId]?.permissions ?? []
}

/** True only if the user holds EVERY required permission (AND semantics). */
export function canAccess(
  permissions: PermissionKey[],
  required: PermissionKey | PermissionKey[],
): boolean {
  const needed = Array.isArray(required) ? required : [required]
  return needed.every((key) => permissions.includes(key))
}

/** True if the user holds AT LEAST ONE of the required permissions (OR semantics). */
export function canAccessAny(
  permissions: PermissionKey[],
  required: PermissionKey | PermissionKey[],
): boolean {
  const needed = Array.isArray(required) ? required : [required]
  return needed.some((key) => permissions.includes(key))
}
