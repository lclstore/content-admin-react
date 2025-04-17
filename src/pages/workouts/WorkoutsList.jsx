import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Table, Input, Button, Spin, Dropdown, Modal, message, Badge, Tooltip } from 'antd';
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
    FilterOutlined,
    SearchOutlined,
    CloseOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils';
import { debounce } from 'lodash';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import WorkoutMediaCell from '@/components/MediaCell/MediaCell';
import './List.css';
import {
    statusOrder,
    difficultyOrder,
    mockWorkouts,
    WORKOUT_LIST_VISIBLE_COLUMNS_KEY,
    MANDATORY_COLUMN_KEYS,
    DEFAULT_VISIBLE_COLUMN_KEYS,
    filterSections
} from './Data';

export default function WorkoutsList() {
    const { setSaveButtonState } = useContext(HeaderContext);
    const navigate = useNavigate();
    const [dataSource, setDataSource] = useState(mockWorkouts);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({ status: [], functionType: [], difficulty: [], position: [], target: [] });
    const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
    const [previewVideoUrl, setPreviewVideoUrl] = useState('');
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionClicked, setActionClicked] = useState(false);
    const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
    const [duplicatedRecord, setDuplicatedRecord] = useState(null);
    const [operationHistory, setOperationHistory] = useState([]);
    const [undoMessage, setUndoMessage] = useState(null);
    const [canUndo, setCanUndo] = useState(false);

    // 恢复列可见性状态
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
        try {
            const storedKeys = localStorage.getItem(WORKOUT_LIST_VISIBLE_COLUMNS_KEY);
            if (storedKeys) {
                const parsedKeys = JSON.parse(storedKeys);
                // 确保强制列始终存在
                return Array.from(new Set([...parsedKeys, ...MANDATORY_COLUMN_KEYS]));
            }
        } catch (error) {
            console.error("从 localStorage 读取列可见性时出错:", error);
        }
        return [...DEFAULT_VISIBLE_COLUMN_KEYS]; // 使用默认值
    });

    // 恢复列可见性更改处理程序
    const handleVisibilityChange = (newVisibleKeys) => {
        // 确保强制列始终包含在内
        const finalKeys = Array.from(new Set([...newVisibleKeys, ...MANDATORY_COLUMN_KEYS]));
        setVisibleColumnKeys(finalKeys);
        try {
            localStorage.setItem(WORKOUT_LIST_VISIBLE_COLUMNS_KEY, JSON.stringify(finalKeys));
        } catch (error) {
            console.error("保存列可见性到 localStorage 时出错:", error);
        }
    };

    // 先定义 actionRender
    const actionRender = (text, record) => (
        <div
            className="actions-container"
            onClick={handleActionAreaClick}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Dropdown
                menu={{ items: menuItems(record) }}
                trigger={['click']}
                onClick={handleActionAreaClick}
                className="action-dropdown"
            >
                <Button
                    type="text"
                    icon={<EllipsisOutlined />}
                    className="action-button"
                    onClick={handleActionAreaClick}
                />
            </Dropdown>
        </div>
    );

    // 再定义 columns
    const columns = [
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            render: (text, record) => (
                <WorkoutMediaCell
                    record={record}
                    onVideoClick={handleVideoClick}
                />
            ),
            fixed: 'left',
            width: 150,
        },
        {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: 100,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name) => (
                <Tooltip placement="topLeft" title={name}>
                    <span>{name}</span>
                </Tooltip>
            ),
            ellipsis: { showTitle: false },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
            showSorterTooltip: false,
            width: 100,
            ellipsis: true,
        },
        {
            title: 'Subscription',
            dataIndex: 'isSubscription',
            key: 'subscription',
            render: (isSubscription) => (
                isSubscription
                    ? <CheckOutlined className='success-icon' />
                    : <CloseOutlined className='error-icon' />
            ),
            align: 'center',
            width: 120,
        },
        {
            title: 'Difficulty',
            dataIndex: 'difficulty',
            key: 'difficulty',
            sorter: (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty],
            showSorterTooltip: false,
            width: 100,
            ellipsis: true,
        },
        {
            title: 'Equipment',
            dataIndex: 'equipment',
            key: 'equipment',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Position',
            dataIndex: 'position',
            key: 'position',
            sorter: (a, b) => a.position - b.position,
            showSorterTooltip: false,
            width: 100,
        },
        {
            title: 'Target',
            dataIndex: 'target',
            key: 'target',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'New Start Time',
            dataIndex: 'newStartTime',
            key: 'newStartTime',
            sorter: (a, b) => new Date(a.newStartTime) - new Date(b.newStartTime),
            showSorterTooltip: false,
            render: (time) => formatDate(time, 'YYYY-MM-DD HH:mm'),
            width: 160,
        },
        {
            title: 'New End Time',
            dataIndex: 'newEndTime',
            key: 'newEndTime',
            sorter: (a, b) => new Date(a.newEndTime) - new Date(b.newEndTime),
            showSorterTooltip: false,
            render: (time) => formatDate(time, 'YYYY-MM-DD HH:mm'),
            width: 160,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 70,
            align: 'center',
            render: actionRender,
        },
    ];

    // 可选列（用于列设置 Popover）
    const optionalColumnsForSetting = useMemo(() => {
        return columns
            .filter(col => !MANDATORY_COLUMN_KEYS.includes(col.key || col.dataIndex))
            .map(col => ({ key: col.key || col.dataIndex, title: col.title }));
    }, [columns]);

    // 准备列设置 Filter Section 数据
    const columnSettingsSection = {
        title: 'Visible Columns',
        key: 'visibleColumns', // 使用唯一 key
        options: optionalColumnsForSetting.map(col => col.title), // Popover 显示列标题
        keys: optionalColumnsForSetting.map(col => col.key), // 内部使用列 key
    };

    useEffect(() => {
        setSaveButtonState({
            showSaveButton: true,
            saveButtonText: 'Add Workout',
            saveButtonIcon: PlusOutlined,
            saveButtonType: 'primary',
            saveButtonLoading: false,
            saveButtonDisabled: false,
            onSaveButtonClick: () => navigate('/workouts-editor'),
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
        const handleGlobalClick = () => {
            setActionClicked(false);
        };

        document.addEventListener('click', handleGlobalClick);

        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    useEffect(() => {
        if (undoMessage) {
            const timer = setTimeout(() => {
                setUndoMessage(null);
                setCanUndo(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [undoMessage]);

    const recordOperation = (type, oldData, newData, message) => {
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
    };

    const handleUndo = () => {
        if (operationHistory.length === 0) return;

        const lastOperation = operationHistory[0];
        switch (lastOperation.type) {
            case 'duplicate':
                setDataSource(current =>
                    current.filter(item => item.id !== lastOperation.newData.id)
                );
                message.success('成功撤销复制操作');
                break;

            case 'delete':
                setDataSource(current => [...current, lastOperation.oldData]);
                message.success('成功恢复已删除项目');
                break;

            case 'status':
                setDataSource(current =>
                    current.map(item =>
                        item.id === lastOperation.oldData.id ? lastOperation.oldData : item
                    )
                );
                message.success('成功撤销状态变更');
                break;

            default:
                message.info('无法撤销此操作');
                break;
        }

        setOperationHistory(prev => prev.slice(1));
        setUndoMessage(null);
        setCanUndo(false);
    };

    const menuItems = (record) => {
        const items = [];

        const handleMenuClick = (key, record, e) => {
            if (e && e.domEvent) {
                e.domEvent.stopPropagation();
            }

            console.log(`Clicked ${key} for record:`, record);
            setCurrentRecord(record);

            switch (key) {
                case 'edit':
                    handleEdit(record);
                    break;
                case 'duplicate':
                    handleDuplicate(record);
                    break;
                case 'delete':
                    setIsDeleteModalVisible(true);
                    break;
                case 'enable':
                    handleStatusChange(record, 'Enabled');
                    break;
                case 'disable':
                    handleStatusChange(record, 'Disabled');
                    break;
                case 'deprecate':
                    handleStatusChange(record, 'Deprecated');
                    break;
                default:
                    break;
            }
        };

        const addItem = (key, label, icon) => {
            items.push({
                key,
                label,
                icon,
                onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleMenuClick(key, record, e);
                },
            });
        };

        const addCommonActions = () => {
            addItem('edit', 'Edit', <EditOutlined />);
            addItem('duplicate', 'Duplicate', <CopyOutlined />);
        };

        switch (record.status) {
            case 'Draft':
                addCommonActions();
                addItem('delete', 'Delete', <DeleteOutlined />);
                break;
            case 'Disabled':
                addCommonActions();
                addItem('enable', 'Enable', <CheckOutlined />);
                addItem('delete', 'Delete', <DeleteOutlined />);
                break;
            case 'Enabled':
                addCommonActions();
                addItem('disable', 'Disable', <StopOutlined />);
                addItem('deprecate', 'Deprecate', <DisconnectOutlined />);
                break;
            case 'Subscription':
                addCommonActions();
                addItem('disable', 'Disable', <StopOutlined />);
                break;
            case 'Deprecated':
                addItem('duplicate', 'Duplicate', <CopyOutlined />);
                break;
            default:
                break;
        }

        return items;
    };

    const debouncedSearch = debounce((searchText, filters) => {
        setLoading(true);
        setTimeout(() => {
            let filteredData = mockWorkouts;

            const statuses = filters?.status || [];
            if (statuses.length > 0) {
                filteredData = filteredData.filter(workout => statuses.includes(workout.status));
            }

            const types = filters?.type || [];
            if (types.length > 0) {
                filteredData = filteredData.filter(workout => types.includes(workout.type));
            }

            const difficulties = filters?.difficulty || [];
            if (difficulties.length > 0) {
                filteredData = filteredData.filter(workout => difficulties.includes(workout.difficulty));
            }

            const positions = filters?.position || [];
            if (positions.length > 0) {
                filteredData = filteredData.filter(workout => positions.includes(workout.position));
            }

            const targets = filters?.target || [];
            if (targets.length > 0) {
                filteredData = filteredData.filter(workout => {
                    if (!workout.target) return false;
                    const workoutTargets = workout.target.split(', ').map(t => t.trim());
                    return targets.some(filterTarget => workoutTargets.includes(filterTarget));
                });
            }

            if (searchText) {
                const lowerCaseSearch = searchText.toLowerCase();
                filteredData = filteredData.filter(workout =>
                    (workout.name && workout.name.toLowerCase().includes(lowerCaseSearch)) ||
                    (workout.equipment && workout.equipment.toLowerCase().includes(lowerCaseSearch)) ||
                    (workout.target && workout.target.toLowerCase().includes(lowerCaseSearch))
                );
            }
            setDataSource(filteredData);
            setLoading(false);
        }, 500);
    }, 300);

    const handleSearchInputChange = (e) => {
        const { value } = e.target;
        setSearchValue(value);
        debouncedSearch(value, selectedFilters);
    };

    const handleFilterUpdate = (newFilters) => {
        setSelectedFilters(newFilters);
        debouncedSearch(searchValue, newFilters);
    };

    // 新增：处理列可见性 Popover 的更新
    const handleColumnVisibilityUpdate = (newSelections) => {
        // newSelections 格式为 { visibleColumns: ['Difficulty', 'Equipment', ...] }
        const selectedTitles = newSelections.visibleColumns || [];

        // 将选中的标题映射回列的 key
        const selectedKeys = optionalColumnsForSetting
            .filter(col => selectedTitles.includes(col.title))
            .map(col => col.key);

        handleVisibilityChange(selectedKeys);
    };

    const handleFilterReset = () => {
        const resetFilters = { status: [], functionType: [], difficulty: [], position: [], target: [] };
        setSelectedFilters(resetFilters);
        debouncedSearch(searchValue, resetFilters);
    };

    // 新增：处理列可见性 Popover 的重置
    const handleColumnVisibilityReset = () => {
        // 调用 handleVisibilityChange 并传入空数组，它会自动处理强制列
        handleVisibilityChange([]);
    };

    const handleRowClick = (record, event) => {
        // 检查点击事件是否源自 Ant Design 图片预览组件
        if (event.target.closest('.ant-image-preview-root')) {
            return; // 如果是，则不执行任何操作
        }

        if (actionClicked) {
            return;
        }

        navigate(`/workouts-editor?id=${record.id}`);
    };

    const handleVideoClick = (e, url) => {
        e.stopPropagation();
        setPreviewVideoUrl(url);
        setIsPreviewModalVisible(true);
    };

    const handlePreviewModalCancel = () => {
        setIsPreviewModalVisible(false);
        setPreviewVideoUrl('');
    };

    const handleEdit = (record) => {
        navigate(`/workouts-editor?id=${record.id}`);
    };

    const handleDuplicate = (record) => {
        setActionClicked(true);

        setActionInProgress(true);
        const newId = Math.max(...dataSource.map(item => item.id)) + 1;

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
    };

    const handleGoToEdit = () => {
        if (duplicatedRecord) {
            setIsDuplicateModalVisible(false);
            setTimeout(() => {
                navigate(`/workouts-editor?id=${duplicatedRecord.id}`);
            }, 100);
        }
    };

    const handleCancelEdit = () => {
        setIsDuplicateModalVisible(false);
    };

    const handleDelete = () => {
        if (!currentRecord) return;

        setActionInProgress(true);

        recordOperation('delete', currentRecord, null, `已删除 "${currentRecord.name}"`);

        setDataSource(current => current.filter(item => item.id !== currentRecord.id));

        setActionInProgress(false);
        setIsDeleteModalVisible(false);

        message.success(`成功删除 "${currentRecord.name}"`);
    };

    const handleStatusChange = (record, newStatus) => {
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
            'Subscription': 'added to subscription'
        };
        recordOperation('status', oldRecord, updatedRecord, `已将 "${record.name}" 的状态更改为 ${newStatus}`);

        message.success(`成功将 "${record.name}" ${actionMap[newStatus]}`);
    };

    const handleActionAreaClick = (e) => {
        setActionClicked(true);
        e.stopPropagation();
    };

    const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

    // 恢复根据可见性状态过滤列的逻辑
    const visibleColumns = useMemo(() => {
        return columns.filter(col => visibleColumnKeys.includes(col.key || col.dataIndex));
    }, [columns, visibleColumnKeys]);

    // 恢复计算可见列的总宽度的逻辑
    const totalVisibleWidth = useMemo(() => {
        return visibleColumns.reduce((acc, col) => {
            let width = 0;
            if (typeof col.width === 'number') {
                width = col.width;
            } else if (typeof col.width === 'string') {
                const parsedWidth = parseInt(col.width, 10);
                if (!isNaN(parsedWidth)) {
                    width = parsedWidth;
                }
            }
            // 给没有宽度的列一个默认值，以更好地估算总宽度
            // 也可以根据实际情况调整此默认值
            return acc + (width > 0 ? width : 150);
        }, 0);
    }, [visibleColumns]);

    // 准备传递给列设置 Popover 的初始选中值
    const initialVisibleColumnTitles = useMemo(() => {
        return {
            visibleColumns: optionalColumnsForSetting
                .filter(col => visibleColumnKeys.includes(col.key))
                .map(col => col.title)
        };
    }, [visibleColumnKeys, optionalColumnsForSetting]);

    // 检查列设置是否有非默认值
    const hasActiveColumnSettings = useMemo(() => {
        const currentOptionalVisibleKeys = visibleColumnKeys.filter(key => !MANDATORY_COLUMN_KEYS.includes(key));
        const defaultOptionalVisibleKeys = DEFAULT_VISIBLE_COLUMN_KEYS.filter(key => !MANDATORY_COLUMN_KEYS.includes(key));
        // 检查当前可选列集合是否与默认可选列集合不同（忽略顺序）
        return currentOptionalVisibleKeys.length !== defaultOptionalVisibleKeys.length ||
            !currentOptionalVisibleKeys.every(key => defaultOptionalVisibleKeys.includes(key));
    }, [visibleColumnKeys]);

    return (
        <div className="workoutsContainer">
            <div className="searchBar">
                <Input
                    placeholder="Search content ID or name..."
                    value={searchValue}
                    prefix={<SearchOutlined />}
                    onChange={handleSearchInputChange}
                    className="searchInput"
                    suffix={loading ? <Spin size="small" /> : null}
                    allowClear
                />
                <FiltersPopover
                    filterSections={filterSections}
                    activeFilters={selectedFilters}
                    onUpdate={handleFilterUpdate}
                    onReset={handleFilterReset}
                >
                    <Badge dot={hasActiveFilters} offset={[-10, 5]} className="larger-badge-dot">
                        <Button icon={<FilterOutlined />}>
                            Filters
                        </Button>
                    </Badge>
                </FiltersPopover>
                <FiltersPopover
                    filterSections={[columnSettingsSection]}
                    activeFilters={initialVisibleColumnTitles}
                    onUpdate={handleColumnVisibilityUpdate}
                    onReset={handleColumnVisibilityReset}
                    popoverPlacement="bottomRight"
                    applyImmediately={true}
                    clearButtonText="Reset"
                >
                    <Button icon={<SettingOutlined />}>
                        Table Settings
                    </Button>
                </FiltersPopover>
                {canUndo && (
                    <div className="undo-message">
                        <span>{undoMessage}</span>
                        <Button
                            type="link"
                            icon={<UndoOutlined />}
                            onClick={handleUndo}
                        >
                            撤销
                        </Button>
                    </div>
                )}
            </div>

            <Table
                columns={visibleColumns}
                dataSource={dataSource}
                rowKey="id"
                loading={loading}
                onRow={(record) => ({
                    onClick: (event) => {
                        handleRowClick(record, event);
                    },
                    style: { cursor: 'pointer' },
                })}
                pagination={{
                    total: dataSource.length,
                    pageSize: 10,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                }}
                scroll={{ x: totalVisibleWidth }}
            />

            <Modal
                title="视频预览"
                open={isPreviewModalVisible}
                onCancel={handlePreviewModalCancel}
                footer={null}
                destroyOnClose
                width={800}
            >
                {previewVideoUrl && (
                    <video
                        src={previewVideoUrl}
                        controls
                        autoPlay
                        style={{ width: '100%', maxHeight: '80vh' }}
                    >
                        您的浏览器不支持 video 标签。
                    </video>
                )}
            </Modal>

            <Modal
                title="确认删除"
                open={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="删除"
                cancelText="取消"
                okButtonProps={{
                    danger: true,
                    loading: actionInProgress
                }}
                cancelButtonProps={{ disabled: actionInProgress }}
            >
                <p>您确定要删除 "{currentRecord?.name}" 吗？此操作无法撤销。</p>
            </Modal>

            <Modal
                title="Workout 已复制"
                open={isDuplicateModalVisible}
                onOk={handleGoToEdit}
                onCancel={handleCancelEdit}
                okText="立即编辑"
                cancelText="留在列表"
            >
                <p>"{duplicatedRecord?.name}" 已成功创建。您想现在编辑它吗？</p>
            </Modal>
        </div>
    );
}   