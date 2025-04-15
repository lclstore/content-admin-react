import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import menus from '@/config/menu';
import { HeaderContext } from '@/contexts/HeaderContext';

import './header.css';

/**
 * Header组件 - 应用全局头部
 * 显示当前页面标题和动态控制的操作按钮
 */
export default function Header() {
    const location = useLocation();
    const currentPath = location.pathname;

    // 从HeaderContext获取按钮状态和控制方法，以及自定义标题
    const {
        showSaveButton = false,        // 是否显示保存按钮
        saveButtonText = 'SAVE CHANGES',// 按钮文本
        saveButtonLoading = false,      // 加载状态
        saveButtonIcon: SaveButtonIcon = SaveOutlined, // 动态图标组件
        saveButtonType = 'primary',     // 按钮类型
        saveButtonSize = 'middle',      // 按钮大小
        saveButtonDisabled = false,     // 是否禁用
        onSaveButtonClick = () => { },    // 点击处理函数
        customPageTitle, // 获取自定义标题
        showBackButton = false,         // 是否显示返回按钮
        onBackButtonClick = () => { }     // 返回按钮点击处理函数
    } = useContext(HeaderContext);

    // 从菜单配置中获取当前路径对应的菜单项
    const currentMenu = menus.find(menu =>
        menu.path === currentPath ||
        (currentPath === '/' && menu.path === '/')
    );

    // 获取页面标题，优先使用自定义标题
    const pageTitle = customPageTitle || currentMenu?.title || '内容管理系统';

    return (
        <div className="header">
            <h1 className="page-title">{pageTitle}</h1>
            {/* 操作按钮容器 */}
            <div className="header-actions">

                {/* 根据 showSaveButton 条件渲染保存按钮 */}
                {showSaveButton && (
                    <Button
                        type={saveButtonType}
                        icon={SaveButtonIcon && <SaveButtonIcon />}
                        onClick={onSaveButtonClick}
                        loading={saveButtonLoading}
                        size={saveButtonSize}
                        style={{ marginRight: '8px' }} // 添加右边距
                        disabled={saveButtonDisabled}
                    >
                        {saveButtonText}
                    </Button>
                )}
                {/* 根据 showBackButton 条件渲染返回按钮 */}
                {showBackButton && (
                    <Button
                        icon={SaveButtonIcon && <ArrowLeftOutlined />}
                        onClick={onBackButtonClick}

                    >
                        Back
                    </Button>
                )}
            </div>
        </div>
    )
}
