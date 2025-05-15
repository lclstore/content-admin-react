import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router/index.jsx';
import './App.css';
import {Spin} from "antd";
import {useStore} from "@/store"

/**
 * 应用根组件
 * @returns {JSX.Element}
 */
function App() {
  const loadingGlobal = useStore(state => state.loadingGlobal);
  return (
      <>
      <Spin spinning={loadingGlobal} fullscreen />
      <RouterProvider router={router} />
      </>
  );
}

export default App;
