import React, { useCallback, useEffect } from 'react';
import { List, Avatar, Space, Row, Col, Typography, Button } from 'antd';
import { MenuOutlined, RetweetOutlined, CopyOutlined, DeleteOutlined, CaretRightOutlined } from '@ant-design/icons';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { optionsConstants } from '@/constants'; // 导入 optionsConstants

const { Text } = Typography;

// --- 可排序项渲染器组件 ---
const SortableItemRenderer = React.memo(({
    panelId, // 面板ID (来自 StructureList 的 panelName)
    item, // 当前项数据
    itemIndex, // 当前项索引
    isExpanded, // 是否展开
    toggleExpandItem, // 切换项展开状态的回调: (itemId) => void
    onOpenReplaceModal, // 打开替换模态框的回调: (itemId, itemIndex) => void
    renderItemMata, // 自定义项元数据渲染函数
    onCopyItem, // 复制项的回调: (itemId) => void
    onDeleteItem, // 删除项的回调: (itemIndex) => void
    onItemChange, // 项内容更改的回调: (panelId, itemId, key, value) => void
}) => {
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
    };

    // 为拖拽中的元素添加样式类（去掉动画）
    // 这些类名 (structure-list-item, item-wrapper) 需要在全局CSS或父组件中定义样式
    const wrapperClassName = `structure-list-item item-wrapper ${isExpanded ? 'expanded' : ''}`;

    // 默认的列表项元数据渲染函数
    const defaultRenderItemMeta = useCallback((currentItem) => {
        // 确保 optionsConstants 和 optionsConstants.status 存在
        const statusObj = optionsConstants.status.find(status => status.value === currentItem.status);
        const statusName = statusObj ? statusObj.name : '-';

        return <List.Item.Meta
            style={{
                display: 'flex',
                alignItems: 'center',
            }}
            avatar={
                // 之前这里有 className={styles.itemAvatar}
                <div>
                    <Avatar shape="square" size={64} src={currentItem.imageUrl || currentItem.animationPhoneUrl} />
                    <CaretRightOutlined
                    // 之前这里有 className={styles.playIcon}
                    />
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
                        <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: currentItem.functionType || currentItem.type }}>
                            {currentItem.functionType || currentItem.type || '-'}
                        </Text>
                    </div>
                </div>
            }
        />;
    }, []); // optionsConstants 从模块作用域获取

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
                className="sortable-item-row" // CSS 类名，用于样式化
                onClick={() => toggleExpandItem && toggleExpandItem(item.id)} // Row 点击切换展开
            >
                <Col flex="auto">
                    {renderItemMata ? renderItemMata(item) : defaultRenderItemMeta(item)}
                </Col>
                <Col flex="none">
                    <Space className="structure-item-actions"> {/* CSS 类名 */}
                        {/* 替换按钮 */}
                        {onOpenReplaceModal && (
                            <Button
                                key="replace"
                                type="text"
                                icon={<RetweetOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onOpenReplaceModal(item.id, itemIndex);
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Replace" // 替换
                            />
                        )}
                        {/* 复制按钮 */}
                        {onCopyItem && (
                            <Button
                                key="copy"
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onCopyItem(item.id);
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Copy" // 复制
                            />
                        )}
                        {/* 删除按钮 */}
                        {onDeleteItem && (
                            <Button
                                key="delete"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    onDeleteItem(itemIndex);
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                                title="Delete" // 删除
                            />
                        )}
                        {/* 排序/拖拽句柄按钮 */}
                        <Button
                            key="sort"
                            type="text"
                            icon={<MenuOutlined />}
                            className="sort-handle" // CSS 类名，用于样式化拖拽句柄
                            onClick={(e) => e.stopPropagation()} // 阻止 Row 的 onClick
                            title="Sort" // 排序
                        />
                    </Space>
                </Col>
            </Row>
        </div>
    );
});
SortableItemRenderer.displayName = 'SortableItemRenderer'; // 设置组件的 displayName

/**
 * 可排序的结构列表组件
 * @param {object} props - 组件属性
 * @param {string} props.panelName - 当前面板的名称/ID
 * @param {Array<object>} props.dataList - 要渲染和排序的项目列表
 * @param {object} props.sensors - dnd-kit 的传感器配置
 * @param {Function} props.onDragEnd - 拖拽结束时的回调函数: (event) => void
 * @param {Function} [props.renderItemMata] - 自定义渲染列表项 Meta 部分的函数: (item) => ReactNode
 * @param {string|null} [props.expandedItemId] - 当前展开的列表项的 ID
 * @param {Function} props.toggleExpandItem - 切换列表项展开/折叠状态的回调: (itemId) => void
 * @param {Function} props.onOpenReplaceModal - 打开替换模态框的回调: (itemId, itemIndex) => void
 * @param {Function} props.onCopyItem - 复制列表项的回调: (itemId) => void
 * @param {Function} props.onDeleteItem - 删除列表项的回调: (itemIndex) => void
 * @param {Function} [props.onItemChange] - 列表项内部属性更改时的回调: (panelId, itemId, key, value) => void
 */
const StructureList = ({
    panelName,
    dataList,
    sensors,
    onDragEnd,
    renderItemMata,
    expandedItemId,
    toggleExpandItem,
    onOpenReplaceModal,
    onCopyItem,
    onDeleteItem,
    onItemChange,
    onItemAdded,
    selectedItemFromList,
}) => {

    useEffect(() => {
        if (selectedItemFromList) {

        }

    }, [selectedItemFromList]);

    // 如果数据列表无效或为空，则不渲染任何内容
    if (!Array.isArray(dataList) || dataList.length === 0) {
        return null;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd} // 直接使用从父组件传递的 onDragEnd 回调
        >
            {/* 拖拽排序上下文 */}
            <SortableContext
                items={dataList.map((_, index) => `${panelName}-item-${index}`)} // 为每个可排序项生成唯一ID
                strategy={verticalListSortingStrategy}
            >
                <div className='structure-list' style={{ // 列表容器样式
                    position: 'relative',
                    padding: '2px 0'
                }}>
                    {dataList.map((listItem, index) => (
                        <SortableItemRenderer
                            key={index} // 使用索引作为 React key (如果 listItem 有唯一 ID，使用 listItem.id 更佳)
                            panelId={panelName} // 将 panelName 作为 panelId 传递给子项
                            item={listItem} // 当前列表项的数据
                            itemIndex={index} // 当前列表项的索引
                            isExpanded={expandedItemId === listItem.id} // 判断当前项是否展开
                            toggleExpandItem={toggleExpandItem} // 传递切换展开状态的回调
                            onOpenReplaceModal={onOpenReplaceModal} // 传递打开替换模态框的回调
                            onCopyItem={onCopyItem} // 传递复制项的回调
                            onDeleteItem={onDeleteItem} // 传递删除项的回调
                            renderItemMata={renderItemMata} // 传递自定义渲染函数
                            onItemChange={onItemChange} // 直接传递 onItemChange 回调
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

StructureList.displayName = 'StructureList'; // 设置组件的 displayName
export default StructureList;
