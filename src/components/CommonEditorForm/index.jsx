import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Form, Collapse, Button, Card, Space, Spin } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,

} from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import styles from './style.module.css';
import { useFormState, useHeaderConfig } from './hooks';
import { renderBasicForm, renderPanelFields } from './FormFields';
import CommonList from './CommonList'; //左侧列表数据
import CollapseForm from './CollapseForm'; //右侧折叠表单
import dayjs from 'dayjs';
import { dateRangeKeys } from '@/constants/app';
/**
 * 通用编辑器组件
 * 支持简单表单和复杂表单，根据配置动态渲染
 * 
 * @param {Object} props 组件属性
 * @param {string} props.formType 表单类型: 'basic' 或 'advanced'
 * @param {Object} props.config 表单配置
 * @param {Array} props.fields 表单字段配置数组
 * @param {Object} props.initialValues 初始值
 * @param {Function} props.onSave 保存回调函数
 * @param {Function} props.validate 自定义验证函数
 * @param {Object} props.complexConfig 复杂表单特定配置
 * @param {Object} props.collapseFormConfig 折叠表单配置
 * @param {string} props.formName 表单名称
 * @param {Object} props.initFormData 初始化表单数据
 */
export default function CommonEditor(props) {
    const {
        formType = 'basic', // 默认为基础表单
        config = {},
        fields = [],
        initialValues = {},
        initFormData,
        onSave,
        validate,
        commonListConfig = {},
        complexConfig = {}, // 高级表单特定配置
        collapseFormConfig = {} // 折叠表单配置
    } = props;
    // 路由相关的钩子
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const [loading, setLoading] = useState(true);
    // 使用自定义钩子管理表单状态
    const {
        form,
        formConnected,
        isFormDirty,
        setIsFormDirty,
        formValues,
        messageApi,
        contextHolder,
        mounted,
        getLatestValues
    } = useFormState(initialValues);
    // 复杂表单特定状态
    const [structurePanels, setStructurePanels] = useState(
        complexConfig.structurePanels || []
    );
    // 初始化激活的折叠面板key - 使用第一个面板的name
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(() => {
        if (collapseFormConfig && collapseFormConfig.fields && collapseFormConfig.fields.length > 0) {
            // 使用第一个面板的name作为默认打开的面板
            return [collapseFormConfig.fields[0].name];
        }
        return [];
    });
    const [expandedItems, setExpandedItems] = useState({});

    // 获取HeaderContext
    const headerContext = useContext(HeaderContext);

    // 使用自定义钩子管理头部配置
    const { headerButtons } = useHeaderConfig({
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
        headerContext,
        setIsFormDirty,
        getLatestValues
    });
    // 判断是否是日期

    // 转换日期
    const transformDatesInObject = (obj = {}, fields = []) => {
        fields.forEach(field => {
            if (field.type === 'date' || field.type === 'dateRange') {
                obj[field.name] = dayjs(obj[field.name]);
                if (field.type === 'dateRange') {
                    // 如果是日期范围，则将日期范围转换为dayjs数组
                    const { keys = dateRangeKeys } = field;
                    obj[field.name] = [dayjs(obj[keys[0]]), dayjs(obj[keys[1]])];
                }
            }
        });
        return obj;
    }
    // 表单变更处理函数
    const handleFormValuesChange = (changedValues, allValues) => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }

        // 执行自定义表单变更处理器
        if (config.onFormChange) {
            config.onFormChange(changedValues, allValues, formConnected ? form : null);
        }
    };

    // 处理展开/折叠项目的函数
    const handleToggleExpandItem = useCallback((itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    }, []);

    // 处理折叠面板变更的函数
    const handleCollapseChange = useCallback((key) => {
        // 手风琴模式下，key是单个字符串而不是数组
        setActiveCollapseKeys(key ? [key] : []);
    }, []);

    // 处理添加项目的函数
    const handleAddItem = (panelIndex) => {
        const panel = structurePanels[panelIndex];
        if (!panel) return;

        const newItems = [...(panel.items || [])];
        const template = panel.itemTemplate || { title: `New Item ${newItems.length + 1}`, fields: [] };

        newItems.push({ ...template });

        const newPanels = [...structurePanels];
        newPanels[panelIndex] = { ...panel, items: newItems };

        // 更新面板状态
        setStructurePanels(newPanels);

        // 如果存在外部结构面板变更处理器，调用它
        if (complexConfig.onStructurePanelsChange) {
            complexConfig.onStructurePanelsChange(newPanels);
        }
    };

    // 处理移除项目的函数
    const handleRemoveItem = (panelIndex, itemIndex) => {
        const panel = structurePanels[panelIndex];
        if (!panel || !panel.items || !panel.items[itemIndex]) return;

        const newItems = [...panel.items];
        newItems.splice(itemIndex, 1);

        const newPanels = [...structurePanels];
        newPanels[panelIndex] = { ...panel, items: newItems };

        // 更新面板状态
        setStructurePanels(newPanels);

        // 如果存在外部结构面板变更处理器，调用它
        if (complexConfig.onStructurePanelsChange) {
            complexConfig.onStructurePanelsChange(newPanels);
        }
    };
    const fetchData = async () => {
        console.log('fetchData');

        let response = initialValues; // 初始化表单数据
        setLoading(true);
        // 如果id存在，则请求获取数据
        if (id) {
            response = await initFormData(id) || {};
        }
        const transformedData = transformDatesInObject(response, fields); // 转换日期
        form.setFieldsValue(transformedData);

        // 确保表单值更新后，设置表单状态为"未修改"
        setIsFormDirty(false);

        // 在这里可以添加一个回调函数通知其他组件数据已加载完成
        if (config.onDataLoaded) {
            config.onDataLoaded(transformedData);
        }
        // 设置头部按钮: 如果id存在，且status不为0，则禁用保存按钮 或者表单内容没修改时禁用按钮
        if (headerContext.setButtons) {
            const isNonZeroStatus = id && transformedData.status !== undefined && transformedData.status !== 0 && transformedData.status !== 2;
            headerButtons[0].disabled = isNonZeroStatus;
            const saveButton = headerButtons.find(button => button.key === 'save');
            saveButton.disabled = isNonZeroStatus && saveButton.disabled;
            headerContext.setButtons(headerButtons);
        }
        setLoading(false);
    };
    // 初始化表单数据
    useEffect(() => {


        fetchData();
    }, [id]);

    // 设置页面标题和头部按钮
    useEffect(() => {
        if (headerContext.setCustomPageTitle) {
            // 设置自定义页面标题
            const formName = config.formName || '';
            const pageTitle = id ? `Edit ${formName}` : `Add ${formName}`;
            headerContext.setCustomPageTitle(pageTitle);
        }


    }, [
        config.formName,
        id,
        headerButtons,
        headerContext.setButtons,
        headerContext.setCustomPageTitle
    ]);

    // 渲染结构面板
    const renderStructurePanels = () => {
        if (!complexConfig.includeStructurePanels || !structurePanels || structurePanels.length === 0) {
            return null;
        }

        return (
            <div className={styles.structurePanelsContainer}>
                {structurePanels.map((panel, panelIndex) => {
                    const panelItems = panel.items || [];

                    return (
                        <Card
                            key={`panel-${panelIndex}`}
                            title={panel.title}
                            className={styles.structurePanel}
                            extra={
                                <Space>
                                    {complexConfig.allowAddRemoveItems && (
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => handleAddItem(panelIndex)}
                                        >
                                            Add Item
                                        </Button>
                                    )}
                                </Space>
                            }
                        >
                            {panelItems.map((item, itemIndex) => (
                                <div key={`item-${panelIndex}-${itemIndex}`}>
                                    <div className={styles.itemHeader}>
                                        <h4>{item.title || `Item ${itemIndex + 1}`}</h4>
                                        {complexConfig.allowAddRemoveItems && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveItem(panelIndex, itemIndex)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <div className={styles.itemFields}>
                                        {renderPanelFields(panel, panelIndex, item, itemIndex, {
                                            form,
                                            formConnected,
                                            initialValues,
                                            mounted
                                        })}
                                    </div>
                                </div>
                            ))}
                        </Card>
                    );
                })}
            </div>
        );
    };

    // 渲染基础表单
    const renderBasicContent = () => {
        return (
            <div className={styles.basicEditorForm}>
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        name={config.formName || 'basicForm'}
                        layout={config.layout || 'vertical'}
                        onValuesChange={handleFormValuesChange}
                        onFinish={headerButtons[0].onClick}
                        initialValues={initialValues}
                        className={styles.form}
                    >
                        {renderBasicForm(fields, {
                            form,
                            formConnected,
                            initialValues,
                            oneColumnKeys: config.oneColumnKeys || [],
                            mounted
                        })}
                    </Form>
                </Spin>
            </div>
        );
    };

    // 渲染高级表单
    const renderAdvancedContent = () => {
        return (
            <div className={styles.advancedFormContent}>
                {/* 渲染左侧列表 */}
                <CommonList {...commonListConfig} />
                {/* 渲染右侧表单 */}
                <div className={`${styles.advancedEditorForm}`}>
                    <Form
                        form={form}
                        name={config.formName || 'advancedForm'}
                        layout={config.layout || 'vertical'}
                        onValuesChange={handleFormValuesChange}
                        onFinish={headerButtons[0].onClick}
                        initialValues={initialValues}
                        className={styles.form}
                    >
                        {/* 如果提供了折叠表单配置，则渲染CollapseForm组件 */}
                        {collapseFormConfig && Object.keys(collapseFormConfig).length > 0 && (
                            <CollapseForm
                                fields={collapseFormConfig.fields || []}
                                form={form}
                                initialValues={initialValues}
                                activeKeys={activeCollapseKeys}
                                onCollapseChange={handleCollapseChange}
                                isCollapse={collapseFormConfig.isCollapse !== false}
                            />
                        )}

                        {/* 如果配置了结构面板，则渲染结构面板 */}
                        {complexConfig.includeStructurePanels && renderStructurePanels()}
                    </Form>
                </div>
            </div>
        );
    };

    return (
        <div className={`${styles.commonEditorContainer} ${formType === 'basic' ? styles.basicEditorContainer : styles.advancedEditorContainer}`}>
            {contextHolder}
            {formType === 'basic' ? renderBasicContent() : renderAdvancedContent()}
        </div>
    );
}