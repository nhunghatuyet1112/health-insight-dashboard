import { create } from 'zustand'
import type { DateRange } from '@/types/health'

interface DashboardState {
  range: DateRange
  assistantOpen: boolean
  setRange: (range: DateRange) => void
  toggleAssistant: () => void
}
export const useDashboardStore = create<DashboardState>((set) => ({
  range: '7d',
  assistantOpen: true,
  setRange: (range) => set({ range }),
  toggleAssistant: () => set((state) => ({ assistantOpen: !state.assistantOpen })),
}))
