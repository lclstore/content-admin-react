import React, { createContext, useState, useCallback } from 'react';

/**
 * HeaderContext - 全局头部按钮状态管理上下文
 * 使用动态按钮数组实现灵活的头部控制
 */
export const HeaderContext = createContext({
    buttons: [],                  // 动态按钮数组
    setButtons: () => { },       // 设置按钮数组的方法
    setButton: () => { },        // 更新单个按钮的方法
    customPageTitle: null,        // 自定义页面标题
    setCustomPageTitle: () => { } // 设置自定义页面标题的方法
});

/**
 * HeaderProvider - 提供全局头部按钮状态的组件
 */
export const HeaderProvider = ({ children }) => {
    // 头部按钮数组状态
    const [buttons, setButtonsState] = useState([]);

    // 自定义页面标题状态
    const [customPageTitle, setCustomPageTitleState] = useState(null);

    // 更新整个按钮数组
    const setButtons = useCallback((newButtons) => {
        setButtonsState(newButtons);
    }, []);

    // 更新单个按钮属性
    const setButton = useCallback((key, buttonProps) => {
        setButtonsState(prevButtons => {
            const index = prevButtons.findIndex(btn => btn.key === key);
            if (index === -1) return prevButtons;

            const newButtons = [...prevButtons];
            newButtons[index] = { ...newButtons[index], ...buttonProps };
            return newButtons;
        });
    }, []);

    // 设置自定义标题
    const setCustomPageTitle = useCallback((title) => {
        setCustomPageTitleState(title);
    }, []);

    return (
        <HeaderContext.Provider
            value={{
                buttons,
                setButtons,
                setButton,
                customPageTitle,
                setCustomPageTitle
            }}
        >
            {children}
        </HeaderContext.Provider>
    );
}; 