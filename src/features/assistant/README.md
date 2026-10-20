# AI assistant integration boundary

The starter intentionally does not generate simulated AI replies.

Next implementation steps:
1. Add a server endpoint (`POST /api/chat`) and keep provider credentials on the server.
2. Validate and bound messages; send canonical health records plus the selected range.
3. Include bounded conversation history and a prompt that prohibits inventing data or diagnosing.
4. Validate provider responses and implement timeout, loading, retry, empty and error states.
5. Add hosting-side rate limiting before making the endpoint public.

Never use a `VITE_` variable for a secret: Vite exposes those variables to the browser.
