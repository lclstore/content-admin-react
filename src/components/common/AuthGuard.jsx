import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import useAuth from '../../hooks/useAuth';
import settings from '../../config/settings';

/**
 * 权限控制组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element}
 */
const AuthGuard = ({ 
  children, 
  permission,
  redirectPath = settings.router.loginPath,
  noPermissionPath = settings.router.noPermissionPath,
  type = 'redirect'  // 'redirect' | 'component'
}) => {
  const { isAuthenticated, hasPermission } = useAuth();

  // 未登录
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // 权限校验
  if (permission && !hasPermission(permission)) {
    if (type === 'redirect') {
      return <Navigate to={noPermissionPath} replace />;
    } else {
      return (
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有访问此页面的权限"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          }
        />
      );
    }
  }

  return children;
};

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
  permission: PropTypes.string,
  redirectPath: PropTypes.string,
  noPermissionPath: PropTypes.string,
  type: PropTypes.oneOf(['redirect', 'component'])
};

export default AuthGuard; 