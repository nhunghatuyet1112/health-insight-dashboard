export type Provider = "apple" | "garmin" | "strava";
export type Range = "7d" | "30d" | "60d";
export type Pillar = "activity" | "sleep" | "recovery";
export type Metric =
  "steps" | "activeMinutes" | "sleepHours" | "restingHeartRateBpm";
export interface Observation {
  value: number | null;
  unit: string;
  timestamp: string;
  source: Provider;
  status: "recorded" | "missing";
}
export interface DailyMetrics {
  date: string;
  steps: Observation;
  activeMinutes: Observation;
  restingHeartRateBpm: Observation;
}
export interface SleepSession {
  id: string;
  date: string;
  start: string;
  end: string;
  duration: Observation;
  bedtimeMinutes: number;
}
export interface WorkoutSession {
  id: string;
  eventId: string;
  date: string;
  source: Provider | "manual";
  type: string;
  start: string;
  durationMinutes: number;
  distanceKm: number | null;
  averageHeartRateBpm: number | null;
}
export interface DataSource {
  id: Provider;
  name: string;
  description: string;
}
export interface ProviderDataset {
  daily: DailyMetrics[];
  sleep: SleepSession[];
  workouts: WorkoutSession[];
}
export interface UnifiedDay {
  date: string;
  steps: number | null;
  activeMinutes: number | null;
  sleepHours: number | null;
  restingHeartRateBpm: number | null;
  bedtimeMinutes: number | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  sources: Partial<Record<Metric, Provider | "manual">>;
}
export interface Goals {
  steps: number;
  sleep: number;
  active: number;
}
export interface HealthGoal {
  id: "steps" | "sleep" | "active";
  label: string;
  target: number;
  value: number | null;
  unit: string;
  progress: number | null;
  reached: number;
  observed: number;
}
export interface HealthInsight {
  id: string;
  pillar: Pillar;
  title: string;
  evidence: string;
  action: string;
}
export interface MetricSummary {
  mean: number | null;
  total: number | null;
  observed: number;
  expected: number;
}
