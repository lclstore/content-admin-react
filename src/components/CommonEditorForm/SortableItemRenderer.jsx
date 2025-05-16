import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuOutlined } from '@ant-design/icons';
import styles from './CommonEditorForm.module.less';

const SortableItemRenderer = ({ item, panelId, toggleExpandItem, isExpanded, onOpenReplaceModal, onCopyItem, onDeleteItem }) => {
    // 使用最基础的 useSortable 配置
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useSortable({ id: item.id });

    // 拖拽项目的样式 - 只保留必要的样式
    const style = {
        transform: CSS.Transform.toString(transform),
        // 完全移除 transition 相关属性
        background: isDragging ? '#f9f9f9' : 'white',
        opacity: isDragging ? 0.8 : 1,
        // 其他视觉反馈
        border: isDragging ? '1px dashed #d9d9d9' : '1px solid #e8e8e8',
        position: 'relative',
        zIndex: isDragging ? 999 : 'auto',
        borderRadius: '4px',
        padding: '8px 12px',
        marginBottom: '8px'
    };

    return (
        <div ref={setNodeRef} style={style}>
            {/* 拖拽手柄区域 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <MenuOutlined
                    style={{
                        cursor: 'move',
                        color: '#999',
                        marginRight: '8px',
                        fontSize: '16px'
                    }}
                    {...attributes}
                    {...listeners}
                />

                <div
                    style={{ flex: 1, fontWeight: '500' }}
                    onClick={() => toggleExpandItem(panelId, item.id)}
                >
                    {item.title || item.name || '未命名项目'}
                </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {onCopyItem && (
                    <span
                        style={{ color: '#1890ff', cursor: 'pointer' }}
                        onClick={() => onCopyItem(panelId, item.id)}
                    >
                        复制
                    </span>
                )}

                {onOpenReplaceModal && (
                    <span
                        style={{ color: '#1890ff', cursor: 'pointer' }}
                        onClick={() => onOpenReplaceModal(panelId, item.id)}
                    >
                        替换
                    </span>
                )}

                {onDeleteItem && (
                    <span
                        style={{ color: '#1890ff', cursor: 'pointer' }}
                        onClick={() => onDeleteItem(panelId, item.id)}
                    >
                        删除
                    </span>
                )}
            </div>

            {/* 展开的内容区域 */}
            {isExpanded && (
                <div style={{ marginTop: '8px' }}>
                    {item.fields && item.fields.map(field => (
                        <div key={field.name} style={{ marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold' }}>{field.label || field.name}:</span>
                            <span style={{ marginLeft: '4px' }}>{item[field.name] || '-'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SortableItemRenderer; 