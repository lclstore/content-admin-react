import { create } from 'zustand'

export const useStore= create((set) => ({
  // 全局loading
  loadingGlobal: false,
  setLoadingGlobal: (data) => set({ loadingGlobal: data }),
  // 全局的 navigate
  navigate:null,
  setNavigate: (data) => set({ navigate: data }),
  // user message 用户信息
  userInfo: {},
  setUserInfo: (data) => set({ userInfo: data }),
}))