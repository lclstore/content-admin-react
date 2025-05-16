import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Form, Button, Card, Space, Spin } from 'antd';
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
        collapseFormConfig = {

        } // 折叠表单配置
    } = props;
    if (!collapseFormConfig.setActiveKey) {
        collapseFormConfig.setActiveKey = (key) => {

            setActiveCollapseKeys(key ? [key] : []);
        }
    }
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
        collapseFormConfig,
        commonListConfig,
        structurePanels,
        headerContext,
        setIsFormDirty,
        getLatestValues
    });
    // 判断是否是日期
    const [selectedItemFromList, setSelectedItemFromList] = useState(null); // 左侧列表添加item
    // 左侧列表添加item
    const handleCommonListItemAdd = (item) => {
        setSelectedItemFromList(item); // 更新 CommonEditor 中的状态

        // 如果 CommonList 配置中提供了 onSelectItem 回调，则调用它
        if (commonListConfig.onSelectItem && typeof commonListConfig.onSelectItem === 'function') {
            commonListConfig.onSelectItem(item);
        }
    };
    // 转换日期
    const transformDatesInObject = (obj = {}, fields = []) => {
        console.log(obj);
        fields.forEach(field => {
            if (field.type === 'date' || field.type === 'dateRange') {
                obj[field.name] = obj[field.name] ? dayjs(obj[field.name]) : null;
                if (field.type === 'dateRange') {
                    // 如果是日期范围，则将日期范围转换为dayjs数组
                    const { keys = dateRangeKeys } = field;
                    obj[field.name] = [obj[keys[0]] ? dayjs(obj[keys[0]]) : null, obj[keys[1]] ? dayjs(obj[keys[1]]) : null];
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
            const pageTitle = config.title ?? `${id ? 'Edit' : 'Add'} ${config.formName}`;
            headerContext.setCustomPageTitle(pageTitle);
        }


    }, [
        config.formName,
        id,
        headerButtons,
        headerContext.setButtons,
        headerContext.setCustomPageTitle
    ]);

    // 从 collapseFormConfig 中获取 activeKeys, onCollapseChange, 和 handleAddCustomPanel
    const {
        fields: collapseFields, // 从配置中获取字段
        initialValues: collapseInitialValues, // 从配置中获取初始值
        activeKeys: configActiveKeys, // 从父组件接收 activeKeys
        onCollapseChange: configOnCollapseChange, // 从父组件接收 onCollapseChange
        handleAddCustomPanel: configHandleAddCustomPanel, // 从父组件接收 handleAddCustomPanel
        handleDeletePanel: configHandleDeletePanel,
        // 选中项和回调函数
        selectedItemFromList: configSelectedItemFromList,
        onItemAdded: configOnItemAdded,
        onSelectedItemProcessed: configOnSelectedItemProcessed,
        // 添加拖拽排序相关的回调
        onSortItems: configOnSortItems,
        onDeleteItem: configOnDeleteItem,
        onCopyItem: configOnCopyItem,
        onReplaceItem: configOnReplaceItem
    } = collapseFormConfig;

    // 当 collapseFormConfig 变化时更新依赖的状态
    const [extractedConfig, setExtractedConfig] = useState({
        collapseFields,
        collapseInitialValues,
        configActiveKeys,
        configOnCollapseChange,
        configHandleAddCustomPanel,
        configHandleDeletePanel,
        // 新增提取的配置
        configSelectedItemFromList,
        configOnItemAdded,
        configOnSelectedItemProcessed,
        // 添加拖拽排序相关的回调
        configOnSortItems,
        configOnDeleteItem,
        configOnCopyItem,
        configOnReplaceItem
    });

    // 当 collapseFormConfig 变化时更新
    useEffect(() => {
        setExtractedConfig({
            collapseFields: collapseFormConfig.fields,
            collapseInitialValues: collapseFormConfig.initialValues,
            configActiveKeys: collapseFormConfig.activeKeys,
            configOnCollapseChange: collapseFormConfig.onCollapseChange,
            configHandleAddCustomPanel: collapseFormConfig.handleAddCustomPanel,
            configHandleDeletePanel: collapseFormConfig.handleDeletePanel,
            // 新增提取的配置
            configSelectedItemFromList: collapseFormConfig.selectedItemFromList,
            configOnItemAdded: collapseFormConfig.onItemAdded,
            configOnSelectedItemProcessed: collapseFormConfig.onSelectedItemProcessed,
            // 添加拖拽排序相关的回调
            configOnSortItems: collapseFormConfig.onSortItems,
            configOnDeleteItem: collapseFormConfig.onDeleteItem,
            configOnCopyItem: collapseFormConfig.onCopyItem,
            configOnReplaceItem: collapseFormConfig.onReplaceItem
        });
    }, [collapseFormConfig]);

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
                        onFinish={headerButtons.find(button => button.key === 'save')?.onClick}
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
        console.log('collapseFormConfig');

        // 使用最新的提取配置
        const {
            collapseFields: fields,
            collapseInitialValues: initValues,
            configActiveKeys: activeKeys,
            configOnCollapseChange: onCollapseChange,
            configHandleAddCustomPanel: handleAddCustomPanel,
            configHandleDeletePanel: handleDeletePanel,
            // 新增从提取配置中获取选中项和回调函数
            configSelectedItemFromList: externalSelectedItem,
            configOnItemAdded: onItemAdded,
            configOnSelectedItemProcessed: onSelectedItemProcessed,
            // 添加拖拽排序相关的回调
            configOnSortItems: onSortItems,
            configOnDeleteItem: onDeleteItem,
            configOnCopyItem: onCopyItem,
            configOnReplaceItem: onReplaceItem
        } = extractedConfig;

        // 优先使用外部传入的选中项，否则使用内部状态
        const effectiveSelectedItem = externalSelectedItem !== undefined ? externalSelectedItem : selectedItemFromList;

        // 选中项处理完成的回调处理函数
        const handleSelectedItemProcessed = () => {
            // 如果提供了外部回调，则调用它
            if (onSelectedItemProcessed && typeof onSelectedItemProcessed === 'function') {
                onSelectedItemProcessed();
            }
            // 同时清空内部状态
            setSelectedItemFromList(null);
        };

        return (
            <div className={styles.advancedFormContent}>
                {/* 渲染左侧列表 */}
                <CommonList
                    {...commonListConfig}
                    onAddItem={handleCommonListItemAdd}
                />
                {/* 渲染右侧表单 */}
                <div className={`${styles.advancedEditorForm}`}>
                    <Form
                        form={form}
                        name={config.formName || 'advancedForm'}
                        layout={config.layout || 'vertical'}
                        onValuesChange={handleFormValuesChange}
                        onFinish={headerButtons.find(button => button.key === 'save')?.onClick}
                        initialValues={initialValues}
                        className={styles.form}
                    >
                        {/* 如果提供了折叠表单配置，则渲染CollapseForm组件 */}
                        {collapseFormConfig && Object.keys(collapseFormConfig).length > 0 && (
                            <CollapseForm
                                fields={fields || collapseFormConfig.fields || []}
                                form={form}
                                selectedItemFromList={effectiveSelectedItem}
                                initialValues={initValues || initialValues}
                                // activeKeys={activeKeys !== undefined ? activeKeys : activeCollapseKeys}
                                activeKeys={activeCollapseKeys}
                                onCollapseChange={handleCollapseChange}
                                handleAddCustomPanel={handleAddCustomPanel}
                                handleDeletePanel={handleDeletePanel}
                                isCollapse={collapseFormConfig.isCollapse !== false}
                                // 添加回调函数
                                onItemAdded={onItemAdded}
                                onSelectedItemProcessed={handleSelectedItemProcessed}
                                // 添加排序相关的回调函数
                                onSortItems={onSortItems}
                                onDeleteItem={onDeleteItem}
                                onCopyItem={onCopyItem}
                                onReplaceItem={onReplaceItem}
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