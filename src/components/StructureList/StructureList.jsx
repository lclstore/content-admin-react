import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { List, Avatar, Space, Row, Col, Typography, Button, Modal, notification, Form, Input, Select } from 'antd';
import { MenuOutlined, RetweetOutlined, CopyOutlined, DeleteOutlined, CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import { renderFormControl } from '@/components/CommonEditorForm/FormFields';
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
import { getFileCategoryFromUrl } from '../../utils';
import audioManager from '../../utils/audioManager';

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
    onSortItems,
    currentPlayingItem,
    isPlaying,
    onAudioClick,
    structureListFields,
    dataItem,
    onItemChange,
}) => {
    // 创建独立的表单实例
    const [itemForm] = Form.useForm();

    // 在组件挂载时初始化表单数据
    useEffect(() => {
        if (isExpanded) {
            itemForm.setFieldsValue(dataItem);
        }
    }, [isExpanded, dataItem, itemForm]);

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

    // 添加鼠标事件相关状态
    const [mouseDownPos, setMouseDownPos] = useState(null);
    const moveThreshold = 5; // 移动阈值，超过这个距离就认为是拖拽

    const handleMouseDown = useCallback((e) => {
        setMouseDownPos({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseUp = useCallback((e) => {
        if (mouseDownPos) {
            const dx = Math.abs(e.clientX - mouseDownPos.x);
            const dy = Math.abs(e.clientY - mouseDownPos.y);

            // 如果移动距离小于阈值，认为是点击
            if (dx < moveThreshold && dy < moveThreshold && !isDragging) {
                toggleExpandItem && toggleExpandItem(item.id);
            }
            setMouseDownPos(null);
        }
    }, [mouseDownPos, isDragging, toggleExpandItem, item.id]);

    const handleMouseMove = useCallback((e) => {
        if (mouseDownPos) {
            const dx = Math.abs(e.clientX - mouseDownPos.x);
            const dy = Math.abs(e.clientY - mouseDownPos.y);

            // 如果移动距离超过阈值，清除mouseDownPos，避免触发点击
            if (dx >= moveThreshold || dy >= moveThreshold) {
                setMouseDownPos(null);
            }
        }
    }, [mouseDownPos]);

    const rowStyle = {
        transform: CSS.Transform.toString(transform),
        cursor: 'pointer'
    };
    const wrapperStyle = { opacity: isDragging ? 0.5 : 1 };
    const wrapperClassName = `structure-list-item item-wrapper${isExpanded ? ' expanded' : ''}`;

    const defaultRenderItemMeta = useCallback((currentItem) => {
        const statusObj = optionsConstants.statusList.find(status => status.value === currentItem.status);
        const statusName = statusObj ? statusObj.name : '-';

        const itemCategory = getFileCategoryFromUrl(currentItem.audioUrl || currentItem.animationPhoneUrl);

        return (
            <List.Item.Meta
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
                avatar={
                    itemCategory === 'audio' ? (
                        <div className="audio-preview">
                            <div
                                className="audio-preview-box"
                                onClick={(e) => {
                                    onAudioClick && onAudioClick(e, currentItem);
                                }}
                                onPointerDown={e => e.stopPropagation()}
                            >
                                {(currentPlayingItem?.id === currentItem.id && isPlaying) ? (
                                    <PauseOutlined style={{ fontSize: '20px' }} />
                                ) : (
                                    <CaretRightOutlined style={{ fontSize: '20px' }} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="item-avatar">
                            <Avatar shape="square" size={64} src={currentItem.imageUrl || currentItem.animationPhoneUrl} />
                            <CaretRightOutlined className="play-icon" />
                        </div>
                    )
                }
                title={<Text ellipsis={{ tooltip: currentItem.name || currentItem.title }}>{currentItem.name || currentItem.title}</Text>}
                description={
                    <div>
                        <div>
                            <Text
                                type="secondary"
                                style={{ fontSize: '12px' }}
                                ellipsis={{ tooltip: item.status }}
                            >
                                {optionsConstants.statusList.find(status => status.value === item.status)?.label}
                            </Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: item.functionType || item.type }}>
                                {item.functionType || item.type}
                            </Text>
                        </div>
                    </div>
                }
            />
        );
    }, [currentPlayingItem, isPlaying, onAudioClick]);

    // 渲染表单字段的函数
    const renderFormField = useCallback((field) => {
        const { type, name, label, options } = field;
        const fieldValue = dataItem[name];

        const handleValueChange = (value) => {
            const updatedItem = {
                ...dataItem,
                [name]: value
            };
            onItemChange && onItemChange(updatedItem);
        };

        // 为每个字段添加唯一的key
        const uniqueKey = `${item.id}-${name}`;
        return <Form.Item
            className='editorform-item'
            key={uniqueKey}
            required={field.required}
            rules={field.rules}
            name={field.name}
            label={field.label}
        >
            {renderFormControl(field, {
                form: itemForm,
                formConnected: true,
                onChange: handleValueChange
            })}
        </Form.Item>
    }, [dataItem, onItemChange, item.id, itemForm]);

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
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMouseDownPos(null)}
            >
                <Col flex="auto">
                    {renderItemMeta ? renderItemMeta(item) : defaultRenderItemMeta(item)}
                </Col>
                <Col flex="none">
                    <Space className="structure-item-actions">
                        {onOpenReplaceModal && (
                            <Button
                                style={{ fontSize: '15px', color: '#1c8' }}
                                type="text"
                                icon={<RetweetOutlined />}
                                onClick={e => { e.stopPropagation(); onOpenReplaceModal(panelId, item.id, itemIndex); }}
                                onPointerDown={e => e.stopPropagation()}
                                title="Replace"
                            />
                        )}
                        {onCopyItem && (
                            <Button
                                style={{ fontSize: '15px', color: '#1c8' }}
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={e => { e.stopPropagation(); onCopyItem(panelId, item.id); }}
                                onPointerDown={e => e.stopPropagation()}
                                title="Copy"
                            />
                        )}
                        {onDeleteItem && (
                            <Button
                                style={{ fontSize: '15px', color: '#ff5252' }}
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
                            style={{ fontSize: '15px', color: '#1c8' }}
                            icon={<MenuOutlined />}
                            className="sort-handle"
                            onClick={e => e.stopPropagation()}
                            title="Sort"
                        />
                    </Space>
                </Col>
            </Row>
            <div className='form-container' style={{ display: isExpanded ? 'block' : 'none' }}>
                <Form form={itemForm} layout="vertical" onValuesChange={(changedValues, allValues) => {
                    onItemChange && onItemChange({ ...dataItem, ...allValues });
                }}>
                    {structureListFields?.map(field => renderFormField(field))}
                </Form>
            </div>
        </div>
    );
});
SortableItemRenderer.displayName = 'SortableItemRenderer';

const StructureList = ({
    panelName,
    dataList,
    sensors,
    renderItemMeta,
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
    onSortItems,
    structureListFields
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

    // 添加展开项的状态管理
    const [expandedItemId, setExpandedItemId] = useState(null);

    // 音频播放相关状态和引用
    const audioRef = useRef(null);
    const [currentPlayingItem, setCurrentPlayingItem] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // 处理音频播放结束
    const handleAudioEnded = useCallback(() => {
        setIsPlaying(false);
        if (audioManager.currentAudio === audioRef.current) {
            audioManager.currentAudio = null;
            audioManager.currentCallback = null;
        }
    }, []);

    // 播放新音频的辅助函数
    const playNewAudio = useCallback((item) => {
        const audioUrl = item.audioUrl || item.animationPhoneUrl;
        if (!audioUrl) {
            notification.error({ message: '播放失败', description: '未找到音频链接。' });
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeEventListener('ended', handleAudioEnded);
        }

        const newAudio = new Audio(audioUrl);
        newAudio.addEventListener('ended', handleAudioEnded);
        audioRef.current = newAudio;

        audioManager.setCurrentAudio(newAudio, (playingStatus) => {
            if (!playingStatus) {
                setIsPlaying(false);
            }
        });

        newAudio.play().then(() => {
            setIsPlaying(true);
        }).catch(error => {
            console.error('音频播放失败:', error);
            notification.error({ message: '播放失败', description: error.message || '无法播放音频文件。' });
            setIsPlaying(false);
            audioManager.clearCurrentAudio(newAudio);
        });
    }, [handleAudioEnded]);

    // 处理音频播放/暂停切换
    const handleAudioToggle = useCallback((item) => {
        if (!item || !(item.audioUrl || item.animationPhoneUrl)) {
            if (isPlaying && audioRef.current) {
                audioManager.stopCurrent();
                setCurrentPlayingItem(null);
            }
            return;
        }

        if (currentPlayingItem?.id === item.id && isPlaying && audioRef.current) {
            audioManager.stopCurrent();
        } else {
            playNewAudio(item);
            setCurrentPlayingItem(item);
        }
    }, [isPlaying, currentPlayingItem, playNewAudio]);

    // 这个函数现在是传递给 SortableItemRenderer 的 onAudioClick
    const handleAudioClick = useCallback((event, item) => {
        handleAudioToggle(item);
    }, [handleAudioToggle]);

    // 组件卸载时清理音频资源
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('ended', handleAudioEnded);
                audioManager.clearCurrentAudio(audioRef.current);
                audioRef.current = null;
            }
            setCurrentPlayingItem(null);
            setIsPlaying(false);
        };
    }, [handleAudioEnded]);

    // 处理展开/折叠项目的函数
    const handleToggleExpandItem = useCallback((itemId) => {
        console.log('切换展开状态：', { itemId, currentExpanded: expandedItemId });
        setExpandedItemId(prevId => prevId === itemId ? null : itemId);
    }, []);

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

    // 处理单个项目的值变更
    const handleItemChange = useCallback((updatedItem) => {
        debugger
        const updatedDataList = dataList.map(item =>
            item.id === updatedItem.id ? updatedItem : item
        );
        onItemChange && onItemChange(updatedDataList);
    }, [dataList, onItemChange]);

    console.log('StructureList 渲染：', {
        expandedItemId,
        structureListFields,
        dataList
    });

    if (!Array.isArray(dataList) || dataList.length === 0) return null;
    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, panelName)}
            >
                <SortableContext
                    items={dataList.map((item, index) => `${panelName}-item-${index}`)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="structure-list" style={{ position: 'relative', padding: '2px 0' }}>
                        {dataList.map((item, index) => (
                            <SortableItemRenderer
                                key={`${panelName}-item-${index}`}
                                panelId={panelName}
                                item={item}
                                itemIndex={index}
                                isExpanded={expandedItemId === item.id}
                                toggleExpandItem={handleToggleExpandItem}
                                onOpenReplaceModal={handleOpenReplaceModal}
                                onCopyItem={handleCopyItem}
                                onDeleteItem={handleDeleteItem}
                                renderItemMeta={renderItemMeta}
                                onItemChange={handleItemChange}
                                onSortItems={onSortItems}
                                currentPlayingItem={currentPlayingItem}
                                isPlaying={isPlaying}
                                onAudioClick={handleAudioClick}
                                structureListFields={structureListFields}
                                dataItem={item}
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
