import { Brain, Minus, Send, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";

export function HealthAssistant() {
  const assistantOpen = useDashboardStore((state) => state.assistantOpen);
  const toggleAssistant = useDashboardStore((state) => state.toggleAssistant);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <aside
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-sm w-[calc(100%-2rem)] pointer-events-none"
      id="ai-assistant-container"
    >
      <div
        className="pointer-events-auto w-full glass-card border border-white/10 rounded-2xl shadow-2xl mb-3 flex flex-col overflow-hidden transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300 origin-bottom-right"
        id="ai-chat-window"
        hidden={!assistantOpen}
      >
        <div className="px-4 py-3 bg-surface-container-high/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shadow-[0_0_10px_rgba(74,222,128,0.25)]">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
            </div>
            <div>
              <div className="font-headline-sm text-xs font-bold text-text-primary leading-none">
                {"Synapse Health AI"}
              </div>
              <div className="font-label-sm text-[10px] text-text-muted font-mono mt-0.5">
                {"Grounded in verified vitals"}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
              id="minimize-ai-btn"
              title="Minimize"
              type="button"
              onClick={toggleAssistant}
            >
              <Minus
                aria-hidden="true"
                className="reference-icon text-[18px]"
              />
            </button>
            <button
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
              id="close-ai-btn"
              title="Close"
              type="button"
              onClick={toggleAssistant}
            >
              <X aria-hidden="true" className="reference-icon text-[18px]" />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto max-h-[min(340px,45dvh)] space-y-3 bg-[#090e18]/80 text-xs">
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Brain
                aria-hidden="true"
                className="reference-icon text-[13px]"
              />
            </div>
            <div className="bg-surface-container-high/60 p-3 rounded-lg border border-white/10 font-body-sm text-slate-200 leading-relaxed">
              {
                " Hi Alex, I have access to your vitals, sleep telemetry, and activity logs. How can I assist your wellness routine today? "
              }
            </div>
          </div>
          <div className="flex items-start justify-end space-x-2">
            <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white p-2.5 rounded-lg font-body-sm max-w-[85%] shadow-md border border-emerald-400/30">
              {" What should I focus on today? "}
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Brain
                aria-hidden="true"
                className="reference-icon text-[13px]"
              />
            </div>
            <div className="bg-surface-container-high/60 p-3 rounded-lg border border-white/10 font-body-sm text-slate-200 space-y-2 leading-relaxed">
              <p>
                {"Based on your "}
                <strong className="text-white">{"8h 14m sleep"}</strong>
                {" and resting HR of "}
                <strong className="text-white">{"58 bpm"}</strong>
                {", your recovery score is peaked at "}
                <strong className="text-primary font-semibold">{"89%"}</strong>
                {"."}
              </p>
              <p>
                {
                  "You are well-positioned for your planned interval run. Maintain hydration (currently 600ml behind target) for optimal thermoregulation."
                }
              </p>
              <div className="font-label-sm text-[10px] text-primary font-semibold pt-1.5 border-t border-white/10 flex items-center gap-1">
                <ShieldCheck
                  aria-hidden="true"
                  className="reference-icon text-[12px]"
                />
                {" Vitals verified live from Apple HealthKit & WHOOP "}
              </div>
            </div>
          </div>
          <div className="pt-2">
            <span className="font-label-sm text-[10px] uppercase text-text-muted block mb-1.5 font-semibold tracking-wider font-mono">
              {"Suggested Questions:"}
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                className="px-2 py-0.5 bg-surface-container-high/60 border border-white/10 hover:border-primary/40 rounded-full text-text-secondary hover:text-primary font-label-sm text-[11px] transition-colors"
                type="button"
                onClick={() => {
                  setDraft("How is my recovery?");
                  inputRef.current?.focus();
                }}
              >
                {' "How is my recovery?" '}
              </button>
              <button
                className="px-2 py-0.5 bg-surface-container-high/60 border border-white/10 hover:border-primary/40 rounded-full text-text-secondary hover:text-primary font-label-sm text-[11px] transition-colors"
                type="button"
                onClick={() => {
                  setDraft("Hydration plan for today");
                  inputRef.current?.focus();
                }}
              >
                {' "Hydration plan for today" '}
              </button>
              <button
                className="px-2 py-0.5 bg-surface-container-high/60 border border-white/10 hover:border-primary/40 rounded-full text-text-secondary hover:text-primary font-label-sm text-[11px] transition-colors"
                type="button"
                onClick={() => {
                  setDraft("Explain HRV change");
                  inputRef.current?.focus();
                }}
              >
                {' "Explain HRV change" '}
              </button>
            </div>
          </div>
        </div>
        <div className="p-2.5 bg-surface-container-high/70 border-t border-white/10">
          <p className="mb-2 text-[10px] text-text-secondary">
            Static UI preview · Messages are not sent.
          </p>
          <form
            className="flex items-center space-x-1.5"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              className="w-full text-xs font-body-sm bg-surface-container-low border border-white/10 rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Ask about vitals, recovery, or diet..."
              type="text"
              aria-label="Ask the health assistant"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              className="px-3 py-2 bg-linear-to-r from-primary to-emerald-400 text-on-primary rounded-lg font-label-md text-xs font-semibold hover:brightness-110 active:scale-95 transition-[color,background-color,border-color,box-shadow,transform,filter] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(74,222,128,0.3)]"
              type="submit"
              aria-label="Send message (UI preview)"
            >
              <Send aria-hidden="true" className="reference-icon text-[16px]" />
            </button>
          </form>
        </div>
      </div>
      <button
        aria-label="Toggle AI Health Assistant"
        className="pointer-events-auto flex items-center space-x-2.5 px-4 py-2.5 bg-[#0f172a] border border-primary/40 text-text-primary rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(74,222,128,0.25)] hover:border-primary hover:bg-[#131d33] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-200 active:scale-95 group"
        id="toggle-ai-btn"
        type="button"
        onClick={toggleAssistant}
        aria-expanded={assistantOpen}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </span>
        <span className="font-headline-sm text-xs font-semibold tracking-wide text-white group-hover:text-primary transition-colors">
          {"AI Health Assistant"}
        </span>
        <svg
          className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform shrink-0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    </aside>
  );
}
