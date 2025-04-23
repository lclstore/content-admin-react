import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Input, Button, Spin, Dropdown, Modal, message, Tooltip, theme, Form, Checkbox, Table } from 'antd';
import {
    PlusOutlined,
    EllipsisOutlined,
    EditOutlined,
    CopyOutlined,
    DeleteOutlined,
    CheckOutlined,
    StopOutlined,
    DisconnectOutlined,
    UndoOutlined,
    CloseOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils';
import { debounce } from 'lodash';
import WorkoutMediaCell from '@/components/MediaCell/MediaCell';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import TagSelector from '@/components/TagSelector/TagSelector';
import {
    statusOrder,
    difficultyOrder,
    mockWorkoutsForList,
    WORKOUT_LIST_VISIBLE_COLUMNS_KEY,
    DEFAULT_VISIBLE_TABLE_COLUMN_KEYS,
    ALL_TABLE_COLUMN_KEYS,
    filterSections,
    BATCH_FILE_OPTIONS,
    MOCK_LANG_OPTIONS
} from './Data';

export default function WorkoutsList() {
    // 1. State Definitions
    const { setSaveButtonState } = useContext(HeaderContext);
    const navigate = useNavigate();
    const [dataSource, setDataSource] = useState(mockWorkoutsForList);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({ status: [], functionType: [], difficulty: [], position: [], target: [] });
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionClicked, setActionClicked] = useState(false);
    const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
    const [duplicatedRecord, setDuplicatedRecord] = useState(null);
    const [operationHistory, setOperationHistory] = useState([]);
    const [undoMessage, setUndoMessage] = useState(null);
    const [canUndo, setCanUndo] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isInteractionBlockingRowClick, setIsInteractionBlockingRowClick] = useState(false);

    // 批量创建文件 Modal 状态
    const [isBatchCreateModalVisible, setIsBatchCreateModalVisible] = useState(false);
    const [batchCreateForm] = Form.useForm(); // 获取 Form 实例
    const [batchCreateLoading, setBatchCreateLoading] = useState(false); // Modal OK 按钮 loading

    // 获取 Ant Design 主题 Token
    const { token } = theme.useToken();

    // 定义左侧工具栏按钮点击处理函数
    const handleBatchCreateFile = useCallback(() => {
        // 重置表单并打开 Modal
        batchCreateForm.resetFields();
        batchCreateForm.setFieldsValue({ files: ['Video-M3U8'], lang: ['EN'] }); // 设置默认值
        setIsBatchCreateModalVisible(true);
    }, [batchCreateForm]); // 依赖 form 实例

    // 2. Callback Definitions (Handlers)
    const handleActionAreaClick = useCallback((e) => {
        setActionClicked(true);
        e.stopPropagation();
    }, []);

    const handleEdit = useCallback((record) => {
        navigate(`/workouts/editor?id=${record.id}`);
    }, [navigate]);

    // Define recordOperation before handleDuplicate/handleStatusChange if they use it
    const recordOperation = useCallback((type, oldData, newData, message) => {
        const historyItem = {
            type,
            timestamp: new Date().getTime(),
            oldData,
            newData,
            message
        };
        setOperationHistory(prev => [historyItem, ...prev].slice(0, 10));
        setUndoMessage(message);
        setCanUndo(true);
    }, []);

    const handleDuplicate = useCallback((record) => {
        setActionClicked(true);
        setActionInProgress(true);
        const newId = Math.max(...dataSource.map(item => item.id).filter(id => Number.isInteger(id)), 0) + 1;
        const newRecord = {
            ...record,
            id: newId,
            name: `${record.name} (Copy)`,
            status: 'Draft',
        };
        setDataSource(current => [...current, newRecord]);
        setDuplicatedRecord(newRecord);
        setActionInProgress(false);
        recordOperation('duplicate', record, newRecord, `已复制 "${record.name}"`);
        message.success(`成功复制 "${record.name}"`);
        setIsDuplicateModalVisible(true);
    }, [dataSource, setDataSource, setDuplicatedRecord, setIsDuplicateModalVisible, setActionInProgress, setActionClicked, recordOperation]);

    const handleStatusChange = useCallback((record, newStatus) => {
        setActionInProgress(true);
        const oldRecord = { ...record };
        const updatedRecord = { ...record, status: newStatus };
        setDataSource(current =>
            current.map(item =>
                item.id === record.id ? updatedRecord : item
            )
        );
        setActionInProgress(false);
        const actionMap = {
            'Enabled': 'enabled',
            'Disabled': 'disabled',
            'Deprecated': 'deprecated',
            'Premium': 'added to subscription'
        };
        recordOperation('status', oldRecord, updatedRecord, `Changed status of "${record.name}" to ${newStatus}`);
        message.success(`Successfully ${actionMap[newStatus]} "${record.name}"`);
    }, [setDataSource, setActionInProgress, recordOperation]);

    const menuItems = useCallback((record) => {
        const items = [];
        const handleMenuClick = (key, record, e) => {
            if (e && e.domEvent) e.domEvent.stopPropagation();
            setCurrentRecord(record);
            switch (key) {
                case 'edit': handleEdit(record); break;
                case 'duplicate': handleDuplicate(record); break;
                case 'delete': setIsDeleteModalVisible(true); break;
                case 'enable': handleStatusChange(record, 'Enabled'); break;
                case 'disable': handleStatusChange(record, 'Disabled'); break;
                case 'deprecate': handleStatusChange(record, 'Deprecated'); break;
                default: break;
            }
        };
        const addItem = (key, label, icon) => items.push({ key, label, icon, onClick: (e) => handleMenuClick(key, record, e) });
        const addCommonActions = () => { addItem('edit', 'Edit', <EditOutlined />); addItem('duplicate', 'Duplicate', <CopyOutlined />); };
        switch (record.status) {
            case 'Draft': addCommonActions(); addItem('delete', 'Delete', <DeleteOutlined />); break;
            case 'Disabled': addCommonActions(); addItem('enable', 'Enable', <CheckOutlined />); addItem('delete', 'Delete', <DeleteOutlined />); break;
            case 'Enabled': addCommonActions(); addItem('disable', 'Disable', <StopOutlined />); break;
            case 'Premium': addCommonActions(); addItem('disable', 'Disable', <StopOutlined />); break;
            case 'Deprecated': addItem('duplicate', 'Duplicate', <CopyOutlined />); break;
            default: break;
        }
        return items;
    }, [handleEdit, handleDuplicate, setIsDeleteModalVisible, handleStatusChange, setCurrentRecord]);

    const actionRender = useCallback((text, record) => (
        <div className="actions-container" onClick={handleActionAreaClick} onMouseDown={(e) => e.stopPropagation()}>
            <Dropdown menu={{ items: menuItems(record) }} trigger={['click']} onClick={handleActionAreaClick} className="action-dropdown">
                <Button type="text" icon={<EllipsisOutlined />} className="action-button" onClick={handleActionAreaClick} />
            </Dropdown>
        </div>
    ), [handleActionAreaClick, menuItems]);

    // 3. Memoized Definitions (that depend on handlers)
    const allColumnDefinitions = useMemo(() => {
        const definitions = [
            { title: 'Cover Image', showNewBadge: true, showLock: true, type: 'video', width: 120, dataIndex: 'coverImage', key: 'image', className: 'media-cell' },
            { title: 'Detail Image', type: 'image', dataIndex: 'detailImage', key: 'detailImage', className: 'media-cell', width: 120 },
            { title: 'Thumbnail Image', type: 'image', dataIndex: 'thumbnailImage', key: 'thumbnailImage', className: 'media-cell', width: 120 },
            { title: 'Complete Image', type: 'image', dataIndex: 'completeImage', key: 'completeImage', className: 'media-cell', width: 150 },
            { title: 'Name', dataIndex: 'name', key: 'name', width: 350, render: (name) => <div className='name-cell'>{name}</div> },
            {
                title: 'Status', dataIndex: 'status', key: 'status',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                showSorterTooltip: false,
                width: 120,
                ellipsis: true,
                render: (status) => {
                    let color;
                    switch (status) {
                        case 'Draft': color = token.colorTextSecondary; break;
                        case 'Enabled': color = token.colorSuccess; break;
                        case 'Disabled': color = token.colorError; break;
                        case 'Deprecated': color = '#bfcaca'; break;
                        case 'Premium': color = token.colorInfo; break;
                        default: color = token.colorText;
                    }
                    return <span style={{ color }}>{status}</span>;
                }
            },
            { title: 'Premium', dataIndex: 'isSubscription', key: 'subscription', render: (isSubscription) => (isSubscription ? <CheckOutlined className='success-icon' /> : <CloseOutlined className='error-icon' />), align: 'center', width: 120 },
            {
                title: 'Duration (Min)', align: 'center', dataIndex: 'duration', key: 'duration',
                sorter: (a, b) => (a.duration || 0) - (b.duration || 0),
                width: 150,
                render: (duration) => {
                    if (!duration) return '-';
                    const minutes = Math.floor(duration / 60);
                    const seconds = duration % 60;
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            },
            { title: 'Calorie (Kcal)', align: 'center', dataIndex: 'calorie', key: 'calorie', sorter: (a, b) => (a.calorie || 0) - (b.calorie || 0), render: (calorie) => calorie || '-', align: 'right', width: 150 },
            { title: 'Difficulty', dataIndex: 'difficulty', key: 'difficulty', sorter: (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty], width: 100, ellipsis: true },
            { title: 'Equipment', dataIndex: 'equipment', key: 'equipment', width: 200, ellipsis: true },
            { title: 'Position', dataIndex: 'position', key: 'position', sorter: (a, b) => (a.position || '').localeCompare(b.position || ''), width: 100, ellipsis: true },
            { title: 'Target', dataIndex: 'target', key: 'target', width: 200, ellipsis: true },
            { title: 'Exercise Num', align: 'center', dataIndex: 'exerciseNum', key: 'exerciseNum', sorter: (a, b) => (a.exerciseNum || 0) - (b.exerciseNum || 0), width: 130 },
            {
                title: 'New Date',
                key: 'newDate',
                render: (text, record) => {
                    const startTime = record.newStartTime ? formatDate(record.newStartTime, 'YYYY-MM-DD') : '-';
                    const endTime = record.newEndTime ? formatDate(record.newEndTime, 'YYYY-MM-DD') : '-';
                    if (startTime === '-' && endTime === '-') return '-';
                    return `${startTime} to ${endTime}`;
                },
                width: 220
            },
            { title: 'Audio Lang', dataIndex: 'audioLang', key: 'audioLang', width: 120, ellipsis: true },
            {
                title: 'File Status', dataIndex: 'fileStatus', key: 'fileStatus',
                width: 120,
                ellipsis: true,
                render: (status) => {
                    let color;
                    switch (status) {
                        case 'Successful': color = token.colorSuccess; break;
                        case 'Processing': color = token.colorInfo; break;
                        case 'Failed': color = token.colorError; break;
                        default: color = token.colorText;
                    }
                    return <span style={{ color }}>{status || '-'}</span>;
                }
            },
            { title: 'Actions', key: 'actions', fixed: 'right', width: 70, align: 'center', render: actionRender },
        ];
        return definitions;
    }, [actionRender, token]);

    // 4. Memoized calculations (that depend on definitions)
    const configurableKeys = useMemo(() => new Set([...DEFAULT_VISIBLE_TABLE_COLUMN_KEYS, ...ALL_TABLE_COLUMN_KEYS]), []);
    const mandatoryKeys = useMemo(() =>
        allColumnDefinitions
            .map(col => col.key || col.dataIndex)
            .filter(key => key && !configurableKeys.has(key))
        , [allColumnDefinitions, configurableKeys]);
    // 5. State that depends on memoized calculations
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
        let initialKeys;
        try {
            const storedKeys = localStorage.getItem(WORKOUT_LIST_VISIBLE_COLUMNS_KEY);
            if (storedKeys) {
                const parsedKeys = JSON.parse(storedKeys);
                initialKeys = Array.from(new Set([...parsedKeys, ...mandatoryKeys]));
            } else {
                initialKeys = Array.from(new Set([...DEFAULT_VISIBLE_TABLE_COLUMN_KEYS, ...mandatoryKeys]));
            }
        } catch (error) {
            console.error("从 localStorage 读取列可见性错误:", error);
            initialKeys = Array.from(new Set([...DEFAULT_VISIBLE_TABLE_COLUMN_KEYS, ...mandatoryKeys]));
        }
        return initialKeys;
    });

    // 6. Callback that depends on state/memoized values
    const handleVisibilityChange = useCallback((newVisibleKeysFromPopover) => {
        const finalKeys = Array.from(new Set([...newVisibleKeysFromPopover, ...mandatoryKeys]));
        setVisibleColumnKeys(finalKeys);
        try {
            localStorage.setItem(WORKOUT_LIST_VISIBLE_COLUMNS_KEY, JSON.stringify(finalKeys));
        } catch (error) {
            console.error("保存列可见性到 localStorage 错误:", error);
        }
    }, [mandatoryKeys]);

    const onSelectChange = useCallback((newSelectedRowKeys) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    }, []);

    // Define debouncedSearch before handlers that use it
    const debouncedSearch = useMemo(() => debounce((searchText, filters) => {
        setLoading(true);
        setTimeout(() => {
            let filteredData = mockWorkoutsForList;
            const statuses = filters?.status || [];
            if (statuses.length > 0) filteredData = filteredData.filter(w => statuses.includes(w.status));
            const types = filters?.type || []; // Assuming type filter might exist
            if (types.length > 0) filteredData = filteredData.filter(w => types.includes(w.type));
            const difficulties = filters?.difficulty || [];
            if (difficulties.length > 0) filteredData = filteredData.filter(w => difficulties.includes(w.difficulty));
            const positions = filters?.position || [];
            if (positions.length > 0) filteredData = filteredData.filter(w => positions.includes(w.position));
            const targets = filters?.target || [];
            if (targets.length > 0) {
                filteredData = filteredData.filter(w => {
                    if (!w.target) return false;
                    const workoutTargets = w.target.split(', ').map(t => t.trim().toLowerCase());
                    return targets.some(ft => workoutTargets.includes(ft.toLowerCase()));
                });
            }
            if (searchText) {
                const lowerCaseSearch = searchText.toLowerCase();
                filteredData = filteredData.filter(w =>
                    (w.name && w.name.toLowerCase().includes(lowerCaseSearch)) ||
                    (w.equipment && w.equipment.toLowerCase().includes(lowerCaseSearch)) ||
                    (w.target && w.target.toLowerCase().includes(lowerCaseSearch))
                );
            }
            setDataSource(filteredData);
            setLoading(false);
        }, 500);
    }, 300), [mockWorkoutsForList, setDataSource, setLoading]); // mockWorkoutsForList is likely stable, but include just in case

    const handleSearchInputChange = useCallback((e) => {
        const { value } = e.target;
        setSearchValue(value);
        debouncedSearch(value, selectedFilters);
    }, [debouncedSearch, selectedFilters]);

    const handleFilterUpdate = useCallback((newFilters) => {
        setSelectedFilters(newFilters);
        debouncedSearch(searchValue, newFilters);
    }, [debouncedSearch, searchValue]);

    const handleFilterReset = useCallback(() => {
        setSelectedFilters({});
        setSearchValue('');
        debouncedSearch('', {}); // Reset search with empty values
    }, [debouncedSearch]);

    // 新增：处理交互状态变化的回调
    const handleInteractionStateChange = useCallback((isBlocking) => {
        console.log('Interaction blocking row click:', isBlocking); // 调试日志
        setIsInteractionBlockingRowClick(isBlocking);
    }, []);

    const handleRowClick = useCallback((record, event) => {
        // 首先检查交互状态是否阻止点击
        if (isInteractionBlockingRowClick) {
            console.log('Row click blocked by interaction state');
            return;
        }

        // 检查点击事件是否起源于操作按钮容器 (保持这个检查)
        const isActionClick = event.target.closest('.actions-container');

        // 如果是操作按钮点击，或全局 actionClicked 标志为 true，则阻止导航
        if (actionClicked || isActionClick) {
            console.log('Row click blocked by:', { actionClicked, isActionClick });
            return; // 阻止导航
        }

        // 如果以上都不是，则执行导航
        console.log('Row click allowed, navigating.');
        navigate(`/workouts/editor?id=${record.id}`);
    }, [navigate, actionClicked, isInteractionBlockingRowClick]); // 添加 isInteractionBlockingRowClick 依赖

    const handleUndo = useCallback(() => {
        if (operationHistory.length === 0) return;
        const lastOperation = operationHistory[0];
        switch (lastOperation.type) {
            case 'duplicate':
                setDataSource(current => current.filter(item => item.id !== lastOperation.newData.id));
                message.success('Successfully undone duplicate operation');
                break;
            case 'delete':
                if (lastOperation.oldData) {
                    setDataSource(current => [...current, lastOperation.oldData]);
                    message.success('Successfully restored deleted item');
                } else {
                    message.error("Could not restore item: original data missing.");
                }
                break;
            case 'status':
                setDataSource(current => current.map(item => item.id === lastOperation.oldData.id ? lastOperation.oldData : item));
                message.success('Successfully undone status change');
                break;
            default: message.info('Cannot undo this operation'); break;
        }
        setOperationHistory(prev => prev.slice(1));
        setUndoMessage(null);
        setCanUndo(false);
    }, [operationHistory]);

    // 批量创建 Modal 取消处理
    const handleBatchCreateModalCancel = useCallback(() => {
        setIsBatchCreateModalVisible(false);
    }, []);

    // 批量创建 Modal 确认处理
    const handleBatchCreateModalOk = useCallback(async () => {
        try {
            setBatchCreateLoading(true);
            const values = await batchCreateForm.validateFields();
            const { files, lang } = values;

            // 模拟音频文件校验
            if (files.includes('Audio-JSON')) {
                // TODO: 替换为真实的校验逻辑
                // 假设校验选中 workout 的选中语言音频是否存在
                const audioCheckPassed = Math.random() > 0.2; // 模拟 80% 成功率
                if (!audioCheckPassed) {
                    message.error('Lack of audio.');
                    setBatchCreateLoading(false);
                    return;
                }
            }

            // 模拟生成文件并更新数据源
            // TODO: 替换为真实的 API 调用和数据更新逻辑
            const updatedDataSource = dataSource.map(item => {
                if (selectedRowKeys.includes(item.id)) {
                    let updatedItem = { ...item };
                    if (files.includes('Audio-JSON')) {
                        // 更新 Audio Language 字段
                        const existingLangs = new Set((updatedItem.audioLang || '').split(',').map(l => l.trim()).filter(Boolean));
                        lang.forEach(l => existingLangs.add(l));
                        updatedItem.audioLang = Array.from(existingLangs).sort().join(', ');
                    }
                    // 可以在这里模拟更新其他字段或文件状态
                    return updatedItem;
                }
                return item;
            });
            setDataSource(updatedDataSource);
            console.log(selectedRowKeys);
            console.log(batchCreateForm.getFieldsValue());
            console.log(batchCreateForm.getFieldValue('files'));
            console.log(batchCreateForm.getFieldValue('lang'));

            message.success(`任务已提交，将为 ${selectedRowKeys.length} 个 Workout 生成文件。`);
            setIsBatchCreateModalVisible(false);

        } catch (errorInfo) {
            console.log('Validation Failed:', errorInfo);
            // Antd Form 会自动显示校验错误，这里可以不加 message
        } finally {
            setBatchCreateLoading(false);
        }
    }, [batchCreateForm, selectedRowKeys, dataSource, setDataSource]);

    // 7. Effects
    useEffect(() => {
        setSaveButtonState({
            showSaveButton: true,
            saveButtonText: 'Create Workout',
            saveButtonIcon: PlusOutlined,
            saveButtonType: 'primary',
            saveButtonLoading: false,
            saveButtonDisabled: false,
            onSaveButtonClick: () => navigate('/workouts/editor'),
            showBackButton: false
        });

        return () => {
            setSaveButtonState({
                showSaveButton: false,
                saveButtonText: 'SAVE CHANGES',
                saveButtonIcon: null,
                saveButtonLoading: false,
                saveButtonDisabled: false,
                onSaveButtonClick: () => { },
                showBackButton: true
            });
        };
    }, [setSaveButtonState, navigate]);

    useEffect(() => {
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    useEffect(() => {
        if (undoMessage) {
            const timer = setTimeout(() => { setUndoMessage(null); setCanUndo(false); }, 5000);
            return () => clearTimeout(timer);
        }
    }, [undoMessage]);

    // filteredDataForTable (保持不变)
    const filteredDataForTable = useMemo(() => {
        setLoading(true);
        let tempData = [...dataSource];
        try {
            // ... (filtering logic remains here) ...
        } catch (error) {
            // ... error handling ...
        } finally {
            setLoading(false);
        }
        return tempData;
    }, [dataSource, searchValue, selectedFilters, setLoading]);

    // 左侧工具栏按钮定义
    const leftToolbarItems = useMemo(() => [
        {
            key: 'batchCreate',
            label: 'Batch Create File',
            onClick: handleBatchCreateFile,
            icon: <PlusOutlined />,
            // 可以添加其他 Ant Design Button 支持的 props，例如 type, icon 等
            disabled: selectedRowKeys.length === 0 // 例如，根据是否有选中行来禁用按钮
        },
        // 可以添加更多按钮配置
    ], [handleBatchCreateFile, selectedRowKeys]); // 依赖回调函数和选中状态

    // extraToolbarItems (保持不变)
    const extraToolbarItems = useMemo(() => (
        <>
            {canUndo && (
                <div className="undo-message" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '10px' }}>
                    <span>{undoMessage}</span>
                    <Button type="link" icon={<UndoOutlined />} onClick={handleUndo} style={{ marginLeft: '5px' }}>Undo</Button>
                </div>
            )}
        </>
    ), [canUndo, undoMessage, handleUndo]);

    // Define rowSelection object
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 60, // 设置选择列宽度为 100px
        // 可以添加其他配置, 例如:
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
        ],
    };

    // 8. Return JSX
    return (
        <div className="workoutsContainer">
            <ConfigurableTable
                uniqueId={WORKOUT_LIST_VISIBLE_COLUMNS_KEY}
                columns={allColumnDefinitions}
                dataSource={filteredDataForTable}
                rowKey="id"
                loading={loading}
                onRowClick={handleRowClick}
                actionColumnKey="actions"
                mandatoryColumnKeys={mandatoryKeys}
                defaultVisibleColumnKeys={DEFAULT_VISIBLE_TABLE_COLUMN_KEYS}
                configurableColumnKeys={Array.from(configurableKeys)}
                visibleColumnKeys={visibleColumnKeys}
                onVisibilityChange={handleVisibilityChange}
                searchConfig={{
                    placeholder: "Search name or ID...",
                    searchValue: searchValue,
                    onSearchChange: handleSearchInputChange,
                }}
                filterConfig={{
                    filterSections: filterSections,
                    activeFilters: selectedFilters,
                    onUpdate: handleFilterUpdate,
                    onReset: handleFilterReset,
                }}
                leftToolbarItems={leftToolbarItems}
                extraToolbarItems={extraToolbarItems}
                rowSelection={rowSelection}
                onInteractionStateChange={handleInteractionStateChange}
            />

            <Modal
                title="Confirm Deletion"
                open={isDeleteModalVisible}
                onOk={() => {
                    setActionInProgress(true);
                    recordOperation('delete', currentRecord, null, `已删除 "${currentRecord.name}"`);
                    setDataSource(current => current.filter(item => item.id !== currentRecord.id));
                    setActionInProgress(false);
                    setIsDeleteModalVisible(false);
                    message.success(`Successfully deleted "${currentRecord.name}"`);
                }}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{
                    danger: true,
                    loading: actionInProgress
                }}
                cancelButtonProps={{ disabled: actionInProgress }}
            >
                <p>Are you sure you want to delete "{currentRecord?.name}"? This action cannot be undone.</p>
            </Modal>

            <Modal
                title="Workout Copied"
                open={isDuplicateModalVisible}
                onOk={() => {
                    setIsDuplicateModalVisible(false);
                    setTimeout(() => {
                        navigate(`/workouts/editor?id=${duplicatedRecord.id}`);
                    }, 100);
                }}
                onCancel={() => setIsDuplicateModalVisible(false)}
                okText="Edit Now"
                cancelText="Stay on List"
            >
                <p>"{duplicatedRecord?.name}" has been successfully created. Do you want to edit it now?</p>
            </Modal>

            {/* 批量创建文件 Modal */}
            <Modal
                title="Batch Create Files"
                open={isBatchCreateModalVisible}
                onOk={handleBatchCreateModalOk}
                onCancel={handleBatchCreateModalCancel}
                confirmLoading={batchCreateLoading}
                destroyOnClose // 关闭时销毁内部组件状态
                okText="OK"
                cancelText="Cancel"
            >
                <Form
                    style={{ width: '350px', height: '200px', padding: '20px 50px' }}
                    form={batchCreateForm}
                    layout="vertical"
                    name="batch_create_form"
                    initialValues={{ files: ['Video-M3U8'], lang: ['EN'] }} // 初始默认值
                >
                    <Form.Item
                        style={{ marginBottom: '26px' }}
                        name="files"
                        label="File"
                        rules={[{ required: true, message: 'Please select at least one file!' }]}
                    >
                        <TagSelector
                            options={BATCH_FILE_OPTIONS.map(opt => opt.value)}
                            mode="multiple"
                            placeholder="Select file"
                        />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.files !== currentValues.files}
                    >
                        {(form) => {
                            const filesValue = form.getFieldValue('files') || [];
                            const showLang = filesValue.includes('Audio-JSON');
                            return showLang ? (
                                <Form.Item
                                    name="lang"
                                    label="Lang (Required for Audio-JSON)"
                                    rules={[{ required: true, message: 'Please select at least one language for Audio!' }]}
                                >
                                    <TagSelector
                                        options={MOCK_LANG_OPTIONS.map(opt => opt.value)}
                                        mode="multiple"
                                        placeholder="Select languages"
                                    />
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}   