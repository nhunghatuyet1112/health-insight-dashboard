import { expect, it } from "vitest";
import { buildContext, selectContext, validateUnderstanding } from "../../server/chat";
import { analyze } from "../../src/features/health/engine";
import { DATASET_VERSION } from "../../src/features/health/demo";
const request = { question: "Ok.", history: [], range: "7d" as const, focus: "overview" as const, sources: ["apple" as const], goals: { steps: 8000, sleep: 7.5, active: 150 }, datasetVersion: DATASET_VERSION };
const available = buildContext(request, analyze(request.sources, request.range, request.goals));
const base = { userNeed: "Accept the previous offer to adjust sleep schedule", conversationContext: "Assistant offered practical guidance", analyticsNeed: "not_needed" as const, relevantMetricIds: [], previouslySuggestedActions: [], userReportedUnsuccessfulActions: [] };
it.each(["helpful", "not_needed"] as const)("omits analytics for %s even when metric IDs are suggested", analyticsNeed => {
  const selected = selectContext(available, { ...base, analyticsNeed, relevantMetricIds: ["sleepHours"] });
  expect(selected.evidence).toEqual([]);
  expect(selected.facts).toEqual({});
  expect(selected.context.metrics).toEqual([]);
  expect(selected.context.goals).toEqual([]);
  expect(selected.context.workouts).toEqual([]);
  expect(selected.context.checkins).toEqual([]);
  expect(selected.context.period).toBeUndefined();
  expect(selected.context.requestUnderstanding.userNeed).toBe(base.userNeed);
});
it("selects sleep evidence with its goal dependencies without unrelated readings", () => {
  const selected = selectContext(available, { ...base, analyticsNeed: "required", relevantMetricIds: ["sleepHours"] });
  expect(selected.context.metrics.map(item => item.id)).toContain("sleepHours");
  expect(selected.context.metrics.map(item => item.id)).not.toContain("steps");
  expect(selected.facts["steps.current"]).toBeUndefined();
  for (const fact of Object.values(selected.facts)) {
    if (fact.evidenceId) expect(selected.evidence.some(item => item.id === fact.evidenceId)).toBe(true);
  }
});
it("rejects fabricated IDs, missing fields, extra fields and malformed understanding", () => {
  expect(validateUnderstanding(base, [])).toEqual(base);
  for (const bad of [null, {}, { ...base, relevantMetricIds: ["invented"] }, { ...base, analyticsNeed: "maybe" }, { ...base, extra: true }, { ...base, previouslySuggestedActions: [42] }]) {
    expect(() => validateUnderstanding(bad, [])).toThrow();
  }
});

import { buildResponseInput, resolveFacts, validateSentenceFacts } from "../../server/chat";
it("places compact understanding beside the latest question and omits redundant fields only in B", () => {
  const understanding = { ...base, previouslySuggestedActions: ["Try dimming lights."], conversationContext: "Earlier advice included dimming lights." };
  const selected = selectContext(available, understanding);
  const a = buildResponseInput(request, understanding, selected, "compact");
  const b = buildResponseInput(request, understanding, selected, "history_only");
  const brief = (input: typeof a) => JSON.parse(input.contents.at(-1)!.parts[0].text).requestUnderstanding;
  expect(brief(a).previouslySuggestedActions).toEqual(understanding.previouslySuggestedActions);
  expect(brief(b)).not.toHaveProperty("previouslySuggestedActions");
  expect(brief(b)).not.toHaveProperty("conversationContext");
  expect(brief(b).userNeed).toBe(understanding.userNeed);
  expect(b.context).not.toHaveProperty("requestUnderstanding");
  expect(b.context).not.toHaveProperty("preferences");
  expect(understanding.previouslySuggestedActions).toEqual(["Try dimming lights."]);
  expect(a.contents.at(-1)!.parts.at(-1)!.text).toBe(request.question);
});
it("supplies only individual facts for generation, including broad progress", () => {
  const understanding = { ...base, userNeed: "Assess broad dashboard progress", analyticsNeed: "required" as const, relevantMetricIds: ["sleepHours", "steps"] };
  const input = buildResponseInput(request, understanding, selectContext(available, understanding));
  expect(Object.keys(input.facts).some(id => /\.(trend|goalComparison)$/.test(id))).toBe(false);
  expect(input.facts["sleepHours.current"]).toBeDefined();
  expect(input.facts["sleepTarget.current"]).toBeDefined();
});
it.each([
  "However, {{sleepHours.goalComparison}} and activity decreased.",
  "{{sleepHours.goalComparison}} and activity decreased.",
  "Sleep improved: {{sleepHours.trend}}.",
  "{{sleepHours.trend}} {{steps.trend}}",
])("rejects complete-sentence placeholders embedded in prose: %s", text => {
  expect(() => validateSentenceFacts(text)).toThrow();
});
it.each(["{{sleepHours.goalComparison}}", "{{sleepHours.trend}}. More context helps.", "A mixed picture. {{sleepHours.goalComparison}}.", "Sleep averages {{sleepHours.current}}."])("accepts standalone sentences or individual facts: %s", text => {
  expect(() => validateSentenceFacts(text)).not.toThrow();
});
it("checks sentence composition before fact replacement", () => {
  expect(() => resolveFacts("However, {{sleepHours.goalComparison}} and activity decreased.", { "sleepHours.goalComparison": { text: "Sleep is below target." } }, new Set())).toThrow();
});
