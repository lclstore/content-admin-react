import React, { useEffect, useState, useMemo } from 'react';
import { Form, Divider, Row, Col } from 'antd';
import FormItemRenderer from './FormItemRenderer';
import { deepClone } from '@/utils';
import styles from './style.module.css';

/**
 * 基础表单组件
 * 支持不同类型的表单字段渲染、值传递和变更通知
 */
const BasicForm = ({
    fields,
    initialValues,
    initialFormValues,
    form,
    onFormChange,
    onFinish,
    messageApi,
    fieldsConfig = {},
    divider = true,
    oneColumnKeys = [],
    layout = 'vertical', // 默认垂直布局
    ...props
}) => {
    // 内部状态，存储当前表单值
    const [formValues, setFormValues] = useState({});
    // 追踪表单实例是否已连接
    const [formConnected, setFormConnected] = useState(false);

    // 检查表单实例是否有效
    useEffect(() => {
        if (form && typeof form.getFieldsValue === 'function') {
            setFormConnected(true);
        } else {
            setFormConnected(false);
        }
    }, [form]);

    // 使用useMemo缓存初始值，防止不必要的重新渲染
    const cachedInitialValues = useMemo(() => {
        // 基础初始值
        const baseInitialValues = initialValues ? deepClone(initialValues) : {};

        // 合并 fieldsConfig 和 fields 中的 defaultValue 到初始值
        if (fields && fields.length > 0) {
            fields.forEach(field => {
                const fieldName = field.name;
                if (!fieldName) return;

                // 如果初始值中已经存在该字段的值，不覆盖
                if (baseInitialValues[fieldName] !== undefined) return;

                // 检查 field.defaultValue
                if (field.defaultValue !== undefined) {
                    baseInitialValues[fieldName] = field.defaultValue;
                    return;
                }

                // 检查 fieldsConfig 中的 defaultValue
                const fieldConfig = fieldsConfig[fieldName] || {};
                if (fieldConfig.defaultValue !== undefined) {
                    baseInitialValues[fieldName] = fieldConfig.defaultValue;
                }
            });
        }

        return baseInitialValues;
    }, [JSON.stringify(initialValues), JSON.stringify(fieldsConfig), fields]);

    // 使用useMemo缓存字段配置
    const cachedFields = useMemo(() => {
        return fields || [];
    }, [fields]);

    // 当表单初始值变化时重置表单并设置新值
    useEffect(() => {
        // 确保form已经存在且已连接
        if (!formConnected) return;

        // 重置表单字段
        form.resetFields();

        // 设置表单值 - 使用延时确保在DOM更新后执行
        setTimeout(() => {
            if (Object.keys(cachedInitialValues).length > 0) {
                form.setFieldsValue(cachedInitialValues);
                setFormValues(cachedInitialValues);
            } else {
                setFormValues({}); // 当初始值为空时重置内部状态
            }
        }, 0);
    }, [form, formConnected, cachedInitialValues]);

    // 处理Ant Design表单的值变化
    const handleFormValuesChange = (changedValues, allValues) => {
        // 设置内部状态
        setFormValues(prev => ({
            ...prev,
            ...changedValues
        }));

        // 通知父组件
        if (onFormChange) {
            onFormChange(changedValues, allValues);
        }
    };

    /**
     * 创建带值的表单控件
     * 优先使用内部状态的值，如果没有则使用表单实例中的值或初始值
     */
    const createControlWithValue = (field) => {
        if (!field) return null;

        // 字段名和类型
        const fieldName = field.name;
        const fieldType = field.type;

        // 优先从内部状态获取值，然后依次从表单实例或初始值中获取
        let fieldValue;

        // 首先检查内部状态
        if (formValues && formValues[fieldName] !== undefined) {
            fieldValue = formValues[fieldName];
        }
        // 然后检查表单实例 - 仅在表单已连接时才使用
        else if (formConnected && field.name && typeof form.getFieldValue === 'function') {
            try {
                fieldValue = form.getFieldValue(fieldName);
            } catch (error) {
                // 如果获取字段值出错，使用初始值
                fieldValue = cachedInitialValues[fieldName];
            }
        }
        // 最后检查初始值
        else if (cachedInitialValues && cachedInitialValues[fieldName] !== undefined) {
            fieldValue = cachedInitialValues[fieldName];
        }

        // 获取字段配置
        const fieldConfig = fieldsConfig[fieldName] || {};

        // 从外部配置或字段属性中获取 disabled 状态
        const disabled = fieldConfig.disabled || field.disabled || false;

        // 从外部配置或字段属性中获取 defaultValue
        const defaultValue = field.defaultValue !== undefined ?
            field.defaultValue :
            (fieldConfig.defaultValue !== undefined ? fieldConfig.defaultValue : undefined);

        // 准备安全的表单控件属性
        const safeRules = [];
        if (field.rules && Array.isArray(field.rules)) {
            field.rules.forEach(rule => {
                // 创建新规则对象，保留所有验证相关属性
                const safeRule = {};

                // 基本验证属性
                if (rule.required !== undefined) safeRule.required = rule.required;
                if (rule.message !== undefined) safeRule.message = rule.message;
                else if (safeRule.required && !rule.message) {
                    // 为未设置消息的必填规则添加默认消息
                    safeRule.message = `Please ${fieldType === 'select' || fieldType === 'single' || fieldType === 'multiple' ? 'select' : fieldType === 'upload' ? 'upload' : 'input'} ${field.label}`;
                }
                if (rule.min !== undefined) safeRule.min = rule.min;
                if (rule.max !== undefined) safeRule.max = rule.max;
                if (rule.pattern !== undefined) safeRule.pattern = rule.pattern;
                if (rule.len !== undefined) safeRule.len = rule.len;

                // 处理高级验证属性
                if (rule.validator !== undefined) safeRule.validator = rule.validator;
                if (rule.async !== undefined) safeRule.async = rule.async;
                if (rule.transform !== undefined) safeRule.transform = rule.transform;
                if (rule.type !== undefined) safeRule.type = rule.type;
                if (rule.validateTrigger !== undefined) safeRule.validateTrigger = rule.validateTrigger;
                if (rule.whitespace !== undefined) safeRule.whitespace = rule.whitespace;
                if (rule.warningOnly !== undefined) safeRule.warningOnly = rule.warningOnly;
                if (rule.enum !== undefined) safeRule.enum = rule.enum;

                safeRules.push(safeRule);
            });
        }


        // 安全处理组件属性
        const safeProps = {};
        if (field.props) {
            for (const key in field.props) {
                const value = field.props[key];
                // 对于上传属性，我们需要特殊处理，确保正确传递
                if (fieldType === 'upload') {
                    safeProps[key] = value; // 对于上传控件，传递所有属性，包括对象
                } else if (value === null || typeof value !== 'object') {
                    safeProps[key] = value;
                }
            }
        }

        // 处理特殊属性，确保可以正确传递复杂对象
        if (field.previewStyle) {
            console.log('BasicForm found previewStyle in field:', field.name, field.previewStyle); // 添加调试日志
            safeProps.previewStyle = field.previewStyle;
        }

        // 如果是上传控件，确保直接传递重要属性
        if (fieldType === 'upload') {
            // 直接复制这些关键属性
            if (field.acceptedFileTypes) safeProps.acceptedFileTypes = field.acceptedFileTypes;
            if (field.maxFileSize) safeProps.maxFileSize = field.maxFileSize;
            if (field.uploadDescription) safeProps.uploadDescription = field.uploadDescription;
            if (field.uploadSuccessMessage) safeProps.uploadSuccessMessage = field.uploadSuccessMessage;
            if (field.uploadFailMessage) safeProps.uploadFailMessage = field.uploadFailMessage;
            if (field.uploadErrorMessage) safeProps.uploadErrorMessage = field.uploadErrorMessage;
            if (field.dirKey) safeProps.dirKey = field.dirKey;
            if (field.uploadFn) safeProps.uploadFn = field.uploadFn;
            if (field.previewWidth) safeProps.previewWidth = field.previewWidth;
            if (field.previewHeight) safeProps.previewHeight = field.previewHeight;
        }

        // 处理字段值变化
        const handleFieldChange = (value) => {
            try {
                // 对值进行安全处理 - 但不直接设置表单值，让Ant Design的Form.Item自行处理
                let finalValue;

                // 对于switch类型，转换为简单的数字
                if (fieldType === 'switch') {
                    finalValue = value ? 1 : 0;
                }
                // 对于复杂对象，需要安全处理，避免循环引用
                else if (value !== null && typeof value === 'object') {
                    // 处理Moment对象 - date类型特殊处理
                    if (fieldType === 'date' || fieldType === 'datepicker') {
                        // 直接返回值，Form组件会处理date值
                        finalValue = value;
                    }
                    // 处理数组
                    else if (Array.isArray(value)) {
                        // 对于数组，创建新数组并过滤
                        finalValue = value.filter(item =>
                            item !== null && typeof item !== 'undefined'
                        );
                    }
                    // 其他对象
                    else {
                        // 对于常规对象，创建简单克隆
                        finalValue = { ...value };
                    }
                }
                // 简单值直接使用
                else {
                    finalValue = value;
                }

                // 调用父组件的处理函数 - 如果存在
                if (field.onChange) {
                    field.onChange(finalValue, form);
                }

                return finalValue;
            } catch (error) {
                // 出错时返回原始值
                return value;
            }
        };

        // 提取key属性和其他属性
        const { key, onChange: fieldOnChange, options, ...otherFieldProps } = field;

        // 创建FormItemRenderer的属性
        const restProps = {
            ...otherFieldProps,
            type: fieldType,
            name: fieldName,
            label: field.label,
            defaultValue,
            disabled,
            rules: safeRules,
            props: safeProps,
            options: options,
            onChange: (value) => {
                // 处理值变化
                const finalValue = handleFieldChange(value);

                // 调用原始字段的onChange
                if (fieldOnChange) {
                    fieldOnChange(finalValue, form);
                }

                return finalValue;
            }
        };

        // 使用FormItemRenderer组件，key属性单独传递
        const itemKey = field.key || `${fieldName}-${fieldType}`;
        return <FormItemRenderer form={form} key={itemKey} {...restProps} />;
    };

    // 渲染字段组
    const renderFields = () => {
        // 如果没有fields，返回null
        if (!cachedFields || cachedFields.length === 0) {
            return null;
        }

        // 创建字段元素
        return (
            <div className={styles.fieldGroupContainer}>
                <div>
                    {cachedFields.map((field, index) => {
                        // 如果没有名称，跳过
                        if (!field || !field.name) return null;

                        // 获取字段名，确定它应该占据多少列宽
                        const fieldName = field.name;
                        const isOneColumn = oneColumnKeys.includes(fieldName) || field.fullWidth;
                        const span = 24; // 每个表单项占据整行

                        // 该字段之前是否应该有分隔线
                        const showDivider = divider && field.divider && index > 0;

                        return (
                            <React.Fragment key={`field-${fieldName}`}>
                                {showDivider && (
                                    <Col span={24} className={styles.dividerCol}>
                                        <Divider orientation="left">{field.dividerText}</Divider>
                                    </Col>
                                )}
                                <Col span={span} className={styles.formCol}>
                                    {createControlWithValue(field)}
                                </Col>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 使用Ant Design表单组件
    return (
        <Form
            form={form}
            onValuesChange={handleFormValuesChange}
            onFinish={onFinish}
            initialValues={cachedInitialValues}
            name="common-editor-form-basic"
            layout={layout}
            className={styles.basicFormContainer}
            preserve
        >
            {renderFields()}
        </Form>
    );
};

export default BasicForm; 