import React, { useEffect, useMemo } from 'react';
import { Form } from 'antd';
import EditorFormPanel from '@/components/EditorFormPanel/EditorFormPanel';
import ContentLibraryPanel from '@/components/ContentLibrary/ContentLibraryPanel';
import styles from './style.module.css';

/**
 * 高级表单组件
 * 支持复杂数据结构和内容库选择
 */
const AdvancedForm = ({
    formInstance,
    config = {},
    initialValues = {},
    onFormChange,
    onFinish,
    complexConfig = {},
    structurePanels = [],
    expandedItems = {},
    activeCollapseKeys = ['1'],
    onToggleExpandItem,
    onCollapseChange
}) => {
    // 使用useMemo缓存初始值，避免不必要的重渲染
    const cachedInitialValues = useMemo(() => initialValues, [JSON.stringify(initialValues)]);

    // 确保表单值在组件内正确设置
    useEffect(() => {
        if (formInstance && Object.keys(initialValues).length > 0) {
            try {
                // 先重置表单，确保没有旧值干扰
                formInstance.resetFields();
                // 然后设置新值
                formInstance.setFieldsValue(initialValues);
            } catch (error) {
                // 表单值设置失败的错误处理
            }
        }
    }, [initialValues, formInstance]);

    // 准备表单属性
    const formProps = {
        layout: config.layout || "vertical",
        onValuesChange: onFormChange,
        onFinish: onFinish,
        initialValues: cachedInitialValues, // 使用缓存的初始值
        name: "common-editor-form-advanced",
        preserve: true // 保留表单项
    };

    // 只有当formInstance有效时才添加form属性
    if (formInstance && typeof formInstance.getFieldsValue === 'function') {
        formProps.form = formInstance;
    }

    // 安全检查 - 确保表单实例可用于传递给子组件
    const safeFormInstance = formInstance && formInstance._init ? formInstance : null;

    return (
        <Form {...formProps}>
            <div className={complexConfig.containerClassName || styles.advancedEditorContainer}>
                {/* 内容库面板 */}
                {complexConfig.showContentLibrary && complexConfig.ContentLibraryPanel && (
                    <ContentLibraryPanel
                        className={complexConfig.contentLibraryClassName || styles.contentLibraryPanel}
                        contentLibraryData={complexConfig.contentLibraryData || []}
                        onAddItem={complexConfig.onAddItem}
                        searchValue={complexConfig.contentSearchValue}
                        onSearchChange={complexConfig.onContentSearchChange}
                        onFilterChange={complexConfig.onContentFilterChange}
                        hasActiveFilters={complexConfig.hasActiveContentFilters}
                        activeFilters={complexConfig.contentFilters}
                    />
                )}

                {/* 编辑表单面板 */}
                {complexConfig.EditorFormPanel && (
                    <EditorFormPanel
                        className={complexConfig.editorPanelClassName || styles.editorFormPanel}
                        formInstance={safeFormInstance}
                        onFinish={onFinish}
                        structurePanelsData={structurePanels}
                        onFormChange={onFormChange}
                        onDeleteItem={complexConfig.onDeleteItem}
                        onRoundChange={complexConfig.onRoundChange}
                        onReplaceItem={complexConfig.onReplaceItem}
                        onSortItems={complexConfig.onSortItems}
                        onItemChange={complexConfig.onItemChange}
                        onCopyItem={complexConfig.onCopyItem}
                        onStructureNameChange={complexConfig.onStructureNameChange}
                        onAddStructurePanel={complexConfig.onAddStructurePanel}
                        workoutData={complexConfig.workoutData}

                        // 展开/折叠状态
                        expandedItems={expandedItems}
                        onToggleExpandItem={onToggleExpandItem}

                        // 折叠面板状态
                        activeCollapseKeys={activeCollapseKeys}
                        onCollapseChange={onCollapseChange}

                        // 内容库模态框属性
                        contentLibraryData={complexConfig.contentLibraryData}
                        contentSearchValue={complexConfig.contentSearchValue}
                        contentFilters={complexConfig.contentFilters}
                        onContentSearchChange={complexConfig.onContentSearchChange}
                        onContentFilterChange={complexConfig.onContentFilterChange}
                        hasActiveContentFilters={complexConfig.hasActiveContentFilters}
                    />
                )}
            </div>
        </Form>
    );
};

export default AdvancedForm; 