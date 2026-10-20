export interface HealthRecord {
  day: string
  steps: number
  sleepHours: number
  activeMinutes: number
}
export type DateRange = '7d' | '14d'
