import { create } from 'zustand'

export const useStore= create((set) => ({
  loadingGlobal: false,
  setLoadingGlobal: (data) => set({ loadingGlobal: data }),
}))