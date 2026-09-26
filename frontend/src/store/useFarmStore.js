import { create } from 'zustand'

export const useFarmStore = create((set) => ({
  farms: [],
  fields: [],
  setFarms: (farms) => set({ farms }),
  setFields: (fields) => set({ fields }),
}))
