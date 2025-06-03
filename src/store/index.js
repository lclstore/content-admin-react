import { create } from 'zustand'
import { optionsConstants } from "./options.jsx"

export const useStore= create((set) => ({
  // 全局loading
  loadingGlobal: false,
  setLoadingGlobal: (loadingGlobal) => set({ loadingGlobal }),
  // 全局的 navigate
  navigate:null,
  setNavigate: (navigate) => set({ navigate }),
  // 全局的 Location 信息
  location:null,
  setLocation: (location) => set({ location }),
  // user message 用户信息
  userInfo: {},
  setUserInfo: (userInfo) => set({ userInfo }),
  // 映射表信息
  optionsBase:{...optionsConstants},
  optionsBaseAdd:(optionsBase) => set((state) => ({ optionsBase:{...state.optionsBase,  ...optionsBase} })),
}))