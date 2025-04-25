import React, { useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from 'antd';
import menus from '@/config/menu';
import { HeaderContext } from '@/contexts/HeaderContext';

import './header.css';

/**
 * Header组件 - 应用全局头部
 * 显示当前页面标题和动态按钮
 */
export default function Header() {
    const location = useLocation();
    const currentPath = location.pathname;

    // 从HeaderContext获取按钮数组和自定义标题
    const { buttons, customPageTitle } = useContext(HeaderContext);

    // 从菜单配置中获取当前路径对应的菜单项
    const currentMenu = useMemo(() => menus.find(menu =>
        menu.path === currentPath ||
        (currentPath === '/' && menu.path === '/')
    ), [currentPath]);

    // 获取页面标题，优先使用自定义标题
    const pageTitle = customPageTitle || currentMenu?.title || '内容管理系统';

    return (
        <div className="header">
            <h1 className="page-title">{pageTitle}</h1>

            {/* 动态渲染按钮数组 */}
            <div className="header-actions">
                {buttons.map((button, index) => (
                    <Button
                        key={button.key || index}
                        type={button.type || 'default'}
                        icon={button.icon && React.createElement(button.icon)}
                        onClick={button.onClick}
                        loading={button.loading}
                        size={button.size || 'middle'}
                        disabled={button.disabled}
                        danger={button.danger}
                        className={button.className}
                    >
                        {button.text}
                    </Button>
                ))}
            </div>
        </div>
    );
}
