# OPP-016 — User · Role · Permission (RBAC) reference

> Auto-generated from `src/core/permissions/index.ts` + `src/mock-data/auth/demo-users.json`.
> Regenerate: `npx tsx scripts/gen-rbac-doc.ts`. Do not edit by hand.
> Model: NIST RBAC — User → Role → Permission. Assignment is administered in **UC-09** (Web Portal, Admin only, audit-logged).

**Totals:** 15 users · 15 roles · 36 permissions.

## 1. Users (current system list)

Demo password for every account: `vietjet`.

| # | Employee code | Name | Department | Job title | Role |
|---|---|---|---|---|---|
| 1 | `VJ1808` | Nguyen Van Admin | Ground Operations | Equipment Manager | Quản trị hệ thống (`admin`) |
| 2 | `VJ2401` | Tran Thi Equipment | In-Flight Services | Equipment Staff | NV thiết bị (IFS) (`equipment_staff`) |
| 3 | `VJ2402` | Le Van Viewer | Ground Operations | Analyst | Người xem (read-only) (`viewer`) |
| 4 | `VJ3001` | Pham Thi Hoa | In-Flight Services | IFS Back Office Officer | IFS — Điều hành (BackOffice) (`ifs_backoffice`) |
| 5 | `VJ3002` | Do Van Cuong | Catering Operations | Catering Planner | Vận hành suất ăn (`catering_ops`) |
| 6 | `VJ3003` | Nguyen Thi Mai | Commercial | Commercial Executive | Team Commercial (`commercial`) |
| 7 | `VJ3004` | Vu Van Long | Operations Control | Operations Officer | Vận hành (`operations`) |
| 8 | `VJ3005` | Bui Thi Lan | Supply Chain | Supply Coordinator | Bộ phận cung ứng (`supply`) |
| 9 | `VJ3006` | Tran Van Nam | Operations Control | Ramp Dispatcher | Điều phối viên / Admin bản đồ (`dispatcher`) |
| 10 | `VJ4001` | Le Thi Thu | Airport Services | Boarding Agent | Nhân viên cổng (`boarding_agent`) |
| 11 | `VJ4002` | Hoang Van Son | Airport Services | Gate Supervisor | Supervisor cổng (`gate_supervisor`) |
| 12 | `VJ5001` | Nguyen Thi Ngoc | Cabin Crew | Flight Attendant | Tiếp viên (`cabin_crew`) |
| 13 | `VJ5002` | Dang Thi Huong | Cabin Crew | Purser | Tiếp viên trưởng (`purser`) |
| 14 | `VJ6001` | Pham Van Tai | Ground Transport | Airside Driver | Tài xế sân bay (`driver`) |
| 15 | `VJ9001` | SkyChef Catering Co. | External Supplier | Supplier Account | Nhà cung ứng (ngoài) (`supplier`) |

## 2. Roles (validate coverage with end users)

| Role (VI) | Role (EN) | `id` | Platform | Wave | Perms | Description |
|---|---|---|---|---|---|---|
| **Quản trị hệ thống** | System Administrator | `admin` | web | MVP | 36 | Full access. Administers staff, roles and permissions (UC-09); superuser. |
| **IFS — Điều hành (BackOffice)** | IFS Back Office | `ifs_backoffice` | web | MVP | 10 | In-flight service back office: catering compute/finalize, VIP supplements, equipment oversight. |
| **Vận hành suất ăn** | Catering Operations | `catering_ops` | web | MVP | 4 | Computes and reviews meal-preparation figures per aircraft (UC-06). |
| **Team Commercial** | Commercial | `commercial` | web | MVP | 5 | Owns the upsell (catering) quota and reviews onboard-sales performance. |
| **Vận hành** | Operations | `operations` | web | MVP | 9 | Cross-module operations oversight: reviews plans, sales, equipment and dispatch. |
| **NV thiết bị (IFS)** | Equipment Staff | `equipment_staff` | web | MVP | 8 | IFS equipment department: master data, registration, maintenance and defects (M5). |
| **Bộ phận cung ứng** | Supply | `supply` | web | MVP | 5 | Receives and processes supplement requests; coordinates trolley / amenity supply. |
| **Điều phối viên / Admin bản đồ** | Dispatcher / Map Admin | `dispatcher` | web | Wave sau | 5 | Draws & publishes the airport map and dispatches Ops Ride in realtime (UC-08). |
| **Nhân viên cổng** | Boarding Agent | `boarding_agent` | mobile | MVP | 3 | Scans boarding passes at the gate and raises wrong-boarding alerts (UC-02). |
| **Supervisor cổng** | Gate Supervisor | `gate_supervisor` | mobile | MVP | 4 | Handles escalated wrong-boarding cases: block, re-route and close (UC-12). |
| **Tiếp viên** | Cabin Crew | `cabin_crew` | mobile | MVP | 8 | Flight attendant: passenger service, onboard sales, amenities and device handling on board. |
| **Tiếp viên trưởng** | Purser (Lead Cabin Crew) | `purser` | mobile | MVP | 11 | Lead cabin crew: everything a cabin crew does, plus manifest snapshot, sales handover and cart receiving. |
| **Tài xế sân bay** | Airside Driver | `driver` | mobile | Wave sau | 2 | Accepts and performs airside ride tasks (UC-05). |
| **Nhà cung ứng (ngoài)** | External Supplier | `supplier` | web · external | Wave sau | 3 | External vendor: creates supplement requests and reads finalized catering figures. |
| **Người xem (read-only)** | Viewer | `viewer` | web | MVP | 6 | Read-only access to dashboards and reports; makes no changes. |

## 3. Permissions (name + description)

### M1 · Identity, Admin & Portal

| Permission key | Name | Description | Platform | Wave |
|---|---|---|---|---|
| `portal.dashboard.view` | View dashboard | Open the operations dashboard and its KPI / station widgets. | web | MVP |
| `portal.notifications.receive` | Receive notifications | Receive operational push / in-app notifications addressed to the user. | both | MVP |
| `admin.users.read` | View staff directory | Browse the list of staff (employee code, name, department, job title). | web | MVP |
| `admin.users.manage` | Manage staff & assignments | Create / edit staff records and assign a role to a user (UC-09). | web | MVP |
| `admin.roles.manage` | Manage roles & permissions | Create / edit roles and map permissions to roles (UC-09). | web | MVP |
| `admin.audit.view` | View audit log | Read the audit trail of authorization and administrative changes. | web | MVP |

### M2 · Boarding & Passenger

| Permission key | Name | Description | Platform | Wave |
|---|---|---|---|---|
| `boarding.scan` | Scan boarding pass | Scan boarding passes and validate passengers against the served flight (UC-02). | mobile | MVP |
| `boarding.case.view` | View boarding cases | See wrong-boarding alerts and their case status. | mobile | MVP |
| `boarding.case.handle` | Handle boarding cases | Accept, block, re-route and close wrong-boarding cases (Supervisor only, UC-12). | mobile | MVP |
| `passenger.profile.view` | View passenger profile | View the unified passenger profile incl. SSR / pre-meal (PII — crew of the flight only, UC-03). | mobile | MVP |
| `passenger.service.update` | Update passenger service | Mark passenger service delivered and sync per leg (UC-03). | mobile | MVP |
| `passenger.manifest.load` | Load flight manifest | Load and lock the shared flight-manifest snapshot for the crew (Purser, UC-03). | mobile | MVP |

### M3 · Ops Ride & Map

| Permission key | Name | Description | Platform | Wave |
|---|---|---|---|---|
| `ride.request.create` | Book airside ride | Request an airside pickup/dropoff; system auto-assigns a driver (UC-04). | mobile | Wave sau |
| `ride.task.drive` | Drive ride tasks | Accept, navigate and complete airside ride tasks as a driver (UC-05). | mobile | Wave sau |
| `map.dispatch.manage` | Manage map & dispatch | Draw/publish the airport map and dispatch rides in realtime (UC-08). | web | Wave sau |
| `dispatch.read` | View dispatch board | View the realtime dispatch board (driver positions & running trips). | web | Wave sau |
| `airports.read` | View airports | View airport / station master data. | web | MVP |

### M4 · Catering, Sales & Supply

| Permission key | Name | Description | Platform | Wave |
|---|---|---|---|---|
| `catering.read` | View catering | View catering plans, meal figures and amenity stock. | web | MVP |
| `catering.plan.compute` | Compute meal plan | Compute meals to prepare per aircraft/day (pre-meal + upsell + crew meals, UC-06). | web | MVP |
| `catering.quota.manage` | Manage upsell quota | Review / edit and version the upsell (catering) quota dataset (UC-10, Commercial). | web | MVP |
| `catering.finalize` | Finalize catering figures | Lock the 15:00 T-1 meal figures to the supplier and track Delta View (UC-18). | web | MVP |
| `catering.amenities.declare` | Declare amenities | Declare remaining amenities per leg; updates stock (UC-16, crew). | mobile | MVP |
| `catering.vip.manage` | Manage VIP supplements | Create VIP / SkyBoss supplement requests and notify Supply + Crew (UC-17). | both | MVP |
| `sales.read` | View sales | Open the onboard-sales dashboard (quantities + revenue by currency, UC-11). | web | MVP |
| `sales.declare` | Declare goods sold | Declare goods sold per leg with amount and currency (UC-07, crew). | mobile | MVP |
| `sales.report.confirm` | Confirm sales handover | Aggregate trolley sales and confirm the sales handover report (Purser, UC-07). | mobile | MVP |
| `supply.request.create` | Create supply request | Create a pre-flight supply / equipment supplement request (UC-20). | both | MVP |
| `supply.request.process` | Process supply request | Process / approve and update the status of supplement requests (Supply dept, UC-20). | web | MVP |
| `supply.cart.receive` | Receive cart | Receive & reconcile the packed cart at flight start; dual sign-off on mismatch (Purser, UC-21). | mobile | MVP |

### M5 · Equipment

| Permission key | Name | Description | Platform | Wave |
|---|---|---|---|---|
| `equipment.read` | View equipment | View equipment list, status and history timeline (UC-15). | web | MVP |
| `equipment.edit` | Manage equipment | Register and edit equipment master data — carts / POS / iPad (UC-22, UC-15). | web | MVP |
| `equipment.maintenance` | Manage maintenance | Send equipment to repair and update repair status / results (UC-23). | web | MVP |
| `equipment.defect.manage` | Manage defect catalog | Maintain the defect catalog and cart/POS quota master data (UC-15). | web | MVP |
| `equipment.report.view` | View fault reports | View equipment fault / repair-history reports (UC-15, UC-23). | web | MVP |
| `equipment.handover` | Hand over equipment | Hand over / receive a cart, POS or iPad with two-party confirm (UC-13, UC-24, crew). | mobile | MVP |
| `equipment.defect.report` | Report equipment defect | Report equipment damage on the spot with photo & defect reason (UC-14, crew). | mobile | MVP |

## 4. Role × Permission matrix

`●` = granted. Columns are roles (see §2); `admin` holds every permission.

Legend: `ADM`=System Administrator · `IFS`=IFS Back Office · `CAT`=Catering Operations · `COM`=Commercial · `OPS`=Operations · `EQP`=Equipment Staff · `SUP`=Supply · `DSP`=Dispatcher / Map Admin · `BRD`=Boarding Agent · `GSV`=Gate Supervisor · `CRW`=Cabin Crew · `PSR`=Purser (Lead Cabin Crew) · `DRV`=Airside Driver · `VND`=External Supplier · `VWR`=Viewer

| Permission | ADM | IFS | CAT | COM | OPS | EQP | SUP | DSP | BRD | GSV | CRW | PSR | DRV | VND | VWR |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `portal.dashboard.view` | ● | ● | ● | ● | ● | ● | ● | ● |  |  |  |  |  |  | ● |
| `portal.notifications.receive` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `admin.users.read` | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `admin.users.manage` | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `admin.roles.manage` | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `admin.audit.view` | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `boarding.scan` | ● |  |  |  |  |  |  |  | ● | ● |  |  |  |  |  |
| `boarding.case.view` | ● |  |  |  |  |  |  |  | ● | ● |  |  |  |  |  |
| `boarding.case.handle` | ● |  |  |  |  |  |  |  |  | ● |  |  |  |  |  |
| `passenger.profile.view` | ● |  |  |  |  |  |  |  |  |  | ● | ● |  |  |  |
| `passenger.service.update` | ● |  |  |  |  |  |  |  |  |  | ● | ● |  |  |  |
| `passenger.manifest.load` | ● |  |  |  |  |  |  |  |  |  |  | ● |  |  |  |
| `ride.request.create` | ● |  |  |  | ● |  |  |  |  |  |  |  |  |  |  |
| `ride.task.drive` | ● |  |  |  |  |  |  |  |  |  |  |  | ● |  |  |
| `map.dispatch.manage` | ● |  |  |  |  |  |  | ● |  |  |  |  |  |  |  |
| `dispatch.read` | ● |  |  |  | ● |  |  | ● |  |  |  |  |  |  |  |
| `airports.read` | ● |  |  |  | ● | ● |  | ● |  |  |  |  |  |  |  |
| `catering.read` | ● | ● | ● | ● | ● |  | ● |  |  |  |  |  |  | ● | ● |
| `catering.plan.compute` | ● | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |
| `catering.quota.manage` | ● |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |
| `catering.finalize` | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `catering.amenities.declare` | ● |  |  |  |  |  |  |  |  |  | ● | ● |  |  |  |
| `catering.vip.manage` | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `sales.read` | ● | ● |  | ● | ● |  |  |  |  |  |  |  |  |  | ● |
| `sales.declare` | ● |  |  |  |  |  |  |  |  |  | ● | ● |  |  |  |
| `sales.report.confirm` | ● |  |  |  |  |  |  |  |  |  |  | ● |  |  |  |
| `supply.request.create` | ● | ● |  |  |  |  | ● |  |  |  | ● | ● |  | ● |  |
| `supply.request.process` | ● |  |  |  |  |  | ● |  |  |  |  |  |  |  |  |
| `supply.cart.receive` | ● |  |  |  |  |  |  |  |  |  |  | ● |  |  |  |
| `equipment.read` | ● | ● |  |  | ● | ● |  |  |  |  |  |  |  |  | ● |
| `equipment.edit` | ● |  |  |  |  | ● |  |  |  |  |  |  |  |  |  |
| `equipment.maintenance` | ● |  |  |  |  | ● |  |  |  |  |  |  |  |  |  |
| `equipment.defect.manage` | ● |  |  |  |  | ● |  |  |  |  |  |  |  |  |  |
| `equipment.report.view` | ● | ● |  |  | ● | ● |  |  |  |  |  |  |  |  | ● |
| `equipment.handover` | ● |  |  |  |  |  |  |  |  |  | ● | ● |  |  |  |
| `equipment.defect.report` | ● |  |  |  |  |  |  |  |  |  | ● | ● |  |  |  |
