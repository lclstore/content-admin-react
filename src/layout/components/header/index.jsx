import React, { useContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Dropdown } from 'antd';
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
    // 添加本地状态来控制Dropdown的显示
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // 从HeaderContext获取按钮数组和自定义标题
    const { buttons, customPageTitle } = useContext(HeaderContext);

    // 从菜单配置中获取当前路径对应的菜单项
    const currentMenu = useMemo(() => menus.find(menu =>
        menu.path === currentPath ||
        (currentPath === '/' && menu.path === '/')
    ), [currentPath]);

    // 获取页面标题，优先使用自定义标题
    const pageTitle = customPageTitle || currentMenu?.title || 'Content Management System';

    // 处理Dropdown可见性变化
    const handleDropdownOpenChange = (visible, button) => {
        setDropdownOpen(visible);
        if (!visible && button?.statusModalProps?.onCancel) {
            button.statusModalProps.onCancel();
        }
    };

    return (
        <div className="header">
            <h1 className="page-title">{pageTitle}</h1>

            {/* 动态渲染按钮数组 */}
            <div className="header-actions">
                {buttons.map((button, index) => {
                    if (button.hidden) return null;

                    // 为save按钮添加状态选择Dropdown
                    if (button.key === 'save' && button.statusModalProps) {
                        const { statusList, onConfirm } = button.statusModalProps;
                        const DropdownItems = statusList.map(({ name, value }) => {
                            return {
                                key: value,
                                label: name,
                                style: {
                                    padding: '5px 10px'
                                },
                                onClick: (e) => {
                                    if (e.domEvent) e.domEvent.stopPropagation();
                                    onConfirm(value);
                                }
                            }
                        })

                        return (
                            <Dropdown
                                key={button.key || index}
                                menu={{ items: DropdownItems }}
                                trigger={['click']}
                                open={dropdownOpen}
                                onOpenChange={(visible) => handleDropdownOpenChange(visible, button)}
                            >
                                <Button
                                    type={button.type || 'default'}
                                    icon={button.icon}
                                    onClick={(e) => {
                                        if (button.statusModalProps) {
                                            setDropdownOpen(true);
                                        } else {
                                            button.onClick?.();
                                        }
                                    }}
                                    loading={button.loading}
                                    size={button.size || 'middle'}
                                    disabled={button.disabled}
                                    danger={button.danger}
                                    className={button.className}
                                >
                                    {button.text}
                                </Button>
                            </Dropdown>
                        );
                    }

                    return (
                        <Button
                            key={button.key || index}
                            type={button.type || 'default'}
                            icon={button.icon}
                            onClick={button.onClick}
                            loading={button.loading}
                            size={button.size || 'middle'}
                            disabled={button.disabled}
                            danger={button.danger}
                            className={button.className}
                        >
                            {button.text}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
