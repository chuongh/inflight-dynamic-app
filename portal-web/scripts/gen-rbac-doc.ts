/**
 * Generates `src/core/permissions/RBAC.md` from the RBAC model so the
 * human-readable catalogs never drift from the code.
 *   Run:  npx tsx scripts/gen-rbac-doc.ts
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  PERMISSIONS,
  ROLES,
  ROLE_ORDER,
  ALL_PERMISSIONS,
  type PermissionKey,
  type RoleId,
} from '../src/core/permissions/index.ts'
import demoUsers from '../src/mock-data/auth/demo-users.json' with { type: 'json' }

const MODULE_NAMES: Record<string, string> = {
  M1: 'M1 · Identity, Admin & Portal',
  M2: 'M2 · Boarding & Passenger',
  M3: 'M3 · Ops Ride & Map',
  M4: 'M4 · Catering, Sales & Supply',
  M5: 'M5 · Equipment',
}

const wave = (w: string) => (w === 'later' ? 'Wave sau' : 'MVP')
const permKeys = ALL_PERMISSIONS

const lines: string[] = []
const p = (s = '') => lines.push(s)

p('# OPP-016 — User · Role · Permission (RBAC) reference')
p()
p('> Auto-generated from `src/core/permissions/index.ts` + `src/mock-data/auth/demo-users.json`.')
p('> Regenerate: `npx tsx scripts/gen-rbac-doc.ts`. Do not edit by hand.')
p('> Model: NIST RBAC — User → Role → Permission. Assignment is administered in **UC-09** (Web Portal, Admin only, audit-logged).')
p()
p(`**Totals:** ${demoUsers.length} users · ${ROLE_ORDER.length} roles · ${permKeys.length} permissions.`)
p()

// ── 1. Users ────────────────────────────────────────────────────────────────
p('## 1. Users (current system list)')
p()
p('Demo password for every account: `vietjet`.')
p()
p('| # | Employee code | Name | Department | Job title | Role |')
p('|---|---|---|---|---|---|')
demoUsers.forEach((u, i) => {
  const role = ROLES[u.roleId as RoleId]
  p(`| ${i + 1} | \`${u.employeeCode}\` | ${u.name} | ${u.department} | ${u.jobTitle} | ${role.labelVi} (\`${u.roleId}\`) |`)
})
p()

// ── 2. Roles ────────────────────────────────────────────────────────────────
p('## 2. Roles (validate coverage with end users)')
p()
p('| Role (VI) | Role (EN) | `id` | Platform | Wave | Perms | Description |')
p('|---|---|---|---|---|---|---|')
ROLE_ORDER.forEach((rid) => {
  const r = ROLES[rid]
  const ext = r.external ? ' · external' : ''
  p(`| **${r.labelVi}** | ${r.label} | \`${r.id}\` | ${r.platform}${ext} | ${wave(r.wave)} | ${r.permissions.length} | ${r.description} |`)
})
p()

// ── 3. Permissions ──────────────────────────────────────────────────────────
p('## 3. Permissions (name + description)')
p()
const byModule = new Map<string, PermissionKey[]>()
for (const k of permKeys) {
  const m = PERMISSIONS[k].module
  if (!byModule.has(m)) byModule.set(m, [])
  byModule.get(m)!.push(k)
}
for (const [m, keys] of [...byModule.entries()].sort()) {
  p(`### ${MODULE_NAMES[m] ?? m}`)
  p()
  p('| Permission key | Name | Description | Platform | Wave |')
  p('|---|---|---|---|---|')
  for (const k of keys) {
    const meta = PERMISSIONS[k]
    p(`| \`${k}\` | ${meta.name} | ${meta.description} | ${meta.platform} | ${wave(meta.wave)} |`)
  }
  p()
}

// ── 4. Role × Permission matrix ─────────────────────────────────────────────
p('## 4. Role × Permission matrix')
p()
p('`●` = granted. Columns are roles (see §2); `admin` holds every permission.')
p()
const shortRole: Record<RoleId, string> = {
  admin: 'ADM',
  ifs_backoffice: 'IFS',
  catering_ops: 'CAT',
  commercial: 'COM',
  operations: 'OPS',
  equipment_staff: 'EQP',
  supply: 'SUP',
  dispatcher: 'DSP',
  boarding_agent: 'BRD',
  gate_supervisor: 'GSV',
  cabin_crew: 'CRW',
  purser: 'PSR',
  driver: 'DRV',
  supplier: 'VND',
  viewer: 'VWR',
}
p('Legend: ' + ROLE_ORDER.map((r) => `\`${shortRole[r]}\`=${ROLES[r].label}`).join(' · '))
p()
p('| Permission | ' + ROLE_ORDER.map((r) => shortRole[r]).join(' | ') + ' |')
p('|---|' + ROLE_ORDER.map(() => '---').join('|') + '|')
for (const k of permKeys) {
  const cells = ROLE_ORDER.map((r) => (ROLES[r].permissions.includes(k) ? '●' : ''))
  p(`| \`${k}\` | ${cells.join(' | ')} |`)
}
p()

const outPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/core/permissions/RBAC.md')
writeFileSync(outPath, lines.join('\n'))
console.log(`Wrote ${outPath} (${lines.length} lines)`) // eslint-disable-line no-console
