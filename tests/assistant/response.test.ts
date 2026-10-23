import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isModelResponse, responseFieldIssues, sentenceCount } from "../../src/features/assistant/response-validation";
import { buildHistory } from "../../src/features/assistant/history";
import { respond, validateRequest, buildContext, resolveFacts } from "../../server/chat";
import { DATASET_VERSION } from "../../src/features/health/demo";
import { analyze } from "../../src/features/health/engine";

const request = { question: "I tried that but it did not help.", history: [], range: "7d", focus: "overview", sources: ["apple", "garmin", "strava"], goals: { steps: 8000, sleep: 7.5, active: 150 }, datasetVersion: DATASET_VERSION };
const raw = { answer: "More context would help explain what felt difficult.", evidenceIds: [], recommendation: "", followUp: "Was the difficulty making time for bed or falling asleep?" };
const understanding = { userNeed: "Discuss sleep difficulties", conversationContext: "", analyticsNeed: "not_needed", relevantMetricIds: [], previouslySuggestedActions: [], userReportedUnsuccessfulActions: [] };
const modelReply = (value: unknown) => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(value) }] } }] });
describe("strict provider contract", () => {
  it("allows empty evidence and recommendation", () => expect(isModelResponse(raw, [])).toBe(true));
  it.each([
    { ...raw, extra: "unexpected" }, { ...raw, evidenceIds: ["fabricated"] },
    { ...raw, evidenceIds: ["steps", "steps"] }, { ...raw, evidenceIds: Array(9).fill("steps") },
    { ...raw, followUp: null }, { ...raw, answer: " " },
  ])("rejects malformed, unknown or excessive evidence", value => expect(isModelResponse(value, ["steps"])).toBe(false));
  it("rejects extra fields even if the provider ignores its schema", async () => {
    await expect(respond(validateRequest(request), { apiKey: "test", fetch: async (_url, options) => modelReply(JSON.parse(String(options?.body)).generationConfig.responseJsonSchema.properties.userNeed ? understanding : { ...raw, extra: true }) })).rejects.toMatchObject({ code: "INVALID_AI_RESPONSE" });
  });
  it("keeps numeric provenance fail-closed in each text field", async () => {
    for (const field of ["answer", "recommendation", "followUp"]) {
      await expect(respond(validateRequest(request), { apiKey: "test", fetch: async (_url, options) => modelReply(JSON.parse(String(options?.body)).generationConfig.responseJsonSchema.properties.userNeed ? understanding : { ...raw, [field]: "A made-up reading is 999." }) })).rejects.toMatchObject({ code: "INVALID_AI_RESPONSE" });
    }
  });
  it("rejects unavailable placeholders instead of inventing values", () => {
    const validated = validateRequest(request);
    const { facts } = buildContext(validated, analyze(validated.sources, validated.range, validated.goals));
    expect(() => resolveFacts("{{bloodPressure.current}}", facts, new Set())).toThrow();
  });
});
describe("mechanical field checks; not semantic equivalence judgments", () => {
  it("handles decimals and placeholders without false sentence splits", () => {
    expect(sentenceCount("Sleep averages 6.5 hours. More context helps.")).toBe(2);
    expect(sentenceCount("Sleep averages {{sleepHours.current}}.")).toBe(1);
  });
  it("flags an overlong answer and misplaced questions", () => {
    expect(responseFieldIssues({ ...raw, answer: "A. B. C. D. What was hard?", recommendation: "Could you change bedtime?", followUp: "When? Why?" })).toEqual(expect.arrayContaining(["answer_sentence_limit", "question_in_answer", "question_in_recommendation", "multiple_follow_up_questions"]));
  });
  it("flags exact duplication without pretending to detect paraphrases", () => {
    expect(responseFieldIssues({ ...raw, answer: "Try dimming lights.", recommendation: "Try dimming lights." })).toContain("exact_action_repeated");
    expect(responseFieldIssues({ ...raw, answer: "Lower the lighting.", recommendation: "Try dimming lights." })).not.toContain("exact_action_repeated");
  });
  it("does not discard urgent guidance merely for ordinary field formatting", async () => {
    const urgent = { answer: "Seek urgent medical assistance now. Contact local emergency services. Avoid driving yourself. Stay with someone if possible.", evidenceIds: [], recommendation: "", followUp: "" };
    expect(responseFieldIssues(urgent)).toContain("answer_sentence_limit");
    const result = await respond(validateRequest({ ...request, question: "I have severe chest pain and trouble breathing." }), { apiKey: "test", fetch: async (_url, options) => modelReply(JSON.parse(String(options?.body)).generationConfig.responseJsonSchema.properties.userNeed ? understanding : urgent) });
    expect(result.answer).toBe(urgent.answer);
  });
});
it("sends bounded history with recommendations, feedback, roles and latest question through understanding and response calls", async () => {
  const response = { answer: "A quiet transition may help.", evidence: [], recommendation: "Try dimming lights.", followUp: "Was it hard to find time?", period: { start: "", end: "", previousStart: "", previousEnd: "", days: 7 }, sources: [] };
  const history = buildHistory(Array.from({ length: 5 }, (_, i) => ({ question: i === 4 ? "I tried dimming lights without success." : `Earlier topic ${i}`, answer: response.answer, response, contextKey: "same" })), "same");
  expect(history).toHaveLength(8);
  expect(history[0].content).not.toContain("Earlier topic 0");
  expect(history[6]).toMatchObject({ role: "user", content: "I tried dimming lights without success." });
  expect(history[7].content).toContain(response.answer);
  expect(history.every(message => message.content.length <= 2000)).toBe(true);
  expect(history[7].content).toContain("Recommended action: Try dimming lights.");
  expect(history[7].content).toContain("Follow-up: Was it hard to find time?");
  let calls = 0;
  const result = await respond(validateRequest({ ...request, history }), { apiKey: "test", model: "gemini-3.1-flash-lite", fetch: async (_url, options) => {
    calls++;
    const payload = JSON.parse(String(options?.body));
    if (calls === 1) {
      const input = JSON.parse(payload.contents[0].parts[0].text);
      expect(input.history).toEqual(history);
      expect(input.latestUserMessage).toBe(request.question);
      expect(input.metricCatalog.length).toBeGreaterThan(0);
      return modelReply(understanding);
    }
    expect(JSON.parse(payload.systemInstruction.parts[1].text).metrics).toEqual([]);
    expect(payload.contents.slice(0, -1)).toEqual(history.map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })));
    expect(payload.contents.at(-1).parts.at(-1)).toEqual({ text: request.question });
    expect(JSON.parse(payload.contents.at(-1).parts[0].text).requestUnderstanding.userNeed).toBe(understanding.userNeed);
    expect(Object.keys(payload.generationConfig.responseJsonSchema.properties).sort()).toEqual(["answer", "evidenceIds", "followUp", "recommendation"]);
    expect(payload.generationConfig.maxOutputTokens).toBe(8192);
    return modelReply(raw);
  } });
  expect(calls).toBe(2);
  expect(result.evidence).toEqual([]);
  expect(result.recommendation).toBe("");
});
it("retains the previous follow-up so a personal disclosure remains a conversational continuation", () => {
  const response = { answer: "More context would help clarify the difficulty.", evidence: [], recommendation: "", followUp: "Is there something specific that keeps your mind active at night?", period: { start: "", end: "" }, sources: [] };
  const history = buildHistory([{ question: "I cannot easily go to sleep.", answer: response.answer, response }]);
  expect(history[1]).toEqual({ role: "assistant", content: "More context would help clarify the difficulty.\nFollow-up: Is there something specific that keeps your mind active at night?" });
  expect(validateRequest({ ...request, question: "I'm thinking about my life and future.", history }).history).toEqual(history);
});
// Explicit report replay: these tests exercise actual generated replies, never call Gemini.
const reportPath = process.env.ASSISTANT_REPLAY_REPORT;
const report = reportPath ? JSON.parse(readFileSync(reportPath, "utf8")) : null;
describe.skipIf(!report)("live report mechanical replay (semantic review stays separate)", () => {
  const variant = process.env.ASSISTANT_REPLAY_VARIANT;
  it("has a complete experiment before reporting a regression pass", () => {
    expect(report.completedAt).toBeTruthy();
    expect(report.blockedReason).toBeUndefined();
    expect(report.results).toHaveLength(report.planned);
  });
  it("holds analytics, schema and generation settings fixed across prompt variants", () => {
    for (const row of report.results.filter((item: { variant: string }) => item.variant === "after")) {
      const baseline = report.results.find((item: { variant: string; run: number; id: string }) => item.variant === "before" && item.run === row.run && item.id === row.id);
      expect(baseline).toBeTruthy();
      expect(row.contextHash).toBe(baseline.contextHash);
      expect(row.schemaHash).toBe(baseline.schemaHash);
      expect(row.generation).toEqual(baseline.generation);
      expect(row.history).toEqual(baseline.history);
    }
  });
  for (const row of (report?.results ?? []).filter((item: { variant: string }) => !variant || item.variant === variant)) {
    it(`${row.variant}/${row.run}/${row.id}`, () => {
      expect(row.error).toBeUndefined();
      expect(row.automaticIssues).toEqual([]);
      expect(row.rawJson).toBeTypeOf("string");
      expect(row.response).toBeTruthy();
    });
  }
});
