import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import store from '@/store'
import App from '@/App'
import '@/assets/styles/variables.css'
import './index.css'
import settings from '@/config/settings'

// 设置文档标题
document.title = import.meta.env.VITE_APP_TITLE || '内容管理系统';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={settings.themeConfig}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
)
console.log(import.meta.env.VITE_APP_TITLE)