import React from "react";
import { RouterProvider } from 'react-router';
import {router} from './router/index.jsx';
import './App.css';

/**
 * 应用根组件
 * @returns {JSX.Element}
 */
function App() {

    return (
        <RouterProvider router={router}/>
    );
}

export default App;
