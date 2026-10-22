# Health Insight design contract

## Visual authority

`health-overview-2026-10`, supplied by the user on 22 October 2026, is the visual standard for the entire active app. The exact supplied HTML is saved in `design/reference/health-overview.html`. It supersedes the earlier component-library v2.4 palette, font assignments and density. Other references remain historical.

## Foundations

`src/design-system/tokens.json` owns semantic values. Run `npm run design:tokens` to generate `theme.css`; never edit generated CSS. Build checks synchronization.

- Canvas #090D16; sidebar/header #0D111A; surface #10131A; low container #191B23; container #1D1F27; high #272A32; highest #32353D; recessed content #0B0E15; fields #131722.
- Primary/actions #4ADE80; secondary #4EDEA3; cyan accent #38BDF8; tertiary #BEE5FF; primary text #E1E2EC; secondary text #BCCABB; outline #3D4A3E at 30–40%; error #FFB4AB; warning #FBBF24.
- Headings and metric values: Inter. Body: Space Grotesk. Measurement labels: JetBrains Mono. Fonts are self-hosted. Compact body 12px/16px, labels 10–12px, section titles 14px/20px, hero 20px/28px, KPI value 24px bold.
- Cards: 16px padding and 12px radius. Controls: 8px radius. Main padding and section gaps: 24px. KPI gap: 16px. Pills: 9999px radius.

## Composition

DashboardShell owns the 260px desktop sidebar, nested Activity/Sleep/Recovery navigation, profile card and sticky compact header with fixed baseline dates. The header contains working metric search, 7/30/60-day selection, simulated Sync Data, JSON export and a status dialog. Controls wrap when the viewport requires it. Sidebar hides below 768px and a native page select supplies mobile navigation.

Overview follows the supplied hierarchy: compact greeting/source banner; four KPI cards; full-width Activity & Health Trends with metric tabs and calculated sleep evidence; an 8/4 lower grid with daily telemetry/workouts and goals/journal. Four KPI columns start at 1024px, two at 640px, and one below. The lower grid stacks below 1024px. Workspace max width is 1600px. Source names, values, coverage and insights come from analytics, rather than the illustrative reference numbers.

The floating assistant is 370px wide (clamped on small screens), with separate header, scrollable body and composer; its body is at most 256px. Surface #0F1420, header/composer #131926, green user bubbles and container-colored assistant bubbles follow the reference. Existing clear, minimize, close, retry and evidence behavior remains functional.

Landing, Insights, Goals, Journal and Devices consume these same foundations and shared components. Their product-specific forms/content remain available. Legacy `/reference` and `/first-day` are archive previews outside the active navigation.

## Ownership

`src/components/ui/health-kit.tsx` / `health-kit.css` own Card, Badge, fields, checkbox, segmented control, progress, goals, metrics, evidence, feedback, loading, empty and Dialog primitives. Button variants live in `button.tsx`; RatingScale owns the native 1–5 radio control. Extend these components instead of duplicating controls or overriding variants in feature CSS.

`DashboardSystem.tsx` adapts shell, panels and buttons. `dashboard-system.css` owns dashboard layout; `landing.css` owns landing composition. All feature appearance resolves semantic tokens.

## Data and behavior

The fixed 60-day synthetic dataset covers Aug 20–Oct 18, 2026, GMT+7. Active comparisons retain 7D/30D equal-length periods and require 70% coverage in both periods. All 60D displays the entire baseline; prior coverage is zero and comparisons remain unavailable. Missing observations remain null/gaps; recorded zero remains valid. Keep `connectNulls={false}`. Provider priority, permissions, workout deduplication, journal persistence, goal calculations and source disconnection behavior stay in the existing store/engine.

AI uses POST /api/chat with server-owned analytics. Never expose secrets through VITE variables, fabricate sample conversations as real answers, or add clinical/live-sensor claims. Notes stay in the browser. Source/context changes cancel or reset conversation under the existing contracts.

## Verification

Run build, lint and relevant tests. Verify desktop/mobile overflow, typography, navigation, filters, forms, empty/limited/loading/error states and chat. `design/reference/health-overview.html` is the composition and visual comparison source; it is not executable application code and its CDN scripts are not imported into the app.

## KPI card fidelity correction

The supplied KPI screenshot is the authority for metric cards: 210px minimum height, 16px padding, JetBrains Mono regular 12px titles, 10px source labels, Inter bold 24px values, Space Grotesk 12px units and mono comparisons. Footer uses two columns rather than stacked target rows. Steps show observed target achievement, active minutes show weekly pace/goal, sleep shows its source and resting HR shows the earlier observed baseline. Limited coverage replaces the header source with an amber badge and shows the required day count; no limited state is fabricated for sufficient data. Card navigation remains keyboard accessible through a full-card action with visible focus, without the extra footer arrow.

## Header action fidelity

Desktop actions use 12px gaps, a 256×30px Space Grotesk search field, 4px-padded telemetry range group with 12px mono labels and an `(Active)` suffix on the selected range, 32px-high mono Sync/Export buttons, and a 32px recessed status button. Sync uses a primary green icon; the status button displays a green connected-source dot. Segmented appearance and compact button sizing live in the shared primitives; feature CSS only arranges the cluster.

## Telemetry chart fidelity

The latest supplied chart screenshot defines the overview chart: title `Telemetry Trendline`, inline aggregation badge and right-aligned solid-green metric selection. The recessed chart surface contains a mono legend, personal target and observed maximum/date; the Y axis is hidden, horizontal grid lines are dashed and dates use abbreviated month/day labels. The area uses straight segments with a green gradient and preserves null gaps. Hover shows a cyan dashed cursor and a source/date/value/goal tooltip calculated from the hovered record. The sleep insight is a compact horizontal code-rule banner with framed icon, adjacent title/badge and trailing Explore Sleep action. Text remains calculated evidence, not the illustrative correlation claim in the screenshot.

## Workout list

Recent Workouts has no session count or View all/Show recent toggle. Its deduplication description sits directly below the title. A keyboard-focusable scroll region is capped at 320px. Variable-height rows are measured with ResizeObserver; only visible rows plus two overscan rows on each side mount. List items retain stable event IDs, list positions and total-size accessibility metadata. Range/source changes reset the list, and empty sources retain the existing empty state.

## Synapse assistant fidelity

The latest assistant screenshot supersedes the former badge/suggestion-heavy layout. Header uses a robot icon, Synapse AI Assistant title, plain grounding subtitle and minimize action. Clear becomes available with a draft or conversation. The launcher only appears while minimized; Escape also minimizes and retains conversation. Suggested questions remain available through composer autocomplete rather than visible chips. The intro is deterministic analytics, with a grouped Grounded Telemetry card and a calculated action; subsequent submissions still use the real API and preserve evidence, provenance, retry/cancellation and context reset. The single-row composer uses a recessed input and green upward-arrow button, functionally disabled for empty/pending input. Self-hosted fonts and the shared 370px/small-screen-clamped window remain.
