# DESIGN.md — KhetGPT Frontend Design System

**Direction:** Vibrant Agri-Tech (Solar & Flora / Modern High-Contrast Precision)  
**Target User:** Farmers, field officers, and agronomists using mid-to-low-end smartphones in bright outdoor sunlight as well as desktop displays.  
**Core Aesthetic:** Optimistic, luminous, tactile, and precise. Combines deep fertile emeralds and mineral darks with solar maize/ochre accents, crisp white card surfaces, and accessible contrast ratios.

---

## 1. Visual Direction Rationale

1. **Outdoor Legibility:** In harsh direct sunlight, subtle pastels and low-contrast grays fail. Vibrant Agri-Tech utilizes rich chlorophyll greens (`#146C43`), deep mineral text (`#122017`), and solar ochre highlights against crisp, light card backgrounds with clear borders to guarantee AAA readability.
2. **Tactile Ergonomics:** Every interactive element satisfies a minimum 44px touch target (`min-h-[44px]`), prominent focus rings for accessibility, and distinctive hover and active depressions.
3. **Room for 3D Standout:** The clean, luminous card surfaces and crisp layout establish a calm, grounded frame that allows the standout 3D soil core / crop canopy scene (PRD Feature 12) to feel vivid, glowing, and integrated rather than gimmicky.
4. **Never Color Alone:** Following agronomic safety principles, risk levels (Low, Medium, High) are never communicated by color alone. Every badge, indicator, and warning couples color with a distinct icon and explicit text label.

---

## 2. Color Palette & Tokens

| Token Family | Name | Hex / Value | Purpose |
|---|---|---|---|
| **Base Canvas** | `--color-bg-base` | `#F8FAF6` | Warm organic off-white app background |
| **Card Surface** | `--color-bg-surface` | `#FFFFFF` | Crisp pure white elevated cards and panels |
| **Subtle Fill** | `--color-bg-subtle` | `#F0F5EE` | Input backgrounds, hover states, table stripes |
| **Muted Fill** | `--color-bg-muted` | `#E4ECE1` | Disabled states, chip backgrounds |
| **Text Primary** | `--color-text-primary` | `#122017` | High-contrast mineral green-black (AAA body copy) |
| **Text Secondary** | `--color-text-secondary` | `#33473B` | Supporting descriptions and metadata |
| **Text Muted** | `--color-text-muted` | `#5C7365` | Placeholders, inactive labels, captions |
| **Text Inverse** | `--color-text-inverse` | `#FFFFFF` | High-contrast text on primary buttons & dark chips |
| **Primary 50** | `--color-primary-50` | `#EDF8F1` | Light primary tint for active tabs and highlights |
| **Primary 100** | `--color-primary-100` | `#D6F0E0` | Hover states on subtle primary buttons |
| **Primary 500** | `--color-primary-500` | `#1B8755` | Vibrant growth emerald |
| **Primary 600** | `--color-primary-600` | `#146C43` | Primary brand action color, submit buttons |
| **Primary 700** | `--color-primary-700` | `#0E5232` | Pressed / active states, dark accents |
| **Primary 900** | `--color-primary-900` | `#07331E` | Deep forest dark tone |
| **Solar Ochre** | `--color-accent-ochre` | `#D97706` | Sunlit highlight, key callout badges |
| **Solar Maize** | `--color-accent-maize` | `#FEF3C7` | Warm sunlit banner background |
| **Borders** | `--color-border-subtle` | `#E3EBE2` | Card separators, subtle boundaries |
| **Borders** | `--color-border-default` | `#CBD8CA` | Standard input borders, card frames |
| **Borders** | `--color-border-strong` | `#96AF95` | Active focus borders, selected states |
| **Risk Low** | `--color-risk-low-bg`<br>`--color-risk-low-text`<br>`--color-risk-low-border` | `#EDF8F1`<br>`#146C43`<br>`#86EFAC` | Balanced nutrients (Shield icon + "Low Risk" text) |
| **Risk Medium** | `--color-risk-med-bg`<br>`--color-risk-med-text`<br>`--color-risk-med-border` | `#FEF3C7`<br>`#B45309`<br>`#FCD34D` | Caution/deficit (AlertTriangle icon + "Medium Risk" text) |
| **Risk High** | `--color-risk-high-bg`<br>`--color-risk-high-text`<br>`--color-risk-high-border` | `#FEE2E2`<br>`#B91C1C`<br>`#FCA5A5` | Over-application danger (AlertOctagon icon + "High Risk" text) |

---

## 3. Typography Pairing & Bilingual Support

- **Primary Latin & Numerals:** `Plus Jakarta Sans` (weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold). Modern, geometric yet warm grotesque with excellent figure legibility for kg/ha numbers.
- **Devanagari (Hindi) Pairing:** `Noto Sans Devanagari` (weights: 400, 500, 600, 700). Matched optical x-height and stroke width ensures seamless visual rhythm when toggling English/Hindi.
- **Self-Hosted Delivery:** Both font families are delivered locally via `@fontsource` as self-hosted modern `.woff2` files with `font-display: swap`. Zero cloud dependencies; offline capable.

---

## 4. Spacing Scale & Touch Targets

Built upon a strict 4px modular scale:
- `--space-1`: `0.25rem` (4px)
- `--space-2`: `0.5rem` (8px)
- `--space-3`: `0.75rem` (12px)
- `--space-4`: `1rem` (16px)
- `--space-5`: `1.25rem` (20px)
- `--space-6`: `1.5rem` (24px)
- `--space-8`: `2rem` (32px)
- `--space-10`: `2.5rem` (40px)
- `--space-12`: `3rem` (48px)
- `--space-16`: `4rem` (64px)

**Touch Target Rule:**
All interactive elements (buttons, inputs, selects, tab triggers, icon buttons) enforce a minimum bounding box of **44 × 44 px** (`min-h-[44px]`). On mobile touch devices, tap targets are guaranteed never to cause accidental mis-taps.

---

## 5. Motion Principles

1. **Performance First:** Motion must never drop frames on low-end Android hardware. CSS transforms and opacity only; no layout-triggering properties (`width`, `height`, `top`).
2. **Timing & Easing:**
   - Instant: `75ms` (`--dur-instant`) for micro-clicks and checkboxes.
   - Fast: `150ms` (`--dur-fast`) for button hover/active and dropdown expands.
   - Normal: `250ms` (`--dur-normal`) for modal fade-ins, toasts, and card transitions.
   - Ease Curve: `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-spring`) snappy responsive feel.
3. **Accessibility:** Full compliance with `@media (prefers-reduced-motion: reduce)`. When active, animations degrade to instant opacity fades or zero-duration transitions.
