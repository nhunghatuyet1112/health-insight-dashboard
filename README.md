# Health Insight

Your personal health intelligence companion. A demo wellness product built with React, TypeScript, Vite, Zustand, Tailwind CSS v4, shadcn/ui and Recharts.

Explore **Activity, Sleep and Recovery** through Overview, Health Insights, Wellness Journal, Goals and Devices & Integrations. A floating assistant uses real AI responses through a Node.js proxy grounded in the same computed data as the dashboard. No account is required.

## Contents

- [Setup instructions](#setup-instructions)
- [Environment variable documentation](#environment-variable-documentation)
- [Architecture](#architecture)
- [Key product decisions](#key-product-decisions)
- [LLM/prompt approach](#llmprompt-approach)
- [Product flows](#product-flows)
- [Data contract and calculations](#data-contract-and-calculations)
- [Chat API](#chat-api)
- [Validation and design](#validation-and-design)
- [Manual data and coverage policy](#manual-data-and-coverage-policy)
- [Conversation regression](#conversation-regression)
- [Documentation map](#documentation-map)

## Setup instructions

Use Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

`dev` compiles the server, starts the API at `127.0.0.1:8787`, and starts Vite at its printed frontend address (normally `http://localhost:5173`). Vite proxies `/api` to the server. If server-side code changes, restart `dev` to recompile it; frontend changes use Vite HMR.

For a local production build:

```sh
npm run build
npm start
```

Open `http://127.0.0.1:8787`. The Node server serves both `dist/` and `/api/chat` (`/api/assistant` is an alias). `npm run preview` only previews static frontend assets; use `npm start` to exercise the API. `PORT` configures the app/API port. No deployment is included.

### Configure Gemini

Copy `.env.example` to `.env` and configure Gemini:

```sh
cp .env.example .env
```

```dotenv
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.1-flash-lite
PORT=8787
```

Restart `npm run dev` (or `npm start` after building) after configuration changes. The browser calls only `/api/chat`; the Node.js server reads `GEMINI_API_KEY` at runtime and calls Gemini’s generateContent API. Production must run the Node server, not only host the static `dist/` folder. The server serves only `dist/`, so `.env` is not a public asset; `.env` is also ignored by Git.

## Environment variable documentation

All variables below are read by the Node server; none is a browser secret or a `VITE_*` setting.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | For chat only | None | Authenticates server requests to Gemini. Dashboard features work without it. |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Response Generator model; must support JSON Schema structured output. |
| `GEMINI_UNDERSTANDING_MODEL` | No | Resolved `GEMINI_MODEL` | Optional separate model for Request Understanding; also requires structured output. |
| `PORT` | No | `8787` | Node API/static-server port. The Vite development proxy reads the same `PORT` from the process environment or `.env`. |
| `HOST` | No | `127.0.0.1` | Node listen address. Set explicitly for a container or remote host when needed. |

## Architecture

The application has a React client and a Node HTTP server. Vite proxies `/api` during development; the Node server serves the built frontend and API together in production mode.

| Layer | Source | Responsibility |
| --- | --- | --- |
| Routing and screens | `src/App.tsx`, `src/features/landing/`, `src/features/health/` | Hash routes, dashboard views, journal, goals and simulated integrations. |
| Client state | `src/stores/health-store.ts`, `src/stores/dashboard-store.ts`, `src/stores/onboarding-store.ts` | Zustand preferences, source permissions, journal and archive-compatible profile state. |
| Shared analytics | `src/features/health/model.ts`, `demo.ts`, `entries.ts`, `engine.ts` | Typed synthetic observations, source selection, normalization, coverage and deterministic calculations used by both runtimes. |
| UI system | `src/components/ui/`, `src/features/dashboard/components/DashboardSystem.tsx`, `src/design-system/` | Shared controls, dashboard adapters and generated semantic tokens. |
| HTTP boundary | `server/index.ts` | Chat routes, body/rate limits and static production assets. |
| LLM orchestration | `server/chat.ts`, `src/features/assistant/` | Input validation, canonical analytics, two-stage prompts, bounded history, output validation and trusted evidence. |

Client requests describe sources, permissions, goals, structured journal data and the selected period. The server validates these inputs and recomputes measurements rather than trusting browser totals. Only the server calls Gemini. There is no database, authentication service or real wearable integration. Browser localStorage keeps demo settings and journal entries; chat stays in memory.

## Key product decisions

### Build for everyday wellness and habit improvement

**Target users:** health-conscious adults who want to monitor their wellness, understand trends and improve daily habits.

Health Insight consolidates data from simulated wearable integrations and manual logging, then combines a personal dashboard with an AI Health Assistant to turn observations into meaningful insights and practical next steps. The core benefit is helping users understand their patterns and choose what to focus on. Activity, Sleep and Recovery define the scope; nutrition, live workout tracking and medical diagnosis are outside the current product.

### Organize Dashboard Overview around four user questions

| User question | What Overview provides | Why this decision matters |
| --- | --- | --- |
| **How am I doing?** | Daily Steps, Active Minutes, Sleep Duration and Resting HR cards, with units, sources and coverage. | Four familiar signals make current wellness understandable at a glance. Steps and sleep use observed-day averages, activity uses the period total, and resting HR uses an average with historical baseline context. |
| **Am I improving?** | 7D/30D selection, comparisons against an equally long previous period and a metric-switchable Telemetry Trendline. | Trends provide context beyond a single reading. Missing observations remain gaps and comparisons need sufficient coverage, so incomplete data does not become a misleading improvement claim. |
| **Am I reaching my goals?** | Goals Progress, personal target context and steps/sleep target lines on the chart. | Editable targets connect observations to the user's own intentions. Weekly activity pace is distinguished from measured totals, and progress labels retain actual values even when bars reach 100%. |
| **What should I focus on?** | “What deserves your attention?” cards with calculated observations and links to deeper insights. | Actionable interpretation sits alongside metrics, giving users a starting point for exploration or a question to the assistant. |

Daily Telemetry Log and Recent Workouts keep supporting records available for inspection. Source priority and workout deduplication prevent overlapping integrations from inflating results. Wellness Journal Check-in adds recent self-reported energy and stress, helping users consider how they feel alongside wearable observations without treating the two as equivalent measurements.

### Connect exploration, conversation and progress

The core journey is **Connect data sources → Explore dashboard → Understand trends → Ask AI → Take action → Track progress**.

The demo starts with simulated sources already connected so the dashboard's value is immediately visible. Users can change sources and permissions in Integrations, explore patterns in Overview and Health Insights, ask the assistant for interpretation, and revisit Goals or record context in Journal. The floating assistant supports questions during exploration; minimizing and reopening it preserves the conversation. Suggested questions help users begin, while free-form input supports their own concerns.

The intended habit loop is to review a pattern, choose a manageable action and return to inspect progress. The current demo illustrates this loop with fixed synthetic data; it does not measure real-world adherence or prove health improvement.

### Make Health Assistant relevant, grounded and actionable

- **Understand the need before selecting data.** The assistant considers the latest question and bounded conversation history, including earlier suggestions and actions the user reports trying. It receives selected measurements only when analytics are required, keeping general wellness conversations relevant to the question.
- **Keep AI and dashboard analysis consistent.** Both use the same deterministic analytics engine. The server recomputes evidence for the current sources, permissions, period, goals and structured journal entries. It validates and resolves numeric fact references so assistant measurements match the dashboard.
- **Help users choose a next step.** Responses can include an explanation, inspectable evidence, one small optional recommendation and a follow-up question in the user's language. This supports practical habit decisions while leaving the choice with the user.
- **Keep context current.** Range and goal changes preserve the visible conversation while omitting obsolete measurements from outgoing history. Source, permission and structured journal changes reset the conversation. This balances continuity with the need to avoid advice based on stale evidence.

### Preserve trust through clear data boundaries

Measured, estimated and self-reported data have different meanings. Wearable measurements are explicitly synthetic in this demo; manual sleep windows estimate time in bed; journal energy and stress ratings are self-reported. Source labels, coverage and missing-data states keep these distinctions visible. Raw journal notes stay in the browser.

The assistant supports wellness understanding, with instructions against diagnosis, medication advice, invented observations and causal claims from correlation. Recovery uses resting HR without a composite clinical score. Numeric validation constrains invented measurements but cannot guarantee every interpretation is correct.

Missing configuration, invalid AI output and provider/network errors produce explicit states with retry. Dashboard features remain usable without an API key. This keeps the experience transparent when the assistant cannot produce a grounded response.

## LLM/prompt approach

The assistant explains the dashboard and can suggest one small optional action. It answers in the question's language. Two sequential structured-output calls in `server/chat.ts` separate request interpretation from answering:

1. **Request Understanding** (`UNDERSTANDING_INSTRUCTIONS`) receives the latest question, bounded conversation history and a metric catalog without current measurements. It describes the user's need, tracks previous suggestions/unsuccessful actions, classifies analytics as required/helpful/not needed and selects existing metric IDs. It does not answer the user.
2. **Context selection** validates the understanding result. Only `required` includes selected analytics; `helpful` and `not_needed` omit measurements. Goal-related evidence is selected together to avoid dangling references. Trusted profile preference text remains available.
3. **Response Generator** (`ASSISTANT_INSTRUCTIONS`) receives the understanding, selected canonical evidence and history. Instructions define the role, language, missing-data policy, fact placeholders and medical boundaries. JSON Schema constrains answer, evidence IDs, recommendation and follow-up.
4. **Server validation** rejects unknown facts, unsupported numeric literals and invalid output, then resolves placeholders such as `{{steps.current}}` from canonical values. This verifies numeric provenance; it cannot prove that every interpretation or suggestion is correct.

The split keeps irrelevant dashboard measurements out of general conversation and lets follow-ups account for advice the user already tried. It costs two sequential provider calls and adds latency and another failure boundary. Each stage has a 120-second deadline shared with at most one short retry on HTTP 503. There is no streaming or retrieval/vector database.

Current analytics take precedence over older history. Trend and goal-comparison phrases are also computed on the server and can be inserted as complete fact references, so their arithmetic does not depend on the model. The opening message is a simple personalized greeting; dashboard measurements are requested through the conversation.

Range and target changes retain the visible conversation. Outgoing history keeps the previous questions, actions and follow-ups but omits earlier assistant measurements and target judgments when the dashboard context has changed. Provider, permission and structured journal-entry changes reset it. The app does not persist chat to a server or database. Check-in scores have self-report evidence; preferred bed/wake times have trusted text references; manual sleep contributions are flagged as estimated time in bed. The public response contract remains plain text plus server-owned evidence; placeholder templates are internal to the provider boundary.

Run `npm run eval:assistant` for fifteen fictional-data scenarios twice against the configured provider. This is an explicit live API test and may consume provider quota. Rate-limit waits/retries apply only to this evaluation command. Results are saved locally under `artifacts/` and require semantic review; the script never grades correctness merely because JSON validation passed. See `scripts/assistant-scenarios.mjs` for the acceptance cases. Diagnostic logging is described above.

## Product flows

- `#/`: landing with **Explore Demo**.
- `#/demo` and `#/dashboard`: populated Overview; the default connects all three mock sources.
- `#/insights/activity`, `#/insights/sleep`, `#/insights/recovery`: detailed trends, evidence, coverage and history.
- `#/journal`: create, edit and delete wellness check-ins, estimated sleep windows and manual workouts. Entries use the fixed demo calendar and GMT+7.
- `#/goals`: progress and editable steps/day, sleep/night and active minutes/week targets.
- `#/integrations`: simulated per-metric permission selection, connect, sync, disconnect, retry, sync-failure scenario and **Reset Demo**.
- Removed onboarding, welcome, profile-review and sign-in/sign-up URLs redirect to the demo. There is no Personalize Demo flow or UI.
- `#/reference` and `#/first-day` are legacy archive previews, outside the active product navigation. Their older static/scripted/manual behavior is retained separately from the main dataset.

No authentication, real wearable OAuth, Live Activity, nutrition or mental wellness module is included. All connections and measurements are simulated. The UI is in English; the assistant follows the question's language.

## Data contract and calculations

`src/features/health/model.ts`, `demo.ts` and `engine.ts` define the shared data boundary. The engine runs in both the frontend and server.

- **Dataset:** 60 reproducible days, Aug 20–Oct 18, 2026, in the demo's GMT+7 calendar. The ending date does not roll forward with the computer clock.
- **Observations:** value, unit, timestamp, provider and recorded/missing status. Daily metrics, sleep sessions and workout sessions remain typed separately.
- **Source policy:** prefer Apple Health for each available daily measurement and sleep session, then Garmin as fallback. Strava supplies workouts. Never add competing providers' daily totals together.
- **Workout policy:** merge by the fixture's shared event ID, prefer Strava details then Garmin then Apple, and retain contributing providers. Strava-only events extend history. Workout duration is not added again to a provider's daily active-minute total.
- **Disconnect:** remove that provider from normalization. An observation/event survives if another connected provider supplies it. All screens, export and the next AI request recompute immediately.
- **Sync:** first connection contributes only after success; reconnects do not duplicate data. A failed resync retains the last connected data. The failure control deliberately exercises this state without changing real services.
- **Periods:** 7D compares Oct 12–18 with Oct 5–11. 30D compares Sep 19–Oct 18 with Aug 20–Sep 18. The previous period always has the same calendar length.
- **Missing data:** null remains missing; all charts leave gaps at missing observations and plot recorded zero as a valid value. Means exclude null, while recorded zero remains in denominators. Every metric has current and previous coverage. An all-missing metric has null total/mean.
- **Goals:** steps and sleep compare recorded daily means to user targets; show observed days meeting the target. Weekly activity pace is mean active minutes per observed day × 7, explicitly distinguished from the measured period total. Progress bars cap visually at 100%; labels retain actual percentages.
- **Sleep consistency:** population standard deviation of recorded bedtimes, with a noon day boundary to handle midnight. At least two nights are required.
- **Recovery:** average resting HR and its change, with no clinical threshold, target or recovery score.

The scenarios include activity improving, a later sleep decline, fluctuating RHR, overlapping workouts, shared missing days, provider-specific gaps and recorded rest days. The fictional Alex profile is retained; the original 28-day fixtures remain only for the archive and its regression tests.

Existing profile storage migrates without losing goal targets; the legacy storage key remains for compatibility. Connection/UI settings, permissions and journal entries have their own versioned storage. Chat is held in memory, retained across navigation/minimize, and reset when providers, permissions or journal data change. **Reset Demo** restores default sources, period, profile, targets, default permissions, seeded check-ins and onboarding draft state.

## Chat API

`POST /api/chat` accepts a question, up to eight user/assistant history messages (four exchanges including recommendation and follow-up), `7d`, `30d` or `60d`, current view focus, allowed source IDs, bounded goal targets and dataset version. It does not accept authoritative browser-computed metrics.

The server validates inputs, regenerates the dataset and analytics, then builds canonical summaries for all three pillars and selects relevant evidence through the two-stage Gemini pipeline described below. Full-period aggregates remain available; individual details are limited to the latest three workouts and seven check-ins, and raw daily rows are excluded to control context size. View focus is a preference, not a topic restriction. The response contains `answer`, server-resolved `evidence`, `recommendation`, `followUp`, the current period and contributing sources. Evidence contains exact current/previous values, ranges and coverage. Personal numeric measurements are rendered in that evidence section; unknown evidence IDs, invalid placeholders and model-written numeric literals are rejected. The model writes references such as `{{steps.current}}`; the server inserts the formatted number and unit, so answers can include measurements naturally. Referenced facts automatically add their evidence. Missing values and unavailable comparisons have no numeric reference. This verifies numeric origin, not the meaning of every sentence.

Raw journal notes stay in the browser and are excluded from the request. Validated check-in scales and structured manual logs enter server-recomputed analytics. Manual entries remain user reports, never authenticated sensor measurements.

Guardrails prohibit invented observations, inferred missing measurements, diagnosis, medication advice and causal claims from correlation. Configuration errors, refusals, timeouts, rate limits, incomplete/malformed output and provider/network failures have explicit states. Context changes abort pending browser requests and suppress stale answers. Deterministic dashboard insights are calculated observations, clearly labeled separately from the LLM assistant.

## Validation and design

```sh
npm test
npm run build
npm run lint
```

Tests cover deterministic fixtures, normalization/fallback, deduplication, disconnect, null vs zero, equal period comparisons, goal pace, midnight consistency and the chat boundary with a mocked provider. A live provider test requires configured credentials and is separate from these deterministic tests.

`DESIGN.md` documents the UI architecture and visual contract; `design/reference/` contains composition HTML and earlier baselines. `src/design-system/tokens.json` is the authoritative **health-overview-2026-10** specification. The update retains the 260px sidebar, compact hero/header, four 210px KPI cards, 8/4 analytics layout, landing split and floating chat composition.

Consume semantic tokens and the shared dashboard primitives. Edit token JSON and run `npm run design:tokens` only when an authorized token change is needed; never edit generated `theme.css` directly. Build runs `design:check`.

## Manual data and coverage policy

- The journal supports at most 100 entries. One active check-in and one manual sleep window per reporting date; edit existing records to update them. Two seeded check-ins illustrate subjective well-being that may differ from movement metrics.
- Sleep windows are assigned to wake date in GMT+7. Windows must be positive and at most 24 hours. When wearable data exists for that reporting date, explicitly prefer its measurement or the manual window. Both originals remain available; the engine selects one rather than adding them. Manual windows estimate time in bed.
- Manual workouts retain source identification and do not add duration to provider exercise minutes. A workout within 15 minutes of an imported start requires confirmation that it is a separate session. Known cross-provider duplicates still merge by event identity. Manual sessions are not automatically matched to imports by fuzzy duration/type.
- Every provider exposes supported data permissions before connection and during use. Revocation excludes that metric from normalization, charts and AI immediately; Strava offers workouts only.
- Period comparisons need at least 70% of dates observed for that metric in both windows. Values remain visible with coverage, but insufficient comparisons are withheld. Bedtime variation needs two observations; historical RHR baseline needs seven; sleep/activity associations need three paired observations per group and establish no cause.
- AI receives evidence for goal achievement, historical RHR baseline and steps grouped by nights below/meeting the personal sleep target. It receives structured check-in scales, without notes. Responses never fabricate replacement data when the API fails.

Live Workout Mode remains optional and is not implemented. Automated provider-boundary tests use a mocked LLM; no successful live API call is claimed. Validate with your configured server credentials separately. The app remains usable without a key.

The v2.4 component migration covers Landing, Overview, Health Insights, Goals, Journal, Integrations and the floating assistant. The implementation/consumer matrix is in `src/design-system/ADOPTION.md`. Shared components live in `src/components/ui/health-kit.tsx`; feature CSS owns page composition rather than reimplementing controls.

## Conversation regression

`npm test` now includes offline Vitest checks for response contracts, numeric grounding, field review signals, safety-formatting preservation and bounded history through the provider request. The Vitest checks mock Gemini. `npm run eval:conversation` explicitly compares a frozen previous prompt with the current prompt on ten fictional scenarios, twice each, retaining raw JSON before fact substitution. The frozen baseline is stored in `tests/assistant/fixtures/conversation-v4-system.txt`. `npm run eval:input-ab` runs a separate paired synthetic input experiment. These evaluation scripts are opt-in and may consume provider quota.

## Documentation map

This README contains setup, environment variables, architecture, product decisions and the LLM/prompt approach. Supporting documentation stays close to the implementation:

- `src/features/assistant/README.md`: assistant contracts, orchestration and evaluation commands.
- `src/design-system/README.md`: token generation and UI architecture.
- `src/design-system/ADOPTION.md`: shared component ownership and consumer map.
- `DESIGN.md`: fixed composition and implementation constraints for the existing UI.
- `AGENTS.md`: repository contributor/agent guidance; `.agents/skills/` retains project skills.

`tests/assistant/fixtures/conversation-v4-system.txt` is executable evaluation input, not redundant documentation. Reference HTML/images and third-party component licenses are retained as implementation assets.
