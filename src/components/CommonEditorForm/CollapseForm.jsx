import React, { useEffect, useMemo, Fragment, useState } from 'react';
import { Collapse, Form, Button, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
 * @param {Function} props.setActiveKeys 设置激活面板的函数
 * @param {boolean} props.isCollapse 是否可折叠
 * @param {Function} props.handleAddCustomPanel 添加自定义面板的回调函数
 * @param {Function} props.handleDeletePanel 删除面板的回调函数
 */
const CollapseForm = ({
    fields = [],
    form,
    selectedItemFromList = null,
    initialValues = {},
    activeKeys = [],
    onCollapseChange,
    setActiveKeys,
    isCollapse = true,
    handleAddCustomPanel,
    handleDeletePanel
}) => {
    const newField = fields.find(item => item.isShowAdd);
    const [dataList, setDataList] = useState([newField]);//datalist
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
        console.log(field);

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
    //  添加新的collapse面板的表单验证
    const validateFields = (fieldGroup) => {
        if (!fieldGroup || !Array.isArray(fieldGroup.fields) || fieldGroup.fields.length === 0) {
            return true;
        }

        const formValues = form.getFieldsValue();

        const hasInvalidField = fieldGroup.fields.some(field => {
            return field.required && !formValues[field.name];
        });

        if (hasInvalidField) {
            // 展开字段所在的面板
            onCollapseChange(fieldGroup.name);

            // 等待面板展开再校验
            requestAnimationFrame(() => {
                form.validateFields();
            });

            return false;
        }

        return true;
    };

    // 添加新的collapse面板的回调函数
    const onAddCollapsePanel = () => {
        const currentFields = dataList[dataList.length - 1];//最后一个折叠面板数据
        let valid = validateFields(currentFields);//验证当前折叠面板数据是否填写
        if (!valid) return;
        // notification.warning({
        //     message: `Cannot Add New ${currentFields.label}`,
        //     description: `Please add exercises to the current last ${currentFields.label} before adding a new one.`,
        //     placement: 'topRight',
        // });
        // 创建新面板的数据结构
        const newPanelName = `${newField.name}${dataList.length}`; // 生成一个唯一的名称/key
        const newCustomPanel = {
            ...newField,
            name: newPanelName,
            isShowAdd: true,
        };

        // 调用父组件传递的回调函数来添加新面板
        if (handleAddCustomPanel) {
            // 添加面板到父组件的 formFields
            handleAddCustomPanel(newCustomPanel);
            onCollapseChange([newPanelName]);

            // 本地状态更新，用于计数
            setDataList([...dataList, newCustomPanel]);
        }
    };

    // 找到第一个自定义项的索引
    const firstCustomItemIndex = fields.findIndex(item => item.isShowAdd);
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

    // 处理删除面板
    const onDeletePanel = (e, panelName) => {
        e.stopPropagation(); // 阻止事件冒泡，避免触发折叠面板的展开/收起
        if (handleDeletePanel) {
            handleDeletePanel(panelName);
            setDataList(dataList.filter((item) => item.name !== panelName));

        }
    };

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
                        className={`${styles.workoutDetailsCollapse} ${item.isShowAdd ? styles.structureCollapse : ''}`}
                        items={[{
                            key: item.name || `panel-${index}`,
                            label: (
                                <div className={styles.collapseHeader}>
                                    <span>{item.label || item.title}</span>
                                    {dataList.length > 1 && item.isShowAdd && (
                                        <DeleteOutlined
                                            className={styles.deleteIcon}
                                            onClick={(e) => onDeletePanel(e, item.name)}
                                        />
                                    )}
                                </div>
                            ),
                            className: `${styles.collapsePanel} ${item.isShowAdd ? styles.structureItem : ''}`,
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