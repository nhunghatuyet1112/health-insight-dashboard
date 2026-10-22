import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  demoProfile,
  goals,
  type Profile,
  type GoalId,
} from "@/features/onboarding/profile";
interface OnboardingState {
  profile: Profile;
  started: boolean;
  completed: boolean;
  lastStep: number;
  waterLogged: number;
  stepsLogged: number;
  sleepLogged: number | null;
  resetDemo: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  toggleGoal: (goal: GoalId) => void;
  setPrimary: (goal: GoalId) => void;
  start: () => void;
  setStep: (step: number) => void;
  finish: () => void;
  addWater: () => void;
  logEntry: (kind: "steps" | "sleep", value: number) => void;
}
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      profile: { ...demoProfile },
      started: false,
      completed: false,
      lastStep: 0,
      waterLogged: 0,
      stepsLogged: 0,
      sleepLogged: null,
      resetDemo: () =>
        set({
          profile: { ...demoProfile },
          started: false,
          completed: false,
          lastStep: 0,
          waterLogged: 0,
          stepsLogged: 0,
          sleepLogged: null,
        }),
      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch }, started: true })),
      toggleGoal: (goal) =>
        set((s) => {
          const selected = s.profile.goals.includes(goal)
            ? s.profile.goals.filter((g) => g !== goal)
            : [...s.profile.goals, goal];
          return {
            profile: {
              ...s.profile,
              goals: selected,
              primary: selected.includes(s.profile.primary)
                ? s.profile.primary
                : (selected[0] ?? "fitness"),
            },
          };
        }),
      setPrimary: (goal) =>
        set((s) => ({
          profile: {
            ...s.profile,
            primary: goal,
            goals: s.profile.goals.includes(goal)
              ? s.profile.goals
              : [...s.profile.goals, goal],
          },
        })),
      start: () => set({ started: true }),
      setStep: (lastStep) => set({ lastStep, started: true }),
      finish: () => set({ completed: true }),
      addWater: () =>
        set((s) => ({
          waterLogged: Math.round((s.waterLogged + 0.25) * 100) / 100,
        })),
      logEntry: (kind, value) =>
        set(kind === "steps" ? { stepsLogged: value } : { sleepLogged: value }),
    }),
    {
      name: "synapse-onboarding-minh-anh-v2",
      version: 2,
      migrate: (persisted) => {
        const saved = persisted as Partial<OnboardingState>;
        const profile = { ...demoProfile, ...saved.profile };
        const selected = profile.goals.filter((id) =>
          goals.some((g) => g.id === id),
        );
        profile.goals = selected.length ? selected : ["wellness"];
        if (!profile.goals.includes(profile.primary))
          profile.primary = profile.goals[0];
        return { ...saved, profile };
      },
    },
  ),
);
