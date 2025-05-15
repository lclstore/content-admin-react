import React, { useEffect, useMemo, Fragment } from 'react';
import { Collapse, Form, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ShrinkOutlined, ArrowsAltOutlined } from '@ant-design/icons';
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
 * @param {Object} props.selectedItemFromList 左侧列表添加item
 */
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
    console.log(122);


    // 添加新的collapse面板的回调函数
    const onAddCollapsePanel = () => {
        // 1. 创建新面板的数据结构
        const newPanelName = `custom-structure-${Date.now()}`; // 生成一个唯一的名称/key
        const newCustomPanel = {
            name: newPanelName,
            label: '新的自定义结构', // 新面板的默认标题
            icon: <PlusOutlined />, // 示例图标，你可以根据需要替换
            isCustom: true,         // 标记为自定义类型，与 item.isCustom 的面板类似
            fields: []              // 新面板初始时内部字段为空
        };

        // 2. 【重要】调用父组件传递的回调函数来添加新面板
        // CollapseForm 组件不能直接修改 'fields' prop。
        // 父组件需要提供一个函数 (例如 props.handleAddCustomPanel) 来处理 'fields' 状态的更新。
        //
        // 示例调用方式 (假设父组件传递了 handleAddCustomPanel prop):
        // if (props.handleAddCustomPanel) {
        //     props.handleAddCustomPanel(newCustomPanel);
        //     // 父组件在更新 fields 数组后，也应该负责更新 activeKeys 来自动展开这个新面板。
        //     // 例如，父组件可以调用 setActiveKeys([...currentActiveKeys, newPanelName]);
        //     // 或者，如果 activeKeys 由父组件完全控制，父组件应在其状态中添加 newPanelName。
        // } else {
        //     console.warn("CollapseForm: 'handleAddCustomPanel' prop is missing. Cannot add new panel dynamically.");
        //     alert("添加新面板的功能需要在父组件中通过 prop (例如 handleAddCustomPanel) 实现。");
        // }

        // 由于我们无法在此处直接调用父组件的 prop，以下代码仅为演示和提示：
        console.log("请求父组件添加新的自定义面板:", newCustomPanel);
        console.log("父组件需要实现一个回调函数 (例如 'handleAddCustomPanel') 来接收这个 newCustomPanel 对象，更新 'fields' 列表，并更新 'activeKeys' 以包含: ", newPanelName);
        // 提示用户，实际的添加和激活逻辑需要在父组件中处理。
        // alert("请在父组件中实现添加面板的逻辑，并通过prop传递给CollapseForm。新面板的数据已打印到控制台。父组件还应负责激活新面板。");
    };

    // 找到第一个自定义项的索引
    const firstCustomItemIndex = fields.findIndex(item => item.isCustom);
    // 检查是否有自定义项
    const hasCustomItems = firstCustomItemIndex !== -1;

    // 准备Structure头部
    const structureHeader = hasCustomItems ? (
        <div className={styles.structureSectionHeader} key="structure-header-section">
            <Typography.Title level={5} style={{ marginBottom: '0', fontWeight: '600', color: 'var(--primary-color)' }}>Structure</Typography.Title>
            <Button
                type="text"
                onClick={onAddCollapsePanel}
                icon={<PlusOutlined />}
                style={{ color: 'var(--primary-color)', padding: '0 4px', fontSize: '16px' }}
            >
                Add
            </Button>
        </div>
    ) : null;

    return (
        <div className={styles.collapseForm}>
            {fields.map((item, index) => (
                <Fragment key={`fragment-${item.name || index}`}>
                    {/* 在第一个自定义项之前显示Structure标题 */}
                    {index === firstCustomItemIndex && structureHeader}

                    {/* 渲染折叠面板项 */}
                    <Collapse
                        expandIcon={({ isActive }) => isActive ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                        destroyInactivePanel={false}
                        accordion={true}
                        activeKey={activeKeys}
                        onChange={onCollapseChange}
                        ghost
                        expandIconPosition="end"
                        className={`${styles.workoutDetailsCollapse} ${item.isCustom ? styles.structureCollapse : ''}`}
                        items={[{
                            key: item.name || `panel-${index}`,
                            label: (
                                <div className={styles.collapseHeader}>
                                    <span className={styles.collapseLeftIcon}>{item.icon}</span>
                                    <span>{item.label || item.title}</span>
                                </div>
                            ),
                            className: `${styles.collapsePanel} ${item.isCustom ? styles.structureItem : ''}`,
                            children: (
                                <div className={styles.collapsePanelContent}>
                                    {renderFieldGroup(item.fields || [])}
                                </div>
                            )
                        }]}
                    />
                </Fragment>
            ))}
        </div>
    );
};

export default CollapseForm;