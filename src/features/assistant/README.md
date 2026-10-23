# Health Assistant

The chat UI starts with a personalized greeting and three clickable suggestions.
Questions are submitted to `POST /api/chat`; replies include separate answer,
recommendation and follow-up paragraphs. Message timestamps use GMT+7.
ThinkingState and Orb from the public AICSS registry indicate a pending request;
TextResponse styles completed answers. Their MIT license is kept beside the components.

## Provider and context

`server/chat.ts` uses server-only `GEMINI_API_KEY` and `GEMINI_MODEL`
(default `gemini-3.1-flash-lite`). Optional `GEMINI_UNDERSTANDING_MODEL` selects
the first-stage model. No secret belongs in a `VITE_*` variable.

Two sequential structured calls share the provider transport. Request Understanding
receives the latest question, bounded history and metric catalog without measurements.
It describes the need and selects relevant metric IDs. Response Generator receives
selected canonical analytics when required, bounded history and compact understanding.
Each call has a 120-second deadline shared with at most one short HTTP 503 retry.
Only an analytics need of `required` includes selected measurements; `helpful`
and `not_needed` omit them while retaining trusted profile preferences.

The server recomputes analytics and permissions, validates response shape and evidence,
and replaces trusted numeric placeholders. Unknown facts, unsupported numbers and
malformed output fail closed. Raw journal notes remain in the browser.
`response-validation.ts` owns contract checks; `history.ts` retains four exchanges,
including recommendations and follow-ups. Range/goal changes omit obsolete measurements
from outgoing history; provider/permission/journal changes reset the conversation.

## Verification and diagnostics

`npm run test:assistant` runs offline Vitest checks with mocked Gemini responses.
`tests/health-engine.test.mjs` also covers canonical data and provider boundaries;
its response-stage harness supplies valid mocked understanding. Separate Vitest tests
verify understanding selection and orchestration.

`npm run eval:assistant`, `npm run eval:conversation` and `npm run eval:input-ab`
are opt-in provider evaluations using synthetic scenarios. They can consume quota;
local reports are ignored by Git. Conversation comparison uses the frozen v4 fixture.
Mechanical validity does not establish model quality; outputs need semantic review.

Server diagnostic logs include request context, history, provider output and validation
failures. API keys and authentication headers are excluded/redacted. Browser diagnostic
logs include response content. No production conversation storage is implemented.
