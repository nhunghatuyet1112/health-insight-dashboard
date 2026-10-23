/** Provider JSON contract. Semantic judgments remain a separate review. */
export interface ModelResponse {
  answer: string;
  evidenceIds: string[];
  recommendation: string;
  followUp: string;
}
const fields = ["answer", "evidenceIds", "recommendation", "followUp"];
export function isModelResponse(value: unknown, allowedEvidence: readonly string[]): value is ModelResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return Object.keys(item).length === fields.length && fields.every(key => Object.hasOwn(item, key))
    && [item.answer, item.recommendation, item.followUp].every(text => typeof text === "string" && text.length <= 5000)
    && typeof item.answer === "string" && !!item.answer.trim()
    && Array.isArray(item.evidenceIds) && item.evidenceIds.length <= 6
    && new Set(item.evidenceIds).size === item.evidenceIds.length
    && item.evidenceIds.every(id => typeof id === "string" && allowedEvidence.includes(id));
}
export function sentenceCount(text: string) {
  const prose = text.replace(/\{\{[^{}]+\}\}/g, "value");
  return [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(prose)]
    .filter(segment => /\p{L}/u.test(segment.segment)).length;
}
/** Mechanical review signals, not an intent/safety classifier.
 * Keep these advisory in the API: safety guidance must never be discarded for style.
 * Regression cases explicitly assert them; semantic equivalence is reviewed manually.
 */
export function responseFieldIssues(value: ModelResponse) {
  const issues: string[] = [];
  if (sentenceCount(value.answer) > 3) issues.push("answer_sentence_limit");
  if (/[?？]/u.test(value.answer)) issues.push("question_in_answer");
  if (/[?？]/u.test(value.recommendation)) issues.push("question_in_recommendation");
  if ((value.followUp.match(/[?？]/gu) ?? []).length > 1) issues.push("multiple_follow_up_questions");
  if (value.followUp.trim() && !/[?？]/u.test(value.followUp)) issues.push("follow_up_not_question");
  const normalized = (text: string) => text.trim().toLocaleLowerCase().replace(/[.!?]+$/u, "");
  if (value.recommendation.trim() && normalized(value.answer).includes(normalized(value.recommendation))) issues.push("exact_action_repeated");
  return issues;
}
