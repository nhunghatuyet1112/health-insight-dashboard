import type {
  DataSource,
  Observation,
  Provider,
  ProviderDataset,
} from "./model.js";
export const DATASET_VERSION = "health-insight-60d-v1";
export const DEMO_END = "2026-10-18";
export const providers: DataSource[] = [
  {
    id: "apple",
    name: "Apple Health",
    description: "Steps, active minutes, sleep and resting heart rate",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    description: "Daily activity, sleep, resting heart rate and workouts",
  },
  {
    id: "strava",
    name: "Strava",
    description: "Workouts, duration, distance and workout heart rate",
  },
];
export const dates = Array.from({ length: 60 }, (_, i) =>
  new Date(Date.UTC(2026, 7, 20 + i)).toISOString().slice(0, 10),
);
function observation(
  value: number | null,
  unit: string,
  date: string,
  source: Provider,
): Observation {
  return {
    value,
    unit,
    timestamp: `${date}T23:59:00+07:00`,
    source,
    status: value === null ? "missing" : "recorded",
  };
}
export function createProviderData(source: Provider): ProviderDataset {
  const daily: ProviderDataset["daily"] = [];
  const sleep: ProviderDataset["sleep"] = [];
  const workouts: ProviderDataset["workouts"] = [];
  dates.forEach((date, i) => {
    const missingDay = [13, 39, 56].includes(i);
    const week = Math.floor(i / 7);
    if (source !== "strava") {
      const unavailable =
        missingDay ||
        (source === "apple" && i % 11 === 0) ||
        (source === "garmin" && i % 9 === 0);
      const steps = Math.round(
        4400 + week * 420 + [0, 900, -200, 1600, -400, 2100, 600][i % 7],
      );
      const active = i % 7 === 4 ? 0 : 12 + week * 2 + (i % 4) * 4;
      const rhr = Math.round(69 - week * 0.35 + [0, 2, -1, 3, 0, -2, 1][i % 7]);
      daily.push({
        date,
        steps: observation(unavailable ? null : steps, "steps", date, source),
        activeMinutes: observation(
          unavailable ? null : active,
          "min",
          date,
          source,
        ),
        restingHeartRateBpm: observation(
          unavailable || i % 10 === 3 ? null : rhr,
          "bpm",
          date,
          source,
        ),
      });
      const duration = Math.round(
        (7.4 +
          [0, -0.4, 0.2, -0.2, -0.5, 0.4, 0.1][i % 7] -
          (i >= 44 ? 0.8 : 0)) *
          60,
      );
      const bedtimeMinutes = (24 * 60 + 390 - duration) % 1440;
      const end = `${date}T06:30:00+07:00`;
      sleep.push({
        id: `${source}-sleep-${date}`,
        date,
        end,
        start: new Date(
          new Date(end).getTime() - duration * 60000,
        ).toISOString(),
        bedtimeMinutes,
        duration: observation(
          unavailable || i === 52 ? null : duration / 60,
          "h",
          date,
          source,
        ),
      });
    }
    if (
      !missingDay &&
      (i % 3 === 0 || (source === "strava" && (i % 10 === 7 || i === 59)))
    ) {
      const exclusive = i % 3 !== 0;
      if (exclusive && source !== "strava") return;
      const eventId = `${exclusive ? "strava-only" : "shared"}-${date}`;
      workouts.push({
        id: `${source}-${eventId}`,
        eventId,
        date,
        source,
        type: i % 2 ? "Walk" : "Run",
        start: `${date}T17:30:00+07:00`,
        durationMinutes: 25 + (i % 20),
        distanceKm: Math.round((2 + (i % 5) * 0.6) * 10) / 10,
        averageHeartRateBpm: 110 + (i % 30),
      });
    }
  });
  return { daily, sleep, workouts };
}
export const providerData: Record<Provider, ProviderDataset> = {
  apple: createProviderData("apple"),
  garmin: createProviderData("garmin"),
  strava: createProviderData("strava"),
};
