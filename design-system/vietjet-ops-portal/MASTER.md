# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** VietJet Ops Portal
**Generated:** 2026-07-14 15:29:33
**Category:** Airline
**Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 4/10 (Standard) | Density 8/10 (Dense / Dashboard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E3A8A` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#3B82F6` | `--color-secondary` |
| Accent/CTA | `#EA580C` | `--color-accent` |
| Background | `#EFF6FF` | `--color-background` |
| Foreground | `#1E40AF` | `--color-foreground` |
| Muted | `#E9EEF5` | `--color-muted` |
| Border | `#BFDBFE` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#1E3A8A` | `--color-ring` |

**Color Notes:** Sky blue + booking orange [Accent adjusted from #F97316 for WCAG 3:1]

### Typography

- **Heading Font:** Amatic SC
- **Body Font:** Cabin
- **Mood:** indie, craft, handmade, artisan, organic, creative
- **Google Fonts:** [Amatic SC + Cabin](https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Cabin:wght@400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Cabin:wght@400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #EA580C;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #1E3A8A;
  border: 2px solid #1E3A8A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #EFF6FF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #1E3A8A;
  outline: none;
  box-shadow: 0 0 0 3px #1E3A8A20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Exaggerated Minimalism

**Keywords:** Bold minimalism, oversized typography, high contrast, negative space, loud minimal, statement design

**Best For:** Fashion, architecture, portfolios, agency landing pages, luxury brands, editorial

**Key Effects:** font-size: clamp(3rem 10vw 12rem), font-weight: 900, letter-spacing: -0.05em, massive whitespace

### Page Pattern

**Pattern Name:** Enterprise Gateway

- **Conversion Strategy:** Path selection (I am a...). Mega menu navigation. Trust signals prominent.
- **CTA Placement:** Contact Sales (Primary) + Login (Secondary)
- **Section Order:** 1. Hero (Video/Mission), 2. Solutions by Industry, 3. Solutions by Role, 4. Client Logos, 5. Contact Sales

---

## Motion

**Page Transition** (Standard) — Trigger: route change | Duration: 400-600ms | Easing: `power2.inOut`

```js
const tl = gsap.timeline(); tl.to('.transition-overlay', { yPercent: 0, duration: 0.4, ease: 'power2.inOut' }).call(navigate).to('.transition-overlay', { yPercent: -100, duration: 0.4, ease: 'power2.inOut', delay: 0.1 });
```

**Framework notes:** Keep the overlay element mounted at the layout root (outside the page component) so it survives the route swap

- ✅ Show a lightweight loading indicator if the destination route's data fetch outlasts the overlay
- ❌ Don't tie the overlay's reveal directly to data-fetch completion without a max-wait timeout; a slow API stalls the whole transition
- ⚡ Prefer CSS transform (yPercent) over top/left to keep the overlay animation on the compositor thread

---

## Anti-Patterns (Do NOT Use)

- ❌ Complex booking
- ❌ Poor mobile

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
