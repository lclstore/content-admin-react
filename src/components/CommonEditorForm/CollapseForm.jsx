import React, { useMemo } from 'react';
import { Collapse, Form } from 'antd';
import { renderFormControl, processValidationRules } from './FormFields';
import styles from './CollapseForm.module.css';

/**
 * 折叠表单组件
 * 根据formFields配置动态渲染表单项
 * @param {Object} props 组件属性
 * @param {Array} props.fields 表单字段配置数组
 * @param {Object} props.form 表单实例
 * @param {Object} props.initialValues 初始值
 * @param {Array} props.activeKeys 当前激活的面板keys
 * @param {Function} props.onCollapseChange 折叠面板变化回调
 */
const CollapseForm = ({
    fields = [],
    form,
    initialValues = {},
    activeKeys = [],
    onCollapseChange,
    isCollapse = true
}) => {
    // 表单连接状态
    const formConnected = !!form;

    // 挂载状态引用
    const mounted = useMemo(() => ({ current: true }), []);

    // 渲染单个表单字段
    const renderField = (field) => {
        // 针对字段中声明的校验规则进行处理
        const rules = field.rules || [];

        // 构建表单项属性 - 不包含key
        const formItemProps = {
            name: field.name,
            label: field.label,
            rules: rules,
            labelCol: field.labelCol,
            wrapperCol: field.wrapperCol,
            className: `${styles.formItem} ${field.className || ''}`,
            hidden: field.hidden,
            valuePropName: field.type === 'switch' ? 'checked' : 'value',
        };
        // 处理每个子项的验证规则
        const itemRules = processValidationRules(field.rules || [], {
            required: field.required,
            label: field.label,
            type: field.type,
            requiredMessage: field.requiredMessage
        });

        // 渲染表单项 - key直接作为属性传递
        return (
            <Form.Item name={field.name}
                label={field.label}
                required={field.required}
                rules={itemRules} >
                {renderFormControl(field, {
                    form,
                    formConnected,
                    initialValues,
                    mounted
                })}
            </Form.Item>
        );
    };
    /**
     * 统一处理表单验证规则
     * @param {Array} rules 原始规则数组
     * @param {Boolean} required 是否必填
     * @param {String} label 字段标签
     * @param {String} type 字段类型
     * @param {String} requiredMessage 自定义必填消息
     * @returns {Array} 处理后的规则数组
     */

    // 渲染表单字段组
    const renderFieldGroup = (fieldGroup) => {
        // 确保每个field都有name作为key，如果没有name则使用索引
        return fieldGroup.map((field, index) => {
            // 使用field.name作为key，如果没有name属性则使用索引
            const key = field.name || `field-${index}`;
            return renderField({ ...field, key });
        });
    };

    // 如果没有字段配置或为空数组，则不渲染
    if (!fields || fields.length === 0) {
        return null;
    }

    // 创建Collapse的items配置
    // 根据Editor.jsx中的配置，使用name作为key
    const collapseItems = fields.map((item, index) => ({
        // 使用name属性作为key，如果没有则使用索引
        key: item.name || `panel-${index}`,
        label: (
            <div className={styles.collapseHeader}>
                <span className={styles.collapseLeftIcon}>{item.icon}</span>
                <span>{item.label || item.title}</span>
            </div>
        ),
        children: (
            <div className={styles.collapsePanelContent}>
                {renderFieldGroup(item.fields || [])}
            </div>
        ),
        className: styles.collapsePanel
    }));

    // 手风琴模式下，activeKey需要是单个值，而不是数组
    // 从activeKeys数组中取第一个值
    const activeKey = activeKeys && activeKeys.length > 0 ? activeKeys[0] : undefined;

    return (
        <div className={styles.collapseForm}>
            <Collapse
                accordion={true} // 设置为手风琴模式，只允许同时打开一个面板
                activeKey={activeKey} // 手风琴模式下使用单个值
                onChange={onCollapseChange} // 父组件处理change事件
                ghost
                expandIconPosition="end"
                className={styles.workoutDetailsCollapse}
                items={collapseItems}
            />
        </div>
    );
};

export default CollapseForm;