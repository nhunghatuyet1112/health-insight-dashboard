import { Input, EvidenceCard, Feedback, LoadingState } from "@/components/ui/health-kit";
import { Button } from "@/components/ui/button";
import { useEffect, useId, useRef, useState } from "react";
import {
  Brain,
  MessageSquare,
  Minus,
  ArrowUp,
  ShieldCheck,
  Bot,
  Trash2,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { ChatResponse, ChatEvidence } from "@/features/assistant/contracts";
import { format } from "@/features/health/engine";
interface Exchange {
  question: string;
  answer: string;
  response?: ChatResponse;
  sourceLabel?: string;
}
export interface AskOptions {
  signal: AbortSignal;
  history: { role: "user" | "assistant"; content: string }[];
}
interface AIChatbotProps {
  greeting: string;
  sourceLabel: string;
  suggestions: string[];
  initialExchange?: Exchange;
  initialEvidence?: ChatEvidence[];
  initialRecommendation?: string;
  onAsk: (
    question: string,
    options: AskOptions,
  ) => string | ChatResponse | Promise<string | ChatResponse>;
  contextKey?: string;
  realAI?: boolean;
}
function GroundedTelemetry({ evidence, compact = false }: { evidence: ChatEvidence[]; compact?: boolean }) {
  if (!evidence.length) return null;
  const coverage = evidence.find(e => e.kind !== "target" && /^\d+\/\d+$/.test(e.coverage))?.coverage;
  const [observed, expected] = (coverage ?? "").split("/").map(Number);
  return <EvidenceCard className="synapse-grounded-telemetry" title="GROUNDED TELEMETRY" tone="success" badge={coverage && expected ? `Coverage ${Math.round(observed / expected * 100)}% (${coverage}d)` : "Code Engine"}>
    {evidence.map(e => <p key={e.id}>{e.label}: <strong>{format(e.value, e.unit.includes("hour") || e.unit === "km" || e.id === "restingHeartRateBpm" ? 1 : 0)} {e.unit}</strong>{!compact && <span className="synapse-grounded-detail"> · {e.kind === "target" ? "Personal target" : `${e.coverage} recorded · ${e.start}–${e.end}`}</span>}</p>)}
  </EvidenceCard>;
}
/** Fixed chat composition; synchronous archive callers and the real server API share it. */
export function AIChatbot({
  greeting,
  sourceLabel,
  suggestions,
  initialExchange,
  initialEvidence,
  initialRecommendation,
  onAsk,
  contextKey = "",
  realAI = false,
}: AIChatbotProps) {
  const open = useDashboardStore((s) => s.assistantOpen);
  const toggle = useDashboardStore((s) => s.toggleAssistant);
  const [draft, setDraft] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pendingState, setPending] = useState<{
    question: string;
    context: string;
    controller: AbortController;
  } | null>(null);
  const pending =
    pendingState?.context === contextKey ? pendingState.question : null;
  const [failureState, setFailure] = useState<{
    message: string;
    question: string;
    context: string;
  } | null>(null);
  const failure = failureState?.context === contextKey ? failureState : null;
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const active = useRef<AbortController | null>(null);
  const currentContext = useRef(contextKey);
  const regionId = useId(),
    titleId = useId();
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [exchanges, pending, failure]);
  useEffect(
    () => () => {
      active.current?.abort();
    },
    [],
  );
  useEffect(() => {
    currentContext.current = contextKey;
    active.current?.abort();
    active.current = null;
  }, [contextKey]);
  function close() {
    toggle();
    trigger.current?.focus();
  }
  async function submit(question = draft.trim()) {
    if (!question || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    const requestContext = contextKey;
    setPending({ question, context: contextKey, controller });
    setFailure(null);
    setDraft("");
    const history = exchanges.slice(-4).flatMap((exchange) => [
      { role: "user" as const, content: exchange.question.slice(0, 2000) },
      { role: "assistant" as const, content: exchange.answer.slice(0, 2000) },
    ]);
    try {
      const answer = await onAsk(question, {
        signal: controller.signal,
        history,
      });
      if (
        controller.signal.aborted ||
        currentContext.current !== requestContext
      )
        return;
      setExchanges((previous) => [
        ...previous,
        {
          question,
          answer: typeof answer === "string" ? answer : answer.answer,
          response: typeof answer === "string" ? undefined : answer,
          sourceLabel,
        },
      ]);
    } catch (error) {
      if (
        !controller.signal.aborted &&
        currentContext.current === requestContext
      )
        setFailure({
          question,
          context: requestContext,
          message:
            error instanceof Error
              ? error.message
              : "The assistant is unavailable. Please retry.",
        });
    } finally {
      setPending((previous) =>
        previous?.controller === controller ? null : previous,
      );
      if (active.current === controller) {
        active.current = null;
        input.current?.focus();
      }
    }
  }
  const all = [...(initialExchange ? [initialExchange] : []), ...exchanges];
  return (
    <aside className="dashboard-assistant" aria-label="AI health assistant">
      {open && (
        <section
          id={regionId}
          role="region"
          aria-labelledby={titleId}
          className="ui-card synapse-chat"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <header className="synapse-chat-header">
            <div className="synapse-chat-brand">
              <span className="synapse-chat-symbol">
                <Bot size={16} aria-hidden="true" />
              </span>
              <div>
                <h2 id={titleId}>Synapse AI Assistant</h2>
                <p>
                  {realAI ? "Grounded in 60-day demo telemetry GMT+7" : "Archived scripted preview"}
                </p>
              </div>
            </div>
            <div className="synapse-chat-controls">
              {(all.length > 0 || draft) && <Button variant="ghost" size="icon-sm" type="button" title="Clear conversation" aria-label="Clear conversation" onClick={() => {
                active.current?.abort(); active.current = null; setPending(null); setFailure(null); setExchanges([]); setDraft(''); input.current?.focus();
              }}><Trash2 size={16} aria-hidden="true" /></Button>}
              <Button
                type="button"
                variant="ghost" size="icon-sm"
                title="Minimize"
                aria-label="Minimize assistant"
                onClick={close}
              >
                <Minus size={18} aria-hidden="true" />
              </Button>
            </div>
          </header>
          <div ref={body} className="synapse-chat-body">
            <div className="synapse-chat-message synapse-chat-message-ai">
              <span className="synapse-chat-avatar">
                <Brain size={13} aria-hidden="true" />
              </span>
              <div className="synapse-chat-bubble"><p>{greeting}</p>{initialEvidence?.length ? <GroundedTelemetry evidence={initialEvidence} compact /> : null}{initialRecommendation && <p className="synapse-chat-recommendation">Recommended action: {initialRecommendation}</p>}</div>
            </div>
            <div
              role="log"
              aria-label="Assistant conversation"
              aria-live="polite"
              aria-relevant="additions"
              className="synapse-chat-log"
            >
              {all.map((exchange, index) => (
                <div className="synapse-chat-exchange" key={index}>
                  <div className="synapse-chat-message synapse-chat-message-user">
                    <div className="synapse-chat-bubble">
                      {exchange.question}
                    </div>
                  </div>
                  <div className="synapse-chat-message synapse-chat-message-ai">
                    <span className="synapse-chat-avatar">
                      <Brain size={13} aria-hidden="true" />
                    </span>
                    <div className="synapse-chat-bubble">
                      <p>{exchange.answer}</p>
                      {exchange.response && (
                        <>
                          <GroundedTelemetry evidence={exchange.response.evidence} />
                          {exchange.response.recommendation && (
                            <p>
                              <strong>Recommended action:</strong>{" "}
                              {exchange.response.recommendation}
                            </p>
                          )}
                          {exchange.response.followUp && (
                            <Button
                              variant="link" size="sm"
                              type="button"
                              onClick={() => {
                                setDraft(exchange.response!.followUp);
                                input.current?.focus();
                              }}
                            >
                              {exchange.response.followUp}
                            </Button>
                          )}
                        </>
                      )}
                      <div className="synapse-chat-source">
                        <ShieldCheck size={12} aria-hidden="true" />
                        {exchange.response
                          ? `${exchange.response.period.start}–${exchange.response.period.end} · ${exchange.response.sources.join(", ") || "No connected sources"}`
                          : (exchange.sourceLabel ?? sourceLabel)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {pending && (
                <div className="synapse-chat-exchange">
                  <div className="synapse-chat-message synapse-chat-message-user">
                    <div className="synapse-chat-bubble">{pending}</div>
                  </div>
                  <LoadingState>Reviewing your health data…</LoadingState>
                </div>
              )}
            </div>
            {failure && (
              <Feedback tone="danger">
                <p>{failure.message}</p>
                <Button
                  type="button"
                  variant="link" size="sm"
                  onClick={() => void submit(failure.question)}
                >
                  Retry question
                </Button>
              </Feedback>
            )}

          </div>
          <footer className="synapse-chat-footer">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Input
                ref={input}
                name="assistant-question"
                autoComplete="off"
                aria-label="Ask the health assistant"
                placeholder="Ask about metrics, sleep, recovery…"
                list={`${regionId}-suggestions`}
                value={draft}
                maxLength={realAI ? 1500 : 300}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button
                type="submit"
                variant="composer"
                size="icon"
                disabled={!!pending || !draft.trim()}
                aria-label="Send message"
              >
                <ArrowUp size={18} aria-hidden="true" />
              </Button>
            </form>
            <datalist id={`${regionId}-suggestions`}>{suggestions.map(question => <option key={question} value={question} />)}</datalist>
          </footer>
        </section>
      )}
      <Button
        hidden={open}
        ref={trigger}
        variant="outline"
        type="button"
        className="dashboard-assistant-launcher"
        aria-expanded={open}
        aria-controls={open ? regionId : undefined}
        aria-label="Toggle AI Health Assistant"
        onClick={toggle}
      >
        <span className="synapse-chat-status" aria-hidden="true" />
        <span>AI Health Assistant</span>
        <MessageSquare size={16} aria-hidden="true" />
      </Button>
    </aside>
  );
}
