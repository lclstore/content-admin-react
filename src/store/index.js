import authReducer from '@/store/slices/authSlice'
import loadingReducer from '@/store/slices/loadingSlice'
import themeReducer from '@/store/slices/themeSlice'
import { configureStore } from '@reduxjs/toolkit'

export default configureStore({
  reducer: {
    auth: authReducer,
    loading: loadingReducer,
    theme: themeReducer,
  },
}) 