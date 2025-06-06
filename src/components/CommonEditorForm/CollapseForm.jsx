import React, { useEffect, useMemo, Fragment, useState, useCallback } from 'react';
import { Collapse, Form, Button, Typography, List, Avatar, Space, Row, Col, notification, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, MenuOutlined, RetweetOutlined, CopyOutlined, CaretRightOutlined } from '@ant-design/icons';
import { ShrinkOutlined, ArrowsAltOutlined } from '@ant-design/icons';
import { renderFormControl, processValidationRules, renderFormItem } from './FormFields';
import CommonList from './CommonList';
import { optionsConstants } from '@/constants';
import styles from './CollapseForm.module.css';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const { Text } = Typography;

// --- 可排序项渲染器组件 ---
const SortableItemRenderer = React.memo(({ panelId, item, itemIndex, isExpanded, toggleExpandItem, onOpenReplaceModal, renderItemMata, onCopyItem, onDeleteItem, onUpdateItem }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useSortable({
        id: `${panelId}-item-${itemIndex}`, // 使用面板ID和项目索引组合作为唯一标识符
        data: {
            type: 'item',
            item,
            panelId,
            itemIndex
        }
    });

    // Row（可拖拽元素）的样式
    const rowStyle = {
        transform: CSS.Transform.toString(transform),
    };

    // 外层 wrapper 的样式 (视觉效果，例如透明度)
    const wrapperStyle = {
        opacity: isDragging ? 0.5 : 1,
        // 内联样式移至 CSS 文件
    };

    // 为拖拽中的元素添加样式类（去掉动画）
    const wrapperClassName = `structure-list-item item-wrapper ${isExpanded ? 'expanded' : ''}`;

    // 格式化持续时间或次数用于显示
    const durationSeconds = item.duration || 0;
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    // 默认的列表项渲染函数
    const defaultRenderItemMeta = useCallback((item) => {
        return <List.Item.Meta
            style={{
                display: 'flex',
                alignItems: 'center',
            }}
            avatar={
                <div className={styles.itemAvatar}>
                    <Avatar shape="square" size={64} src={item.imageUrl || item.animationPhoneUrl} />
                    <CaretRightOutlined
                        className={styles.playIcon}
                    />
                </div>
            }
            title={<Text ellipsis={{ tooltip: item.displayName || item.title }}>{item.displayName || item.title || '未命名项目'}</Text>}
            description={
                <div>
                    <div>
                        <Text
                            type="secondary"
                            style={{ fontSize: '12px' }}
                            ellipsis={{ tooltip: item.status }}
                        >
                            {optionsConstants.statusList.find(status => status.value === item.status)?.name || '-'}
                        </Text>
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: item.functionType || item.type }}>
                            {item.functionType || item.type || '-'}
                        </Text>
                    </div>
                </div>
            }
        />
    }, []);

    return (
        // 外层 wrapper 控制透明度/边距
        <div style={wrapperStyle} className={wrapperClassName}>
            {/* Row 同时处理拖拽监听和点击切换 */}
            <Row
                ref={setNodeRef}
                style={rowStyle}
                {...attributes}
                {...listeners}
                wrap={false}
                align="middle"
                className="sortable-item-row" // 添加类名以便在 CSS 中定位
                onClick={() => toggleExpandItem && toggleExpandItem(panelId, item.id)} // Row 点击切换展开
            >
                <Col flex="auto">
                    {renderItemMata ? renderItemMata(item) : defaultRenderItemMeta(item)}
                </Col>
                <Col flex="none">
                    <Space className="structure-item-actions">
                        {/* 1. 展开/折叠按钮 */}
                        {/* <Button
                            key="expand"
                            type="text"
                            icon={isExpanded ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                            onClick={(e) => {
                                e.stopPropagation(); // 阻止事件冒泡
                                toggleExpandItem && toggleExpandItem(panelId, item.id); // 动作：切换展开
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                            title={isExpanded ? "Collapse" : "Expand"}
                        /> */}
                        {/* 2. 替换按钮 */}
                        {onOpenReplaceModal && (
                            <Button
                                key="replace"
                                type="text"
                                icon={<RetweetOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onOpenReplaceModal(panelId, item.id, itemIndex); // 添加索引参数
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Replace"
                            />
                        )}
                        {/* 3. 复制按钮 */}
                        {onCopyItem && (
                            <Button
                                key="copy"
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onCopyItem(panelId, item.id); // 动作：复制项
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Copy"
                            />
                        )}
                        {/* 4. 删除按钮 */}
                        {onDeleteItem && (
                            <Button
                                key="delete"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onDeleteItem(panelId, itemIndex); // 修改：传递索引而不是ID
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Delete"
                            />
                        )}
                        {/* 5. 排序/拖拽句柄按钮 */}
                        <Button
                            key="sort"
                            type="text"
                            icon={<MenuOutlined />}
                            className="sort-handle" // 使用类名代替内联样式
                            onClick={(e) => e.stopPropagation()} // 阻止 Row 的 onClick
                            title="Sort"
                        />
                    </Space>
                </Col>
            </Row>
            {/* 这里可以添加展开内容 */}
        </div>
    );
});

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
 * @param {Function} props.onItemAdded 添加项后的回调函数，用于清空选中状态
 * @param {Function} props.onSelectedItemProcessed 处理完选中项后的回调函数，用于清空选中状态
 * @param {Function} props.onSortItems 处理排序的回调函数
 * @param {Function} props.onDeleteItem 处理删除项的回调函数
 * @param {Function} props.onUpdateItem 处理更新项的回调函数
 * @param {Function} props.onCopyItem 处理复制项的回调函数
 * @param {Function} props.onReplaceItem 处理替换项的回调函数
 * @param {Component} props.commonListConfig 替换弹框中显示的commonListConfig组件
 * @param {String} props.moduleKey 模块key
 */
const CollapseForm = ({
    fields = [],
    form,
    moduleKey,
    renderItemMata,
    commonListConfig = {},
    selectedItemFromList = null,
    initialValues = {},
    activeKeys = [],
    onCollapseChange,
    setActiveKeys,
    isCollapse = true,
    handleAddCustomPanel,
    handleDeletePanel,
    onItemAdded,
    onSelectedItemProcessed,
    // 添加新的回调函数
    onSortItems,
    onDeleteItem,
    onUpdateItem,
    onCopyItem,
    onReplaceItem,
}) => {
    const newField = fields.find(item => item.isShowAdd);
    // 表单连接状态
    const formConnected = !!form;
    // 挂载状态引用
    const mounted = useMemo(() => ({ current: true }), []);
    // 添加展开项的状态
    const [expandedItems, setExpandedItems] = useState({});
    // 添加替换弹框状态
    const [replaceModalVisible, setReplaceModalVisible] = useState(false);
    // 当前选中的panel和item id
    const [currentReplaceItem, setCurrentReplaceItem] = useState({
        panelId: null,
        itemId: null
    });
    // 新增：在替换弹框中临时选中的项
    const [tempSelectedItem, setTempSelectedItem] = useState(null);

    // 处理展开/折叠项目的函数
    const toggleExpandItem = useCallback((panelId, itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [panelId]: prev[panelId] === itemId ? null : itemId // 切换展开状态
        }));
    }, []);

    // 处理删除项目
    const handleDeleteItem = useCallback((panelId, itemId) => {
        if (onDeleteItem) {
            onDeleteItem(panelId, itemId);
        }
    }, [onDeleteItem]);

    // 递归查找目标项并复制
    const findAndCopyItemInFields = (field, itemId) => {
        let found = false;
        let result = field;

        // 如果当前字段有 dataList，查找目标项
        if (field.dataList !== undefined && Array.isArray(field.dataList)) {
            const targetItem = field.dataList.find(item => item.id === itemId);
            if (targetItem) {
                // 找到目标项，创建副本
                const newItem = {
                    ...targetItem,
                    id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
                };
                result = {
                    ...field,
                    dataList: [...field.dataList, newItem]
                };
                found = true;
            }
        }

        // 如果在当前层级没找到，且有子字段，继续递归查找
        if (!found && field.fields) {
            const updatedFields = field.fields.map(subField => {
                const { found: subFound, result: subResult } = findAndCopyItemInFields(subField, itemId);
                if (subFound) {
                    found = true;
                }
                return subResult;
            });
            result = {
                ...field,
                fields: updatedFields
            };
        }

        return { found, result };
    };

    // 处理复制项目
    const handleCopyItem = useCallback((panelId, itemId) => {
        // 更新所有字段
        const updatedFields = fields.map(field => {
            const { result } = findAndCopyItemInFields(field, itemId);
            return result;
        });

        // 更新表单数据
        if (form) {
            const formValues = form.getFieldsValue();
            form.setFieldsValue(formValues);
        }

        // 如果提供了 onCopyItem 回调，调用它
        if (onCopyItem) {
            onCopyItem(panelId, itemId);
        }
    }, [fields, form, onCopyItem]);

    // 处理替换项目
    const handleOpenReplaceModal = useCallback((panelId, itemId, itemIndex) => {
        // 保存当前选中的panel、item id和索引
        setCurrentReplaceItem({
            panelId,
            itemId,
            itemIndex  // 保存项目索引
        });
        // 初始化临时选中项为当前项ID
        setTempSelectedItem({ id: itemId });
        // 打开替换弹框
        setReplaceModalVisible(true);
    }, []);

    // 处理CommonList中选中项变更
    const handleCommonListItemSelect = useCallback((selectedItem) => {
        // 更新临时选中的项
        setTempSelectedItem(selectedItem);
    }, []);

    // 处理替换项目选中后的回调
    const handleReplaceItemSelected = useCallback(() => {
        // 确保所有必要的参数都存在
        if (!onReplaceItem || !currentReplaceItem.panelId || !currentReplaceItem.itemId || !tempSelectedItem) {
            console.warn('替换操作缺少必要参数', { currentReplaceItem, tempSelectedItem });
            return;
        }

        // 只有当选中项不是当前项时才执行替换
        if (tempSelectedItem.id !== currentReplaceItem.itemId) {
            const panelId = currentReplaceItem.panelId;     // 面板ID
            const oldItemId = currentReplaceItem.itemId;    // 旧项目ID
            const newItemId = tempSelectedItem.id;          // 新项目ID
            const newItem = tempSelectedItem;               // 新项目完整数据
            const itemIndex = currentReplaceItem.itemIndex; // 项目索引

            // 执行替换操作，传递面板ID、当前旧项目ID、新项目ID、新项目完整数据和项目索引
            onReplaceItem(panelId, oldItemId, newItemId, newItem, itemIndex);
        }

        // 关闭弹框
        setReplaceModalVisible(false);

        // 清除临时选中项
        setTempSelectedItem(null);
    }, [onReplaceItem, currentReplaceItem, tempSelectedItem]);

    // 判断确认按钮是否应该禁用
    const isConfirmButtonDisabled = useMemo(() => {
        // 如果没有临时选中项，或者临时选中项的ID与当前项ID相同，则禁用按钮
        return !tempSelectedItem || tempSelectedItem.id === currentReplaceItem.itemId;
    }, [tempSelectedItem, currentReplaceItem.itemId]);

    // dnd-kit 的传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 降低激活距离
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 拖拽结束处理程序
    function handleDragEnd(event, panelId) {
        const { active, over } = event;
        console.log('处理拖拽结束:', { active, over, panelId });

        if (active && over && active.id !== over.id) {
            try {
                // 从ID中提取索引信息
                const activeIdParts = active.id.split('-');
                const overIdParts = over.id.split('-');

                // 获取原始索引和目标索引
                const oldIndex = parseInt(activeIdParts[activeIdParts.length - 1]);
                const newIndex = parseInt(overIdParts[overIdParts.length - 1]);

                console.log('直接使用索引:', { oldIndex, newIndex });

                // 检查索引有效性
                if (!isNaN(oldIndex) && !isNaN(newIndex) && oldIndex !== newIndex) {
                    if (onSortItems) {
                        console.log('调用父组件排序函数:', { panelId, oldIndex, newIndex });
                        onSortItems(panelId, oldIndex, newIndex);
                    } else {
                        console.warn('没有提供 onSortItems 回调函数');
                    }
                } else {
                    console.warn('索引无效或相同:', { oldIndex, newIndex });
                }
            } catch (error) {
                console.error('排序处理出错:', error);
            }
        } else {
            console.log('拖拽没有改变位置或不满足条件', { active, over });
        }
    }
    // 收集具有 dataList 属性的面板
    const findFirstDataListItemAndParent = (fields, parent = null) => {
        if (!Array.isArray(fields)) {
            return null;
        }

        for (const item of fields) {
            // 如果当前项有 dataList 属性，直接返回结果
            if (item && item.dataList) {
                return {
                    dataListItem: item,
                    parentItem: parent || item,
                };
            }

            // 如果当前项有子字段，递归查找
            if (item && Array.isArray(item.fields)) {
                const result = findFirstDataListItemAndParent(item.fields, item);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    };


    // 接收左侧列表添加item数据
    useEffect(() => {
        // 如果有从列表选择的数据，需要添加到相应的折叠面板中
        if (selectedItemFromList) {

            // 查找所有具有 dataList 属性的面板
            const result = findFirstDataListItemAndParent(fields);
            if (result) {
                const { dataListItem, parentItem } = result;
                const targetPanel = dataListItem;

                // 如果目标面板未展开，则展开它
                if (!activeKeys.includes(parentItem.name)) {
                    // 展开目标面板
                    onCollapseChange(parentItem.name);
                }

                // 将选中的数据添加到表单中
                try {
                    // 获取当前表单数据
                    const currentFormValues = form.getFieldsValue();

                    // 检查目标面板的字段结构
                    // 1. 如果面板有指定的 listFieldName，使用该字段名
                    // 2. 否则使用面板的 name 作为字段名
                    const fieldName = targetPanel.listFieldName || targetPanel.name;
                    // 初始化字段值为数组（如果尚未初始化）
                    if (!currentFormValues[fieldName]) {
                        currentFormValues[fieldName] = [];
                    } else if (!Array.isArray(currentFormValues[fieldName])) {
                        // 如果存在但不是数组，转换为包含原值的数组
                        currentFormValues[fieldName] = [currentFormValues[fieldName]];
                    }

                    // 准备要添加的数据
                    // 如果面板定义了 dataMapping 函数，使用它转换数据
                    let itemToAdd;
                    if (typeof targetPanel.dataMapping === 'function') {
                        // 使用映射函数转换数据
                        itemToAdd = targetPanel.dataMapping(selectedItemFromList);
                    } else {
                        // 否则使用默认映射 - 添加原始数据并生成ID
                        itemToAdd = {
                            ...selectedItemFromList,
                        };
                    }

                    // 添加新项目到数组中
                    currentFormValues[fieldName].push(itemToAdd);

                    // 更新表单值
                    form.setFieldsValue(currentFormValues);

                    // 触发表单的 onValuesChange 回调（如果直接设置值可能不会触发）
                    const changeEvent = {};
                    changeEvent[fieldName] = currentFormValues[fieldName];
                    if (form.onValuesChange) {
                        form.onValuesChange(changeEvent, currentFormValues);
                    }

                    console.log('数据已添加到面板:', targetPanel.name, '字段:', fieldName);

                    // 如果提供了回调函数，则调用它
                    if (onItemAdded && typeof onItemAdded === 'function') {
                        onItemAdded(parentItem?.name || targetPanel.name, fieldName, itemToAdd, null, form);
                    }

                    // 通知父组件已处理完选中项，可以清空选中状态
                    if (onSelectedItemProcessed && typeof onSelectedItemProcessed === 'function') {
                        onSelectedItemProcessed();
                    }
                } catch (error) {
                    console.error('添加数据到面板时出错:', error);

                }
            } else {
                // 如果没有适合的面板，也需要清空选中状态
                if (onSelectedItemProcessed && typeof onSelectedItemProcessed === 'function') {
                    onSelectedItemProcessed();
                }
            }
        }
    }, [selectedItemFromList]);

    // 渲染表单字段组
    const renderFieldGroup = (fieldGroup) => {
        console.log(fieldGroup);

        return fieldGroup.map((field, index) => (
            <React.Fragment key={field.name || `field-${index}`}>
                {renderFormItem(field, {
                    form,
                    formConnected,
                    initialValues,
                    mounted,
                    moduleKey,
                    onAddItem: onItemAdded,
                    onDeleteItem,
                    onCopyItem: handleCopyItem,
                    onReplaceItem,
                    onUpdateItem,
                    commonListConfig,
                    onSortItems,
                    onSelectedItemProcessed,
                })}
            </React.Fragment>
        ));
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
        // 找到具有isShowAdd属性的面板
        const currentFields = fields.find(item => item.isShowAdd);
        if (!currentFields) return;

        // 验证当前表单数据是否填写
        let valid = validateFields(currentFields);
        if (!valid) return;

        // 检查当前面板是否有数据
        if (!currentFields.dataList || currentFields.dataList.length === 0) {
            notification.warning({
                message: `Cannot Add New ${currentFields.label}`,
                description: `Please add exercises to the current last ${currentFields.label} before adding a new one.`,
                placement: 'topRight',
            });
            return;
        }

        // 计算需要添加的新面板索引
        // 查找所有带有isShowAdd属性的面板
        const showAddPanels = fields.filter(item => item.isShowAdd);
        const newPanelIndex = showAddPanels.length; // 新面板的索引

        // 创建新面板的数据结构
        const newPanelName = `${currentFields.name}${newPanelIndex}`; // 生成唯一名称
        const newCustomPanel = {
            ...currentFields,
            dataList: [],  // 新面板初始无数据
            name: newPanelName,
            isShowAdd: true,
            // 确保fields中的每个字段name也是唯一的
            fields: currentFields.fields?.map(field => ({
                ...field,
                name: `${field.name}${newPanelIndex}` // 为每个字段名称添加相同的后缀
            })) || []
        };

        // 调用父组件传递的回调函数来添加新面板
        if (handleAddCustomPanel) {
            handleAddCustomPanel(newCustomPanel);
            onCollapseChange(newPanelName); // 自动展开新添加的面板
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
                        accordion={activeKeys.length > 1 ? false : true}
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
                                    {fields.filter(item => item.dataList)?.length > 1 && item.isShowAdd && (
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

            {/* 替换弹框 */}
            <Modal
                title={commonListConfig?.title || 'Replace Item'}
                open={replaceModalVisible}
                onCancel={() => setReplaceModalVisible(false)}
                okText="Confirm Replace" // 确认按钮文字 (中文注释：确认替换)
                cancelText="Cancel" // 取消按钮文字
                width="90%" // 进一步增加宽度 (从 80% 到 90%)
                styles={{ body: { height: '60vh', width: '700px' } }} // 允许内容库滚动
                destroyOnClose={true}
                okButtonProps={{ disabled: isConfirmButtonDisabled }} // 根据条件禁用确认按钮
                onOk={handleReplaceItemSelected} // 点击确认按钮时执行替换
            >
                {
                    commonListConfig && (
                        <CommonList
                            selectionMode="replace"
                            selectedItemId={tempSelectedItem?.id || currentReplaceItem.itemId}
                            onAddItem={handleCommonListItemSelect} // 处理选中项变更
                            {...commonListConfig}
                        />
                    )
                }
            </Modal>
        </div>
    );
};

export default CollapseForm;