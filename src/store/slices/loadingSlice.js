import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoading: false,
  loadingText: ''
}

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload.status
      state.loadingText = action.payload.text || ''
    },
    clearLoading: (state) => {
      state.isLoading = false
      state.loadingText = ''
    }
  }
})

export const { setLoading, clearLoading } = loadingSlice.actions
export default loadingSlice.reducer 