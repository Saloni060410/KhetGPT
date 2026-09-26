import { create } from 'zustand'

export const useRecommendationStore = create((set) => ({
  current: null,
  history: [],
  setCurrent: (current) => set({ current }),
  setHistory: (history) => set({ history }),
}))
