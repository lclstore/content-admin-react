import { Form, message } from 'antd';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import React from 'react';
import { dateRangeKeys } from '@/constants/app';
/**
 * 通用编辑器组件
 * 支持简单表单和复杂表单，根据配置动态渲染
 */

/**
 * 自定义Hook，用于管理表单状态
 * 处理表单初始化、状态连接和值缓存
 * 
 * @param {Object} initialValues 表单初始值
 * @returns {Object} 表单状态管理对象
 */
export const useFormState = (initialValues = {}) => {
    // 使用useForm创建表单实例
    const [form] = Form.useForm();

    // 表单状态管理
    const [formConnected, setFormConnected] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // 表单初始值状态 - 使用useMemo进行缓存，避免不必要的重新渲染
    const formValues = useMemo(() =>
        ({ ...initialValues }),
        [JSON.stringify(initialValues)]
    );

    // 引用和标志
    const initialValuesRef = useRef(initialValues);
    const mounted = useRef(false);
    const initialized = useRef(false);

    // 初始化表单数据
    useEffect(() => {
        // 更新引用中的初始值
        initialValuesRef.current = { ...initialValues };

        // 仅在表单连接后操作
        if (form && formConnected && Object.keys(initialValues).length > 0) {
            // 确保重置和设置值按顺序执行
            form.resetFields();
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form, formConnected]);

    // 监控表单实例挂载状态
    useEffect(() => {

        if (form && typeof form.getFieldsValue === 'function') {
            setFormConnected(true);
            mounted.current = true;

            // 手动标记表单实例为已初始化
            if (!form._init) {
                form._init = true;
            }

            // 表单连接后设置初始值
            if (Object.keys(initialValues).length > 0 && !initialized.current) {
                initialized.current = true;
                form.setFieldsValue(initialValues);
            }
        }

        return () => {
            mounted.current = false;
        };
    }, [form, initialValues]);

    return {
        form,
        formConnected,
        isFormDirty,
        setIsFormDirty,
        formValues,
        messageApi,
        contextHolder,
        mounted // 导出挂载引用供其他组件使用
    };
};

/**
 * 用于管理头部配置的自定义Hook
 * 处理保存和返回按钮逻辑
 * 
 * @param {Object} params 参数对象
 * @returns {Object} 头部配置对象
 */
export const useHeaderConfig = (params) => {
    const {
        config,
        id,
        isFormDirty,
        form,
        formConnected,
        validate,
        onSave,
        navigate,
        messageApi,
        fields,
        formType,
        complexConfig,
        structurePanels,
        collapseFormConfig,
        commonListConfig,
        headerContext,
        setIsFormDirty
    } = params;
    //处理表单字段和自定义表单验证
    const processFields = (fields = [], dataToSave = {}, row = null) => {
        fields.forEach(field => {
            // 如果存在子字段，则递归处理
            if (Array.isArray(field.fields)) {
                processFields(field.fields, dataToSave, field);
            }
            //手动验证
            if (formType === 'advanced' && collapseFormConfig.isCollapse && row) {
                console.log(row);

                if (field.required) {
                    if (!dataToSave[field.name]) {

                        // 验证失败时，通知折叠栏展开对应面板
                        if (collapseFormConfig.setActiveKey && row.name) {
                            // 将包含错误字段的面板key设为activeKey
                            collapseFormConfig.setActiveKey(row.name);
                        }
                        throw new Error({
                            errorFields: [{
                                name: [field.name],
                                errors: [field.label + ' is required']
                            }]
                        });
                        return;
                    }
                }
            }
            if (field.type === 'dateRange') {

                // 如果使用分离字段模式且字段名在值中，移除原始timeRange字段
                const fieldNameConfig = field.keys || dateRangeKeys;
                const date = form.getFieldValue(field.name);
                if (date && date.length === 2) {
                    dataToSave[fieldNameConfig[0]] = date[0].format('YYYY-MM-DD');
                    dataToSave[fieldNameConfig[1]] = date[1].format('YYYY-MM-DD');
                } else {
                    dataToSave[fieldNameConfig[0]] = null;
                    dataToSave[fieldNameConfig[1]] = null;
                }
                delete dataToSave[field.name];

            }

            // 确保所有日期值都转换为字符串
            if ((field.type === 'date' || field.type === 'datepicker') && dataToSave[field.name]) {
                // 如果值是Moment/Dayjs对象，转换为字符串
                const dateValue = dataToSave[field.name];
                if (dateValue && typeof dateValue === 'object' && typeof dateValue.format === 'function') {
                    dataToSave[field.name] = dateValue.format('YYYY-MM-DD');
                }
            }

            // 处理timeRange字段，确保值是字符串数组而不是日期对象数组
            if (field.type === 'dateRange' && dataToSave[field.name] && Array.isArray(dataToSave[field.name])) {
                const format = field.props?.format || 'YYYY-MM-DD';
                const dateRangeValue = dataToSave[field.name];

                // 将数组中的每个日期对象转换为字符串
                if (dateRangeValue.length === 2) {
                    if (typeof dateRangeValue[0] === 'object' && typeof dateRangeValue[0].format === 'function') {
                        dataToSave[field.name] = [
                            dateRangeValue[0].format(format),
                            dateRangeValue[1].format(format)
                        ];
                    }
                }
            }
        });
    }

    // 保存按钮处理函数
    const handleSaveChanges = useCallback(() => {

        if (!form) return;

        form.validateFields()
            .then(values => {
                if (validate && !validate(values, form)) {
                    return;
                }
                let dataToSave = { ...values };
                const formFields = formType === 'basic' ? fields : collapseFormConfig.fields;
                // 处理dateRange类型字段 - 确保在分离字段模式下移除原始字段
                processFields(formFields, dataToSave);

                // 处理高级表单的结构化数据
                // if (formType === 'advanced' && complexConfig.includeStructurePanels) {
                //     dataToSave.structurePanels = JSON.parse(JSON.stringify(structurePanels));

                //     if (complexConfig.flattenStructurePanels) {
                //         dataToSave.structure = dataToSave.structurePanels.flatMap(
                //             panel => panel.items || []
                //         );
                //     }
                // }
                if (onSave) {


                    const editId = id;
                    const callbackUtils = {
                        setDirty: setIsFormDirty,
                        messageApi,
                        navigate
                    };
                    onSave(dataToSave, editId, callbackUtils);
                } else {
                    messageApi.success(config.saveSuccessMessage || 'Save successful!');
                    setIsFormDirty(false);

                    if (config.navigateAfterSave) {
                        navigate(config.afterSaveUrl || -1);
                    }
                }
            })
            .catch((error) => {
                // 检查错误对象是否包含 errorFields 属性
                if (!error.errorFields || !error.errorFields.length) {
                    messageApi.error(config.validationErrorMessage || 'Please check if the form is filled correctly');
                    return;
                }
                // 如果启用了折叠功能且提供了 setActiveKey 方法
                if (collapseFormConfig.isCollapse && collapseFormConfig.setActiveKey) {
                    const errorFieldName = error.errorFields[0].name?.[0];

                    const matchedPanel = collapseFormConfig.fields.find(panel =>
                        Array.isArray(panel.fields) &&
                        panel.fields.some(field => field.name === errorFieldName)
                    );

                    if (matchedPanel) {
                        collapseFormConfig.setActiveKey(matchedPanel.name);
                    }
                }
                // 显示错误信息
                messageApi.error(error.errorFields[0].errors[0]);
            });
    }, [
        formConnected,
        form,
        validate,
        fields,
        formType,
        complexConfig,
        structurePanels,
        onSave,
        id,
        messageApi,
        navigate,
        config,
        setIsFormDirty
    ]);

    // 返回按钮处理函数
    const handleBackClick = useCallback(() => {
        if (isFormDirty && config.confirmUnsavedChanges !== false) {
            if (window.confirm(config.unsavedChangesMessage || "You have unsaved changes. Are you sure you want to leave?")) {
                navigate(config.backUrl || -1);
            }
        } else {
            navigate(config.backUrl || -1);
        }
    }, [
        isFormDirty,
        config.confirmUnsavedChanges,
        config.unsavedChangesMessage,
        config.backUrl,
        navigate
    ]);

    // 头部按钮配置
    let headerButtons = useMemo(() => {
        return [
            {
                key: 'save',
                hidden: config.hideSaveButton,
                text: config.saveButtonText || 'Save',
                icon: React.createElement(SaveOutlined),
                type: 'primary',
                onClick: handleSaveChanges,
                // disabled: !config.allowEmptySave && !isFormDirty,// 如果表单内容没修改时禁用按钮
                disabled: !config.allowEmptySave,
            },
            {
                key: 'back',
                hidden: config.hideBackButton,
                text: config.backButtonText || 'Back',
                icon: React.createElement(ArrowLeftOutlined),
                onClick: handleBackClick,
            }
        ];
    }, [
        config.saveButtonText,
        config.backButtonText,
        config.allowEmptySave,
        isFormDirty,
        handleSaveChanges,
        handleBackClick
    ]);
    if (config.headerButtons) {
        config.headerButtons.forEach(button => {
            if (button.key === 'save') {
                button.onClick = handleSaveChanges;
            }
        });
        headerButtons = config.headerButtons;
    }
    return {
        headerButtons,
        handleSaveChanges,
        handleBackClick
    };
}; 