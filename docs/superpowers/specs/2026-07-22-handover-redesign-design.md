# Handover Redesign

## Goal

Reduce scrolling and correct the operational ownership of returned goods and onboard devices.

## Information architecture

The handover detail uses compact tabs:

- **Hàng hoá** is returned to Ground.
- **Thiết bị** never goes to Ground. It is either left onboard or transferred to the next crew.
- **Vận hành** appears only for a crew change.

Red is reserved for the primary action and selected navigation. Green indicates completion, yellow indicates a pending acknowledgement, blue is used only for neutral information, and inactive controls remain neutral.

## Goods workflow

The goods tab combines segmented navigation with progressive disclosure:

- The primary view shows only goods with a quantity above zero.
- An empty state is shown when nothing has been entered.
- “Thêm hàng hoá” reveals the searchable catalogue.
- Rows use 16px card padding, 12–16px section gaps, and a minimum 52px touch row.
- The sticky action confirms goods returned to Ground.

## Device workflow

Two options are available:

1. **Để lại trên tàu bay** — the default when there is no receiving crew. The outgoing Purser records the storage location and confirms placement onboard.
2. **Bàn giao tổ bay** — the outgoing Purser marks the devices offered to the next crew. The record then becomes “Chờ tổ mới xác nhận”. The incoming Purser confirms receipt in a second action.

The device workflow is complete only after onboard placement is confirmed or both crews have confirmed transfer.

## Operational handover

Operational metrics and notes are shown only when “Bàn giao tổ bay” is selected. They remain separate from the Ground goods workflow.

## Accessibility and interaction

- Interactive targets are at least 44px.
- Selected tabs expose `aria-selected`.
- Status is conveyed by text as well as color.
- Focus rings use VietJet red.
- Motion remains limited to 150–200ms state feedback and respects reduced motion.
