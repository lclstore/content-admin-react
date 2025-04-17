import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router/index.jsx';
import { HeaderProvider } from './contexts/HeaderContext';
import './App.css';

/**
 * 应用根组件
 * @returns {JSX.Element}
 */
function App() {
  return (
    <HeaderProvider>
      <RouterProvider router={router} />
    </HeaderProvider>
  );
}

export default App;
