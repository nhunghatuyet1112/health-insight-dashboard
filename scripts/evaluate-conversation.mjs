import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { respond, validateRequest, ASSISTANT_INSTRUCTIONS, ASSISTANT_PROMPT_VERSION, buildContext } from "../dist-server/server/chat.js";
import { responseFieldIssues } from "../dist-server/src/features/assistant/response-validation.js";
import { buildHistory } from "../dist-server/src/features/assistant/history.js";
import { analyze } from "../dist-server/src/features/health/engine.js";
import { DATASET_VERSION } from "../dist-server/src/features/health/demo.js";
import { conversationCases } from "./conversation-cases.mjs";

const dryRun = process.argv.includes("--dry-run");
if (!process.env.GEMINI_API_KEY && !dryRun) throw new Error("Configure server-only GEMINI_API_KEY; no provider call was made.");
const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const runs = Number(process.argv.find(arg => arg.startsWith("--runs="))?.split("=")[1] ?? 2);
if (![1, 2, 3].includes(runs)) throw new Error("Use --runs=1, 2 or 3.");
const selected = process.argv.find(arg => arg.startsWith("--case="))?.split("=")[1];
const cases = selected ? conversationCases.filter(item => item.id === selected) : conversationCases;
if (!cases.length) throw new Error("Unknown case.");
const hash = value => createHash("sha256").update(value).digest("hex");
const baselinePath = process.argv.find(arg => arg.startsWith("--baseline="))?.slice("--baseline=".length) ?? "tests/assistant/fixtures/conversation-v4-system.txt";
const baselineVersion = process.argv.find(arg => arg.startsWith("--baseline-version="))?.slice("--baseline-version=".length) ?? "conversation-v4";
const before = await readFile(baselinePath, "utf8");
const after = ASSISTANT_INSTRUCTIONS;
const base = { range: "7d", focus: "overview", sources: ["apple", "garmin", "strava"], goals: { steps: 8000, sleep: 7.5, active: 150 }, datasetVersion: DATASET_VERSION };
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const path = `artifacts/conversation-evaluation-${stamp}.local.json`;
let report = {
  generatedAt: new Date().toISOString(), model, runs, planned: cases.length * runs * 2,
  promptVersions: { before: { version: baselineVersion, hash: hash(before), source: baselinePath }, after: { version: ASSISTANT_PROMPT_VERSION, hash: hash(after) } },
  note: "Fictional fixed histories, identical dataset/context/generation settings and validation for both prompts. Raw JSON is captured before server rendering. Retries belong only to this evaluator. No semantic judge or extra product call. Semantic review is pending until explicitly recorded.",
  results: [],
};
const resumePath = process.argv.find(arg => arg.startsWith("--resume="))?.slice("--resume=".length);
if (resumePath) {
  const previous = JSON.parse(await readFile(resumePath, "utf8"));
  if (previous.model !== model || previous.runs !== runs || previous.planned !== report.planned
    || previous.promptVersions?.before?.hash !== hash(before) || previous.promptVersions?.after?.hash !== hash(after)) {
    throw new Error("Resume requires the same prompt hashes, model, run count and case set.");
  }
  const keys = new Set();
  for (const row of previous.results) {
    const scenario = cases.find(item => item.id === row.id);
    const key = `${row.variant}/${row.run}/${row.id}`;
    if (!scenario || !["before", "after"].includes(row.variant) || row.run < 1 || row.run > runs || keys.has(key)) throw new Error("Invalid or duplicated saved case.");
    keys.add(key);
    const history = buildHistory(scenario.history);
    const request = validateRequest({ ...base, ...scenario.patch, history, question: scenario.question });
    const { context } = buildContext(request, analyze(request.sources, request.range, request.goals, request.data));
    if (row.question !== scenario.question || JSON.stringify(row.history) !== JSON.stringify(history)
      || row.contextHash !== hash(JSON.stringify(context))
      || row.generation?.model !== model || row.generation?.max_completion_tokens !== 2048 || row.generation?.reasoning_effort !== "medium") {
      throw new Error(`Saved input/context/generation mismatch: ${key}`);
    }
  }
  report = previous;
  report.resumeEvents = [...(report.resumeEvents ?? []), { at: new Date().toISOString(), source: resumePath, previousBlockedReason: report.blockedReason }];
  delete report.blockedReason;
  delete report.completedAt;
}
if (dryRun) {
  console.log(`Validated ${report.results.length} saved attempts; ${report.planned - report.results.length} unrun. No provider calls made.`);
  process.exit(0);
}
await mkdir("artifacts", { recursive: true });
const save = async () => {
  const json = JSON.stringify(report, null, 2);
  await writeFile(path, json);
  await writeFile("artifacts/conversation-evaluation-latest.local.json", json);
};
let dailyLimit = false;
outer: for (let run = 1; run <= runs; run++) {
  for (const scenario of cases) {
    for (const variant of ["before", "after"]) {
      if (report.results.some(row => row.run === run && row.id === scenario.id && row.variant === variant)) continue;
      const row = { run, id: scenario.id, variant, question: scenario.question, rubric: scenario.rubric, semanticReview: "pending", automaticIssues: [], attempts: [], rawJson: null };
      const history = buildHistory(scenario.history);
      const request = validateRequest({ ...base, ...scenario.patch, history, question: scenario.question });
      row.history = history;
      const started = Date.now();
      const providerFetch = async (url, options) => {
        const body = JSON.parse(options.body);
        const language = body.systemInstruction.parts[0].text.slice(body.systemInstruction.parts[0].text.lastIndexOf("FINAL LANGUAGE REQUIREMENT:"));
        body.systemInstruction.parts[0].text = `${variant === "before" ? before : after}\n${language}`;
        row.contextHash = hash(body.systemInstruction.parts[1].text);
        row.generation = { model, ...body.generationConfig };
        row.schemaHash = hash(JSON.stringify(body.generationConfig.responseJsonSchema));
        for (let attempt = 0; attempt < 5; attempt++) {
          const response = await fetch(url, { ...options, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
          const payload = await response.clone().json().catch(() => null);
          const rawJson = payload?.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text ?? "").join("") ?? null;
          if (rawJson !== null) row.rawJson = rawJson;
          const message = payload?.error?.message ?? "";
          const limit = /tokens per day|requests per day/i.test(message) ? "daily" : /tokens per minute/i.test(message) ? "per-minute" : undefined;
          row.attempts.push({ status: response.status, code: payload?.error?.code, limit, ...(rawJson !== null ? { rawJson } : {}) });
          if (limit === "daily") { dailyLimit = true; return response; }
          if (response.status !== 429 || attempt === 4) return response;
          const retry = Number(response.headers.get("retry-after"));
          const ms = Math.max(1000, Math.min(60000, (retry > 0 ? retry : 20) * 1000));
          console.log(`${variant}/${run}/${scenario.id}: provider rate limit, wait ${Math.ceil(ms / 1000)}s`);
          await new Promise(resolve => setTimeout(resolve, ms));
        }
      };
      try {
        row.response = await respond(request, { model, fetch: providerFetch });
        const raw = JSON.parse(row.rawJson);
        row.automaticIssues.push(...responseFieldIssues({ ...raw, answer: row.response.answer, recommendation: row.response.recommendation, followUp: row.response.followUp }));
        if (scenario.checks.noAnalytics && row.response.evidence.length) row.automaticIssues.push("unnecessary_analytics_evidence");
        if (scenario.checks.emptyRecommendation && row.response.recommendation.trim()) row.automaticIssues.push("expected_empty_recommendation");
        if (scenario.checks.requireFollowUp && !row.response.followUp.trim()) row.automaticIssues.push("missing_clarification");
      } catch (error) {
        row.error = { code: error.code ?? error.name ?? "UNKNOWN" };
      }
      row.durationMs = Date.now() - started;
      report.results.push(row);
      console.log(`${variant}/${run}/${scenario.id}: ${row.error?.code ?? (row.automaticIssues.length ? row.automaticIssues.join(",") : "mechanical checks passed; semantic review pending")}`);
      await save();
      if (dailyLimit) { report.blockedReason = "Provider daily quota exhausted; remaining attempts were not run."; await save(); break outer; }
    }
  }
}
report.completedAt = new Date().toISOString();
await save();
console.log(`Saved ${report.results.length}/${report.planned} attempts: ${path}`);
if (report.results.some(row => row.error || row.automaticIssues.length) || dailyLimit) process.exitCode = 1;
