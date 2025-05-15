import React, { useMemo, useEffect } from 'react';
import { Collapse, Form, Button } from 'antd';
import { PlusOutlined, ShrinkOutlined, ArrowsAltOutlined } from '@ant-design/icons';
import styles from './CollapseForm.module.css';

const CollapseForm = ({
    fields = [],
    form,
    selectedItemFromList = null,
    initialValues = {},
    activeKeys = [],
    onCollapseChange,
    setActiveKeys,
    isCollapse = true
}) => {
    // 表单连接状态
    const formConnected = !!form;
    // 挂载状态引用
    const mounted = useMemo(() => ({ current: true }), []);
    // 接收左侧列表添加item数据
    useEffect(() => {
        console.log('selectedItemFromList', selectedItemFromList);
    }, [selectedItemFromList]);
    // 渲染单个表单字段
    const renderField = (field) => {
        // 针对字段中声明的校验规则进行处理
        // 处理每个子项的验证规则
        const itemRules = processValidationRules(field.rules || [], {
            required: field.required,
            label: field.label,
            type: field.type,
            requiredMessage: field.requiredMessage
        });

        // 渲染表单项 - key直接作为属性传递
        return (
            <Form.Item
                name={field.name}
                rules={itemRules}
                className={styles.formItem}
                required={field.required}
                key={field.name}
                label={field.label}

            >
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
            return renderField({ ...field });
        });
    };

    // 如果没有字段配置或为空数组，则不渲染
    if (!fields || fields.length === 0) {
        return null;
    }

    // 添加新的collapse面板的回调函数
    const onAddCollapsePanel = () => {
        console.log('onAddStructurePanel');
    }

    // 用于存储将要渲染的JSX元素，包括面板和自定义结构头部
    const elementsToRender = [];
    let structureHeaderRendered = false; // 标记自定义结构头部是否已渲染

    // 遍历字段配置，生成面板和自定义结构头部
    fields.forEach((item, index) => {
        // 如果当前项是自定义项，并且自定义结构头部尚未渲染，则在此处插入头部
        if (item.isCustom && !structureHeaderRendered) {
            elementsToRender.push(
                <div className="structure-section-header" key="structure-header-section">
                    <div>Structure</div>
                    <Button
                        type="text"
                        onClick={onAddCollapsePanel}
                        icon={<PlusOutlined />}
                        style={{ color: 'var(--primary-color)', padding: '0 4px', fontSize: '16px' }}
                    >
                        Add
                    </Button>
                </div>
            );
            structureHeaderRendered = true; // 标记已渲染
        }

        // 渲染当前字段配置对应的Collapse.Panel
        elementsToRender.push(
            <Collapse.Panel
                key={item.name || `panel-${index}`} // 使用name属性作为key，如果没有则使用索引
                header={( // 面板头部
                    <div className={styles.collapseHeader}>
                        <span className={styles.collapseLeftIcon}>{item.icon}</span>
                        <span>{item.label || item.title}</span>
                    </div>
                )}
                className={styles.collapsePanel}
            >
                {/* 面板内容 */}
                <div className={styles.collapsePanelContent}>
                    {renderFieldGroup(item.fields || [])}
                </div>
            </Collapse.Panel>
        );
    });

    return (
        <div className={styles.collapseForm}>
            <Collapse
                expandIcon={({ isActive }) => isActive ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                destroyInactivePanel={false}
                accordion={true} // 设置为手风琴模式，只允许同时打开一个面板
                activeKey={activeKeys} // 手风琴模式下使用单个值
                onChange={onCollapseChange} // 父组件处理change事件
                ghost
                expandIconPosition="end"
                className={styles.workoutDetailsCollapse}
            >
                {elementsToRender /* 直接渲染生成的元素列表 */}
            </Collapse>
        </div>
    );
};

export default CollapseForm; 