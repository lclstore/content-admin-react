import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { List, Avatar, Space, Row, Col, Typography, Button, Modal, notification } from 'antd';
import { MenuOutlined, RetweetOutlined, CopyOutlined, DeleteOutlined, CaretRightOutlined } from '@ant-design/icons';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { optionsConstants } from '@/constants';
import './StructureList.css';
import CommonList from '../CommonEditorForm/CommonList';

const { Text } = Typography;

const SortableItemRenderer = React.memo(({
    panelId,
    item,
    itemIndex,
    isExpanded,
    toggleExpandItem,
    onOpenReplaceModal,
    renderItemMeta,
    onCopyItem,
    onDeleteItem,
    onSortItems
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({
        id: `${panelId}-item-${itemIndex}`,
        data: { type: 'item', item, panelId, itemIndex },
    });

    const rowStyle = { transform: CSS.Transform.toString(transform) };
    const wrapperStyle = { opacity: isDragging ? 0.5 : 1 };
    const wrapperClassName = `structure-list-item item-wrapper${isExpanded ? ' expanded' : ''}`;

    const defaultRenderItemMeta = useCallback((currentItem) => {
        const statusObj = optionsConstants.statusList.find(status => status.value === currentItem.status);
        const statusName = statusObj ? statusObj.name : '-';

        return (
            <List.Item.Meta
                style={{
                    display: 'flex',
                    alignItems: 'center',
                }}
                avatar={
                    <div className="content-library-item-avatar">
                        <Avatar shape="square" size={64} src={currentItem.imageUrl || currentItem.animationPhoneUrl} />
                        <CaretRightOutlined className="content-library-item-play-icon" />
                    </div>
                }
                title={<Text ellipsis={{ tooltip: currentItem.displayName || currentItem.title }}>{currentItem.displayName || currentItem.title || '未命名项目'}</Text>}
                description={
                    <div>
                        <div>
                            <Text
                                type="secondary"
                                style={{ fontSize: '12px' }}
                                ellipsis={{ tooltip: currentItem.status }}
                            >
                                {statusName}
                            </Text>
                        </div>
                        <div>
                            <Text
                                type="secondary"
                                style={{ fontSize: '12px' }}
                                ellipsis={{ tooltip: currentItem.functionType || currentItem.type }}
                            >
                                {currentItem.functionType || currentItem.type || '-'}
                            </Text>
                        </div>
                    </div>
                }
            />
        );
    }, []);

    return (
        <div style={wrapperStyle} className={wrapperClassName}>
            <Row
                ref={setNodeRef}
                style={rowStyle}
                {...attributes}
                {...listeners}
                wrap={false}
                align="middle"
                className="sortable-item-row"
                onClick={() => toggleExpandItem && toggleExpandItem(panelId, item.id)}
            >
                <Col flex="auto">
                    {renderItemMeta ? renderItemMeta(item) : defaultRenderItemMeta(item)}
                </Col>
                <Col flex="none">
                    <Space className="structure-item-actions">
                        {onOpenReplaceModal && (
                            <Button
                                type="text"
                                icon={<RetweetOutlined />}
                                onClick={e => { e.stopPropagation(); onOpenReplaceModal(panelId, item.id, itemIndex); }}
                                onPointerDown={e => e.stopPropagation()}
                                title="Replace"
                            />
                        )}
                        {onCopyItem && (
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={e => { e.stopPropagation(); onCopyItem(panelId, item.id); }}
                                onPointerDown={e => e.stopPropagation()}
                                title="Copy"
                            />
                        )}
                        {onDeleteItem && (
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={e => { e.stopPropagation(); onDeleteItem(panelId, itemIndex); }}
                                onPointerDown={e => e.stopPropagation()}
                                title="Delete"
                            />
                        )}
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            className="sort-handle"
                            onClick={e => e.stopPropagation()}
                            title="Sort"
                        />
                    </Space>
                </Col>
            </Row>
        </div>
    );
});
SortableItemRenderer.displayName = 'SortableItemRenderer';

const StructureList = ({
    panelName,
    dataList,
    sensors,
    renderItemMeta,
    expandedItemId,
    toggleExpandItem,
    onOpenReplaceModal: externalOpenReplaceModal,
    onCopyItem: externalCopyItem,
    onDeleteItem: externalDeleteItem,
    commonListConfig = {},
    onReplaceItem,
    onItemChange,
    onItemAdded,
    name,
    form,
    selectedItemFromList,
    onSelectedItemProcessed,
    onSortItems
}) => {
    // 替换弹框状态
    const [replaceModalVisible, setReplaceModalVisible] = useState(false);
    // 当前选中的panel和item id
    const [currentReplaceItem, setCurrentReplaceItem] = useState({
        panelId: null,
        itemId: null,
        itemIndex: null
    });
    // 在替换弹框中临时选中的项
    const [tempSelectedItem, setTempSelectedItem] = useState(null);

    // 处理展开/折叠项目的函数
    const handleToggleExpandItem = useCallback((panelId, itemId) => {
        if (toggleExpandItem) {
            toggleExpandItem(itemId);
        }
    }, [toggleExpandItem]);

    // 处理删除项目
    const handleDeleteItem = useCallback((panelName, itemIndex) => {
        if (externalDeleteItem) {
            externalDeleteItem(panelName, itemIndex);
        }
    }, [externalDeleteItem]);

    // 处理复制项目
    const handleCopyItem = useCallback((panelName, itemId) => {
        if (externalCopyItem) {
            externalCopyItem(panelName, itemId);
        }
    }, [externalCopyItem]);

    // 处理替换项目
    const handleOpenReplaceModal = useCallback((panelId, itemId, itemIndex) => {
        // 如果有外部替换处理函数，优先使用
        if (externalOpenReplaceModal) {
            externalOpenReplaceModal(itemId, itemIndex);
            return;
        }

        // 否则使用内部替换弹框逻辑
        // 保存当前选中的panel、item id和索引
        setCurrentReplaceItem({
            panelId,
            itemId,
            itemIndex
        });
        // 初始化临时选中项为当前项ID
        setTempSelectedItem({ id: itemId });
        // 打开替换弹框
        setReplaceModalVisible(true);
    }, [externalOpenReplaceModal]);

    // 处理CommonList中选中项变更
    const handleCommonListItemSelect = useCallback((selectedItem) => {
        debugger
        // 更新临时选中的项
        setTempSelectedItem(selectedItem);
    }, []);

    // 处理替换项目选中后的回调
    const handleReplaceItemSelected = useCallback(() => {
        // 只有当选中项不是当前项时才执行替换
        if (tempSelectedItem.id !== currentReplaceItem.itemId) {
            const panelId = name;     // 面板ID
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
    // 拖拽结束处理程序
    const handleDragEnd = (event, panelId) => {
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
    // 判断确认按钮是否应该禁用
    const isConfirmButtonDisabled = useMemo(() => {
        // 如果没有临时选中项，或者临时选中项的ID与当前项ID相同，则禁用按钮
        return !tempSelectedItem || tempSelectedItem.id === currentReplaceItem.itemId;
    }, [tempSelectedItem, currentReplaceItem.itemId]);

    useEffect(() => {
        if (selectedItemFromList && typeof onItemAdded === 'function') {
            onItemAdded('basic', name, selectedItemFromList, null, form);
            // 通知父组件已处理完选中项，可以清空选中状态
            if (onSelectedItemProcessed && typeof onSelectedItemProcessed === 'function') {
                onSelectedItemProcessed();
            }
        }

    }, [selectedItemFromList]);

    if (!Array.isArray(dataList) || dataList.length === 0) return null;
    return (
        <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(event, name)}>
                <SortableContext
                    items={dataList.map((_, index) => `${name}-item-${index}`)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="structure-list" style={{ position: 'relative', padding: '2px 0' }}>
                        {dataList.map((item, index) => (
                            <SortableItemRenderer
                                key={index}
                                panelId={name}
                                item={item}
                                itemIndex={index}
                                isExpanded={expandedItemId === item.id}
                                toggleExpandItem={handleToggleExpandItem}
                                onOpenReplaceModal={handleOpenReplaceModal}
                                onCopyItem={handleCopyItem}
                                onDeleteItem={handleDeleteItem}
                                renderItemMeta={renderItemMeta}
                                onItemChange={onItemChange}
                                onSortItems={onSortItems}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* 替换弹框 */}
            <Modal
                title={commonListConfig?.title || 'Replace Item'}
                open={replaceModalVisible}
                onCancel={() => setReplaceModalVisible(false)}
                okText="Confirm Replace"
                cancelText="Cancel"
                width="90%"
                styles={{ body: { height: '60vh', width: '700px' } }}
                destroyOnClose={true}
                okButtonProps={{ disabled: isConfirmButtonDisabled }}
                onOk={handleReplaceItemSelected}
            >
                {
                    commonListConfig && (
                        <CommonList
                            selectionMode="replace"
                            selectedItemId={tempSelectedItem?.id || currentReplaceItem.itemId}
                            onAddItem={handleCommonListItemSelect}
                            {...commonListConfig}
                        />
                    )
                }
            </Modal>
        </>
    );
};

StructureList.displayName = 'StructureList';
export default StructureList;
