import { records, type HealthRecord } from "./data";
export const mean = (values: (number | null)[]) => {
  const present = values.filter((value): value is number => value !== null);
  return present.length
    ? present.reduce((a, b) => a + b, 0) / present.length
    : null;
};
export function summarize(rows: HealthRecord[]) {
  const active = rows
    .map((r) => r.activeMinutes)
    .filter((v): v is number => v !== null);
  return {
    steps: mean(rows.map((r) => r.steps)),
    sleep: mean(rows.map((r) => r.sleepHours)),
    water: mean(rows.map((r) => r.waterMl)),
    active: active.length ? active.reduce((a, b) => a + b, 0) : null,
    heart: mean(rows.map((r) => r.restingHeartRateBpm)),
    mood: mean(rows.map((r) => r.mood)),
    energy: mean(rows.map((r) => r.energy)),
    days: rows.length,
    missing: rows.reduce(
      (n, r) =>
        n +
        [
          r.steps,
          r.sleepHours,
          r.waterMl,
          r.activeMinutes,
          r.restingHeartRateBpm,
          r.mood,
          r.energy,
        ].filter((v) => v === null).length,
      0,
    ),
  };
}
export const weeks = Array.from({ length: 4 }, (_, i) => ({
  label: ["Sep 21–27", "Sep 28–Oct 4", "Oct 5–11", "Oct 12–18"][i],
  rows: records.slice(i * 7, i * 7 + 7),
}));
export const changePercent = (
  current: number | null,
  previous: number | null,
) =>
  current === null || previous === null || previous === 0
    ? null
    : ((current - previous) / previous) * 100;
export const fmt = (n: number | null, digits = 0) =>
  n === null
    ? "—"
    : n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
export function progressAnswer(
  rows: HealthRecord[],
  previous: HealthRecord[],
  targets: { steps: number; sleep: number; active: number; water: number },
) {
  const s = summarize(rows),
    p = summarize(previous),
    delta = changePercent(s.steps, p.steps);
  return `Average daily steps: ${fmt(s.steps)}${delta === null ? " (no previous week to compare)" : `, ${delta >= 0 ? "+" : ""}${fmt(delta, 1)}% vs the previous week`}. ${s.steps === null ? "No step observations." : `${fmt((s.steps / targets.steps) * 100)}% of your ${fmt(targets.steps)}-step goal; ${rows.filter((r) => r.steps !== null && r.steps >= targets.steps).length}/${rows.filter((r) => r.steps !== null).length} recorded days reached it.`} Sleep averaged ${fmt(s.sleep, 1)}h against ${targets.sleep}h. Active time: ${fmt(s.active)}/${targets.active} minutes. Water: ${fmt(s.water === null ? null : s.water / 1000, 1)}L/day. ${s.missing} missing secondary/primary observations in this week are excluded from averages.`;
}
