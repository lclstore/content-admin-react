import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Form, Collapse, Button, Card, Space, Spin } from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    CaretRightOutlined,
    PlusOutlined,
    DeleteOutlined,
    DownOutlined,
    UpOutlined
} from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import styles from './style.module.css';
import { useFormState, useHeaderConfig } from './hooks';
import { renderFormItem, renderBasicForm, renderPanelFields } from './FormFields';
import dayjs from 'dayjs';
const { Panel } = Collapse;
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
        complexConfig = {} // 高级表单特定配置
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
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(['1']);
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
    const handleCollapseChange = useCallback((keys) => {
        setActiveCollapseKeys(keys);
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
    // 初始化表单数据
    useEffect(() => {
        const fetchData = async () => {
            let response = initialValues; // 初始化表单数据
            setLoading(true);
            response = await initFormData(id) || {};
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
                console.log(transformedData);
                const isNonZeroStatus = id && transformedData.status !== undefined && transformedData.status !== 0 && transformedData.status !== 2;
                headerButtons[0].disabled = isNonZeroStatus;
                const saveButton = headerButtons.find(button => button.key === 'save');
                saveButton.disabled = isNonZeroStatus && saveButton.disabled;
                headerContext.setButtons(headerButtons);
            }
            setLoading(false);
        };

        fetchData();
    }, [id, initFormData, fields, form, initialValues, config, setIsFormDirty]);

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
                            {panelItems.length > 0 ? (
                                <div className={styles.panelItemsContainer}>
                                    {panelItems.map((item, itemIndex) => {
                                        const isExpanded = expandedItems[`${panelIndex}-${itemIndex}`] !== false;

                                        return (
                                            <div
                                                key={`item-${panelIndex}-${itemIndex}`}
                                                className={`${styles.panelItem} ${isExpanded ? styles.expanded : ''}`}
                                            >
                                                <div
                                                    className={styles.itemHeader}
                                                    onClick={() => handleToggleExpandItem(`${panelIndex}-${itemIndex}`)}
                                                >
                                                    <span className={styles.itemTitle}>
                                                        {item.title || `Item ${itemIndex + 1}`}
                                                    </span>
                                                    <div className={styles.itemActions}>
                                                        {complexConfig.allowAddRemoveItems && (
                                                            <Button
                                                                size="small"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveItem(panelIndex, itemIndex);
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="link"
                                                            size="small"
                                                            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleExpandItem(`${panelIndex}-${itemIndex}`);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className={styles.itemContent}>
                                                        {renderPanelFields(
                                                            panel,
                                                            panelIndex,
                                                            item,
                                                            itemIndex,
                                                            {
                                                                form,
                                                                formConnected,
                                                                initialValues: transformedInitialValues,
                                                                mounted
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={styles.emptyPanel}>
                                    No items in this panel
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        );
    };
    const transformedInitialValues = {};
    console.log(transformedInitialValues);

    // 渲染基础表单内容
    const renderBasicContent = () => {
        return (
            <Form
                form={form}
                layout={config.layout || 'vertical'}
                onValuesChange={handleFormValuesChange}
                onFinish={headerButtons[0].onClick}
                // initialValues={transformedInitialValues}
                className={styles.basicFormContainer}
                size={config.size || 'middle'}
            >
                <div className={styles.fieldGroupContainer}>
                    {renderBasicForm(fields, {
                        form,
                        formConnected,
                        initialValues: transformedInitialValues,
                        oneColumnKeys: config.oneColumnKeys || [],
                        mounted
                    })}
                </div>
            </Form>
        );
    };

    // 渲染高级表单内容
    const renderAdvancedContent = () => {
        return (
            <Form
                form={form}
                layout={config.layout || 'vertical'}
                onValuesChange={handleFormValuesChange}
                onFinish={headerButtons[0].onClick}
                initialValues={transformedInitialValues}
                className={styles.advancedForm}
            >
                <Collapse
                    defaultActiveKey={activeCollapseKeys}
                    activeKey={activeCollapseKeys}
                    onChange={handleCollapseChange}
                    expandIcon={({ isActive }) => (
                        <CaretRightOutlined rotate={isActive ? 90 : 0} />
                    )}
                    className={styles.formCollapse}
                >
                    {complexConfig.showBasicPanel !== false && (
                        <Panel header="Basic Information" key="1" className={styles.formPanel}>
                            {renderBasicForm(complexConfig.basicFields || [], {
                                form,
                                formConnected,
                                initialValues: transformedInitialValues,
                                oneColumnKeys: config.oneColumnKeys || [],
                                mounted
                            })}
                        </Panel>
                    )}

                    {complexConfig.showStructurePanel !== false && complexConfig.includeStructurePanels && (
                        <Panel header="Structured Data" key="2" className={styles.formPanel}>
                            {renderStructurePanels()}
                        </Panel>
                    )}
                </Collapse>
            </Form>
        );
    };

    return (
        <Spin spinning={loading}>
            <div className={styles.commonEditorContainer}>
                {contextHolder}
                {formType === 'basic' ? renderBasicContent() : renderAdvancedContent()}
            </div>
        </Spin>
    );
}