import type { AnalysisOptions } from "../health/entries.js";
import type { Goals, Pillar, Provider, Range } from "../health/model.js";
export interface ChatRequest {
  data?: AnalysisOptions;
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
  range: Range;
  focus: Pillar | "overview" | "goals" | "integrations" | "journal";
  sources: Provider[];
  goals: Goals;
  datasetVersion: string;
  preferences?: {
    primaryFocus: Pillar | "overview";
    bedtime: string;
    wakeTime: string;
    activityLevel: "sitting" | "light" | "moderate" | "very";
  };
}
export interface ChatEvidence {
  kind?: "measurement" | "target";
  id: string;
  label: string;
  value: number | null;
  previousValue: number | null;
  unit: string;
  coverage: string;
  previousCoverage: string;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
}
export interface ChatResponse {
  answer: string;
  evidence: ChatEvidence[];
  recommendation: string;
  followUp: string;
  period: { start: string; end: string };
  sources: string[];
}
