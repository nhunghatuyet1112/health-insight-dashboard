# Health Overview component adoption

The active product consumes React components from `src/components/ui/health-kit.tsx`, `button.tsx` and `rating-scale.tsx`. Their appearance belongs to `health-kit.css`, the button variants and semantic tokens. Feature CSS arranges the page; it must not redefine control colors, borders, disabled states or variants.

| Reference family | Shared implementation | Active consumers |
| --- | --- | --- |
| Primary, secondary, outline, ghost, destructive, loading buttons | `Button`; dashboard adapter `DashboardButton` | Dashboard shell, overview, insights, goals, journal, integrations, landing, assistant |
| Overview surface card/panel | `Card`; dashboard adapter `DashboardPanel` | All active dashboard panels and landing preview |
| Metric cards and coverage/empty conditions | `MetricCard` | Four overview metrics and landing metrics |
| Input, select, textarea and invalid/disabled states | `Input`, `Select`, `Textarea` | Goals, Journal, mobile navigation, assistant composer |
| Permission checkboxes | `Checkbox` | Integration permissions and workout duplicate confirmation |
| 1–5 scales | `RatingScale` | Journal energy, stress and sleep quality |
| Segmented controls | `SegmentedControl` | 7D/30D, overview chart metric, health pillar, activity metric, journal entry type |
| Goal and clamped progress bars | `GoalCard`, `Progress` | Overview and Goals |
| Mock, synced, error, limited, source and code/AI evidence badges | `Badge` with semantic tone | Shell, KPI, integrations, code insights, landing, assistant |
| Evidence cards | `EvidenceCard` | Calculated insights, landing companion, assistant evidence |
| Loading, errors, success and empty states | `LoadingState`, `Feedback`, `EmptyState` | App route loading, assistant, journal, goals, empty charts |
| Native information modal | `Dialog` | Landing data/privacy information |
| Floating assistant | `AIChatbot` composed from shared controls and evidence | Every active dashboard route |

## Semantics preserved

- Values and source labels derive from analytics; source names in the reference are illustrative.
- Metrics below 70% current coverage show the warning card; zero observations show a dashed empty card. Comparison is supplied only when the engine permits it for both periods.
- Resting HR deltas remain neutral; they do not imply a medical outcome. Numeric zero remains valid.
- Progress bars clamp visually and in `aria-valuenow`; text and `aria-valuetext` retain actual percentages above 100%.
- Checkbox/radio/select controls remain native for keyboard navigation and form submission. Native invalid form submissions and explicit `aria-invalid` use the error treatment.
- Loading buttons suppress duplicate activation. Cancel/disconnect remains enabled while sync is pending.
- Dialog uses native focus containment and Escape. Assistant close/minimize, cancellation, retry, context reset and source isolation remain in `AIChatbot`.

## Scope of reference-only examples

The reference illustrates notification/unread, streaming and AI-inclusion switches. The product does not currently expose those capabilities. No fake notifications, simulated streaming or new AI data permissions are introduced by a visual migration. Notes remain excluded from AI. `/reference` and `/first-day` remain archived compositions, outside the active product navigation; shared primitive fixes may flow through them.

## Verification

Run `npm run build`, `npm run lint`, `npm test` and `git diff --check`. Check active routes, 7D/30D, radio scales, provider permissions, sync/error/cancel controls and assistant draft/minimize/close. Inspect desktop and mobile for overflow and the 260px sidebar, 210px KPI cards and 8/4 analytics grid.

### Verified on 2026-10-22

- Build and token synchronization passed; 20 tests passed. Lint reports existing warnings in the installed Vercel skill collection, with no application warnings.
- Desktop at 1274px: four KPI cards measure 210px including borders, with no internal card overflow or horizontal page overflow. 7D/30D updates cards, comparisons and goals.
- Actual 390px iframe viewports: Overview and Journal stack correctly with mobile navigation and wrapping segmented controls. Reusable harness: `design/reference/component-adoption-mobile.html`.
- Provider permission checkbox toggles, sync loading disables permissions, cancel stays available, error retains previous data and Retry restarts sync. Permission selection restored after the check.
- Goal form submits existing values and shows success. Journal entry-type switching preserves the expected default fields and source-resolution selector. Sleep Insights renders trends, code evidence and history.
- Landing native modal opens/closes. Assistant suggested question populates the shared input; minimize/reopen retains the draft without sending an API request.
- Captures: `design/reference/ui-kit-adopted-overview-desktop.png`, `ui-kit-adopted-integrations-desktop.png`, `ui-kit-adopted-mobile.png`.
