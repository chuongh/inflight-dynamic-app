# VietJet Ops Portal — Source Layout

Feature-based structure with a clear split between **app shell**, **pages**, **domain modules**, and **shared UI**.

## Top-level

```
src/
├── app/              # App bootstrap & routing
├── routes/           # Path constants (single source of truth)
├── pages/            # Route-level screens (thin, compose components)
├── modules/          # Domain logic (equipment, future HR, etc.)
├── components/       # Reusable UI (brand, equipment, layout, patterns, primitives)
├── core/             # Auth, permissions, module registry
├── design-system/    # Tokens, theme, brand colors
├── mock-data/        # Demo JSON + loaders (swap for API later)
├── shared/           # Cross-cutting utilities
├── assets/           # Static files (logo, etc.)
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## `app/`

- `App.tsx` — providers (theme, query, auth, router)
- `routes.tsx` — all `<Route>` definitions and data loaders

## `routes/paths.ts`

Central path map used by router, sidebar registry, and navigation links.

```ts
paths.equipment.trolley.detail('ABC123') // → /equipment/ABC123
```

## `pages/`

Organized by feature — one folder per screen group:

| Folder | Screens |
|--------|---------|
| `auth/` | Login |
| `dashboard/` | Dashboard |
| `design-system/` | Design System showcase |
| `equipment/trolley/` | Trolley list & detail |
| `equipment/pos/` | POS list & detail |
| `equipment/ipad/` | iPad list & detail |

Pages should stay thin: fetch via hooks, render via `components/` and `patterns/`.

## `modules/equipment/`

Domain layer for equipment fleet:

| Path | Purpose |
|------|---------|
| `constants.ts` | Status labels, stations, vendors, types |
| `types.ts` | Repair requests, defect catalog types |
| `repairRequest.ts` | Repair request business logic |
| `lib/` | Mock data generators (`generateTrolleys`, `generatePortableDevices`) |
| `hooks/` | React Query hooks (`useTrolleys`, `usePosDevices`, …) |
| `services/` | `EquipmentService` interface + mock/API implementations |
| `index.ts` | Barrel exports |

## `components/`

| Folder | Contents |
|--------|----------|
| `brand/` | `VietJetLogo` |
| `equipment/` | `SendToRepairModal`, `ImportRepairResultsModal`, `TrolleyRepairHistoryDrawer` |
| `layout/` | `AppShell` (sidebar + topbar) |
| `patterns/` | `ListPageLayout`, `PageHeader`, `DetailHero`, `FilterBar`, aviation widgets |
| `primitives/` | `Button`, `Badge`, `Text`, `DaysBadge` |

## Import alias

Use `@/` for imports from `src/`:

```ts
import { paths } from '@/routes/paths'
import { STATIONS } from '@/modules/equipment/constants'
import { formatDateDMY } from '@/shared/utils/format'
```

Configured in `vite.config.ts` and `tsconfig.app.json`.

## i18n (English / Vietnamese)

- Library: `i18next` + `react-i18next`
- Config: `src/i18n/index.ts` (locale stored in `localStorage` key `vj-portal-locale`)
- Translations: `src/i18n/locales/en.json`, `vi.json`
- Hooks: `useEquipmentLabels()`, `useFormatters()` in `src/i18n/hooks/`
- UI switcher: topbar `LanguageSwitcher` in `AppShell`
- Ant Design locale syncs via `VietJetThemeProvider` (`en_US` / `vi_VN`)

In components:

```tsx
const { t } = useTranslation()
t('nav.dashboard')
t('equipment.trolley.footerCount', { filtered: 10, total: 100 })
```

Nav registry uses `labelKey` (e.g. `nav.dashboard`) — translate with `t(module.labelKey)`.

## Adding a new feature module

1. Add paths in `routes/paths.ts`
2. Register in `core/modules/registry.ts`
3. Add routes in `app/routes.tsx`
4. Create `pages/<feature>/` screens
5. Add `modules/<feature>/` for domain logic when needed
