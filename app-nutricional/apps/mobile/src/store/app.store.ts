import { create } from 'zustand'

interface AppState {
  selectedDate: string // YYYY-MM-DD
  setSelectedDate: (date: string) => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useAppStore = create<AppState>((set) => ({
  selectedDate: todayISO(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}))
