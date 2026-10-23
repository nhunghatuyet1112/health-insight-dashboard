import { defaultPermissions, reportingDate, timestamp, type AnalysisOptions } from "./entries.js";
import { dates, DEMO_END, providerData, providers } from "./demo.js";
import type { ChatEvidence } from "../assistant/contracts.js";
import type {
  Goals,
  HealthGoal,
  HealthInsight,
  Metric,
  MetricSummary,
  Provider,
  Range,
  UnifiedDay,
  WorkoutSession,
} from "./model.js";
export const metrics: Metric[] = [
  "steps",
  "activeMinutes",
  "sleepHours",
  "restingHeartRateBpm",
];
export const metricNames: Record<Metric, string> = {
  steps: "Daily steps",
  activeMinutes: "Active minutes",
  sleepHours: "Sleep duration",
  restingHeartRateBpm: "Resting heart rate",
};
export const units: Record<Metric, string> = {
  steps: "steps / day",
  activeMinutes: "min / period",
  sleepHours: "hours / night",
  restingHeartRateBpm: "bpm",
};
export const format = (value: number | null, digits = 0): string =>
  value === null
    ? "—"
    : value.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
export function mean(values: (number | null)[]) {
  const present = values.filter((v): v is number => v !== null);
  return present.length
    ? present.reduce((a, b) => a + b, 0) / present.length
    : null;
}
export function normalize(sources: Provider[], options: AnalysisOptions = {}): {
  days: UnifiedDay[];
  workouts: (WorkoutSession & { sources: (Provider | "manual")[] })[];
} {
  const available = new Set(sources);
  const permissions = options.permissions ?? defaultPermissions();
  const days = dates.map((date, index) => {
    const row: UnifiedDay = {
      date,
      steps: null,
      activeMinutes: null,
      sleepHours: null,
      restingHeartRateBpm: null,
      bedtimeMinutes: null,
      sleepStart: null,
      sleepEnd: null,
      sources: {},
    };
    for (const metric of metrics) {
      for (const source of ["apple", "garmin"] as const) {
        if (!available.has(source) || !permissions[source].includes(metric)) continue;
        const observation =
          metric === "sleepHours"
            ? providerData[source].sleep[index].duration
            : providerData[source].daily[index][metric];
        if (observation.value === null) continue;
        row[metric] = observation.value;
        row.sources[metric] = source;
        if (metric === "sleepHours") {
          const session = providerData[source].sleep[index];
          row.bedtimeMinutes = session.bedtimeMinutes;
          row.sleepStart = session.start;
          row.sleepEnd = session.end;
        }
        break;
      }
    }
    return row;
  });
  for (const entry of options.entries ?? []) {
    if (entry.kind !== 'sleep') continue;
    const row = days.find(d => d.date === reportingDate(entry.end));
    if (!row || (row.sleepHours !== null && entry.resolution === 'wearable')) continue;
    row.sleepHours = (Date.parse(timestamp(entry.end)) - Date.parse(timestamp(entry.start))) / 3600000;
    row.sleepStart = timestamp(entry.start);
    row.sleepEnd = timestamp(entry.end);
    row.bedtimeMinutes = Number(entry.start.slice(11, 13)) * 60 + Number(entry.start.slice(14));
    row.sources.sleepHours = 'manual';
  }
  const events = new Map<string, WorkoutSession & { sources: (Provider | "manual")[] }>();
  // Prefer provider workout details without ever summing duplicate events.
  for (const source of ["strava", "garmin", "apple"] as const) {
    if (!available.has(source) || !permissions[source].includes("workouts")) continue;
    for (const workout of providerData[source].workouts) {
      const existing = events.get(workout.eventId);
      if (existing) existing.sources.push(source);
      else events.set(workout.eventId, { ...workout, sources: [source] });
    }
  }
  for (const entry of options.entries ?? []) {
    if (entry.kind !== 'workout') continue;
    const eventId = `manual:${entry.id}`;
    events.set(eventId, { id: entry.id, eventId, date: reportingDate(entry.start), source: 'manual', sources: ['manual'], type: entry.activity, start: timestamp(entry.start), durationMinutes: entry.duration, distanceKm: entry.distance, averageHeartRateBpm: null });
  }
  return {
    days,
    workouts: [...events.values()].sort((a, b) =>
      b.start.localeCompare(a.start),
    ),
  };
}
export function summarizeMetric(
  rows: UnifiedDay[],
  metric: Metric,
): MetricSummary {
  const values = rows
    .map((r) => r[metric])
    .filter((v): v is number => v !== null);
  return {
    mean: mean(values),
    total: values.length ? values.reduce((a, b) => a + b, 0) : null,
    observed: values.length,
    expected: rows.length,
  };
}
export function consistency(rows: UnifiedDay[]) {
  // Put the day boundary at noon, so 23:50 and 00:10 are twenty minutes apart.
  const times = rows
    .filter((r) => r.sleepHours !== null && r.bedtimeMinutes !== null)
    .map((r) => (r.bedtimeMinutes! + 720) % 1440);
  const average = mean(times);
  return times.length < 2 || average === null
    ? null
    : Math.sqrt(
        times.reduce((sum, t) => sum + (t - average) ** 2, 0) / times.length,
      );
}
export function difference(current: number | null, previous: number | null) {
  return current === null || previous === null ? null : current - previous;
}
export function percent(current: number | null, previous: number | null) {
  return current === null || previous === null || previous === 0
    ? null
    : ((current - previous) / previous) * 100;
}
export function analyze(sources: Provider[], range: Range, targets: Goals, options: AnalysisOptions = {}) {
  const normalized = normalize(sources, options);
  const length = range === "7d" ? 7 : range === "30d" ? 30 : 60;
  const current = normalized.days.slice(-length);
  const previous = normalized.days.slice(-length * 2, -length);
  const summary = Object.fromEntries(
    metrics.map((m) => [m, summarizeMetric(current, m)]),
  ) as Record<Metric, MetricSummary>;
  const prior = Object.fromEntries(
    metrics.map((m) => [m, summarizeMetric(previous, m)]),
  ) as Record<Metric, MetricSummary>;
  const period = {
    start: current[0].date,
    end: DEMO_END,
    previousStart: previous[0]?.date ?? new Date(Date.parse(current[0].date) - length * 86400000).toISOString().slice(0, 10),
    previousEnd: previous.at(-1)?.date ?? new Date(Date.parse(current[0].date) - 86400000).toISOString().slice(0, 10),
    days: length,
  };
  const goals: HealthGoal[] = [
    {
      id: "steps",
      label: "Daily movement",
      target: targets.steps,
      value: summary.steps.mean,
      unit: "steps / day",
      progress:
        summary.steps.mean === null
          ? null
          : (summary.steps.mean / targets.steps) * 100,
      reached: current.filter(
        (r) => r.steps !== null && r.steps >= targets.steps,
      ).length,
      observed: summary.steps.observed,
    },
    {
      id: "sleep",
      label: "Sleep duration",
      target: targets.sleep,
      value: summary.sleepHours.mean,
      unit: "hours / night",
      progress:
        summary.sleepHours.mean === null
          ? null
          : (summary.sleepHours.mean / targets.sleep) * 100,
      reached: current.filter(
        (r) => r.sleepHours !== null && r.sleepHours >= targets.sleep,
      ).length,
      observed: summary.sleepHours.observed,
    },
    {
      id: "active",
      label: "Weekly activity pace",
      target: targets.active,
      value:
        summary.activeMinutes.mean === null
          ? null
          : summary.activeMinutes.mean * 7,
      unit: "min / week · normalized from recorded days",
      progress:
        summary.activeMinutes.mean === null
          ? null
          : ((summary.activeMinutes.mean * 7) / targets.active) * 100,
      reached: 0,
      observed: summary.activeMinutes.observed,
    },
  ];
  const insights: HealthInsight[] = [];
  // Comparisons need at least 70% observed dates in both windows.
  const comparable = (metric: Metric) => summary[metric].observed / length >= 0.7 && prior[metric].observed / length >= 0.7;
  const stepChange = comparable('steps') ? percent(summary.steps.mean, prior.steps.mean) : null;
  if (stepChange !== null)
    insights.push({
      id: "activity-trend",
      pillar: "activity",
      title:
        stepChange >= 0 ? "Your movement is building" : "Movement has slowed",
      evidence: `Average steps ${format(summary.steps.mean)} vs ${format(prior.steps.mean)} (${stepChange >= 0 ? "+" : ""}${format(stepChange, 1)}%) compared with the previous ${length} days.`,
      action: "Keep a short walk in a regular part of your day.",
    });
  const sleepChange = comparable("sleepHours") ? difference(summary.sleepHours.mean, prior.sleepHours.mean) : null;
  if (summary.sleepHours.mean !== null)
    insights.push({
      id: "sleep-trend",
      pillar: "sleep",
      title:
        sleepChange !== null && sleepChange < 0
          ? "Make room for sleep"
          : "Protect your sleep routine",
      evidence: `${format(summary.sleepHours.mean, 1)}h per night against your ${format(targets.sleep, 1)}h target${sleepChange === null ? "; no prior comparison available" : `; ${sleepChange >= 0 ? "+" : ""}${format(sleepChange * 60)} minutes vs the previous period`}.`,
      action:
        "Try a consistent wind-down time and review the trend again next week.",
    });
  if (summary.restingHeartRateBpm.mean !== null)
    insights.push({
      id: "recovery-trend",
      pillar: "recovery",
      title: "Recovery, in context",
      evidence: `Resting HR averages ${format(summary.restingHeartRateBpm.mean, 1)} bpm across ${summary.restingHeartRateBpm.observed}/${length} days.`,
      action:
        "Review your resting HR alongside sleep and activity. This observation does not establish a medical cause.",
    });
  const workouts = normalized.workouts.filter(
    (w) => w.date >= period.start && w.date <= period.end,
  );
  const weeklyExercise = Array.from({ length: Math.floor(current.length / 7) }, (_, index) => {
    const rows = current.slice(current.length - (index + 1) * 7, current.length - index * 7);
    const total = summarizeMetric(rows, 'activeMinutes');
    return { start: rows[0].date, end: rows.at(-1)!.date, total: total.total, observed: total.observed, sufficient: total.observed >= 5, met: total.observed >= 5 && total.total !== null ? total.total >= targets.active : null };
  });
  const wakeConsistency = (rows: UnifiedDay[]) => consistency(rows.map(row => {
    const wake = row.sleepEnd ? new Date(Date.parse(row.sleepEnd) + 7 * 3600000) : null;
    return { ...row, bedtimeMinutes: wake ? wake.getUTCHours() * 60 + wake.getUTCMinutes() : null };
  }));
  const evidence: ChatEvidence[] = metrics.map((metric) => ({
    id: metric,
    label: metricNames[metric],
    value:
      metric === "activeMinutes" ? summary[metric].total : summary[metric].mean,
    unit: units[metric],
    previousValue: !comparable(metric) ? null : metric === "activeMinutes" ? prior[metric].total : prior[metric].mean,
    coverage: `${summary[metric].observed}/${length}`,
    previousCoverage: `${prior[metric].observed}/${length}`,
    ...period,
  }));
  const workoutAvailable = sources.some(s => (options.permissions ?? defaultPermissions())[s].includes('workouts')) || (options.entries ?? []).some(e => e.kind === 'workout');
  const priorWorkouts = normalized.workouts.filter(
    (w) => w.date >= period.previousStart && w.date <= period.previousEnd,
  );
  const workoutCoverage = (sessions: typeof workouts) =>
    `${new Set(sessions.map((w) => w.date)).size}/${length}`;
  evidence.push(
    {
      id: "sleepConsistency",
      label: "Bedtime variation",
      value: consistency(current),
      previousValue: comparable("sleepHours") ? consistency(previous) : null,
      unit: "min standard deviation",
      coverage: `${summary.sleepHours.observed}/${length}`,
      previousCoverage: `${prior.sleepHours.observed}/${length}`,
      ...period,
    },
    {
      id: "workoutCount",
      label: "Unique workouts",
      value: workoutAvailable ? workouts.length : null,
      previousValue: workoutAvailable && previous.length ? priorWorkouts.length : null,
      unit: "sessions",
      coverage: workoutCoverage(workouts),
      previousCoverage: workoutCoverage(priorWorkouts),
      ...period,
    },
    {
      id: "workoutMinutes",
      label: "Workout duration",
      value: workoutAvailable
        ? workouts.reduce((n, w) => n + w.durationMinutes, 0)
        : null,
      previousValue: workoutAvailable && previous.length
        ? priorWorkouts.reduce((n, w) => n + w.durationMinutes, 0)
        : null,
      unit: "min across unique sessions",
      coverage: workoutCoverage(workouts),
      previousCoverage: workoutCoverage(priorWorkouts),
      ...period,
    },
    {
      id: "weeklyActivityPace",
      label: "Weekly activity pace",
      value: goals[2].value,
      previousValue:
        !comparable("activeMinutes") || prior.activeMinutes.mean === null ? null : prior.activeMinutes.mean * 7,
      unit: "min / week, normalized",
      coverage: `${summary.activeMinutes.observed}/${length}`,
      previousCoverage: `${prior.activeMinutes.observed}/${length}`,
      ...period,
    },
  );
  for (const goal of goals) {
    evidence.push({
      id: `${goal.id}Target`,
      kind: "target",
      label: `${goal.label} target`,
      value: goal.target,
      previousValue: null,
      unit: goal.id === "active" ? "min / week" : goal.unit,
      coverage: `${goal.observed}/${length}`,
      previousCoverage: "Not tracked",
      ...period,
    });
  }
  for (const workout of workouts) {
    for (const [suffix, label, value, unit] of [
      ["duration", "Duration", workout.durationMinutes, "min"],
      ["distance", "Distance", workout.distanceKm, "km"],
      ["heart", "Average heart rate", workout.averageHeartRateBpm, "bpm"],
    ] as const) {
      evidence.push({
        id: `workout:${workout.eventId}:${suffix}`,
        label: `${workout.type} on ${workout.date}: ${label}`,
        value,
        previousValue: null,
        unit,
        coverage: "1 session",
        previousCoverage: "Not applicable",
        start: workout.date,
        end: workout.date,
        previousStart: period.previousStart,
        previousEnd: period.previousEnd,
      });
    }
  }
  for (const week of weeklyExercise) evidence.push({ id: `exerciseWeek:${week.start}`, label: 'Observed exercise minutes in completed seven-day block', value: week.total, previousValue: null, unit: 'min; missing dates not estimated', coverage: `${week.observed}/7`, previousCoverage: 'Not applicable', start: week.start, end: week.end, previousStart: period.previousStart, previousEnd: period.previousEnd });
  evidence.push({ id: 'wakeConsistency', label: 'Wake-time variation', value: wakeConsistency(current), previousValue: comparable('sleepHours') ? wakeConsistency(previous) : null, unit: 'min standard deviation', coverage: `${summary.sleepHours.observed}/${length}`, previousCoverage: `${prior.sleepHours.observed}/${length}`, ...period });
  const baseline = summarizeMetric(normalized.days.slice(0, -length), 'restingHeartRateBpm');
  if (baseline.observed < 7) baseline.mean = null;
  const paired = current.filter(r => r.sleepHours !== null && r.steps !== null);
  const shorter = paired.filter(r => r.sleepHours! < targets.sleep);
  const metSleep = paired.filter(r => r.sleepHours! >= targets.sleep);
  evidence.push({ id: 'rhrBaseline', label: 'Earlier personal resting HR baseline', value: baseline.observed >= 7 ? baseline.mean : null, previousValue: null, unit: 'bpm, earlier observed days', coverage: `${baseline.observed}/${normalized.days.length - length}`, previousCoverage: 'Not applicable', start: normalized.days[0].date, end: period.previousEnd, previousStart: period.previousStart, previousEnd: period.previousEnd });
  for (const [id, label, rows] of [['afterShortSleep', 'Average steps on wake dates below sleep target', shorter], ['afterTargetSleep', 'Average steps on wake dates meeting sleep target', metSleep]] as const) {
    evidence.push({ id, label, value: rows.length >= 3 ? mean(rows.map(r => r.steps)) : null, previousValue: null, unit: 'steps / paired date; association only', coverage: `${rows.length}/${length}`, previousCoverage: 'Not applicable', ...period });
  }
  for (const goal of goals.filter(g => g.id !== 'active')) {
    evidence.push({ id: `${goal.id}Achievement`, label: `${goal.label}: recorded dates meeting target`, value: goal.observed ? goal.reached : null, previousValue: null, unit: 'days meeting personal target', coverage: `${goal.observed}/${length}`, previousCoverage: 'Not tracked', ...period });
  }
  return {
    comparable,
    weeklyExercise,
    wakeConsistency: wakeConsistency(current),
    baseline,
    checkins: (options.entries ?? []).filter((e): e is import('./entries.js').WellnessCheckIn => e.kind === 'checkin' && e.date >= period.start && e.date <= period.end),
    range,
    period,
    current,
    previous,
    summary,
    prior,
    goals,
    insights,
    workouts,
    sleepConsistency: consistency(current),
    previousSleepConsistency: comparable("sleepHours") ? consistency(previous) : null,
    evidence,
    sources: providers.filter((p) => sources.includes(p.id)),
  };
}
export type Analytics = ReturnType<typeof analyze>;
