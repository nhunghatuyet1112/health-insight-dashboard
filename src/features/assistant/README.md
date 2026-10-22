# Health Insight AI boundary

The active app uses real responses through `POST /api/chat`; it has no scripted fallback. Legacy `/reference` and `/first-day` previews retain their archive behavior.

- `contracts.ts`: frontend/server request and response types.
- `server/chat.ts`: validation, canonical analytics, provider call and structured evidence resolution.
- `server/index.ts`: JSON HTTP boundary, request limits, local rate limiting and static production serving.
- `AIChatbot.tsx`: async submission, evidence display, retry, context cancellation and retained conversation presentation.

Set server-only `OPENAI_API_KEY` (or legacy `LLM_API_KEY`) and `LLM_MODEL`; see the root README. No key is accepted through the UI, emitted into Vite or printed to logs.

The server sends all available pillar analytics regardless of the selected tab. Scope changes use current server-derived facts; provider, permission and journal changes start a new conversation so disconnected-provider history is not resent. Numeric evidence is resolved by the server, never copied from model-created values. Prompt rules and output validation complement each other; structured output alone does not prove semantic or medical correctness.

The unit tests use a mocked provider and no external credentials. A real provider response must be checked separately when configuration is available.

`/api/assistant` aliases `/api/chat`. Requests allow up to 100 validated structured manual entries and provider-specific permissions within a 128 KiB body limit. The server recomputes analytics; raw journal notes are omitted from LLM context. Sleep windows remain estimates, check-ins remain subjective and workout durations never inflate imported exercise minutes.
