import React from 'react';
import { Navigate } from 'react-router';
import { useSelector } from 'react-redux';

/**
 * 私有路由组件，用于处理需要认证的路由
 * @param {Object} props
 * @param {JSX.Element} props.children 子组件
 * @returns {JSX.Element} 路由组件
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute; 