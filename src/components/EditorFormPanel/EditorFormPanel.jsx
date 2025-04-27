import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Form, Input, Popover, Collapse, Space, Switch, DatePicker, InputNumber, List, Avatar, Button, Segmented, Row, Col, Typography, Tooltip, Modal, notification } from 'antd';
import {
    ThunderboltOutlined,
    TagsOutlined,
    ShrinkOutlined,
    ArrowsAltOutlined,
    PictureOutlined,
    InfoOutlined,
    SettingOutlined,
    SlidersOutlined,
    VideoCameraOutlined,
    DeleteOutlined,
    RetweetOutlined,
    MenuOutlined,
    InfoCircleOutlined,
    MinusOutlined,
    PlusOutlined,
    CaretRightOutlined,
    CopyOutlined
} from '@ant-design/icons';
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
import { filterSections } from '../../pages/workouts/Data';
import TagSelector from '../TagSelector/TagSelector';
import FileUpload from '../FileUpload/FileUpload';
import NumberStepper from '../NumberStepper/NumberStepper';
import './EditorFormPanel.css';
import dayjs from 'dayjs';
import ContentLibraryPanel from '../ContentLibrary/ContentLibraryPanel';

// 从筛选配置中获取选项
const getOptionsFromFilter = (key) => {
    const section = filterSections.find(section => section.key === key);
    return section ? section.options : [];
};

// --- 添加 normFile 函数用于处理文件上传组件的值 ---
// 注意：此函数需要根据 FileUpload 组件实际调用 onChange 时传递的参数进行调整
const normFile = (e) => {
    console.log('[EditorFormPanel] normFile Upload event:', e); // 打印事件对象以便调试

    // 常见情况 1: Ant Design Upload 组件的事件对象 (假设 FileUpload 类似)
    if (e && e.fileList && Array.isArray(e.fileList)) {
        // 如果只需要最新的一个文件 URL
        const latestFile = e.fileList[e.fileList.length - 1];
        if (latestFile && latestFile.status === 'done' && latestFile.response) {
            // 假设服务器响应中包含 url 字段 或 data 字段
            const url = latestFile.response.url || latestFile.response.data;
            if (url) return url;
        }
        // 文件可能已经上传完成，URL 在 file 对象本身上
        if (latestFile && latestFile.url) {
            return latestFile.url;
        }
        // 如果 fileList 不为空，但没有有效的 URL（可能正在上传或失败），返回一个非空值，避免 required 判定失败
        // 但更好的做法是 FileUpload 在完成时才调用 onChange 并提供 URL
        // 如果你希望有文件就算通过，可以返回一个标记，但这通常不用于 URL 字段
        // return e.fileList.length > 0 ? 'file_present' : null;

        // 默认返回 null，让 required 验证失败，除非找到有效的 URL
        return null;
    }
    // 兼容 Antd Upload 组件直接传递 file 对象的情况
    else if (e && e.file && typeof e.file === 'object') {
        if (e.file.status === 'done' && e.file.response) {
            const url = e.file.response.url || e.file.response.data;
            if (url) return url;
        }
        if (e.file.url) {
            return e.file.url;
        }
        // 正在上传或失败，返回 null
        return null;
    }
    // 常见情况 2: FileUpload 直接调用 onChange(url)
    if (typeof e === 'string' && e.startsWith('http')) { // 简单检查是否像 URL
        return e;
    }
    // 常见情况 3: FileUpload 直接调用 onChange(null) 或 onChange(undefined) 来清除
    if (e === null || e === undefined) {
        return null;
    }
    // 常见情况 4: FileUpload 直接调用 onChange({url: '...'}) 
    if (e && typeof e === 'object' && e.url) {
        return e.url;
    }

    // 添加更多针对你的 FileUpload 组件行为的判断逻辑...
    console.warn('[EditorFormPanel] normFile could not extract value from event:', e);

    // 如果以上都不匹配，或者文件正在上传中/失败，返回 null
    // 返回 null 让 required:true 规则可以正确判断字段是否为空
    return null;
};

// --- 辅助组件：自定义步进器 ---
// （后续可移至单独文件）
const ValueStepper = ({ value, onChange, min = 0, max = Infinity, step = 1, formatter = (v) => v }) => {
    const handleDecrement = () => {
        onChange(Math.max(min, value - step));
    };
    const handleIncrement = () => {
        onChange(Math.min(max, value + step));
    };

    return (
        <Space.Compact>
            <Button icon={<MinusOutlined />} onClick={handleDecrement} disabled={value <= min} />
            <Input
                value={formatter(value)}
                className="value-stepper-input" // 使用类名代替内联样式
                readOnly // 只读，通过按钮控制
            />
            <Button icon={<PlusOutlined />} onClick={handleIncrement} disabled={value >= max} />
        </Space.Compact>
    );
};
// --- 辅助组件结束 ---

// --- 可排序项渲染器组件 ---
const SortableItemRenderer = React.memo(({ panelId, item, isExpanded, toggleExpandItem, onOpenReplaceModal, onCopyItem, onDeleteItem, onItemChange }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    // Row（可拖拽元素）的样式
    const rowStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        // 内联样式移至 CSS 文件
    };

    // 外层 wrapper 的样式 (视觉效果，例如透明度)
    const wrapperStyle = {
        opacity: isDragging ? 0.5 : 1,
        // 内联样式移至 CSS 文件
    };

    // 格式化持续时间或次数用于显示
    const durationSeconds = item.duration || 0;
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const displayValue = item.executionType === 'duration' ? formattedDuration : `${item.repetitions} reps`;

    return (
        // 外层 wrapper 控制透明度/边距
        <div style={wrapperStyle} className={`structure-list-item item-wrapper ${isExpanded ? 'expanded' : ''}`}>
            {/* Row 同时处理拖拽监听和点击切换 */}
            <Row
                ref={setNodeRef}
                style={rowStyle}
                {...attributes}
                {...listeners}
                wrap={false}
                align="middle"
                className="sortable-item-row" // 添加类名以便在 CSS 中定位
                onClick={() => toggleExpandItem(panelId, item.id)} // Row 点击切换展开
            >
                <Col flex="auto">
                    <List.Item.Meta
                        className="structure-item-meta" // 使用类名代替内联样式
                        avatar={
                            <div className="structure-item-avatar-wrapper">
                                <Avatar shape="square" size={64} src={item.animationPhoneUrl} />
                                <CaretRightOutlined className="structure-item-play-icon" />
                            </div>
                        }
                        title={item.displayName}
                        description={
                            <>
                                <div style={{ fontSize: '13px', color: '#889e9e' }}>{displayValue}</div>
                                {item.status && (
                                    <div style={{ fontSize: '13px', color: '#889e9e' }} className={`status-tag status-${item.status.toLowerCase()}`}>
                                        {item.status}
                                    </div>
                                )}
                            </>
                        }
                    />
                </Col>
                <Col flex="none">
                    <Space className="structure-item-actions">
                        {/* 1. 展开/折叠按钮 */}
                        <Button
                            key="expand"
                            type="text"
                            icon={isExpanded ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                            onClick={(e) => {
                                e.stopPropagation(); // 阻止事件冒泡
                                toggleExpandItem(panelId, item.id); // 动作：切换展开
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                            title={isExpanded ? "Collapse" : "Expand"}
                        />
                        {/* 2. 替换按钮 - onClick 改为调用 onOpenReplaceModal */}
                        <Button
                            key="replace"
                            type="text"
                            icon={<RetweetOutlined />}
                            onClick={(e) => {
                                e.stopPropagation(); // 阻止事件冒泡
                                onOpenReplaceModal(panelId, item.id); // 动作：打开替换弹框
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                            title="Replace"
                        />
                        {/* 3. 复制按钮 */}
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
                        {/* 4. 删除按钮 */}
                        <Button
                            key="delete"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation(); // 阻止事件冒泡
                                onDeleteItem(panelId, item.id); // 动作：删除项
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // 保留: 防止拖拽
                            title="Delete"
                        />
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
            {/* 展开内容 */}
            {/* {isExpanded && (
                <div className="expanded-content" onClick={(e) => e.stopPropagation()}>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Space align="center">
                                <Typography.Text strong>Execution</Typography.Text>
                                <Tooltip title="Choose time-based or repetition-based execution.">
                                    <InfoCircleOutlined className="info-circle-icon" />
                                </Tooltip>
                            </Space>
                            <Segmented
                                options={[{ label: 'Duration', value: 'duration' }, { label: 'Repetitions', value: 'repetition' }]}
                                value={item.executionType}
                                onChange={(value) => onItemChange(panelId, item.id, 'executionType', value)}
                            />
                        </Col>

                        <Col span={24}>
                            <Space align="center">
                                <Typography.Text strong>{item.executionType === 'duration' ? 'Duration' : 'Repetitions'}</Typography.Text>
                            </Space>
                            {item.executionType === 'duration' ? (
                                <ValueStepper
                                    value={item.duration}
                                    onChange={(value) => onItemChange(panelId, item.id, 'duration', value)}
                                    min={5}
                                    max={300}
                                    step={5}
                                    formatter={(v) => `${String(Math.floor(v / 60)).padStart(1, '0')}:${String(v % 60).padStart(2, '0')}`}
                                />
                            ) : (
                                <ValueStepper
                                    value={item.repetitions}
                                    onChange={(value) => onItemChange(panelId, item.id, 'repetitions', value)}
                                    min={1}
                                    max={100}
                                    step={1}
                                    formatter={(v) => `${v} reps`}
                                />
                            )}
                        </Col>

                        <Col span={24}>
                            <Space align="center">
                                <Typography.Text strong>Show preview</Typography.Text>
                                <Tooltip title="Show a preview animation before the exercise starts.">
                                    <InfoCircleOutlined className="info-circle-icon" />
                                </Tooltip>
                            </Space>
                            <Segmented
                                options={[{ label: 'No', value: false }, { label: 'Yes', value: true }]}
                                value={item.showPreview}
                                onChange={(value) => onItemChange(panelId, item.id, 'showPreview', value)}
                            />
                        </Col>
                    </Row>
                </div>
            )} */}
        </div>
    );
});
// --- 可排序项渲染器组件结束 ---

/**
 * @description 编辑器右侧表单面板，用于编辑 Workout 的详细信息。
 * @param {object} formInstance - Ant Design Form 实例
 * @param {function} onFormChange - 表单值变化时的回调函数
 * @param {object} workoutData - 包含 workout 相关数据的对象，例如 equipmentOptions
 * @param {Array} structurePanelsData - 从内容库添加的结构项数据数组
 * @param {function} onRoundChange - 处理轮次变化的回调函数
 * @param {function} onDeleteItem - 处理删除项的回调函数
 * @param {function} onReplaceItem - 处理替换项的回调函数 (用于最终执行替换)
 * @param {function} onSortItems - 处理排序项的回调函数
 * @param {function} onItemChange - 处理单个项数据变化的回调函数
 * @param {function} onCopyItem - 处理复制项的回调函数
 * @param {Array} contentLibraryData - 完整的内容库数据 (用于弹框)
 * @param {string} contentSearchValue - 内容库搜索值 (用于弹框)
 * @param {function} onContentSearchChange - 内容库搜索处理函数 (用于弹框)
 * @param {function} onContentFilterChange - 内容库筛选处理函数 (用于弹框)
 * @param {object} contentFilters - 内容库筛选器状态 (用于弹框，重新添加)
 * @param {boolean} hasActiveContentFilters - 是否有激活的筛选器 (用于弹框)
 * @param {function} onStructureNameChange - 处理结构名称变化的回调函数 (panelId, name) => void
 * @param {object} expandedItems - 当前展开的项状态 { [panelId]: itemId | null } (从父组件传入)
 * @param {function} onToggleExpandItem - 处理展开/折叠项的回调函数 (panelId, itemId) => void (从父组件传入)
 * @param {function} onFinish - 接收 onFinish prop
 * @param {function} onAddStructurePanel - 处理添加新 Structure Panel 的回调函数
 * @param {Array} activeCollapseKeys - 当前展开的 Collapse 项的 keys (从父组件传入)
 * @param {function} onCollapseChange - 处理 Collapse 项变化的回调函数 (keys) => void (从父组件传入)
 */
const EditorFormPanel = ({
    formInstance,
    onFormChange,
    workoutData,
    structurePanelsData = [],
    onDeleteItem,
    onReplaceItem,
    onSortItems,
    onItemChange,
    onCopyItem,
    // --- Content Library Props ---
    contentLibraryData,
    contentSearchValue,
    contentFilters,
    onContentSearchChange,
    onContentFilterChange,
    hasActiveContentFilters,
    // --- Expansion Props (received from parent) ---
    expandedItems,
    onToggleExpandItem,
    // --- Collapse Props (received from parent) ---
    activeCollapseKeys,
    onCollapseChange,
    onFinish,
    onAddStructurePanel,
}) => {
    // --- 添加日志记录 ---
    console.log('[EditorFormPanel] Rendering with activeCollapseKeys:', activeCollapseKeys);
    // --- 日志记录结束 ---

    const [workoutNameHeader, setWorkoutNameHeader] = useState('');
    // console.log('[EditorFormPanel] Received activeCollapseKeys:', activeCollapseKeys); // 调试日志: 打印接收到的 props
    const [isReplaceModalVisible, setIsReplaceModalVisible] = useState(false);
    const [replacingItemInfo, setReplacingItemInfo] = useState(null);
    const [selectedItemInModal, setSelectedItemInModal] = useState(null);

    // --- 使用 Form.useWatch 监听相关字段 --- 
    const watchedExercisePreviewDuration = Form.useWatch('exercisePreviewDuration', formInstance);
    const watchedExerciseDuration = Form.useWatch('exerciseDuration', formInstance);
    const watchedIntroDuration = Form.useWatch('introDuration', formInstance);
    const watchedStructures = Form.useWatch('structures', formInstance); // 新增：监听 structures 字段

    const toggleExpandItem = useCallback((panelId, itemId) => {
        onToggleExpandItem(panelId, itemId);
    }, [onToggleExpandItem]);

    const handleFormChange = useCallback((changedValues, allValues) => {
        if (changedValues.workoutName !== undefined) {
            setWorkoutNameHeader(changedValues.workoutName || 'Workout Details');
        }
        onFormChange(changedValues, allValues);
    }, [onFormChange]);

    useEffect(() => {
        const initialName = formInstance.getFieldValue('workoutName');
        setWorkoutNameHeader(initialName || 'Workout Details');
    }, [formInstance]);

    // 获取标签选项
    const difficultyOptions = getOptionsFromFilter('difficulty');
    const PositionOptions = getOptionsFromFilter('position');
    const targetOptions = getOptionsFromFilter('target');
    const equipmentOptions = workoutData?.equipmentOptions || [];

    // dnd-kit 的传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 拖拽结束处理程序
    function handleDragEnd(event, panelId) {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const panel = structurePanelsData.find(p => p.id === panelId);
            if (!panel) return;

            const oldIndex = panel.items.findIndex(item => item.id === active.id);
            const newIndex = panel.items.findIndex(item => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                onSortItems(panelId, oldIndex, newIndex);
            }
        }
    }

    // --- 替换弹框处理函数 ---
    const handleOpenReplaceModal = useCallback((panelId, itemId) => {
        const panel = structurePanelsData.find(p => p.id === panelId);
        const initialItemData = panel?.items.find(i => i.id === itemId);
        // 保存要替换的项信息，包括其 libraryId
        setReplacingItemInfo({ panelId, itemId, libraryId: initialItemData?.libraryId });
        // 重置弹框内的选择状态
        setSelectedItemInModal(null);
        setIsReplaceModalVisible(true);
    }, [structurePanelsData]);

    // 使用 useCallback 缓存模态框取消函数
    const handleModalCancel = useCallback(() => {
        setIsReplaceModalVisible(false);
        setReplacingItemInfo(null);
        setSelectedItemInModal(null);
    }, []);

    // 使用 useCallback 缓存模态框确认函数
    const handleModalConfirm = useCallback(() => {
        if (replacingItemInfo && selectedItemInModal) {
            const originalItem = structurePanelsData
                .find(p => p.id === replacingItemInfo.panelId)?.items
                .find(i => i.id === replacingItemInfo.itemId);

            // 如果找不到原始项，则无法替换
            if (!originalItem) {
                console.error("Original item not found for replacement!");
                handleModalCancel();
                return;
            }

            // 构建新的项目数据：保留原始项的配置，只更新核心信息
            const newItemData = {
                ...originalItem, // 基础：保留原始项的所有属性（包括执行参数、预览设置等）
                id: `struct-item-${Date.now()}-${Math.random().toString(16).slice(2)}`, // !! 生成新的唯一 ID
                // 覆盖：使用弹框中选中项的核心属性进行覆盖
                displayName: selectedItemInModal.displayName,
                animationPhoneUrl: selectedItemInModal.animationPhoneUrl, // 图片
                status: selectedItemInModal.status, // 状态
                // 更新 libraryId 为新选择的库项目 ID
                libraryId: selectedItemInModal.id,
            };

            // 调用父组件的替换函数
            onReplaceItem(replacingItemInfo.panelId, replacingItemInfo.itemId, newItemData);

            // --- 新增：替换后自动展开对应的 Collapse 项 --- 
            const panelKeyToExpand = `structure-${replacingItemInfo.panelId}`; // 改回：使用 panel id
            console.log('[EditorFormPanel] Attempting to expand key:', panelKeyToExpand); // 调试日志
            // 调用父组件传入的 onCollapseChange 来更新展开状态
            // 假设父组件的 onCollapseChange 会处理单个 key 的数组以实现 accordion 效果
            if (onCollapseChange) {
                onCollapseChange([panelKeyToExpand]);
                console.log('[EditorFormPanel] Called onCollapseChange with key:', panelKeyToExpand); // 调试日志
            }
            // --- 新增结束 ---

            handleModalCancel();
        }
    }, [replacingItemInfo, selectedItemInModal, structurePanelsData, onReplaceItem, handleModalCancel]);

    /**
     * @description 处理在弹框的内容库中点击"添加"按钮（实际是选择替换项）
     * @param {object} itemData - 从 ContentLibraryPanel 选择的项目数据
     */
    const handleSelectItemInModal = useCallback((itemData) => {
        setSelectedItemInModal(itemData);
    }, []);
    // --- 替换弹框处理结束 ---

    // --- 分离 Collapse 项生成逻辑 ---

    // 生成基础设置项 (Name, Image, Labels, Duration Settings)
    const baseCollapseItems = useMemo(() => [
        { // 名称与描述
            key: '1',
            label: (
                <Space>
                    <ThunderboltOutlined className="collapse-left-icon" />
                    Basic Information
                </Space>
            ),
            children: (
                <>
                    <Form.Item
                        label="Name"
                        name="workoutName"
                        rules={[{ required: true, message: 'Please input the name!' }]}
                    >
                        <Input maxLength={100} showCount placeholder="Name" />
                    </Form.Item>
                    <Form.Item
                        label="Description"

                        name="description"
                    >
                        <Input.TextArea maxLength={1000}
                            showCount placeholder="Description" rows={4} />
                    </Form.Item>

                    {/* New 标签展示时间 - 使用 RangePicker 替换 */}
                    <Form.Item
                        label="New Time" // 修改标签名称
                        name="newDateRange" // 修改字段名称
                        initialValue={[dayjs(), dayjs().add(14, 'day')]} // 默认范围：今天到 14 天后

                    >
                        <DatePicker.RangePicker
                            format="YYYY-MM-DD" // 日期格式
                            className="full-width-datepicker" // 保持宽度样式
                            // 禁用今天之前的日期
                            disabledDate={(current) => {
                                return current && current < dayjs().startOf('day');
                            }}
                        />
                    </Form.Item>

                    {/* 是否为 Premium 内容 */}
                    <Form.Item
                        label="Premium"
                        name="PremiumRequired"
                        valuePropName="checked" // Switch 使用 checked 属性
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                </>
            )
        },
        { // 图片上传
            key: '2',
            label: (
                <Space>
                    <PictureOutlined className="collapse-left-icon" />
                    Image
                </Space>
            ),
            children: (
                <>
                    {/* Cover Image */}
                    <Form.Item
                        label=""
                        name="coverImageUrl"
                        rules={[
                            { required: true, message: 'Please upload the Cover Image!' },
                            // 可选：添加文件类型校验规则
                            // { validator: (_, value) => validateFileType(value, ['png', 'webp']) }
                        ]}
                        getValueFromEvent={normFile} // 处理事件获取值
                    >
                        <FileUpload isRequired={true} recommendation='format: webp,png' title="Cover Image" accept=".png,.webp" />
                    </Form.Item>

                    {/* Detail Image */}
                    <Form.Item
                        label=""
                        name="detailImageUrl"
                        rules={[
                            { required: true, message: 'Please upload the Detail Image!' },
                            // { validator: (_, value) => validateFileType(value, ['png', 'webp']) }
                        ]}
                        getValueFromEvent={normFile} // 处理事件获取值
                    >
                        <FileUpload recommendation='format: webp,png' isRequired={true} title="Detail Image" accept=".png,.webp" />
                    </Form.Item>

                    {/* Thumbnail Image */}
                    <Form.Item
                        label=""
                        name="thumbnailImageUrl" // 注意：字段名可能需要调整，避免与原 imageUrl 冲突或根据需要统一
                        rules={[
                            { required: true, message: 'Please upload the Thumbnail Image!' },
                            // { validator: (_, value) => validateFileType(value, ['png', 'webp']) }
                        ]}
                        getValueFromEvent={normFile} // 处理事件获取值
                    >
                        <FileUpload recommendation='format: webp,png' isRequired={true} title="Thumbnail Image" accept=".png,.webp" />
                    </Form.Item>

                    {/* Complete Image */}
                    <Form.Item
                        label=""
                        name="completeImageUrl"
                        rules={[
                            { required: true, message: 'Please upload the Complete Image!' },
                            // { validator: (_, value) => validateFileType(value, ['png', 'webp']) }
                        ]}
                        getValueFromEvent={normFile} // 处理事件获取值
                    >
                        <FileUpload recommendation='format: webp,png' isRequired={true} title="Complete Image" accept=".png,.webp" />
                    </Form.Item>
                </>
            )
        },
        { // 标签选择
            key: '3',
            label: (
                <Space>
                    <TagsOutlined className="collapse-left-icon" />
                    Labels
                </Space>
            ),
            children: (
                <>
                    <Form.Item
                        label="Difficulty"
                        name="difficulty"
                        rules={[{ required: true, message: 'Please select the difficulty!' }]}
                    >
                        <TagSelector options={difficultyOptions} mode="single" />
                    </Form.Item>
                    <Form.Item
                        label="Equipment"
                        name="equipment"
                        rules={[{ required: true, message: 'Please select the equipment!' }]}
                    >
                        <TagSelector options={equipmentOptions} mode="multiple" />
                    </Form.Item>
                    <Form.Item
                        label="Position"
                        name="position"
                        rules={[{ required: true, message: 'Please select the position!' }]}
                    >
                        <TagSelector options={PositionOptions} mode="single" />
                    </Form.Item>
                    <Form.Item
                        label="Target"
                        name="target"
                        rules={[{ required: true, message: 'Please select the target areas!' }]}
                    >
                        <TagSelector options={targetOptions} mode="multiple" />
                    </Form.Item>

                </>
            )
        },
        { // 运动偏好设置
            key: '5',
            label: (
                <Space>
                    <SettingOutlined className="collapse-left-icon" />
                    Duration Settings
                </Space>
            ),
            children: (
                <>
                    <Form.Item
                        label="Intro Duration"
                        name="introDuration"
                        initialValue={10} // 默认值为 10 秒
                    >
                        <NumberStepper
                            min={0}
                            max={10}
                            step={10}
                            formatter={(value) => `0:${String(value).padStart(2, '0')}`} // 格式化显示为 0:XX
                        />
                    </Form.Item>

                    <Form.Item
                        label="Exercise Preview Duration"
                        name="exercisePreviewDuration"
                        initialValue={10} // 默认值为 10 秒
                    >
                        <NumberStepper
                            min={0}
                            max={10}
                            step={10}
                            formatter={(value) => `0:${String(value).padStart(2, '0')}`} // 格式化显示为 0:XX
                        />
                    </Form.Item>

                    <Form.Item
                        label="Exercise Execution Duration"
                        name="exerciseDuration"
                        initialValue={30} // 默认值为 30 秒
                    >
                        <NumberStepper
                            min={10}
                            max={40}
                            step={10}
                            formatter={(value) => `0:${String(value).padStart(2, '0')}`} // 格式化显示为 0:XX
                        />
                    </Form.Item>
                </>
            ),
        }
    ], [difficultyOptions, PositionOptions, targetOptions, equipmentOptions]);

    // --- 添加 Collapse onChange 的包装函数 ---
    const handleCollapseChange = useCallback((keys) => {
        console.log('[EditorFormPanel] handleCollapseChange called with keys:', keys);
        onCollapseChange(keys); // 调用从父组件传入的原始 onChange
    }, [onCollapseChange]);
    // --- 包装函数结束 ---

    // 生成 Structure Collapse 项列表
    const structureCollapseItems = useMemo(() => (structurePanelsData || []).map((panel, index) => {
        const structureName = formInstance.getFieldValue(['structures', panel.id, 'name']) || panel.name || `Structure ${index + 1}`;
        const structureRound = formInstance.getFieldValue(['structures', panel.id, 'round']) || panel.round || 1;

        return {
            key: `structure-${panel.id}`, // 改回：使用 panel id 确保 key 的唯一性
            label: (
                <Space>
                    <VideoCameraOutlined className="collapse-left-icon" />
                    Structure Name & Reps
                </Space>
            ),
            children: (
                // 每个 Structure 的 DndContext 和 SortableContext
                <div key={panel.id} className="structure-panel-container"> {/* 每个 Structure 的外层容器 */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, panel.id)}
                    >
                        <SortableContext
                            items={panel.items.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="structure-panel-content">
                                {/* 结构名称输入和轮次设置 */}
                                <div className="structure-name-input-container">
                                    <Form.Item
                                        name={['structures', panel.id, 'name']}
                                        label={<Typography.Text strong className="structure-name-label">Structure Name</Typography.Text>}
                                        rules={[{ required: true, message: 'Structure name is required' }]}
                                        className="structure-name-form-item"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        initialValue={panel.name} // 设置初始值
                                    >
                                        <Input
                                            placeholder="Enter structure name"
                                            maxLength={100}
                                            showCount
                                            className="structure-name-input"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name={['structures', panel.id, 'round']}
                                        label="Reps"
                                        rules={[{ required: true, message: 'Reps number is required' }]}
                                        initialValue={panel.round || 1}
                                        className="round-form-item"
                                    >
                                        <NumberStepper min={1} max={5} step={1} />
                                    </Form.Item>
                                </div>
                                <div className='structure-list'> {/* 结构项列表容器 */}
                                    {panel.items && panel.items.map((item) => (
                                        <SortableItemRenderer
                                            key={item.id}
                                            panelId={panel.id}
                                            item={item}
                                            isExpanded={expandedItems[panel.id] === item.id}
                                            toggleExpandItem={toggleExpandItem}
                                            onOpenReplaceModal={handleOpenReplaceModal}
                                            onCopyItem={onCopyItem}
                                            onDeleteItem={onDeleteItem}
                                            onItemChange={onItemChange}
                                        />
                                    ))}
                                </div>
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            ),
        };
    }), [
        structurePanelsData, formInstance, sensors, handleDragEnd, expandedItems,
        toggleExpandItem, handleOpenReplaceModal, onCopyItem, onDeleteItem, onItemChange
    ]);

    // --- 计算一个表示所有面板项目数量的字符串，用于 useMemo 依赖 ---
    const itemCountsString = structurePanelsData.map(p => p.items?.length || 0).join(',');

    // 生成 Workout Data Collapse 项 (如果需要)
    const workoutDataCollapseItem = useMemo(() => {
        if (!structurePanelsData || structurePanelsData.length === 0) {
            return null; // 如果没有 Structure，则不生成 Workout Data 项
        }

        // --- 获取相关时长值（单位：秒），提供默认值 ---
        // 使用与 Form.Item initialValue 一致的默认值，防止初始计算为 0
        const introDuration = watchedIntroDuration ?? 10; // 默认 10 秒
        const exercisePreviewDuration = watchedExercisePreviewDuration ?? 10; // 默认 10 秒
        const exerciseDuration = watchedExerciseDuration ?? 0; // 默认 0 秒
        const weightKg = 75; // 体重用于卡路里计算

        let totalStructureTimeContributionSeconds = 0; // 存储所有 structure 对总时长的贡献（秒）
        let totalCalories = 0;

        // --- 遍历每个 Structure Panel 计算时长和卡路里 ---
        (structurePanelsData || []).forEach(panel => {
            // 获取当前 panel 的轮次 (reps) - 从 watchedStructures 获取最新值
            const round = watchedStructures?.[panel.id]?.round || panel.round || 1;
            // 获取当前 panel 的项目数量
            const numberOfItems = panel.items?.length || 0;

            // 计算当前 panel 对总时长的贡献（单位：秒） = (  运动时长) * 项目数 * 轮次
            // const panelTimeContribution = (exercisePreviewDuration + exerciseDuration) * numberOfItems * round;
            const panelTimeContribution = exerciseDuration * numberOfItems * round;
            totalStructureTimeContributionSeconds += panelTimeContribution; // 累加每个 panel 的时长贡献（秒）
            // 计算当前 panel 的总卡路里 (如果项目有 MET 值)
            (panel.items || []).forEach(item => {
                const met = item.met;
                // const itemSingleDuration = exercisePreviewDuration + exerciseDuration; // 单个项目的时长（预览+执行，单位：秒）
                const itemSingleDuration = exerciseDuration; // 单个项目的时长（预览+执行，单位：秒）
                if (met !== undefined && met !== null && typeof met === 'number' && met > 0 && itemSingleDuration > 0) {
                    // 卡路里计算基于单个项目重复 round 次
                    console.log(met, weightKg, itemSingleDuration, round);
                    totalCalories += (met * weightKg / 3600) * itemSingleDuration * round;
                }
            });
        });

        // --- 计算最终的总时长（单位：秒），根据用户公式: Intro + (Preview + Exercise) * Sum(Items * Reps) ---
        // 注意：totalStructureTimeContributionSeconds 已经包含了 (Preview + Exercise) * Sum(Items * Reps) 这部分（单位：秒）
        const totalDurationSeconds = introDuration + totalStructureTimeContributionSeconds;

        // --- 计算总分钟数（从总秒数转换，并四舍五入到最近的分钟）---
        let roundedMinutes = 0;
        if (totalDurationSeconds > 0) {
            const totalMinutesFloat = totalDurationSeconds / 60;
            const secondsPart = totalDurationSeconds % 60;
            // 不足 30 秒向下取整，大于等于 30 秒向上取整
            roundedMinutes = secondsPart < 30 ? Math.floor(totalMinutesFloat) : Math.ceil(totalMinutesFloat);
        }

        // --- 计算总卡路里（向上取整）---
        const roundedCalories = Math.ceil(totalCalories);

        return {
            key: '4', // Workout Data 面板的 Key
            label: (
                <Space>
                    <InfoCircleOutlined className="collapse-left-icon" />
                    Workout Data
                </Space>
            ),
            children: (
                <>
                    {/* 使用 Row 和 Col 实现左右布局 */}
                    <Row align="middle" justify="space-between" style={{ marginBottom: '8px' }}>
                        <Col>
                            <Typography.Text className="calculated-data-label">Duration (Min): </Typography.Text>
                        </Col>
                        <Col>
                            {/* 改为显示总秒数 */}
                            <Typography.Text strong className="calculated-data-value">{`${totalDurationSeconds} sec`}</Typography.Text>
                        </Col>
                    </Row>
                    {/* 对卡路里也使用 Row 和 Col */}
                    <Row align="middle" justify="space-between">
                        <Col>
                            <Typography.Text className="calculated-data-label">Calorie:</Typography.Text>
                        </Col>
                        <Col>
                            <Typography.Text strong className="calculated-data-value">{`${roundedCalories} kcal`}</Typography.Text>
                        </Col>
                    </Row>
                </>
            ),
        };
    }, [
        structurePanelsData, // 依赖原始数据以访问 panel ID 和 items (用于卡路里计算等)
        itemCountsString,   // 依赖 items 数量的变化
        watchedIntroDuration,
        watchedExercisePreviewDuration,
        watchedExerciseDuration,
        watchedStructures
    ]); // 完整依赖数组

    // --- 合并基础项和动态生成的 Structure 项 ---
    const generateCollapseItems = useMemo(() => {
        // --- 合并基础项和动态生成的 Structure 项 ---
        return [...baseCollapseItems, ...structureCollapseItems, ...(workoutDataCollapseItem ? [workoutDataCollapseItem] : [])];
    }, [
        baseCollapseItems, structureCollapseItems, workoutDataCollapseItem
    ]);

    // 过滤传递给弹框内 ContentLibraryPanel 的数据
    // （如果弹框内的搜索/筛选需要独立于外部，则需要单独的状态和逻辑）
    // 当前实现：弹框内的搜索/筛选与外部联动
    const filteredContentLibraryForModal = useMemo(() => {
        let tempData = [...(contentLibraryData || [])];

        // 1. 按搜索词筛选
        if (contentSearchValue) {
            const lowerCaseSearch = contentSearchValue.toLowerCase();
            tempData = tempData.filter(item =>
                item.displayName && item.displayName.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // 2. 按选定的筛选器筛选
        Object.keys(contentFilters || {}).forEach(key => {
            const selectedOptions = contentFilters[key];
            if (selectedOptions && selectedOptions.length > 0) {
                if (key === 'target') {
                    tempData = tempData.filter(item => {
                        if (!item.target) return false;
                        const itemTargets = item.target.split(',').map(t => t.trim());
                        return selectedOptions.some(filterTarget => itemTargets.includes(filterTarget));
                    });
                } else {
                    tempData = tempData.filter(item => item[key] && selectedOptions.includes(item[key]));
                }
            }
        });
        return tempData;
    }, [contentLibraryData, contentSearchValue, contentFilters]);

    return (
        <div className={`editor-form-panel`}>
            <div className="title"> {/* 面板标题 */}
                <span>{workoutNameHeader}</span> {/* 动态标题显示 Workout 名称 */}
                <Popover
                    content="Create a workout video tailored to your clients' needs using our library of stock exercise clips."
                    trigger="click"
                    placement="bottom"
                >
                    <InfoOutlined className="info-icon" /> {/* 信息提示图标 */}
                </Popover>
            </div>

            <Form
                form={formInstance}
                layout="vertical"
                onValuesChange={handleFormChange}
                className="editor-form"
                onFinish={onFinish}
                onFinishFailed={(errorInfo) => {
                    console.log('Form validation failed:', errorInfo);
                    // 新逻辑：只处理第一个错误字段
                    if (errorInfo.errorFields && errorInfo.errorFields.length > 0) {
                        const firstErrorField = errorInfo.errorFields[0];
                        if (firstErrorField.errors && firstErrorField.errors.length > 0) {
                            notification.error({
                                message: `Input Error: ${firstErrorField.name.join('.')}`, // 字段名
                                description: firstErrorField.errors[0], // 错误信息
                                placement: 'topRight',
                            });
                        }
                    }
                }}
            >
                {/* --- 渲染第一部分 Collapse：基础设置 --- */}
                <Collapse
                    items={baseCollapseItems}
                    activeKey={activeCollapseKeys}
                    onChange={handleCollapseChange}
                    ghost
                    expandIconPosition="end"
                    expandIcon={({ isActive }) => isActive ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                    className="workout-details-collapse"
                    motion={null}
                />

                {/* --- 在基础设置后、Structure 项前添加 Structure 标题和添加按钮 --- */}
                {structureCollapseItems && structureCollapseItems.length > 0 && (
                    <div className="structure-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', marginTop: '16px', paddingLeft: '12px', paddingRight: '12px' /* 添加右边距 */ }}>
                        <Typography.Title level={5} style={{ marginBottom: '0', fontWeight: '600', color: 'var(--primary-color)' }}>Structure</Typography.Title>
                        <Button
                            type="text" // 改为文本按钮，更融入标题栏
                            onClick={onAddStructurePanel}
                            icon={<PlusOutlined />}
                            style={{ color: 'var(--primary-color)', padding: '0 4px', fontSize: '16px' /* 调整内边距 */ }}
                        >
                            Add
                        </Button>
                    </div>
                )}

                {/* --- 渲染第二部分 Collapse：Structure 列表 --- */}
                {structureCollapseItems && structureCollapseItems.length > 0 && (
                    <Collapse
                        items={structureCollapseItems}
                        activeKey={activeCollapseKeys}
                        onChange={handleCollapseChange}
                        ghost
                        expandIconPosition="end"
                        expandIcon={({ isActive }) => isActive ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                        className="workout-details-collapse structure-collapse" // 添加特定类名以便样式调整
                        motion={null}
                    />
                )}

                {/* --- 渲染第三部分 Collapse：Workout Data (仅当有数据时) --- */}
                {workoutDataCollapseItem && (
                    <Collapse
                        items={[workoutDataCollapseItem]} // 需要传入数组
                        activeKey={activeCollapseKeys}
                        onChange={handleCollapseChange}
                        ghost
                        expandIconPosition="end"
                        expandIcon={({ isActive }) => isActive ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                        className="workout-details-collapse workout-data-collapse" // 添加特定类名
                        motion={null}
                    />
                )}
            </Form>

            {/* 替换弹框 Modal 组件 */}
            <Modal
                title="Replace Exercise" // 弹框标题
                open={isReplaceModalVisible} // 控制显示
                onOk={handleModalConfirm} // 确认回调
                onCancel={handleModalCancel} // 取消回调
                okText="Confirm Replace" // 确认按钮文字 (更新)
                cancelText="Cancel" // 取消按钮文字
                width="90%" // 进一步增加宽度 (从 80% 到 90%)
                // 确认按钮在未选择替换项目时禁用
                okButtonProps={{ disabled: !selectedItemInModal }}
                destroyOnClose // 关闭时销毁内部状态
                styles={{ body: { height: '60vh', overflowY: 'auto', width: '700px' } }} // 允许内容库滚动
            >
                {/* 渲染 ContentLibraryPanel */}
                <ContentLibraryPanel
                    // 传递过滤后的数据给弹框内的内容库
                    contentLibraryData={filteredContentLibraryForModal}
                    // 在弹框中点击添加按钮时，调用 handleSelectItemInModal
                    onAddItem={handleSelectItemInModal}
                    // 将外部的搜索/筛选状态和处理函数传递给弹框内的内容库
                    searchValue={contentSearchValue}
                    onSearchChange={onContentSearchChange}
                    onFilterChange={onContentFilterChange}
                    activeFilters={contentFilters}
                    hasActiveFilters={hasActiveContentFilters}
                    // --- 新增：传递选择模式和当前选中项ID ---
                    selectionMode="replace" // 设置为替换选择模式
                    // 优先使用弹框中已选中的项目ID，否则使用初始要替换项的 libraryId
                    selectedItemId={selectedItemInModal?.id || replacingItemInfo?.libraryId}
                />
            </Modal>
        </div>
    );
};

export default EditorFormPanel;