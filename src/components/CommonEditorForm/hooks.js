import { Form, message, notification, Modal, Select } from 'antd';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import React from 'react';
import { optionsConstants } from '@/constants';

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
        enableDraft = false,
        statusList = optionsConstants.displayStatus,//状态列表
        config,
        id,
        isFormDirty,
        form,
        setActiveCollapseKeys,
        isCollapse,
        formConnected,
        validate,
        onSave,
        navigate,
        messageApi,
        fields,
        formFields,
        formType,
        complexConfig,
        structurePanels,
        headerContext,
        setIsFormDirty,
        fieldsToValidate,
        getLatestValues,
        initialValues = {} // 确保初始值可用
    } = params;

    // 创建ref存储最新的collapseFormConfig
    const collapseFormConfigRef = useRef(fields);
    // 更新ref值确保始终是最新的
    useEffect(() => {
        collapseFormConfigRef.current = fields;
    }, [fields]);

    // 状态选择弹框状态
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState(null);

    //处理表单字段和自定义表单验证
    const processFields = (fields = [], dataToSave = {}, parent = null) => {
        for (const field of fields) {
            const value = dataToSave[field.name];
            const isRequired = formType === 'advanced' && isCollapse && field.required;

            // 校验必填项
            if (isRequired && (value === undefined || value === null || value === '')) {
                if (setActiveCollapseKeys && parent.name) {
                    setActiveCollapseKeys(parent.name);

                    requestAnimationFrame(() => {
                        form.validateFields();
                    });
                }

                // 抛出标准表单校验错误
                throw new Error(
                    JSON.stringify({
                        errorFields: [{
                            name: [field.name],
                            errors: [`${field.label} is required`]
                        }]
                    })
                );
            }


            // 处理日期范围字段（有 keys 时分拆，无 keys 时格式化原字段）
            if (field.type === 'dateRange') {
                const date = form.getFieldValue(field.name);
                const format = field.props?.format || 'YYYY-MM-DD';

                if (date && date.length === 2 && typeof date[0]?.format === 'function') {
                    if (field.keys && Array.isArray(field.keys)) {
                        dataToSave[field.keys[0]] = date[0].format(format);
                        dataToSave[field.keys[1]] = date[1].format(format);
                        delete dataToSave[field.name];
                    } else {
                        dataToSave[field.name] = [
                            date[0].format(format),
                            date[1].format(format)
                        ];
                    }
                } else {
                    if (field.keys && Array.isArray(field.keys)) {
                        dataToSave[field.keys[0]] = null;
                        dataToSave[field.keys[1]] = null;
                        delete dataToSave[field.name];
                    }
                }
            }

            // 处理单个日期字段
            if ((field.type === 'date' || field.type === 'datepicker') && value?.format) {
                dataToSave[field.name] = value.format('YYYY-MM-DD');
            }

            // 递归处理嵌套字段
            if (Array.isArray(field.fields)) {
                processFields(field.fields, dataToSave, field);
            }
            //手动验证dataList
            dataListValidate(field, setActiveCollapseKeys);
        }
    };
    //手动验证dataList
    const dataListValidate = (field, setActiveCollapseKeys) => {
        const isStructureList = field.type === 'structureList';
        const isArray = Array.isArray(field.dataList);
        const isRequired = field.required || field.rules?.some(rule => rule?.required);
        const isEmptyList = isArray && field.dataList.length === 0;

        // 只对需要校验的结构化列表或数组字段生效
        if ((isStructureList || isArray) && isRequired && isEmptyList) {
            // 如果配置了折叠面板开关，尝试展开当前折叠项
            if (typeof setActiveCollapseKeys === 'function' && field.name) {
                setActiveCollapseKeys(field.name);
            }

            const ruleMessage = field.rules?.find(rule => !!rule?.required)?.message;
            const fallbackMessage = `Please add at least one ${field.label || 'item'}`;

            throw new Error(
                JSON.stringify({
                    errorFields: [{
                        type: 'notification',
                        message: `Cannot Add New【${field.label || 'Unnamed'}】`,
                        description: ruleMessage || fallbackMessage,
                    }]
                })
            );
        }
    };

    // 执行保存操作
    const executeSave = (dataToSave, status = null) => {
        if (status) {
            dataToSave.status = status;
        }

        console.log('dataToSave', dataToSave);
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
    };

    // 保存按钮处理函数
    const handleSaveChanges = useCallback(() => {
        if (!form) return;

        // 获取当前表单值中的状态，如果没有则使用初始状态
        const currentStatus = form.getFieldValue('status') || initialValues.status || 'ENABLE';
        // 如果启用草稿功能，先弹出状态选择框，否则直接使用当前状态
        if (enableDraft) {
            setPendingSaveData({});
            setIsStatusModalVisible(true);
        } else {
            // 直接调用状态确认处理函数，使用当前状态值
            handleStatusModalConfirm(currentStatus);
        }
    }, [
        form, enableDraft, initialValues
    ]);

    // 处理状态选择确认
    const handleStatusModalConfirm = (statusValue = 'ENABLE') => {
        debugger
        setIsStatusModalVisible(false);

        // 在表单中设置选择的状态
        form.setFieldValue('status', statusValue);

        // 根据状态值确定验证规则
        if (enableDraft && statusValue === 'DRAFT') {
            // 状态为0，只验证name字段
            form.validateFields(fieldsToValidate)
                .then(() => {
                    const dataToSave = form.getFieldsValue(true);
                    dataToSave.status = statusValue;
                    executeSave(dataToSave);
                })

        } else {
            // 其他状态，执行完整验证
            form.validateFields()
                .then(values => {
                    if (validate && !validate(values, form)) {
                        return;
                    }
                    const dataToSave = form.getFieldsValue(true);

                    // 获取当前使用的FormFields
                    const currentFormFields = collapseFormConfigRef.current;
                    if (isCollapse) {
                        processFields(currentFormFields, dataToSave);
                    }
                    const hasStructureListFields = currentFormFields.filter(
                        formField => formField.type === 'structureList'
                    );

                    //手动验证structureList
                    hasStructureListFields.forEach(formField => {
                        dataListValidate(formField, setActiveCollapseKeys);
                    });

                    const hasDataListFields = currentFormFields.filter(
                        formField => Array.isArray(formField.dataList)
                    );

                    // 处理数组列表相关数据格式和验证
                    const dataListValues = hasDataListFields.map(formField => {
                        const dataListObject = {
                            [formField.dataKey]: formField.formterList ? formField.formterList(formField.dataList) : formField.dataList.map(item => item.id)
                        };

                        if (formField.length > 0) {
                            formField.fields.forEach(subField => {
                                const baseName = subField.name.replace(/\d+$/, '');
                                const value = dataToSave[subField.name];
                                if (value !== undefined) {
                                    dataListObject[baseName] = value;
                                    delete dataToSave[subField.name];
                                }
                            });
                        }

                        return dataListObject;
                    });

                    if (dataListValues.length > 0) {
                        const dataKey = hasDataListFields[0].dataKey;
                        dataToSave[dataKey] = dataListValues;
                    }

                    // 确保状态值正确
                    dataToSave.status = statusValue;
                    executeSave(dataToSave);
                })
                .catch((error) => {
                    // 尝试解析错误消息体
                    let errorData = error;

                    // 如果错误是字符串格式的JSON，尝试解析它
                    if (typeof error.message === 'string') {
                        try {
                            const parsedError = JSON.parse(error.message);
                            if (parsedError && parsedError.errorFields) {
                                errorData = parsedError;
                            }
                        } catch (e) {
                            // 解析失败，使用原始错误
                        }
                    }

                    // 检查错误对象是否包含 errorFields 属性
                    if (!errorData.errorFields || !errorData.errorFields.length) {
                        messageApi.error(config.validationErrorMessage || 'Please check if the form is filled correctly');
                        return;
                    }

                    // 处理notification类型的错误
                    if (errorData.errorFields[0]?.type === 'notification') {
                        notification.error({
                            style: {
                                minWidth: 400,
                            },
                            duration: 4000,
                            placement: 'bottomRight',
                            message: errorData.errorFields[0].message,
                            description: errorData.errorFields[0].description,
                        });
                        return;
                    }

                    // 如果启用了折叠功能且提供了 setActiveCollapseKeys 方法
                    if (isCollapse && setActiveCollapseKeys) {
                        const errorFieldName = errorData.errorFields[0].name?.[0];

                        // 使用当前的formFields查找面板
                        const currentFormFields = fields;
                        const matchedPanel = currentFormFields.find(panel =>
                            Array.isArray(panel.fields) &&
                            panel.fields.some(field => field.name === errorFieldName)
                        );

                        if (matchedPanel) {
                            setActiveCollapseKeys(matchedPanel.name);
                        }
                    }

                    // 显示错误信息
                    messageApi.error(errorData.errorFields[0].errors?.[0] || 'Form validation error');
                });
        }
    };

    // 处理状态选择取消
    const handleStatusModalCancel = () => {
        setIsStatusModalVisible(false);
        setPendingSaveData(null);
    };

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
        const saveButton = {
            key: 'save',
            hidden: config.hideSaveButton,
            text: config.saveButtonText || 'Save',
            icon: React.createElement(SaveOutlined),
            type: 'primary',
            onClick: handleSaveChanges,
            disabled: !config.allowEmptySave,
            // 添加状态选择的相关props
            statusModalProps: enableDraft ? {
                visible: isStatusModalVisible,
                statusList,
                onConfirm: handleStatusModalConfirm,
                onCancel: handleStatusModalCancel
            } : null
        };

        const backButton = {
            key: 'back',
            hidden: config.hideBackButton,
            text: config.backButtonText || 'Back',
            icon: React.createElement(ArrowLeftOutlined),
            onClick: handleBackClick,
        };

        return [saveButton, backButton];
    }, [
        config.saveButtonText,
        config.backButtonText,
        config.allowEmptySave,
        isFormDirty,
        handleSaveChanges,
        handleBackClick,
        enableDraft,
        isStatusModalVisible,
        statusList
    ]);

    if (config.headerButtons) {
        config.headerButtons.forEach(button => {
            if (button.key === 'save') {
                button.onClick = handleSaveChanges;
                // 添加状态选择的相关props
                if (enableDraft) {
                    button.statusModalProps = {
                        visible: isStatusModalVisible,
                        statusList,
                        onConfirm: handleStatusModalConfirm,
                        onCancel: handleStatusModalCancel
                    };
                }
            }
        });
        headerButtons = config.headerButtons;
    }

    return {
        headerButtons
    };
}; 