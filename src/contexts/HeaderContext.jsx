import React, { createContext, useState, useCallback } from 'react';

/**
 * HeaderContext - 全局头部按钮状态管理上下文
 * 用于控制全局头部保存按钮的显示、文本、图标和事件处理
 */
export const HeaderContext = createContext({
    showSaveButton: true,        // 是否显示保存按钮
    saveButtonText: '',// 按钮文本
    saveButtonLoading: false,     // 按钮加载状态
    saveButtonIcon: '', // 按钮图标组件
    saveButtonType: 'primary',    // 按钮类型 (primary/default等)
    saveButtonSize: 'middle',     // 按钮大小 (small/middle/large)
    saveButtonDisabled: false,    // 按钮是否禁用
    onSaveButtonClick: () => { },  // 按钮点击事件处理函数
    setSaveButtonState: () => { }, // 更新按钮状态方法
    customPageTitle: null,        // 自定义页面标题
    setCustomPageTitle: () => { }  // 设置自定义页面标题的方法
});

/**
 * HeaderProvider - 提供全局头部按钮状态的组件
 * 包装应用根组件，使所有子组件都能访问HeaderContext
 */
export const HeaderProvider = ({ children }) => {
    // 头部按钮状态
    const [headerState, setHeaderState] = useState({
        showSaveButton: false,
        saveButtonText: 'SAVE CHANGES',
        saveButtonLoading: false,
        saveButtonIcon: '',
        saveButtonType: 'primary',
        saveButtonSize: 'middle',
        saveButtonDisabled: false,
        onSaveButtonClick: () => { }
    });
    // 自定义页面标题状态
    const [customPageTitle, setCustomPageTitleState] = useState(null);

    // 更新按钮状态的方法，使用useCallback确保引用稳定性
    const setSaveButtonState = useCallback((state) => {
        setHeaderState(prevState => ({
            ...prevState,
            ...state
        }));
    }, []);

    // 设置自定义标题的方法，使用useCallback确保引用稳定性
    const setCustomPageTitle = useCallback((title) => {
        setCustomPageTitleState(title);
    }, []);

    return (
        <HeaderContext.Provider
            value={{
                ...headerState,
                setSaveButtonState,
                customPageTitle,      // 传递自定义标题
                setCustomPageTitle   // 传递设置函数
            }}
        >
            {children}
        </HeaderContext.Provider>
    );
}; 