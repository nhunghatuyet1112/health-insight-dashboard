import { Input, SegmentedControl, MetricCard, GoalCard, EvidenceCard, Feedback, EmptyState, Dialog } from "@/components/ui/health-kit";
import { Button } from "@/components/ui/button";
import { WellnessJournal } from "./WellnessJournal";
import { useMemo, useState, useRef, useLayoutEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Brain,
  Download,
  Footprints,
  RefreshCw,
  Target,
  Watch,
  Zap,
  Moon,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Bell,
} from "lucide-react";
import {
  DashboardShell,
  DashboardPanel as Panel,
  DashboardButton as Action,
} from "@/features/dashboard/components/DashboardSystem";
import {
  AIChatbot,
  type AskOptions,
} from "@/features/dashboard/components/AIChatbot";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useHealthStore } from "@/stores/health-store";
import { navigate, useRoute } from "@/features/onboarding/navigation";
import {
  analyze,
  difference,
  format,
  metricNames,
  metrics,
  units,
  type Analytics,
} from "./engine";
import { DATASET_VERSION, providers } from "./demo";
import type { Metric, Pillar, Provider } from "./model";
import type { ChatResponse } from "@/features/assistant/contracts";
import { SourceConnections } from "./SourceConnections";
const colors: Record<Metric, string> = {
  steps: "var(--color-primary)",
  activeMinutes: "var(--color-secondary)",
  sleepHours: "var(--color-accent)",
  restingHeartRateBpm: "var(--color-tertiary-fixed-dim)",
};
const pillars: Pillar[] = ["activity", "sleep", "recovery"];
function GoalProgress({ data }: { data: Analytics }) {
  return (
    <>
      {data.goals.map((goal) => (
        <GoalCard key={goal.id} title={goal.label}
          value={format(goal.value, goal.id === "sleep" ? 1 : 0)}
          target={format(goal.target, goal.id === "sleep" ? 1 : 0)} progress={goal.progress}
          tone={goal.id === "sleep" ? "info" : "success"}>
          {goal.progress === null ? "No observations" : `${format(goal.progress)}% of target`} · {goal.unit} · {goal.observed}/{data.period.days} days recorded
          {goal.id !== "active" ? ` · ${goal.reached}/${goal.observed} recorded days met target` : ""}
        </GoalCard>
      ))}
      <details className="health-insight health-weekly-details"><summary>Observed weekly exercise</summary>{data.weeklyExercise.map(week => <p key={week.start}>{week.start}–{week.end}: {format(week.total)} / {format(data.goals[2].target)} min · {week.observed}/7 days · {!week.sufficient ? 'Limited data' : week.met ? 'Target reached' : 'Below target in recorded data'}</p>)}<small>Complete seven-day blocks within this range; partial blocks excluded. Missing dates are not estimated.</small></details>
    </>
  );
}
function GoalEditor() {
  const profile = useOnboardingStore((s) => s.profile);
  const update = useOnboardingStore((s) => s.updateProfile);
  const [saved, setSaved] = useState(false);
  return (
    <Panel>
      <h2>Adjust your targets</h2>
      <p className="muted">
        Personal goals, not clinical thresholds. Changes update every view and
        the assistant.
      </p>
      <form
        key={`${profile.stepsPerDay}-${profile.sleepHours}-${profile.activeMinutesPerWeek}`}
        className="health-goal-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          update({
            stepsPerDay: Number(form.get("steps")),
            sleepHours: Number(form.get("sleep")),
            activeMinutesPerWeek: Number(form.get("active")),
          });
          setSaved(true);
        }}
        onChange={() => setSaved(false)}
      >
        <label>
          Daily steps
          <Input
            required
            type="number"
            name="steps"
            min={1000}
            max={50000}
            step={100}
            defaultValue={profile.stepsPerDay}
          />
        </label>
        <label>
          Sleep hours / night
          <Input
            required
            type="number"
            name="sleep"
            min={4}
            max={11}
            step={0.25}
            defaultValue={profile.sleepHours}
          />
        </label>
        <label>
          Active minutes / week
          <Input
            required
            type="number"
            name="active"
            min={10}
            max={1500}
            step={5}
            defaultValue={profile.activeMinutesPerWeek}
          />
        </label>
        <Action type="submit" variant="default">
          Save targets
        </Action>
      </form>
      {saved && (
        <Feedback tone="success">Targets saved.</Feedback>
      )}
    </Panel>
  );
}
const chartLabels: Record<Metric, string> = { steps: "Daily Steps Count", activeMinutes: "Active Minutes", sleepHours: "Sleep Hours", restingHeartRateBpm: "Resting HR" };
function chartDate(date: string) { return new Date(`${date}T00:00:00+07:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }); }
function Chart({ data, metric }: { data: Analytics; metric: Metric }) {
  if (!data.summary[metric].observed)
    return (
      <EmptyState title={`No ${metricNames[metric].toLowerCase()} observations`} action={<Action onClick={() => navigate("/integrations")}>Manage sources</Action>}>
        This metric needs Apple Health or Garmin data. Missing measurements are not zero.
      </EmptyState>
    );
  const missingDates = data.current
    .filter((row) => row[metric] === null)
    .map((row) => row.date);
  const target =
    metric === "steps"
      ? data.goals[0].target
      : metric === "sleepHours"
        ? data.goals[1].target
        : null;
  const highest = data.current.reduce<(typeof data.current)[number] | null>((best, row) => row[metric] !== null && (best === null || row[metric]! > best[metric]!) ? row : best, null);
  const chartUnit = metric === "steps" ? "steps" : metric === "activeMinutes" ? "min" : metric === "sleepHours" ? "hrs" : "bpm";
  return (
    <div className="health-chart-surface">
      <div className="health-chart-legend"><span style={{color: colors[metric]}}><i style={{background: colors[metric]}} />{chartLabels[metric]}</span>{target !== null && <span><i className="health-target-swatch" />Target: {format(target, metric === "sleepHours" ? 1 : 0)} {chartUnit}</span>}<span className="health-chart-highest">Highest: {format(highest?.[metric] ?? null, metric === "sleepHours" || metric === "restingHeartRateBpm" ? 1 : 0)} {highest ? `(${chartDate(highest.date)})` : ""}</span></div>
      <div
        className="health-chart"
        role="img"
        aria-label={`${metricNames[metric]} over ${data.period.days} days. ${missingDates.length} days have no measurement and appear as gaps. Exact values follow in daily records.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.current}
            margin={{ top: 12, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`health-fill-${metric}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colors[metric]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={colors[metric]}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-outline-variant)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={Array.from({length: Math.min(7, data.current.length)}, (_, index) => data.current[Math.round(index * (data.current.length - 1) / (Math.min(7, data.current.length) - 1))].date)}
              interval="preserveStartEnd"
              tickFormatter={v => chartDate(String(v))}
              stroke="var(--color-outline)"
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              fontFamily="var(--font-mono)"
              fontSize={10}
              tickMargin={10}
              minTickGap={40}
              height={30}
            />
            <YAxis hide tickCount={4}
              domain={
                metric === "restingHeartRateBpm"
                  ? ["dataMin - 5", "dataMax + 5"]
                  : [0, "auto"]
              }
              stroke="var(--color-text-secondary)"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={45}
            />
            <Tooltip filterNull={false} cursor={{stroke: "var(--color-accent)", strokeDasharray: "2 2", strokeWidth: 1}}
              content={({active, payload}) => {
                const row = payload?.[0]?.payload as (typeof data.current)[number] | undefined;
                if (!active || !row || row[metric] === null) return null;
                const source = row.sources[metric];
                const sourceName = source === "manual" ? "Manual estimate" : providers.find(p => p.id === source)?.name.replace(" Connect", "").replace(" Health", "");
                const value = row[metric]!;
                return <div className="health-chart-tooltip"><header><span>{chartDate(row.date)} (GMT+7)</span><span>{sourceName}{source !== "manual" ? " Sync" : ""}</span></header><p><strong style={{color: colors[metric]}}>{format(value, metric === "sleepHours" || metric === "restingHeartRateBpm" ? 1 : 0)} {chartUnit}</strong>{target !== null && <span>({value >= target ? "+" : ""}{format((value / target - 1) * 100)}% vs goal)</span>}</p></div>;
              }} />
            <Area
              name={metricNames[metric]}
              type="linear"
              dataKey={metric}
              stroke={colors[metric]}
              strokeWidth={2.2}
              fill={`url(#health-fill-${metric})`}
              connectNulls={false}
              dot={data.period.days === 7 ? { r: 3, fill: "var(--color-surface-container-lowest)", stroke: colors[metric], strokeWidth: 2 } : false}
              activeDot={{ r: 4, stroke: "var(--color-surface-container-lowest)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {target !== null && (
              <ReferenceLine
                y={target}
                stroke="var(--color-text-secondary)"
                strokeDasharray="5 5"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function DailyRecords({ data }: { data: Analytics }) {
  const [expanded, setExpanded] = useState(false);
  const rows = [...data.current].reverse();
  return <div className="health-telemetry">
    <div className="health-table-scroll"><table>
      <caption>Synthetic measurements · {data.period.start}–{data.period.end}</caption>
      <thead><tr><th scope="col">Date</th><th scope="col">Steps</th><th scope="col">Active Mins</th><th scope="col">Sleep</th><th scope="col">Resting HR</th><th scope="col">Source</th></tr></thead>
      <tbody>{(expanded ? rows : rows.slice(0, 4)).map(row => <tr key={row.date}>
        <th scope="row">{new Date(`${row.date}T00:00:00+07:00`).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Ho_Chi_Minh"})}</th>
        {metrics.map(m => <td key={m}>{row[m] === null ? "—" : m === "sleepHours" ? `${Math.floor(Math.round(row[m]! * 60) / 60)}h ${Math.round(row[m]! * 60) % 60}m` : `${format(row[m], m === "restingHeartRateBpm" ? 1 : 0)}${m === "activeMinutes" ? "m" : m === "restingHeartRateBpm" ? " bpm" : ""}`}</td>)}
        <td><span className="health-record-source">{[...new Set(metrics.map(m => row.sources[m]).filter(Boolean))].map(id => id === "manual" ? "Manual estimate" : providers.find(p => p.id === id)?.name.replace(" Connect", "").replace(" Health", "")).join(" + ") || "Missing"}</span></td>
      </tr>)}</tbody>
    </table></div>
    <div className="health-table-footer"><span>Showing {expanded ? rows.length : Math.min(4, rows.length)} of {rows.length} dates</span><Button variant="link" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? "Show recent records" : "View full records"}<ArrowRight size={13} /></Button></div>
    <p className="muted">— is missing; zero is a recorded rest day. Dates use GMT+7.</p>
  </div>;
}

function InsightList({ data, pillar, compact = false }: { data: Analytics; pillar?: Pillar; compact?: boolean }) {
  const primary = useOnboardingStore((s) => s.profile.primary);
  const preferred =
    primary === "fitness"
      ? "activity"
      : primary === "energy"
        ? "recovery"
        : primary;
  const insights = [...data.insights]
    .sort(
      (a, b) => Number(b.pillar === preferred) - Number(a.pillar === preferred),
    )
    .filter((i) => !pillar || i.pillar === pillar);
  return (
    <>
      {insights.length ? (
        insights.map((insight) => (
          <EvidenceCard className={compact ? "health-pattern-evidence" : undefined} badge={compact ? "DETERMINISTIC CODE RULE" : "Code Engine"} tone={compact ? "neutral" : "info"} key={insight.id} title={insight.title} footer={<>{!compact && <p>{insight.action}</p>}<Button variant="link" size="sm" onClick={() => navigate(`/insights/${insight.pillar}`)}>Explore {insight.pillar}<ArrowRight size={13} aria-hidden="true" /></Button></>}>
            <p>{insight.evidence}</p>
          </EvidenceCard>
        ))
      ) : (
        <p className="muted">
          Not enough recorded data for this insight. Connect a relevant source
          or review coverage.
        </p>
      )}
    </>
  );
}
function VirtualWorkoutList({ workouts }: { workouts: Analytics["workouts"] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const offsets = useMemo(() => {
    const result = [0];
    for (let index = 0; index < workouts.length; index++) result.push(result[index] + (heights[index] ?? 100));
    return result;
  }, [workouts.length, heights]);
  const total = offsets.at(-1) ?? 0;
  const viewportHeight = Math.min(total, 320);
  // Two extra rows on either side avoid blank space during fast scrolling.
  const first = Math.max(0, offsets.findIndex((_, index) => index < workouts.length && offsets[index + 1] > Math.min(scrollTop, Math.max(0, total - viewportHeight))) - 2);
  const lastVisible = offsets.findIndex(offset => offset >= scrollTop + viewportHeight);
  const end = Math.min(workouts.length, (lastVisible < 0 ? workouts.length : lastVisible) + 2);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      setHeights(previous => {
        let next = previous;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.workoutIndex);
          const height = entry.borderBoxSize[0]?.blockSize ?? entry.target.getBoundingClientRect().height;
          if (height > 0 && previous[index] !== height) {
            if (next === previous) next = { ...previous };
            next[index] = height;
          }
        }
        return next;
      });
    });
    element.querySelectorAll("[data-workout-index]").forEach(row => observer.observe(row));
    return () => observer.disconnect();
  }, [first, end]);
  return <div ref={viewport} className="health-workout-list health-workout-virtual" role="region" aria-label="Recent workouts, scroll to browse" tabIndex={0} style={{height: viewportHeight}} onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>
    <div role="list" aria-label="Workout sessions" style={{height: total, position: "relative"}}>
      {workouts.slice(first, end).map((workout, offset) => {
        const index = first + offset;
        return <div role="listitem" aria-posinset={index + 1} aria-setsize={workouts.length} data-workout-index={index} key={workout.eventId} className="health-workout-virtual-row" style={{transform: `translateY(${offsets[index]}px)`}}>
          <div className="milestone"><span><Footprints size={17} aria-hidden="true" /></span><div><strong>{workout.type}</strong><small>{workout.date} · {workout.sources.map(id => id === "manual" ? "Manual entry" : providers.find(p => p.id === id)?.name).join(" + ")}{workout.sources.length > 1 ? " · merged duplicate" : ""}</small><small>{format(workout.distanceKm, 1)} km · {format(workout.averageHeartRateBpm)} bpm workout average</small></div><b>{workout.durationMinutes} min</b></div>
        </div>;
      })}
    </div>
  </div>;
}
function WorkoutHistory({ data }: { data: Analytics }) {
  return <Panel>
    <h2>Recent Workouts</h2>
    <p className="muted health-workout-description">Workout records are deduplicated across sources. Their duration is not added again to daily active minutes.</p>
    {data.workouts.length ? <VirtualWorkoutList key={`${data.period.start}-${data.period.end}-${data.workouts.map(w => `${w.eventId}:${w.sources.join(",")}`).join("|")}`} workouts={data.workouts} /> : <p className="muted">No workout sessions in this period. Connect a workout source to include its history.</p>}
  </Panel>;
}

export function HealthOverview() {
  const route = useRoute();
  const profile = useOnboardingStore((s) => s.profile);
  const resetProfile = useOnboardingStore((s) => s.resetDemo);
  const connections = useHealthStore((s) => s.connections);
  const permissions = useHealthStore(s => s.permissions);
  const entries = useHealthStore(s => s.entries);
  const revision = useHealthStore(s => s.revision);
  const range = useHealthStore((s) => s.range);
  const setRange = useHealthStore((s) => s.setRange);
  const reset = useHealthStore((s) => s.reset);
  const sync = useHealthStore(s => s.connect);
  const statusDialog = useRef<HTMLDialogElement>(null);
  const [metricSearch, setMetricSearch] = useState("");
  const syncing = Object.values(connections).some(c => c.status === "syncing" || c.status === "connecting");
  const [overviewMetric, setOverviewMetric] = useState<Metric>("steps");
  const [activityMetric, setActivityMetric] = useState<Metric>("steps");
  const sourceKey = (["apple", "garmin", "strava"] as Provider[])
    .filter((id) => connections[id].connected)
    .join(",");
  const sources = useMemo(
    () => (sourceKey ? (sourceKey.split(",") as Provider[]) : []),
    [sourceKey],
  );
  const targets = useMemo(
    () => ({
      steps: profile.stepsPerDay,
      sleep: profile.sleepHours,
      active: profile.activeMinutesPerWeek,
    }),
    [profile.stepsPerDay, profile.sleepHours, profile.activeMinutesPerWeek],
  );
  const data = useMemo(
    () => analyze(sources, range, targets, { permissions, entries }),
    [sources, range, targets, permissions, entries],
  );
  const page = route === "/journal" ? "journal" : route.startsWith("/insights")
    ? "insights"
    : route === "/goals"
      ? "goals"
      : route === "/integrations"
        ? "integrations"
        : "overview";
  const selectedPillar =
    pillars.find((p) => route === `/insights/${p}`) ?? "activity";
  const focus = page === "insights" ? selectedPillar : page;
  const metric =
    page === "insights"
      ? selectedPillar === "sleep"
        ? "sleepHours"
        : selectedPillar === "recovery"
          ? "restingHeartRateBpm"
          : activityMetric
      : overviewMetric;
  const noData =
    !metrics.some((m) => data.summary[m].observed > 0) && !data.workouts.length;
  const title = {
    journal: "Wellness Journal",
    overview: "Dashboard Overview",
    insights: "Health Insights",
    goals: "Your Goals",
    integrations: "Devices & Integrations",
  }[page];
  const preferredPillar =
    profile.primary === "fitness"
      ? "activity"
      : profile.primary === "energy"
        ? "recovery"
        : profile.primary === "sleep"
          ? "sleep"
          : "overview";
  const contextKey = `${revision}-${sourceKey}-${range}-${focus}-${targets.steps}-${targets.sleep}-${targets.active}-${profile.primary}-${profile.bedtime}-${profile.wakeTime}-${profile.activity}`;
  async function ask(
    question: string,
    options: AskOptions,
  ): Promise<ChatResponse> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.any([options.signal, AbortSignal.timeout(30000)]),
      body: JSON.stringify({
        data: { permissions, entries: entries.map(entry => ({ ...entry, notes: '' })) },
        question,
        history: options.history,
        range,
        focus,
        sources,
        goals: targets,
        preferences: {
          primaryFocus: preferredPillar,
          bedtime: profile.bedtime,
          wakeTime: profile.wakeTime,
          activityLevel: profile.activity,
        },
        datasetVersion: DATASET_VERSION,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(
        payload?.error?.message ??
          "The assistant is unavailable. Start the app server and retry.",
      );
    if (
      !payload ||
      typeof payload.answer !== "string" ||
      !Array.isArray(payload.evidence)
    )
      throw new Error(
        "The assistant returned an unreadable answer. Please retry.",
      );
    return payload;
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { datasetVersion: DATASET_VERSION, profile, ...data },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `health-insight-${range}-${data.period.end}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <DashboardShell
      name={profile.name}
      title={title}
      controls={
        <>
          <div className="health-metric-search"><Search size={16} aria-hidden="true" /><Input aria-label="Search metrics and telemetry" placeholder="Search metrics & telemetry..." value={metricSearch} onChange={event => setMetricSearch(event.target.value)} />{metricSearch.trim() && <div className="health-search-results">{metrics.filter(m => metricNames[m].toLowerCase().includes(metricSearch.toLowerCase())).map(m => <Button key={m} variant="ghost" onClick={() => { setOverviewMetric(m); setMetricSearch(""); navigate("/dashboard"); }}>{metricNames[m]}</Button>)}{!metrics.some(m => metricNames[m].toLowerCase().includes(metricSearch.toLowerCase())) && <p>No matching metrics</p>}</div>}</div>
          <SegmentedControl appearance="telemetry" label="Analysis period" value={range} options={[{ value: "7d", label: range === "7d" ? "7 Days (Active)" : "7 Days" }, { value: "30d", label: range === "30d" ? "30 Days (Active)" : "30 Days" }, { value: "60d", label: range === "60d" ? "All 60D (Active)" : "All 60D" }]} onChange={setRange} />
          <Action size="telemetry" loading={syncing} disabled={!sources.length} onClick={() => { void Promise.all(sources.map(id => sync(id))); }}><RefreshCw className="rotate-90 text-primary" size={15} aria-hidden="true" />Sync Data</Action>
          <Action size="telemetry" variant="default" onClick={exportData} aria-label="Export health report">
            <Download size={16} aria-hidden="true" />
            <span className="health-export-label">Export JSON</span>
          </Action>
          <Action variant="status" size="icon-sm" aria-label="Notifications and sync status" onClick={() => statusDialog.current?.showModal()}><Bell size={18} />{sources.length > 0 && <span className="health-sync-dot" aria-hidden="true" />}</Action>
        </>
      }
    >
      <Dialog ref={statusDialog} title="Data & sync status"><p>Synthetic baseline · No live sensors connected.</p>{sources.map(id => <p key={id}>{providers.find(p => p.id === id)?.name}: {connections[id].status}{connections[id].syncedAt ? ` · ${new Date(connections[id].syncedAt!).toLocaleString("en-GB", {timeZone: "Asia/Ho_Chi_Minh"})} GMT+7` : ""}</p>)}{!sources.length && <p>No connected sources.</p>}</Dialog>
      <main id="main" tabIndex={-1} className="dashboard-main health-overview">
        {page === "journal" ? <WellnessJournal data={data} /> : page === "integrations" ? (
          <>
            <Panel className="dashboard-hero">
              <div>
                <h2>Connected data. One clear picture.</h2>
                <p>
                  Manage simulated Apple Health, Garmin Connect and Strava
                  connections. Only connected sources contribute to your
                  dashboard and AI context.
                </p>
              </div>
              <div className="dashboard-hero-actions">
                <Action
                  onClick={() => {
                    reset();
                    resetProfile();
                  }}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Reset Demo
                </Action>
              </div>
            </Panel>
            <Panel>
              <h2>Your data sources</h2>
              <p className="muted">
                Mock integrations · No real device or OAuth connection · 60
                fixed days, Aug 20–Oct 18, 2026.
              </p>
              <SourceConnections />
            </Panel>
            <Panel>
              <h2>How sources become insights</h2>
              <p>
                Apple Health supplies daily metrics and sleep first; Garmin
                fills missing measurements. Strava adds workout history.
                Matching sessions merge into one workout and retain all
                contributing sources.
              </p>
              <p className="muted">
                Disconnecting removes that source’s contribution immediately.
                Another connected source can still supply the same observation.
                An unsuccessful resync retains the last successfully synced
                data.
              </p>
            </Panel>
          </>
        ) : (
          <>
            <Panel className="dashboard-hero">
              <div>
                <h2>
                  {page === "overview"
                    ? `Good morning, ${profile.name.split(/\s+/).slice(-2).join(" ")}`
                    : page === "insights"
                      ? "Understand what is changing."
                      : "Small targets. Meaningful progress."}
                </h2>
                {page === "overview" && <span className="health-baseline-status">Synthetic baseline • {Math.round(data.summary.steps.observed / data.period.days * 100)}% steps coverage</span>}
                <p>
                  {page === "overview" && !noData ? "Deterministic evaluation across GMT+7 window: 20 Aug 2026 – 18 Oct 2026" : noData
                    ? "Connect a simulated source to explore your health trends."
                    : page === "goals"
                      ? "Review your personal targets and the recorded observations behind your progress."
                      : ((
                          data.insights.find(
                            (i) => i.pillar === preferredPillar,
                          ) ?? data.insights.find((i) => i.pillar === "sleep")
                        )?.evidence ??
                        "Review the available observations and their coverage below.")}
                </p>
              </div>
              <div className="dashboard-hero-actions">
                {page === "overview" ? <div className="health-source-pills"><span>Sources:</span>{sources.map(id => <span key={id} data-source={id}><i />{providers.find(p => p.id === id)?.name.replace(" Connect", "")}</span>)}</div> : <Action
                  variant="default"
                  onClick={() =>
                    navigate(page === "goals" ? "/integrations" : "/goals")
                  }
                >
                  <Target size={16} aria-hidden="true" />
                  {page === "goals" ? "Manage sources" : "Review goals"}
                </Action>}
              </div>
            </Panel>
            {noData ? (
              <Panel className="health-empty">
                <Watch size={32} aria-hidden="true" />
                <h2>Your data starts with a source</h2>
                <p>
                  Connect Apple Health or Garmin for daily activity, sleep and
                  recovery, or Strava for workouts.
                </p>
                <Action
                  variant="default"
                  onClick={() => navigate("/integrations")}
                >
                  Connect Sources <ArrowRight size={16} aria-hidden="true" />
                </Action>
              </Panel>
            ) : null}
            {page === "overview" && !noData && (
              <>
                <div className="dashboard-kpis">
                  {metrics.map((m) => {
                    const summary = data.summary[m];
                    const value =
                      m === "activeMinutes" ? summary.total : summary.mean;
                    const previous =
                      m === "activeMinutes"
                        ? data.prior[m].total
                        : data.prior[m].mean;
                    const delta = data.comparable(m) ? difference(value, previous) : null;
                    const displayedDelta =
                      delta === null
                        ? null
                        : m === "sleepHours"
                          ? delta * 60
                          : delta;
                    const sourceIds = [...new Set(data.current.filter(row => row[m] !== null).map(row => row.sources[m]))];
                    const source = sourceIds.map(id => id === "manual" ? "Manual estimate" : providers.find(p => p.id === id)?.name.replace(" Connect", "").replace(" Health", "")).filter(Boolean).join(" + ") || "No source";
                    const goal = m === "steps" ? data.goals[0] : m === "sleepHours" ? data.goals[1] : m === "activeMinutes" ? data.goals[2] : null;
                    return <MetricCard key={m} className={m === "restingHeartRateBpm" ? "health-rhr-card" : undefined} icon={m === "steps" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="14" cy="4" r="2" fill="currentColor" stroke="none" /><path d="m7 21 2-8-2-3M12 13l3 3v5M6 10V7l5-2 3 5 4 2M11 6l-2 7 3 1" /></svg> : m === "activeMinutes" ? <Zap size={18} /> : m === "sleepHours" ? <Moon size={18} /> : <Heart size={18} />} title={m === "steps" ? "Daily Steps" : m === "sleepHours" ? "Sleep Duration" : m === "activeMinutes" ? "Active Minutes" : "Resting HR"} value={m === "sleepHours" && value !== null ? `${Math.floor(Math.round(value * 60) / 60)}h ${Math.round(value * 60) % 60}m` : format(value, m === "restingHeartRateBpm" ? 1 : 0)}
                      unit={m === "steps" ? "steps/day" : m === "activeMinutes" ? "total mins" : m === "sleepHours" ? "hrs/night" : "bpm avg"} source={source} observed={summary.observed} expected={summary.expected}
                      tone={m === "activeMinutes" || m === "sleepHours" ? "info" : "success"}
                      comparison={delta === null ? undefined : <span className={m === "restingHeartRateBpm" ? "health-rhr-delta" : "ui-delta"} data-direction={delta >= 0 ? "up" : "down"}>{m === "restingHeartRateBpm" ? <Minus aria-hidden="true" /> : delta >= 0 ? <TrendingUp aria-hidden="true" /> : <TrendingDown aria-hidden="true" />}{delta >= 0 ? "+" : ""}{format(displayedDelta, m === "restingHeartRateBpm" ? 1 : 0)} {m === "sleepHours" || m === "activeMinutes" ? "min" : m === "steps" ? "" : "bpm"} vs prior {m === "steps" ? `${data.period.days}d` : ""}</span>}
                      detail={m === "steps" && goal ? `Target Met ${goal.observed ? Math.round(goal.reached / goal.observed * 100) : 0}%` : m === "activeMinutes" && goal ? `~${format(goal.value)}m/wk (Goal: ${format(goal.target)}m)` : m === "restingHeartRateBpm" ? `Baseline: ${format(data.baseline.mean, 1)} bpm` : source}
                      action={<Button variant="ghost" size="icon-xs" aria-label={summary.observed === 0 ? `Manage sources for ${metricNames[m]}` : `Explore ${metricNames[m]}`} onClick={() => navigate(summary.observed === 0 ? "/integrations" : `/insights/${m === "sleepHours" ? "sleep" : m === "restingHeartRateBpm" ? "recovery" : "activity"}`)}><ArrowRight size={13} aria-hidden="true" /></Button>} />;

                  })}
                </div>
                <Panel className="health-trend-panel">
                  <div className="health-trend-heading"><div><h2>Telemetry Trendline</h2><span>{data.period.days}-Day Aggregation GMT+7</span></div>
                  <SegmentedControl appearance="chart" label="Chart metric" value={metric} options={metrics.map(value => ({ value, label: value === "steps" ? "Steps" : chartLabels[value] }))} onChange={setOverviewMetric} /></div>
                  <Chart data={data} metric={metric} />
                  <div className="health-pattern"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z" /><path d="m3 3 18 18" /></svg><div><InsightList data={data} pillar="sleep" compact /></div></div>
                </Panel>
                <div className="dashboard-content-grid">
                  <div>
                    <Panel><div className="section-heading"><h2>Daily Telemetry Log</h2><span>GMT+7 TIMESTAMPED</span></div><DailyRecords data={data} /></Panel>
                    <WorkoutHistory data={data} />
                  </div>
                  <div>
                    <Panel><div className="section-heading"><h2>Goals Progress</h2><Target size={18} aria-hidden="true" /></div><GoalProgress data={data} /><Button variant="link" size="sm" onClick={() => navigate("/goals")}>Review targets <ArrowRight size={14} /></Button></Panel>
                    <Panel><div className="section-heading"><h2>Wellness Journal Check-in</h2><span>LOCAL ONLY</span></div>{data.checkins.length ? data.checkins.slice(-2).map(e => <div className="health-checkin" key={e.id}><span>{e.date} · Self-reported</span><p>Perceived Energy <b>{e.energy} / 5</b></p><p>Perceived Stress <b>{e.stress} / 5</b></p></div>) : <p className="muted">No check-ins in this period.</p>}<Button variant="link" size="sm" onClick={() => navigate('/journal')}>Open Wellness Journal <ArrowRight size={14} /></Button></Panel>
                  </div>
                </div>
                <Panel>
                  <div className="section-heading">
                    <h2>What deserves your attention?</h2>
                    <Brain size={20} aria-hidden="true" />
                  </div>
                  <div className="health-insight-grid">
                    <InsightList data={data} />
                  </div>
                  <p className="data-caption">
                    CALCULATED FROM SYNTHETIC RECORDS · WELLNESS OBSERVATIONS
                  </p>
                </Panel>
              </>
            )}
            {page === "insights" && (
              <>
                <SegmentedControl label="Health pillar" value={selectedPillar} options={pillars.map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} onChange={value => navigate(`/insights/${value}`)} />
                <div className="dashboard-content-grid">
                  <div>
                    <Panel>
                      <div className="section-heading">
                        <h2>
                          {selectedPillar[0].toUpperCase() +
                            selectedPillar.slice(1)}{" "}
                          trends
                        </h2>
                        <span>
                          {data.summary[metric].observed}/{data.period.days}{" "}
                          DAYS RECORDED
                        </span>
                      </div>
                      {selectedPillar === "activity" && (
                        <SegmentedControl label="Activity metric" value={activityMetric} options={(["steps", "activeMinutes"] as const).map(value => ({ value, label: metricNames[value] }))} onChange={setActivityMetric} />
                      )}
                      <Chart data={data} metric={metric} />
                      <p className="muted">
                        {!data.comparable(metric) && "Limited data · comparison unavailable. "}Previous period: {data.period.previousStart}–
                        {data.period.previousEnd} ·{" "}
                        {data.prior[metric].observed}/{data.period.days} days ·{" "}
                        {format(
                          !data.comparable(metric) ? null : metric === "activeMinutes"
                            ? data.prior[metric].total
                            : data.prior[metric].mean,
                          metric === "sleepHours" ? 1 : 0,
                        )}{" "}
                        {units[metric]}
                      </p>
                      <DailyRecords data={data} />
                    </Panel>
                  </div>
                  <div>
                    <Panel>
                      <h2>What the data shows</h2>
                      <InsightList data={data} pillar={selectedPillar} />
                      {selectedPillar === "sleep" && (
                        <div className="health-insight">
                          <h3>Bedtime consistency</h3>
                          <p>
                            {format(data.sleepConsistency)} min bedtime
                            variation · previous{" "}
                            {format(data.previousSleepConsistency)} min
                          </p>
                          <p className="muted">
                            Wake-time variation: {format(data.wakeConsistency)} min. Standard deviation of recorded bedtimes, adjusted
                            across midnight. Lower means a more regular
                            schedule. At least two nights are needed.
                          </p>
                        </div>
                      )}
                      {selectedPillar === "recovery" && (
                        <p className="muted">
                          Historical baseline: {format(data.baseline.mean, 1)} bpm across {data.baseline.observed} earlier days. Resting HR is a trend, not a recovery score. HRV and
                          clinical interpretation are outside this demo.
                        </p>
                      )}
                    </Panel>
                  </div>
                </div>
                {selectedPillar === "activity" && (
                  <WorkoutHistory data={data} />
                )}
                {selectedPillar === "sleep" && (
                  <Panel>
                    <h2>Sleep history</h2>
                    <div className="health-table-scroll">
                      <table>
                        <caption>
                          One unified session per recorded night · GMT+7
                        </caption>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Bedtime</th>
                            <th>Wake time</th>
                            <th>Duration</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.current.map((row) => (
                            <tr key={row.date}>
                              <th scope="row">{row.date}</th>
                              <td>
                                {row.bedtimeMinutes === null
                                  ? "—"
                                  : `${String(Math.floor(row.bedtimeMinutes / 60)).padStart(2, "0")}:${String(row.bedtimeMinutes % 60).padStart(2, "0")}`}
                              </td>
                              <td>
                                {row.sleepEnd === null
                                  ? "—"
                                  : new Date(row.sleepEnd).toLocaleTimeString(
                                      "en-GB",
                                      {
                                        timeZone: "Asia/Ho_Chi_Minh",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                              </td>
                              <td>{format(row.sleepHours, 1)} h</td>
                              <td>
                                {row.sources.sleepHours === "manual" ? "Manual sleep-window estimate" : providers.find(
                                  (p) => p.id === row.sources.sleepHours,
                                )?.name ?? "Missing"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                )}
              </>
            )}
            {page === "goals" && (
              <div className="dashboard-content-grid">
                <div>
                  <GoalEditor />
                  <Panel>
                    <h2>Progress from your observations</h2>
                    <GoalProgress data={data} />
                  </Panel>
                </div>
                <div>
                  <Panel>
                    <h2>How progress is calculated</h2>
                    <p>
                      Steps and sleep compare recorded daily averages with your
                      targets. Recorded days meeting each target are shown
                      separately.
                    </p>
                    <p className="muted">
                      Activity pace is average active minutes per recorded day ×
                      7. It is a weekly pace, not a measured weekly total.
                      Missing days are excluded and coverage stays visible.
                      Resting HR has no target or completion score.
                    </p>
                  </Panel>
                </div>
              </div>
            )}
          </>
        )}
        <p className="health-source-note">
          Synthetic wellness data ·{" "}
          {data.sources.map((s) => s.name).join(" · ") ||
            "No sources connected"}{" "}
          · {data.period.start}–{data.period.end}. {range === "60d" ? "No earlier comparison observations." : `Compared with ${data.period.previousStart}–${data.period.previousEnd}.`} No live sensors
          connected.
        </p>
      </main>
      <AIChatbot
        key={`${sourceKey}-${JSON.stringify(permissions)}-${JSON.stringify(entries.map(e => ({ ...e, notes: "" })))}`}
        realAI
        contextKey={contextKey}
        greeting={`Hi ${profile.name.split(/\s+/).slice(-2).join(" ")}, over your selected ${data.period.days}-day window, your average daily step count was ${format(data.summary.steps.mean)} steps${data.comparable("steps") ? ` (${difference(data.summary.steps.mean, data.prior.steps.mean)! >= 0 ? "+" : ""}${format(difference(data.summary.steps.mean, data.prior.steps.mean))} steps vs prior period)` : "; a prior-period comparison is unavailable"}.`}
        initialRecommendation={data.insights.find(i => i.pillar === "sleep")?.action}
        initialEvidence={data.evidence.filter(e => ["stepsAchievement", "stepsTarget", "activeMinutes"].includes(e.id))}
        sourceLabel={`Synthetic records · ${data.period.start}–${data.period.end}`}
        suggestions={
          focus === "sleep"
            ? [
                "Why has my sleep changed?",
                "What sleep data is missing?",
                "How is my activity progressing?",
              ]
            : focus === "recovery"
              ? [
                  "What does my resting HR trend show?",
                  "Is there enough recovery data?",
                  "What should I focus on?",
                ]
              : [
                  "How am I progressing?",
                  "What should I focus on?",
                  "What data is missing?",
                ]
        }
        onAsk={ask}
      />
    </DashboardShell>
  );
}
