import type { ChatResponse } from "./contracts.js";

interface HistoryExchange {
  question: string;
  answer: string;
  response?: ChatResponse;
  contextKey?: string;
}
/** Last four complete exchanges: user feedback plus assistant answer/action/follow-up.
 * The latest user message is sent separately as question by /api/chat.
 * Context changes omit obsolete measurements while retaining actions and feedback.
 */
export function buildHistory(exchanges: HistoryExchange[], currentContextKey?: string) {
  return exchanges.slice(-4).flatMap(exchange => {
    const changed = currentContextKey !== undefined && exchange.contextKey !== currentContextKey;
    return [
      { role: "user" as const, content: exchange.question.slice(0, 2000) },
      { role: "assistant" as const, content: [
        changed ? "Earlier dashboard context: previous measurements omitted. Re-evaluate earlier advice using current facts." : exchange.answer.slice(0, 1200),
        exchange.response?.recommendation ? `Recommended action: ${exchange.response.recommendation.slice(0, 450)}` : "",
        exchange.response?.followUp ? `Follow-up: ${exchange.response.followUp.slice(0, 250)}` : "",
      ].filter(Boolean).join("\n").slice(0, 2000) },
    ];
  });
}
