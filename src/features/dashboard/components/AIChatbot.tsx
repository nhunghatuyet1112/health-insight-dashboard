import { Input, Feedback } from "@/components/ui/health-kit";
import { Button } from "@/components/ui/button";
import { Orb } from "@/components/ui/aicss/Orb";
import { ThinkingState } from "@/components/ui/aicss/ThinkingState";
import { TextResponse } from "@/components/ui/aicss/TextResponse";
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  Brain,
  MessageSquare,
  Minus,
  ArrowUp,
  Bot,
  Trash2,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { ChatResponse } from "@/features/assistant/contracts";
import { buildHistory } from "@/features/assistant/history";
interface Exchange {
  question: string;
  answer: string;
  response?: ChatResponse;
  sourceLabel?: string;
  contextKey?: string;
  sentAt?: string;
  receivedAt?: string;
}
const messageTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});
function MessageTimestamp({ value }: { value?: string }) {
  if (!value) return null;
  return <time className="synapse-chat-timestamp" dateTime={value} title={`${messageTimeFormatter.format(new Date(value))} GMT+7`}>{messageTimeFormatter.format(new Date(value))}</time>;
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
  onAsk: (
    question: string,
    options: AskOptions,
  ) => string | ChatResponse | Promise<string | ChatResponse>;
  contextKey?: string;
  realAI?: boolean;
}
/** Fixed chat composition; synchronous archive callers and the real server API share it. */
export function AIChatbot({
  greeting,
  sourceLabel,
  suggestions,
  initialExchange,
  onAsk,
  contextKey = "",
  realAI = false,
}: AIChatbotProps) {
  const open = useDashboardStore((s) => s.assistantOpen);
  const toggle = useDashboardStore((s) => s.toggleAssistant);
  // A new visit to the same range must not revive its previous request error.
  const requestScope = useMemo(() => ({ key: contextKey }), [contextKey]);
  const [draft, setDraft] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pendingState, setPending] = useState<{
    question: string;
    context: { key: string };
    controller: AbortController;
    sentAt: string;
  } | null>(null);
  const pending =
    pendingState?.context === requestScope ? pendingState.question : null;
  const [failureState, setFailure] = useState<{
    message: string;
    question: string;
    context: { key: string };
  } | null>(null);
  const failure = failureState?.context === requestScope ? failureState : null;
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const active = useRef<AbortController | null>(null);
  const currentContext = useRef(requestScope);
  const regionId = useId(),
    titleId = useId();
  useEffect(() => {
    const container = body.current;
    const exchange = container?.querySelector(".synapse-chat-exchange:last-child");
    if (container && (pending || failure)) {
      container.scrollTop = container.scrollHeight;
    } else if (container && exchange) {
      const start = exchange.querySelector(".synapse-chat-message-ai") ?? exchange;
      container.scrollTop += start.getBoundingClientRect().top - container.getBoundingClientRect().top;
    }
  }, [exchanges, pending, failure]);
  useEffect(
    () => () => {
      active.current?.abort();
    },
    [],
  );
  useEffect(() => {
    currentContext.current = requestScope;
    active.current?.abort();
    active.current = null;
  }, [requestScope]);
  function close() {
    toggle();
    trigger.current?.focus();
  }
  async function submit(question = draft.trim()) {
    if (!question || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    const requestContext = requestScope;
    const sentAt = new Date().toISOString();
    setPending({ question, context: requestScope, controller, sentAt });
    setFailure(null);
    setDraft("");
    const history = buildHistory(exchanges, contextKey);
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
      console.info("assistant.before_render", JSON.stringify({ response: answer }));
      const receivedAt = new Date().toISOString();
      setExchanges((previous) => [
        ...previous,
        {
          question,
          answer: typeof answer === "string" ? answer : answer.answer,
          response: typeof answer === "string" ? undefined : answer,
          sourceLabel,
          contextKey,
          sentAt,
          receivedAt,
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
  function handleSuggestionClick(event: MouseEvent<HTMLButtonElement>) {
    void submit(event.currentTarget.value);
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
                <h2 id={titleId}>Health Assistant</h2>
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
              <div className="synapse-chat-bubble"><TextResponse><p>{greeting}</p></TextResponse></div>
            </div>
            {all.length === 0 && !pending && !failure && (
              <div className="synapse-chat-starters" role="group" aria-label="Suggested questions">
                {suggestions.slice(0, 3).map(question => (
                  <Button key={question} type="button" variant="suggestion" size="sm" wrap value={question} onClick={handleSuggestionClick}>{question}</Button>
                ))}
              </div>
            )}
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
                      <MessageTimestamp value={exchange.sentAt} />
                    </div>
                  </div>
                  <div className="synapse-chat-message synapse-chat-message-ai">
                    <span className="synapse-chat-avatar">
                      <Brain size={13} aria-hidden="true" />
                    </span>
                    <div className="synapse-chat-bubble">
                      <TextResponse>
                      <p>{exchange.answer}</p>
                      {exchange.response && (
                        <>
                          {exchange.response.recommendation && (
                            <p>
                              {exchange.response.recommendation}
                            </p>
                          )}
                          {exchange.response.followUp && (
                            <p>{exchange.response.followUp}</p>
                          )}
                        </>
                      )}
                      </TextResponse>
                      <MessageTimestamp value={exchange.receivedAt} />
                    </div>
                  </div>
                </div>
              ))}
              {pending && (
                <div className="synapse-chat-exchange">
                  <div className="synapse-chat-message synapse-chat-message-user">
                    <div className="synapse-chat-bubble">{pending}<MessageTimestamp value={pendingState?.sentAt} /></div>
                  </div>
                  <div className="synapse-chat-message synapse-chat-message-ai" role="status" aria-label="Reviewing your health data" aria-busy="true">
                    <span className="synapse-chat-avatar" aria-hidden="true"><Orb variant="S1" size={20} /></span>
                    <div className="synapse-chat-bubble synapse-chat-thinking"><ThinkingState /></div>
                  </div>
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
