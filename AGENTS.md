# Project agent guidance

This project uses React, TypeScript, Vite, Zustand, shadcn/ui, Tailwind CSS v4, and Recharts.

## Local skills

Project-scoped skills live in `.agents/skills/`. Read the relevant `SKILL.md` before applying it; do not apply every installed skill to every task.

- React implementation/performance: `react-best-practices`.
- Component API/composition: `composition-patterns`.
- UI review: `web-interface-guidelines` (full checklist requested through Aura), with `web-design-guidelines` as the upstream review workflow. These overlap; avoid duplicate findings.
- Tailwind v4 tokens/components/responsive patterns: `tailwind-design-system` (listed as Tailwind Design System v4 on Aura).
- React transitions: `react-view-transitions`, when requested and supported by the installed React version.
- Documentation review: `writing-guidelines`.
- Deployment and Vercel operations: `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize`, only when relevant and authorized by the user. Installing these skills does not authorize deployment or credential access.
- `react-native-skills` belongs to the requested Vercel collection; this is a web project, so it does not apply unless native development is requested.

Source URLs and hashes are recorded in `.agents/skills-sources.json`. The only adaptation to the Aura Web Interface Guidelines source is adding `name: web-interface-guidelines` to its frontmatter for skill discovery.

## Checks

For application changes run `npm run build` and `npm run lint`. Preserve the starter scope unless asked to implement the complete assessment. Never expose LLM secrets through `VITE_*` variables.

## Fixed dashboard design — mandatory

Before UI work, read `DESIGN.md`. The current visual authority is the user-supplied **health-overview-2026-10** specification in `src/design-system/tokens.json`. It supersedes older literal tokens in the HTML references. Those HTML files still define composition: preserve the 260px sidebar, compact header/hero, compact KPI row, 8/4 analytics layout, landing split and chat structure. Do not redesign or invent another palette/type/spacing/radius scale during feature/data/refactor work. Only an explicit user design request authorizes foundational changes.

Use semantic tokens throughout landing, onboarding, dashboard and chatbot. Run `npm run design:tokens` after editing the JSON; never edit `theme.css` by hand. Build validates generated CSS through `design:check`. Secondary is mint #4EDEA3; cyan is accent #38BDF8. Major cards use 16px padding/12px radius; controls 8px radius; typography follows the supplied named roles.

Use `DashboardShell`, `DashboardPanel` and `DashboardButton` in `src/features/dashboard/components/DashboardSystem.tsx`. Keep dashboard appearance in `dashboard-system.css` and semantic tokens in `src/index.css`; do not use onboarding `.flow-*` / `.first-*` layout or panel styles for dashboard pages. Extend established primitives for new widgets, loading/empty/error states. Preserve working interactions and data computations. Compare affected UI with the fixed HTML and saved baseline after shared styling changes.

## Shared component adoption

Use `src/components/ui/health-kit.tsx` for Card, Badge, Input, Select, Textarea, Checkbox, SegmentedControl, Progress, GoalCard, MetricCard, EvidenceCard, Feedback, EmptyState, LoadingState and Dialog. Use `Button` and `RatingScale` from their UI modules. See `src/design-system/ADOPTION.md` for consumers and scope. Extend the shared primitive for new states; do not copy controls into feature markup or override button variants through feature CSS. Keep analytics and permission behavior in existing stores/engine.
