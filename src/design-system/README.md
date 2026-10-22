# health-overview-2026-10

The user-supplied specification is normalized in `tokens.json`: all colors, nine typography roles, spacing and radius scales. This is the authoritative design system for the active landing, onboarding, dashboard, first-day view and chatbot.

`npm run design:tokens` generates `theme.css`. Never edit the generated CSS directly. `npm run design:check` checks exact synchronization and runs automatically during build.

## Usage

- Colors: `var(--color-primary)`, `var(--color-secondary)`, `var(--color-accent)`, `var(--color-surface)` or Tailwind equivalents.
- Typography: `font: var(--type-body-md)` in component CSS, or `font-body-md text-body-md` in Tailwind. Add `letter-spacing: var(--type-label-md-tracking)` for labels.
- Spacing: `var(--spacing-card-padding)` / `p-card-padding`, `var(--spacing-section-padding)` / `p-section-padding`.
- Radii: `var(--radius-card)` / `rounded-card` (12px), `var(--radius-control)` / `rounded-control` (8px), `var(--radius-pill)` / `rounded-pill` (9999px).
- Buttons, inputs, selects and composer use control radius. Major panels and selection cards use card radius. Nested rows may use the supplied md radius (12px).

`secondary` is mint #4EDEA3. Cyan #38BDF8 is `accent`; it is not the secondary color. Charts use primary, accent, secondary and tertiary-fixed-dim for distinct series. Shadcn foreground/background, muted, destructive, input, ring and chart aliases resolve to these same tokens.

The HTML references continue to define page composition and interactions. The Health Overview reference supersedes earlier literal colors, type sizes, padding and radii. Layout geometry (sidebar 260px, compact KPI cards, analytics 8/4, landing split and chat width 370px) remains stable.

## Component reference and states

The source reference is `design/reference/health-overview.html`. It defines the button, KPI, form, permission, progress, badge and floating assistant state language. See `DESIGN.md` for the full implementation contract.

Filled actions use `action`, `action-hover`, `action-pressed`; `primary` remains the telemetry brand color. `border-strong`, `warning`, `error` and `disabled-foreground` cover shared states. Body uses Space Grotesk and headings use Inter. The global sans alias follows the body role.

`Button` supports `loading` (spinner, aria-busy, disabled activation), `disabled`, and six visual variants. `DashboardButton` defaults to a slate secondary variant; pass a variant explicitly when needed. Dashboard fields use `aria-invalid="true"` for visual errors; callers must associate explanatory text using `aria-describedby`.

The archived sample HTML uses CDN Tailwind only as a reference. Application runtime continues using the local Tailwind v4 pipeline and self-hosted fonts.

`RatingScale` in `src/components/ui/rating-scale.tsx` supplies the shared 1–5 radio scale for journal energy, stress and sleep quality. It preserves native arrow-key selection, form submission and saved edit defaults. Journal delete actions use the destructive button variant.

## Adoption

The active product now consumes shared React components, not just tokens. See [ADOPTION.md](./ADOPTION.md) for the reference-to-component-to-screen matrix, ownership boundaries and state semantics. `health-kit.tsx` and `health-kit.css` provide the shared families; `DashboardSystem` remains the dashboard adapter.
