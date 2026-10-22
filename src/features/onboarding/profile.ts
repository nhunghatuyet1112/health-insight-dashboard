export const goals = [
  {
    id: "fitness",
    title: "Improve Fitness",
    detail: "Build endurance and make movement a consistent part of your week.",
    signal: "Movement · Training",
  },
  {
    id: "sleep",
    title: "Better Sleep",
    detail: "Build a regular sleep window and wake up feeling more rested.",
    signal: "Duration · Consistency",
  },
  {
    id: "energy",
    title: "More Energy",
    detail: "Understand daily energy patterns and reduce afternoon fatigue.",
    signal: "Rest · Daily rhythm",
  },
  {
    id: "wellness",
    title: "Overall Wellness",
    detail: "See your everyday habits together and track meaningful changes.",
    signal: "Your whole picture",
  },
] as const;
export type GoalId = (typeof goals)[number]["id"];
export const activities = [
  {
    id: "sitting",
    title: "Mostly Sitting",
    detail: "Desk work, driving and relaxed daily routines.",
    range: "3,000–5,000",
    target: 4000,
  },
  {
    id: "light",
    title: "Lightly Active",
    detail: "Occasional walks, household chores and time on your feet.",
    range: "5,000–8,000",
    target: 6500,
  },
  {
    id: "moderate",
    title: "Moderately Active",
    detail: "Regular walking, an active commute or a standing job.",
    range: "8,000–12,000",
    target: 10000,
  },
  {
    id: "very",
    title: "Very Active",
    detail: "A physically demanding job or movement throughout the day.",
    range: "12,000+",
    target: 12000,
  },
] as const;
export interface Profile {
  name: string;
  email: string;
  dob: string;
  heightCm: number;
  weightKg: number;
  sex: string;
  goals: GoalId[];
  primary: GoalId;
  activity: (typeof activities)[number]["id"];
  workouts: string;
  sleepHours: number;
  bedtime: string;
  wakeTime: string;
  quality: string;
  diet: string;
  waterLitres: number;
  stress: number;
  stepsPerDay: number;
  activeMinutesPerWeek: number;
}
export const demoProfile: Profile = {
  name: "Nguyễn Minh Anh",
  email: "minhanh@example.com",
  dob: "1996-06-14",
  heightCm: 165,
  weightKg: 58,
  sex: "Prefer not to say",
  goals: ["fitness", "sleep", "energy"],
  primary: "sleep",
  activity: "sitting",
  workouts: "1–2 days/week",
  sleepHours: 7.5,
  bedtime: "23:00",
  wakeTime: "06:30",
  quality: "Fair",
  diet: "Balanced most days",
  waterLitres: 2,
  stress: 3,
  stepsPerDay: 8000,
  activeMinutesPerWeek: 150,
};
export const goalName = (id: GoalId) =>
  goals.find((goal) => goal.id === id)?.title ?? "Overall Wellness";
export const ageAt = (dob: string, now = new Date()) => {
  const [year, month, day] = dob.split("-").map(Number);
  if (!year || !month || !day) return 0;
  return (
    now.getFullYear() -
    year -
    (now.getMonth() + 1 < month ||
    (now.getMonth() + 1 === month && now.getDate() < day)
      ? 1
      : 0)
  );
};
export const clockLabel = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
};
