import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { respond, validateRequest, ASSISTANT_INSTRUCTIONS, UNDERSTANDING_INSTRUCTIONS } from "../dist-server/server/chat.js";
import { DATASET_VERSION } from "../dist-server/src/features/health/demo.js";
import { buildHistory } from "../dist-server/src/features/assistant/history.js";
import { responseFieldIssues } from "../dist-server/src/features/assistant/response-validation.js";

const dryRun = process.argv.includes("--dry-run");
const runs = Number(process.argv.find(arg => arg.startsWith("--runs="))?.split("=")[1] ?? 1);
if (![1, 2, 3].includes(runs)) throw new Error("Use --runs=1, 2 or 3.");
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const base = { range: "7d", focus: "overview", sources: ["apple", "garmin", "strava"], goals: { steps: 8000, sleep: 7.5, active: 150 }, datasetVersion: DATASET_VERSION, preferences: { primaryFocus: "sleep", activityLevel: "light", bedtime: "23:00", wakeTime: "07:00" } };
// Frozen synthetic history: each pair sees identical history, never the other variant's output.
const turns = [
  { question: "How am I progressing?", answer: "Activity is increasing while sleep remains below your target.", recommendation: "Focus on consistency by aiming to start your wind-down routine well before your bedtime of 23:00.", followUp: "Would you like to explore ways to adjust your sleep schedule?" },
  { question: "Ok.", answer: "A consistent wind-down period can signal that it is time to rest.", recommendation: "Try dimming lights and setting aside digital screens before bedtime.", followUp: "" },
  { question: "What else could help?", answer: "A quiet transition can make bedtime feel calmer.", recommendation: "Try gentle reading or light stretching before sleep.", followUp: "" },
  { question: "I tried those things but they did not help.", answer: "More context would help clarify what is getting in the way.", recommendation: "", followUp: "What keeps you awake once you are in bed?" },
  { question: "I keep thinking about my life and future.", answer: "", recommendation: "", followUp: "" },
];
const exchanges = turns.map(turn => ({ question: turn.question, answer: turn.answer, response: { ...turn, evidence: [], period: {}, sources: [] } }));
const report = { generatedAt: new Date().toISOString(), model, runs, promptHashes: { response: hash(ASSISTANT_INSTRUCTIONS), understanding: hash(UNDERSTANDING_INSTRUCTIONS) }, design: "Paired replay of a fixed synthetic conversation. Identical current question, history, first-stage output, model, response schema and generation config within each pair. Only redundant understanding fields differ. Both arms exclude complete-sentence facts. Repetition flags are lexical review aids, not semantic judgments.", results: [] };
if (dryRun) { console.log(`Prepared ${turns.length * runs} pairs; no provider calls.`); process.exit(0); }
if (!process.env.GEMINI_API_KEY) throw new Error("Server-only GEMINI_API_KEY is missing; no provider call made.");
await mkdir("artifacts", { recursive: true });
const path = `artifacts/input-ab-${new Date().toISOString().replace(/[:.]/g, "-")}.local.json`;
const save = () => writeFile(path, JSON.stringify(report, null, 2));
const print = console.info.bind(console);
for (let run = 1; run <= runs; run++) for (let index = 0; index < turns.length; index++) {
  const history = buildHistory(exchanges.slice(0, index));
  const request = validateRequest({ ...base, question: turns[index].question, history });
  let understandingReply;
  let firstPair;
  for (const variant of ["compact", "history_only"]) {
    const row = { run, turn: index, variant, question: request.question, history, semanticReview: "pending" };
    const providerFetch = async (url, options) => {
      const body = JSON.parse(options.body);
      const isUnderstanding = !!body.generationConfig.responseJsonSchema.properties.userNeed;
      if (isUnderstanding && understandingReply) return new Response(understandingReply.body, { status: understandingReply.status, headers: understandingReply.headers });
      if (!isUnderstanding) {
        row.responseInput = body;
        const invariant = { url, generation: body.generationConfig, system: body.systemInstruction, history: body.contents.slice(0, -1), question: body.contents.at(-1).parts.at(-1), understanding: understandingReply?.body };
        row.pairInvariantHash = hash(invariant);
        if (variant === "compact") firstPair = row.pairInvariantHash;
        else if (firstPair !== row.pairInvariantHash) throw new Error("A/B inputs differ beyond the intended understanding fields.");
      }
      const response = await fetch(url, options);
      const raw = await response.clone().text();
      if (isUnderstanding) {
        understandingReply = { body: raw, status: response.status, headers: Object.fromEntries(response.headers) };
        row.understandingProviderOutput = JSON.parse(raw);
      } else {
        row.rawProviderOutput = JSON.parse(raw);
        const text = row.rawProviderOutput.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text ?? "").join("");
        if (text) { try { row.rawResponse = JSON.parse(text); } catch { /* Keep provider payload for inspection. */ } }
      }
      return response;
    };
    const started = Date.now();
    console.info = () => {}; console.error = () => {};
    try {
      row.response = await respond(request, { model, inputVariant: variant, fetch: providerFetch });
      row.fieldIssues = row.rawResponse ? responseFieldIssues(row.rawResponse) : [];
      const recommendation = row.response.recommendation.toLowerCase().trim();
      row.exactRepeatedRecommendation = !!recommendation && exchanges.slice(0, index).some(turn => turn.response.recommendation.toLowerCase().trim() === recommendation);
      row.repeatedAdviceFamilies = [
        ["wind-down", /wind[ -]?down|bedtime routine/i],
        ["dim lights", /dim(?:ming)? (?:the )?lights|lower(?:ing)? (?:the )?light/i],
        ["screens", /screens|digital devices/i],
        ["reading", /reading|read a book/i],
        ["stretching", /stretch/i],
      ].filter(([, pattern]) => pattern.test(row.response.recommendation) && exchanges.slice(0, index).some(turn => pattern.test(turn.response.recommendation))).map(([name]) => name);
    } catch (error) {
      row.error = { code: error.code, message: error.message };
    } finally { console.info = print; console.error = print; }
    row.durationMs = Date.now() - started;
    report.results.push(row); await save();
    print(`${run}/${index}/${variant}: ${row.error ? row.error.code : "ok"}; repeated families: ${(row.repeatedAdviceFamilies ?? []).join(", ") || "none"}`);
    if (row.error && ["AI_PROVIDER_ERROR", "AI_UNAVAILABLE", "AI_TIMEOUT", "AI_NOT_CONFIGURED"].includes(row.error.code)) {
      report.blockedReason = row.error; await save(); print(`Stopped: ${path}`); process.exitCode = 1; process.exit();
    }
  }
}
report.completedAt = new Date().toISOString(); await save(); print(path);
