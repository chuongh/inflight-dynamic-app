# Mock data (OPP-016 ADR-7)

Schema-accurate seed data for Equipment Management demo until BFF is ready.

## Structure

| Path | Content |
|------|---------|
| `auth/demo-users.json` | Demo login accounts + roles |
| `defects/defect-catalog.json` | WP-F4 defect master |
| `equipment/trolleys.json` | Trolley fleet (generated) |
| `equipment/pos-devices.json` | POS devices (generated) |
| `equipment/ipads.json` | iPad devices (generated) |
| `loaders/` | Typed loaders + localStorage cache for demo mutations |

## Regenerate equipment JSON

```bash
npm run seed:mock-data
```

This runs `scripts/seed-mock-data.ts` using the same generators as the original prototype.

## Demo users

| Staff ID | Password | Role |
|----------|----------|------|
| VJ1808 | vietjet | admin |
| VJ2401 | vietjet | equipment_staff |
| VJ2402 | vietjet | viewer |

## Backend mapping

Loaders return domain types consumed by `MockEquipmentService`. When API is ready, swap `VITE_DATA_SOURCE=api` and implement `ApiEquipmentService` with the same shapes documented in `src/modules/equipment/api/contracts.ts`.
