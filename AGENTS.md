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
