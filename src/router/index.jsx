/**
 * 路由配置文件
 * 实现两种布局：登录页独立布局和其他页面共用Layout布局
 */
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import menus from '@/config/menu';
import settings from '@/config/settings';
import AppLayout from '@/layout';

/**
 * 组件懒加载包装
 */
const SuspenseWrapper = ({ component }) => (
  <Suspense fallback={<div>加载中...</div>}>
    {component}
  </Suspense>
);

/**
 * 根据菜单配置动态生成路由
 */
const generateRoutes = () => {
  // 筛选有效路由项
  const validMenus = menus.filter(menu => menu.path && menu.key);

  // 登录页面路由配置（独立页面）
  const loginRoute = validMenus.find(menu => menu.key === 'login');
  let loginRouteConfig = null;

  if (loginRoute) {
    try {
      const LazyLoginComponent = lazy(() => import(`@/pages/login/index.jsx`));
      loginRouteConfig = {
        path: loginRoute.path,
        element: <SuspenseWrapper component={<LazyLoginComponent />} />,
        meta: loginRoute.meta || { title: loginRoute.title, folderName: loginRoute.folderName }
      };
    } catch (error) {
      console.error(`加载登录组件失败:`, error);
    }
  }

  // 处理非登录路由
  const layoutRoutes = validMenus
    .filter(menu => menu.key !== 'login')
    .map(menu => {
      try {
        // 动态引入组件
        const LazyComponent = lazy(() => import(`@/pages/${menu.folderName}/${menu.key}.jsx`));

        return {
          path: menu.path,
          element: <SuspenseWrapper component={<LazyComponent />} />,
          meta: menu.meta || { title: menu.title, folderName: menu.folderName },
          hideInMenu: menu.hideInMenu
        };
      } catch (error) {
        console.error(`加载组件 ${menu.key} 失败:`, error);
        return null;
      }
    }).filter(Boolean);

  // 配置Layout布局路由
  const mainRoute = {
    element: <AppLayout />,
    children: layoutRoutes
  };

  // 合并路由
  const routes = [];

  // 根路径重定向到登录页
  routes.push({
    path: '/',
    element: <Navigate to={settings.router.homePath} replace />
  });

  // 添加主布局路由
  routes.push(mainRoute);

  // 添加登录路由
  if (loginRouteConfig) {
    routes.push(loginRouteConfig);
  }

  // 添加404路由
  routes.push({
    path: '*',
    element: <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h1>404</h1>
      <p>页面不存在</p>
      <a href={settings.router.homePath}>返回首页</a>
    </div>
  });


  return routes;
};

// 创建路由配置
const routes = generateRoutes();

// 创建Router实例
const router = createBrowserRouter(routes);

// 仅使用命名导出
export { router }; 