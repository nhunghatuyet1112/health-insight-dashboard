# Health Insight

Your personal health intelligence companion. A demo wellness product built with React, TypeScript, Vite, Zustand, Tailwind CSS v4, shadcn/ui and Recharts.

Explore **Activity, Sleep and Recovery** through Overview, Health Insights, Wellness Journal, Goals and Devices & Integrations. A floating assistant uses real OpenAI responses grounded in the same computed data as the dashboard. No account is required.

## Run

Use Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

`dev` compiles the server, starts the API at `127.0.0.1:8787`, and starts Vite at its printed frontend address (normally `http://localhost:5173`). Vite proxies `/api` to the server. If server-side code changes, restart `dev` to recompile it; frontend changes use Vite HMR.

For a local production build:

```sh
npm run build
npm start
```

Open `http://127.0.0.1:8787`. The Node server serves both `dist/` and `/api/chat` (`/api/assistant` is an alias). `npm run preview` only previews static frontend assets; use `npm start` to exercise the API. `PORT` configures the app/API port. No deployment is included.

## Configure real AI

Copy `.env.example` to `.env` and configure `OPENAI_API_KEY` and `LLM_MODEL` on the server. The model must be available to your OpenAI project and support Responses Structured Outputs. Restart the server after changing configuration. `LLM_API_KEY` is accepted as a legacy server-key alias.

Never place secrets in `VITE_*` variables: those values are exposed to the browser. The app has no credential-entry UI and does not log questions, conversations or API keys.

Without configuration, every data feature works and chat shows an explicit configuration error with retry. It never substitutes scripted replies for real AI. The server binds to loopback by default and applies a twelve-request-per-minute socket-IP limit, body/history limits and provider timeouts. This is a local demo server; an eventual public deployment needs a hosting-aware shared rate limiter and proxy configuration.

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

The scenarios include activity improving, a later sleep decline, fluctuating RHR, overlapping workouts, shared missing days, provider-specific gaps and recorded rest days. The fictional Minh Anh profile is retained; the original 28-day fixtures remain only for the archive and its regression tests.

Existing profile storage migrates without losing goal targets; the legacy storage key remains for compatibility. Connection/UI settings, permissions and journal entries have their own versioned storage. Chat is held in memory, retained across navigation/minimize, and reset when providers, permissions or journal data change. **Reset Demo** restores default sources, period, profile, targets, default permissions, seeded check-ins and onboarding draft state.

## Chat API

`POST /api/chat` accepts a question, up to eight user/assistant history messages, `7d` or `30d`, current view focus, allowed source IDs, bounded goal targets and dataset version. It does not accept authoritative browser-computed metrics.

The server validates inputs, regenerates the dataset and analytics, then supplies all three pillars to OpenAI Responses. View focus is a preference, not a topic restriction. The response contains `answer`, server-resolved `evidence`, `recommendation`, `followUp`, the current period and contributing sources. Evidence contains exact current/previous values, ranges and coverage. Personal numeric measurements are rendered in that evidence section; invented evidence IDs or numeric personal claims in prose are rejected. Responses are requested with `store: false`.

Raw journal notes stay in the browser and are excluded from the request. Validated check-in scales and structured manual logs enter server-recomputed analytics. Manual entries remain user reports, never authenticated sensor measurements.

Guardrails prohibit invented observations, inferred missing measurements, diagnosis, medication advice and causal claims from correlation. Configuration errors, refusals, timeouts, rate limits, incomplete/malformed output and provider/network failures have explicit states. Context changes abort pending browser requests and suppress stale answers. Deterministic dashboard insights are calculated observations, clearly labeled separately from the LLM assistant.

## Validation and design

```sh
npm test
npm run build
npm run lint
```

Tests cover deterministic fixtures, normalization/fallback, deduplication, disconnect, null vs zero, equal period comparisons, goal pace, midnight consistency and the chat boundary with a mocked provider. A live provider test requires configured credentials and is separate from these deterministic tests.

`PRODUCT.md` records product scope. `DESIGN.md` is the visual contract; `design/reference/` contains composition HTML and earlier baselines. `src/design-system/tokens.json` is the authoritative **health-insight-ui-kit-2.4** specification. The update retains the 260px sidebar, compact hero/header, four 210px KPI cards, 8/4 analytics layout, landing split and floating chat composition.

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
