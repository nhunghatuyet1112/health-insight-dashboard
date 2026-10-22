import { useId, type ComponentProps, type ReactNode } from "react";
import { AlertCircle, Check, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import "./health-kit.css";

export type Tone = "neutral" | "success" | "info" | "warning" | "danger" | "synthetic";
export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("ui-card", className)} {...props} />;
}
export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cn("ui-badge", className)} data-tone={tone} {...props} />;
}
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("ui-input", className)} {...props} />;
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("ui-input ui-select", className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("ui-input ui-textarea", className)} {...props} />;
}
export function Checkbox({ children, className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return <label className={cn("ui-checkbox", className)}><input type="checkbox" {...props} /><span className="ui-checkbox-box" aria-hidden="true"><Check size={12} /></span><span>{children}</span></label>;
}
export function SegmentedControl<T extends string>({ label, value, options, onChange, className, appearance = "default" }: {
  label: string; value: T; options: readonly { value: T; label: string }[];
  onChange: (value: T) => void; className?: string; appearance?: "default" | "telemetry" | "chart";
}) {
  return <div className={cn("ui-segmented", className)} data-appearance={appearance} role="group" aria-label={label}>{options.map(option =>
    <Button key={option.value} variant="ghost" size="sm" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</Button>
  )}</div>;
}
export function Progress({ value, label, tone = "success" }: { value: number | null; label: string; tone?: Tone }) {
  return <div className="ui-progress" data-tone={tone} data-empty={value === null} role="progressbar" aria-label={label}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === null ? undefined : Math.round(Math.max(0, Math.min(100, value)))}
    aria-valuetext={value === null ? "No observations" : `${Math.round(value)}% of target`}>
    <span style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }} />
  </div>;
}
export function GoalCard({ title, value, target, progress, children, tone = "success" }: {
  title: string; value: ReactNode; target: ReactNode; progress: number | null; children: ReactNode; tone?: Tone;
}) {
  return <article className="ui-goal"><header><h3>{title}</h3><span>{value} <small>/ {target}</small></span></header>
    <Progress value={progress} label={`${title} progress`} tone={tone} /><footer>{children}</footer></article>;
}
export function MetricCard({ title, value, unit, source, observed, expected, comparison, detail, action, tone = "success", className, icon }: {
  title: string; value: ReactNode; unit: string; source: string; observed: number; expected: number;
  comparison?: ReactNode; detail?: ReactNode; action?: ReactNode; tone?: Tone; className?: string; icon?: ReactNode;
}) {
  const state = observed === 0 ? "empty" : observed / expected < 0.7 ? "limited" : "ready";
  return <Card className={cn("ui-metric", className)} data-state={state} data-tone={tone}>
    <header><h3>{icon ?? <i aria-hidden="true" />}<span>{title}</span></h3>{state === "limited" ? <Badge tone="warning">&lt;70% Limited</Badge> : <span className="ui-metric-source">{source}</span>}</header>
    <div className="ui-metric-value"><strong>{value}</strong><span>{unit}</span></div>
    <div className="ui-metric-comparison">{comparison ?? <span className="ui-comparison-unavailable">Comparison unavailable{state === "limited" && <><br />(Requires ≥{Math.ceil(expected * .7)} days)</>}</span>}</div>
    <footer><span>{state === "limited" ? <>{observed}/{expected} days ({Math.round(observed / expected * 100)}% coverage)</> : <>Coverage: <b>{observed}/{expected}d</b> ({Math.round(observed / expected * 100)}%)</>}</span><span>{state === "limited" ? source : detail ?? source}</span></footer>
    {action && <div className="ui-metric-action">{action}</div>}
  </Card>;
}
export function EvidenceCard({ title, badge = "Code Engine", tone = "info", children, footer, className }: {
  title: ReactNode; badge?: string; tone?: Tone; children: ReactNode; footer?: ReactNode; className?: string;
}) {
  return <article className={cn("ui-evidence", className)}><header><h3>{title}</h3><Badge tone={tone}>{badge}</Badge></header>
    <div className="ui-evidence-body">{children}</div>{footer && <footer>{footer}</footer>}</article>;
}
export function Feedback({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const Icon = tone === "danger" || tone === "warning" ? AlertCircle : CheckCircle2;
  return <div className={cn("ui-feedback", className)} data-tone={tone} role={tone === "danger" ? "alert" : "status"}><Icon size={16} aria-hidden="true" /><div>{children}</div></div>;
}
export function LoadingState({ children }: { children: ReactNode }) {
  return <div className="ui-loading" role="status"><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />{children}</div>;
}
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="ui-empty" role="status"><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>;
}
/** Native modal supplies focus containment, Escape handling and focus restoration. */
export function Dialog({ title, children, ...props }: Omit<ComponentProps<"dialog">, "title"> & { title: string; children: ReactNode }) {
  const titleId = useId();
  return <dialog {...props} className={cn("ui-dialog", props.className)} aria-labelledby={titleId}>
    <Button variant="ghost" size="icon-sm" className="ui-dialog-close" aria-label="Close information" onClick={event => event.currentTarget.closest("dialog")?.close()}><X size={18} /></Button>
    <h2 id={titleId}>{title}</h2>{children}</dialog>;
}
