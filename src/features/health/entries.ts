import { dates, DEMO_END } from './demo.js';
import type { Metric, Provider } from './model.js';
export type Permission = Metric | 'workouts';
export type Permissions = Record<Provider, Permission[]>;
export const defaultPermissions = (): Permissions => ({
  apple: ['steps', 'activeMinutes', 'sleepHours', 'restingHeartRateBpm', 'workouts'],
  garmin: ['steps', 'activeMinutes', 'sleepHours', 'restingHeartRateBpm', 'workouts'],
  strava: ['workouts'],
});
interface EntryBase { id: string; notes: string }
export interface WellnessCheckIn extends EntryBase {
  kind: 'checkin'; date: string; energy: number; stress: number;
}
export interface ManualSleep extends EntryBase {
  kind: 'sleep'; start: string; end: string; quality: number;
  resolution: 'wearable' | 'manual';
}
export interface ManualWorkout extends EntryBase {
  kind: 'workout'; start: string; activity: string; duration: number;
  distance: number | null; intensity: number | null;
}
export type ManualEntry = WellnessCheckIn | ManualSleep | ManualWorkout;
export interface AnalysisOptions { permissions?: Permissions; entries?: ManualEntry[] }
export const seedEntries = (): ManualEntry[] => [
  { id: 'demo-checkin-1', kind: 'checkin', date: '2026-10-16', energy: 2, stress: 4, notes: 'Felt tired despite keeping up with my walks.' },
  { id: 'demo-checkin-2', kind: 'checkin', date: DEMO_END, energy: 3, stress: 3, notes: '' },
];
// Browser datetime-local input is explicitly interpreted in the demo's GMT+7 calendar.
export const timestamp = (value: string) => `${value}:00+07:00`;
export const reportingDate = (value: string) => value.slice(0, 10);
export function validateEntry(input: unknown): ManualEntry {
  if (!input || typeof input !== 'object') throw new Error('Invalid journal entry.');
  const r = input as Record<string, unknown>;
  const fail = (message: string): never => { throw new Error(message); };
  const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
  const scale = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;
  if (!text(r.id, 100) || !r.id || !text(r.notes, 1000)) fail('Notes must be at most 1,000 characters.');
  const base = { id: r.id as string, notes: r.notes as string };
  if (r.kind === 'checkin') {
    if (typeof r.date !== 'string' || !dates.includes(r.date) || !scale(r.energy) || !scale(r.stress)) fail('Choose a demo date and energy/stress from 1 to 5.');
    return { ...base, kind: 'checkin', date: r.date as string, energy: r.energy as number, stress: r.stress as number };
  }
  const dateTime = (v: unknown) => {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return false;
    const parsed = new Date(timestamp(v));
    return Number.isFinite(parsed.getTime()) && new Date(parsed.getTime() + 7 * 3600000).toISOString().slice(0, 16) === v;
  };
  if (!dateTime(r.start)) fail('Enter a valid start date and time (GMT+7).');
  if (r.kind === 'sleep') {
    if (!dateTime(r.end) || !dates.includes(reportingDate(r.end as string)) || !scale(r.quality) || !['wearable', 'manual'].includes(String(r.resolution))) fail('Choose a valid wake time, quality and conflict preference.');
    const hours = (Date.parse(timestamp(r.end as string)) - Date.parse(timestamp(r.start as string))) / 3600000;
    if (hours <= 0 || hours > 24) fail('Sleep window must be greater than zero and at most 24 hours.');
    return { ...base, kind: 'sleep', start: r.start as string, end: r.end as string, quality: r.quality as number, resolution: r.resolution as ManualSleep['resolution'] };
  }
  if (r.kind === 'workout') {
    if (!dates.includes(reportingDate(r.start as string)) || !text(r.activity, 60) || !(r.activity as string).trim() || typeof r.duration !== 'number' || !Number.isFinite(r.duration) || r.duration <= 0 || r.duration > 1440 || (r.distance !== null && (typeof r.distance !== 'number' || !Number.isFinite(r.distance) || r.distance < 0 || r.distance > 1000)) || (r.intensity !== null && !scale(r.intensity))) fail('Check workout type, duration (1–1,440 min), distance and intensity (1–5).');
    return { ...base, kind: 'workout', start: r.start as string, activity: (r.activity as string).trim(), duration: r.duration as number, distance: r.distance as number | null, intensity: r.intensity as number | null };
  }
  return fail('Unsupported journal entry.');
}
export function validateOptions(input: unknown): AnalysisOptions {
  if (input === undefined) return {};
  if (!input || typeof input !== 'object') throw new Error('Invalid data settings.');
  const r = input as Record<string, unknown>;
  const permissions = defaultPermissions();
  if (r.permissions !== undefined) {
    if (!r.permissions || typeof r.permissions !== 'object') throw new Error('Invalid permissions.');
    for (const id of ['apple', 'garmin', 'strava'] as const) {
      const value = (r.permissions as Permissions)[id];
      if (!Array.isArray(value) || value.some(p => !permissions[id].includes(p)) || new Set(value).size !== value.length) throw new Error('Invalid permissions.');
      permissions[id] = [...value];
    }
  }
  if (r.entries !== undefined && (!Array.isArray(r.entries) || r.entries.length > 100)) throw new Error('Keep at most 100 journal entries.');
  const entries = ((r.entries ?? []) as unknown[]).map(validateEntry);
  if (new Set(entries.map(e => e.id)).size !== entries.length) throw new Error('Duplicate entry IDs.');
  for (const kind of ['checkin', 'sleep'] as const) {
    const keys = entries.filter(e => e.kind === kind).map(e => e.kind === 'checkin' ? e.date : e.kind === 'sleep' ? reportingDate(e.end) : '');
    if (new Set(keys).size !== keys.length) throw new Error('Only one check-in and sleep window per reporting date.');
  }
  return { permissions, entries };
}
