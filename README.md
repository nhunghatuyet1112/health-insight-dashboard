# Synapse Health — UI-first dashboard

Current screen adapts the user-provided Synapse Health HTML into React components and local Tailwind CSS v4. Fixed text and values match the reference; no API is integrated.

## Run

Node.js 22.12+ (recommended Node 24), npm.

```sh
npm install
npm run dev
npm run build
npm run lint
```

## Structure

- `src/features/dashboard/components/Sidebar.tsx`: desktop navigation and profile.
- `DashboardHeader.tsx`: title, search, date and action previews.
- `DashboardContent.tsx`: hero, KPI cards, CSS bar chart, activities, goals and insights.
- `HealthAssistant.tsx`: fixed conversation and local input interaction.
- `src/stores/dashboard-store.ts`: Zustand UI state.
- `src/index.css`: Tailwind v4 tokens, source glass effects, fonts and responsive adjustments.
- `DESIGN.md`: visual decisions and reference adaptation notes.

React, TypeScript, Zustand, shadcn/ui, Tailwind v4, Recharts and Lucide are installed. This fixed screen uses CSS bars from the reference instead of the previous live Recharts chart. No Tailwind CDN, remote JavaScript, API credentials or LLM calls are needed. Fonts are self-hosted; the profile image retains the reference's remote image URL.

## UI preview behavior

The chat starts open. Minimize/close/launcher toggle it; suggested questions fill the input. Submission is a no-op, identified in the UI. All health data, LIVE markers, model labels and wearable verification claims are static reference copy. Navigation and toolbar actions are presentation placeholders; sync, export, logging and search do not call a service.

The original assessment still requires actual LLM integration, data handling, loading/error states and deployment before submission. `.env.example` is reserved for future server-side integration. Never put provider secrets into `VITE_*` variables.

## Agent skills

Project-scoped skills are in `.agents/skills/`; routing is in `AGENTS.md` and sources/hashes in `.agents/skills-sources.json`.
