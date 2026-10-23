import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { respond, validateRequest, ASSISTANT_INSTRUCTIONS, ASSISTANT_PROMPT_VERSION } from "../dist-server/server/chat.js";
import { buildHistory } from "../dist-server/src/features/assistant/history.js";
import { DATASET_VERSION } from "../dist-server/src/features/health/demo.js";
import { scenarios } from "./assistant-scenarios.mjs";

// Explicit opt-in command. Only fictional fixture data is used; never print credentials.
if (!process.env.GEMINI_API_KEY) {
  console.error("Live evaluation pending: configure server-only GEMINI_API_KEY in .env.");
  process.exitCode = 1;
} else {
  const base = { range: "7d", focus: "overview", sources: ["apple", "garmin", "strava"], goals: { steps: 8000, sleep: 7.5, active: 150 }, datasetVersion: DATASET_VERSION, history: [] };
  const results = [];
  const selectedId = process.argv.find(arg => arg.startsWith("--scenario="))?.split("=")[1];
  const runs = Number(process.argv.find(arg => arg.startsWith("--runs="))?.split("=")[1] ?? 2);
  const selectedScenarios = selectedId ? scenarios.filter(scenario => scenario.id === selectedId) : scenarios;
  if (!selectedScenarios.length || ![1, 2].includes(runs)) throw new Error("Use a known --scenario and --runs=1 or --runs=2.");
  const reportStem = selectedId ? `assistant-evaluation-${selectedId}` : "assistant-evaluation";
  await mkdir("artifacts", { recursive: true });
  let providerCalls = 0;
  let providerRateLimits = 0;
  let lastProviderStatus;
  let lastProviderLimit;
  let lastProviderErrorCode;
  let lastContent;
  const providerFetch = async (url, options) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      providerCalls++;
      const response = await fetch(url, options);
      lastProviderStatus = response.status;
      lastProviderLimit = undefined;
      lastProviderErrorCode = undefined;
      if (!response.ok) {
        const body = await response.clone().json().catch(() => null);
        lastProviderErrorCode = body?.error?.code;
        const message = body?.error?.message ?? "";
        lastProviderLimit = /tokens per day/i.test(message) ? "tokens-per-day" : /tokens per minute/i.test(message) ? "tokens-per-minute" : /requests per day/i.test(message) ? "requests-per-day" : undefined;
        if (lastProviderLimit?.endsWith("per-day")) return response;
      }
      if (response.status !== 429 || attempt === 4) {
        if (response.ok) lastContent = (await response.clone().json()).candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text ?? "").join("");
        return response;
      }
      providerRateLimits++;
      const retry = Number(response.headers.get("retry-after"));
      const delay = Math.max(1000, Math.min(60000, (Number.isFinite(retry) && retry > 0 ? retry : 20) * 1000));
      console.log(`Provider rate limit: waiting ${Math.ceil(delay / 1000)}s (evaluation only).`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // A provider request timeout starts anew for each evaluation-only retry.
      options = { ...options, signal: AbortSignal.timeout(25000) };
    }
  };
  const ask = async request => { lastContent = undefined; lastProviderStatus = undefined; lastProviderLimit = undefined; return respond(validateRequest(request), { fetch: providerFetch }); };
  for (let run = 1; run <= runs; run++) {
    for (const scenario of selectedScenarios) {
      const started = Date.now();
      let setupResponse;
      let stage = scenario.setup ? "setup" : "question";
      try {
        let history = [];
        if (scenario.setup) {
          const previous = await ask({ ...base, question: scenario.setup });
          setupResponse = previous;
          history = buildHistory([{ question: scenario.setup, answer: previous.answer, response: previous, contextKey: "base" }], scenario.patch?.range || scenario.patch?.goals ? "changed" : "base");
        }
        stage = "question";
        const response = await ask({ ...base, ...scenario.patch, history, question: scenario.question });
        results.push({ run, id: scenario.id, question: scenario.question, expected: scenario.expected, status: "needs-semantic-review", setupResponse, response, durationMs: Date.now() - started });
        console.log(`Run ${run}: ${scenario.id}: valid response; semantic review required`);
      } catch (error) {
        results.push({ run, id: scenario.id, status: "failed", stage, setupResponse, code: error.code ?? "UNKNOWN", providerStatus: lastProviderStatus, providerErrorCode: lastProviderErrorCode, providerLimit: lastProviderLimit, ...(error.code === "INVALID_AI_RESPONSE" ? { rejectedSyntheticOutput: lastContent } : {}), durationMs: Date.now() - started });
        console.log(`Run ${run}: ${scenario.id}: ${error.code ?? "UNKNOWN"}`);
        if (error.code === "INVALID_AI_RESPONSE") console.log("Rejected synthetic output:", lastContent);
      }
      await writeFile(`artifacts/${reportStem}-progress.local.json`, JSON.stringify(results, null, 2));
    }
  }
  const report = {
    generatedAt: new Date().toISOString(), model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    providerCalls, providerRateLimits, promptVersion: ASSISTANT_PROMPT_VERSION, promptHash: createHash("sha256").update(ASSISTANT_INSTRUCTIONS).digest("hex"),
    note: "Schema/fact validation is automatic. Relevance, causal claims, language and medical boundaries require separate semantic review. Only fictional data included.", results,
  };
  await mkdir("artifacts", { recursive: true });
  await writeFile(`artifacts/${reportStem}.local.json`, JSON.stringify(report, null, 2));
  console.log(`Saved ${results.length} results to artifacts/${reportStem}.local.json`);
  if (results.some(result => result.status === "failed")) process.exitCode = 1;
}
