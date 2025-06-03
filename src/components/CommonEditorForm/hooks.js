import { Form, message, notification, Modal, Select } from 'antd';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { savePublicFormData } from '@/config/api.js'; //公共方法
import { useLocation } from 'react-router-dom';
import React from 'react';
import { optionsConstants } from '@/constants';
import { md5Encrypt } from '@/utils';

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
        setLoading,
        isBack,
        enableDraft = false,
        statusList = optionsConstants.displayStatus1,//状态列表
        config,
        moduleKey,
        operationName,
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
    const location = useLocation();

    // 创建ref存储最新的collapseFormConfig
    const collapseFormConfigRef = useRef(fields);
    // 更新ref值确保始终是最新的
    useEffect(() => {
        collapseFormConfigRef.current = fields || formFields;
    }, [fields]);

    // 状态选择弹框状态
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState(null);

    // 添加状态来管理按钮
    const [buttons, setButtons] = useState([]);

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
    const executeSave = async (dataToSave, status = null) => {

        setLoading(true);
        //统一处理密码字段--加密
        const passwordField = collapseFormConfigRef.current.find(field => field.type === 'password');
        if (passwordField) {
            dataToSave[passwordField.name] = md5Encrypt(dataToSave[passwordField.name]);
        }
        //统一处理switch值
        const switchFields = collapseFormConfigRef.current.filter(field => field.type === 'switch');
        switchFields.forEach(field => {
            dataToSave[field.name] = dataToSave[field.name] ? 1 : 0;
        });

        try {
            if (!dataToSave.status) {
                dataToSave.status = 'ENABLED';
            }

            if (onSave) {
                const result = await onSave(dataToSave);
                return result;
            } else {
                // 从 location 获取基础路径
                const module = moduleKey || location.pathname.split('/')[1]; // 获取模块名称
                const systemList = ['user'];//系统级别操作对应update/add  业务层操作对应save
                const isSystem = systemList.includes(module);
                const operation = operationName || (isSystem ? id ? 'update' : 'add' : 'save');
                const apiUrl = `/${module}/${operation}`; // 完整的API路径
                // 使用新的命名调用
                const ret = await savePublicFormData(dataToSave, apiUrl, 'post');
                return ret;
            }
        } finally {
            setLoading(false);
        }
    };

    // 保存按钮处理函数
    const handleSaveChanges = useCallback(() => {
        if (!form) return;

        // 获取当前表单值中的状态，如果没有则使用初始状态
        const currentStatus = form.getFieldValue('status') || initialValues.status || 'ENABLED';
        // 如果启用草稿功能，先弹出状态选择框，否则直接使用当前状态
        if (enableDraft) {
            setPendingSaveData({});
            setIsStatusModalVisible(true);
        } else {
            // 直接调用状态确认处理函数，使用当前状态值
            return handleStatusModalConfirm(currentStatus);
        }
    }, [
        form, enableDraft, initialValues
    ]);

    // 处理状态选择确认
    const handleStatusModalConfirm = useCallback(async (statusValue = 'ENABLED', load = true) => {
        setIsStatusModalVisible(false);

        try {
            // 在表单中设置选择的状态
            form.setFieldValue('status', statusValue);

            // 根据状态值确定验证规则
            if (enableDraft && statusValue === 'DRAFT') {
                // 状态为 DRAFT，只验证指定字段
                await form.validateFields(fieldsToValidate);
                const dataToSave = form.getFieldsValue(true);
                dataToSave.status = statusValue;
                const saveResult = await executeSave(dataToSave) || {};
                if (saveResult.success) {
                    setIsFormDirty(false);
                    if (isBack) {
                        navigate(config.afterSaveUrl || -1);
                    }
                } else {
                    messageApi.error(saveResult.errMessage || 'Save failed!');
                }
                return saveResult; // 返回保存结果
            } else {
                // 其他状态，执行完整验证
                const values = await form.validateFields();
                if (validate && !validate(values, form)) {
                    const customValidationError = new Error("Custom validation failed.");
                    customValidationError.errorFields = [{ name: ['custom'], errors: ['Custom validation failed.'] }];
                    throw customValidationError;
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
                // 处理数组列表相关数据格式和验证
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
                const saveResult = await executeSave(dataToSave);//执行保存

                if (saveResult.success) {
                    if (load) {
                        messageApi.success(saveResult.message || 'Save successful!');
                    }
                    setIsFormDirty(false);
                    if (isBack) {
                        navigate(config.afterSaveUrl || -1);
                    }
                } else {
                    messageApi.error(saveResult.errMessage || 'Save failed!');
                }

                return saveResult; // 返回保存结果
            }
        } catch (error) {
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
                throw error; // 重新抛出错误
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
                throw error; // 重新抛出错误
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
            throw error; // 确保错误也被正确传递
        }
    }, [
        form, enableDraft, fieldsToValidate, executeSave, validate, collapseFormConfigRef,
        isCollapse, processFields, dataListValidate, setActiveCollapseKeys, messageApi, config
        // 移除了 pendingSaveData, setIsStatusModalVisible 因为它们不直接影响此函数的异步流程
        // 确保所有依赖项都已正确列出
    ]);

    // 处理状态选择取消
    const handleStatusModalCancel = () => {
        setIsStatusModalVisible(false);
        setPendingSaveData(null);
    };
    const visibleStatusList = (button) => {
        let visibleStatusList = [];
        // 如果没有传入button参数，返回所有状态
        if (!button) {
            return statusList;
        }

        switch (button.status) {
            case 'DISABLED':
            case 'ENABLED':
                visibleStatusList = statusList.filter(status => status.value === 'DRAFT');
                break;
            default:
                visibleStatusList = statusList;
        }
        return visibleStatusList;
    }

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

    // 添加更新按钮状态的方法
    const setHeaderButtons = useCallback((formData) => {
        // 根据表单数据状态过滤可用的状态列表
        const getVisibleStatusList = (status) => {
            let filteredStatusList = [];
            switch (status) {
                case 'DISABLED':
                case 'ENABLED':
                    filteredStatusList = statusList.filter(status => status.value !== 'DRAFT');
                    break;
                default:
                    filteredStatusList = statusList;
            }
            return filteredStatusList;
        };

        const saveButton = {
            key: 'save',
            hidden: config.hideSaveButton,
            text: config.saveButtonText || 'Save',
            icon: React.createElement(SaveOutlined),
            type: 'primary',
            onClick: handleSaveChanges,
            disabled: false,
            statusModalProps: enableDraft ? {
                visible: isStatusModalVisible,
                statusList: getVisibleStatusList(formData?.status), // 使用过滤后的状态列表
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

        let newButtons = [saveButton, backButton];

        if (config.headerButtons) {
            config.headerButtons.forEach(button => {
                if (button.key === 'save') {
                    button.onClick = handleSaveChanges;
                    button.disabled = false;
                    if (enableDraft) {
                        button.statusModalProps = {
                            visible: isStatusModalVisible,
                            statusList: getVisibleStatusList(formData?.status), // 使用过滤后的状态列表
                            onConfirm: handleStatusModalConfirm,
                            onCancel: handleStatusModalCancel
                        };
                    }
                }
            });
            newButtons = config.headerButtons;
        }

        setButtons(newButtons);

        if (headerContext.setButtons) {
            headerContext.setButtons(newButtons);
        }
    }, [config, enableDraft, handleSaveChanges, handleBackClick, handleStatusModalConfirm, handleStatusModalCancel, isStatusModalVisible, statusList, headerContext]);

    return {
        headerButtons: buttons,
        handleStatusModalConfirm,
        handleSaveChanges,
        setHeaderButtons // 导出设置按钮的方法
    };
}; 