import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Form, Table } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDateRange } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import TagSelector from '@/components/TagSelector/TagSelector';
// import { statusIconMap, resultIconMap, fileStatusIconMap } from '@/constants';
import {
    statusOrder,
    difficultyOrder,
    mockWorkoutsForList,
    filterSections,
    BATCH_FILE_OPTIONS,
    MOCK_LANG_OPTIONS
} from './Data';

export default function WorkoutsList() {
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const [dataSource, setDataSource] = useState(mockWorkoutsForList); // 表格数据源
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [], functionType: [], difficulty: [], position: [], target: [] }); // 筛选条件
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // 删除确认弹窗
    const [currentRecord, setCurrentRecord] = useState(null); // 当前操作的记录
    const [actionInProgress, setActionInProgress] = useState(false); // 操作进行中状态
    const [actionClicked, setActionClicked] = useState(false); // 操作按钮点击状态，用于阻止行点击事件
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行
    const [messageApi, contextHolder] = message.useMessage();

    // 批量创建文件 Modal 状态
    const [isBatchCreateModalVisible, setIsBatchCreateModalVisible] = useState(false); // 批量创建弹窗可见性
    const [batchCreateForm] = Form.useForm(); // 批量创建表单实例
    const [batchCreateLoading, setBatchCreateLoading] = useState(false); // 批量创建提交加载状态

    // 在Modal打开时重置表单
    useEffect(() => {
        if (isBatchCreateModalVisible) {
            batchCreateForm.resetFields();
            batchCreateForm.setFieldsValue({ files: ['Video-M3U8'], lang: ['EN'] }); // 设置默认值
        }
    }, [isBatchCreateModalVisible, batchCreateForm]);

    // 2. 回调函数定义 - 用户交互和事件处理
    /**
     * 批量创建文件按钮点击处理
     * 显示弹窗
     */
    const handleBatchCreateFile = useCallback(() => {
        setIsBatchCreateModalVisible(true);
    }, []);

    /**
     * 操作区域点击处理
     * 设置操作点击标志，阻止事件冒泡以防止触发行点击事件
     */
    const handleActionAreaClick = useCallback((e) => {
        setActionClicked(true);
        e.stopPropagation();
    }, []);

    /**
     * 编辑按钮处理
     * 导航到训练计划编辑页面
     */
    const handleEdit = useCallback((record) => {
        navigate(`/workouts/editor?id=${record.id}`);
    }, [navigate]);

    /**
     * 复制workout处理
     * 创建一个新的训练计划记录，继承大部分属性但重置状态为草稿
     */
    const handleDuplicate = useCallback((record) => {
        navigate(`/workouts/editor?id=${record.id}`);
    }, [navigate]);

    /**
     * 状态变更处理
     * 更新训练计划的状态（启用/禁用/弃用）
     */
    const handleStatusChange = useCallback((record, newStatus) => {
        setActionInProgress(true);
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
        messageApi.success(`Successfully ${actionMap[newStatus]} "${record.name}"`);
    }, [messageApi]);

    /**
     * 处理按钮点击事件
     */
    const handleActionClick = useCallback((actionName, record, event) => {
        if (event) event.stopPropagation();
        setCurrentRecord(record);

        switch (actionName) {
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
    }, [handleEdit, handleDuplicate, handleStatusChange]);

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 简单的状态-按钮映射关系
        if (status === 0 && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 2 && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        if (status === 1 && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 3 && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 4 && ['duplicate'].includes(btnName)) return true;

        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80, visibleColumn: 1 },
            { title: 'Cover Image', showNewBadge: true, showLock: true, mediaType: 'video', width: 120, dataIndex: 'coverImage', key: 'image' },
            { title: 'Detail Image', mediaType: 'audio', dataIndex: 'detailImage', key: 'detailImage', width: 80, visibleColumn: 1 },
            { title: 'Thumbnail Image', mediaType: 'image', dataIndex: 'thumbnailImage', key: 'thumbnailImage', width: 130, visibleColumn: 1 },
            { title: 'Complete Image', mediaType: 'image', dataIndex: 'completeImage', key: 'completeImage', width: 130, visibleColumn: 1 },
            { title: 'Name', dataIndex: 'name', key: 'name', width: 350, visibleColumn: 0 },
            {
                title: 'Status', dataIndex: 'status', key: 'status',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                options: 'displayStatus',
                width: 120,
                visibleColumn: 0
            },



            { title: 'Premium', align: 'center', dataIndex: 'isSubscription', key: 'subscription', width: 120, options: 'defaultStatus', visibleColumn: 2 },
            {
                title: 'Duration (Min)', align: 'center', dataIndex: 'duration', key: 'duration',
                sorter: (a, b) => (a.duration || 0) - (b.duration || 0),
                width: 150,
                visibleColumn: 2,
                render: (duration) => {
                    if (!duration) return '-';
                    const minutes = Math.floor(duration / 60);
                    const seconds = duration % 60;
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            },
            { title: 'Calorie (Kcal)', align: 'center', dataIndex: 'calorie', key: 'calorie', sorter: (a, b) => (a.calorie || 0) - (b.calorie || 0), width: 150, visibleColumn: 2 },
            {
                title: 'New Date',
                key: 'newDate',
                render: (text, record) => {
                    return formatDateRange(record.newStartTime, record.newEndTime);
                },
                width: 220,
                visibleColumn: 1
            },
            { title: 'Difficulty', dataIndex: 'difficulty', key: 'difficulty', sorter: (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty], width: 100, visibleColumn: 2 },
            { title: 'Equipment', dataIndex: 'equipment', key: 'equipment', width: 200, visibleColumn: 1 },
            { title: 'Position', dataIndex: 'position', key: 'position', options: 'position', sorter: (a, b) => (a.position || '').localeCompare(b.position || ''), width: 100, visibleColumn: 1 },
            { title: 'Injured', dataIndex: 'injured', key: 'injured', width: 200, visibleColumn: 1 },
            { title: 'Audio Lang', dataIndex: 'audioLang', key: 'audioLang', width: 120, visibleColumn: 1 },
            { title: 'Exercise Num', align: 'center', dataIndex: 'exerciseNum', key: 'exerciseNum', sorter: (a, b) => (a.exerciseNum || 0) - (b.exerciseNum || 0), width: 130, visibleColumn: 1 },
            {
                title: 'File Status', dataIndex: 'fileStatus', key: 'fileStatus',
                width: 120,
                ellipsis: true,
                options: 'fileStatus',
                visibleColumn: 1
            },
            { title: 'Gender', dataIndex: 'gender', key: 'gender', width: 130, visibleColumn: 1 },
            // { title: 'Target', dataIndex: 'target', key: 'target', width: 200, visibleColumn: 1 },



            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
                // 按钮点击处理函数
                onActionClick: handleActionClick
            },
        ];
    }, [isButtonVisible, handleActionClick]);

    /**
     * 处理行选择变化
     * 用于批量操作功能
     */
    const onSelectChange = useCallback((newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    }, []);

    /**
     * 搜索处理函数
     * 直接执行搜索，根据条件过滤数据
     */
    const performSearch = useCallback((searchText, filters, pagination) => {
        setLoading(true);
        setTimeout(() => {
            let filteredData = mockWorkoutsForList;
            // 按状态过滤
            const statuses = filters?.status || [];
            if (statuses.length > 0) filteredData = filteredData.filter(w => statuses.includes(w.status));

            // 按难度过滤
            const difficulties = filters?.difficulty || [];
            if (difficulties.length > 0) filteredData = filteredData.filter(w => difficulties.includes(w.difficulty));

            // 按姿势过滤
            const positions = filters?.position || [];
            if (positions.length > 0) filteredData = filteredData.filter(w => positions.includes(w.position));

            // 按目标部位过滤
            const targets = filters?.target || [];
            if (targets.length > 0) {
                filteredData = filteredData.filter(w => {
                    if (!w.target) return false;
                    const workoutTargets = w.target.split(', ').map(t => t.trim().toLowerCase());
                    return targets.some(ft => workoutTargets.includes(ft.toLowerCase()));
                });
            }

            // 关键词搜索
            if (searchText) {
                const lowerCaseSearch = searchText.toLowerCase();
                filteredData = filteredData.filter(w =>
                    (w.name && w.name.toLowerCase().includes(lowerCaseSearch)) ||
                    (w.equipment && w.equipment.toLowerCase().includes(lowerCaseSearch)) ||
                    (w.target && w.target.toLowerCase().includes(lowerCaseSearch))
                );
            }

            // 这里可以添加分页处理逻辑
            // 如果有分页信息，可以在这里进行处理
            if (pagination) {
                console.log('【performSearch】处理分页:', pagination);
                // 真实环境中这里应该是向后端请求分页数据
                // 当前是前端模拟，不需要额外处理
            }

            setDataSource(filteredData);
            setLoading(false);
        }, 0); // 立即执行
    }, [setDataSource, setLoading]);

    /**
     * 搜索输入变化处理
     */
    const handleSearchInputChange = useCallback((e) => {
        const { value } = e.target;
        setSearchValue(value);
        performSearch(value, selectedFilters);
    }, [performSearch, selectedFilters]);

    /**
     * 筛选更新处理
     */
    const handleFilterUpdate = useCallback((newFilters) => {
        setSelectedFilters(newFilters);
        performSearch(searchValue, newFilters);
    }, [performSearch, searchValue]);

    /**
     * 重置筛选器处理
     */
    const handleFilterReset = useCallback(() => {
        setSelectedFilters({});
        setSearchValue('');
        performSearch('', {});
    }, [performSearch]);

    /**
     * 处理行点击
     */
    const handleRowClick = useCallback((record, event) => {
        // 如果全局媒体预览处于激活状态，不处理行点击
        if (window.MEDIA_PREVIEW && window.MEDIA_PREVIEW.isAnyPreviewActive()) {
            return;
        }

        // 如果操作按钮被点击，不处理行点击
        if (actionClicked) {
            return;
        }

        // 检查是否点击了操作区域
        const isActionClick = event.target.closest('.actions-container');
        if (isActionClick) {
            return;
        }

        // 检查是否点击了媒体单元格
        const isMediaClick = event.target.closest('td.media-cell') ||
            (event.target.classList &&
                (event.target.classList.contains('media-cell') ||
                    event.target.classList.contains('mediaCell')));
        if (isMediaClick) {
            console.log('行点击被阻止：点击了媒体单元格');
            return;
        }

        // 检查是否点击了复选框单元格
        const isCheckboxClick = event.target.closest('td.ant-table-cell.ant-table-selection-column') ||
            (event.target.classList &&
                (event.target.classList.contains('ant-table-selection-column') ||
                    event.target.classList.contains('ant-checkbox-wrapper') ||
                    event.target.classList.contains('ant-checkbox') ||
                    event.target.classList.contains('ant-checkbox-input')));
        if (isCheckboxClick) {
            console.log('行点击被阻止：点击了复选框');
            return;
        }

        // 正常导航到编辑页面
        navigate(`/workouts/editor?id=${record.id}`);
    }, [navigate, actionClicked]);

    /**
     * 批量创建 Modal 取消处理
     */
    const handleBatchCreateModalCancel = useCallback(() => {
        setIsBatchCreateModalVisible(false);
    }, []);

    /**
     * 批量创建 Modal 确认处理
     */
    const handleBatchCreateModalOk = useCallback(async () => {
        try {
            setBatchCreateLoading(true);
            const values = await batchCreateForm.validateFields();
            const { files, lang } = values;

            // 更新数据源
            const updatedDataSource = dataSource.map(item => {
                if (selectedRowKeys.includes(item.id)) {
                    let updatedItem = { ...item };
                    if (files.includes('Audio-JSON')) {
                        // 更新 Audio Language 字段
                        const existingLangs = new Set((updatedItem.audioLang || '').split(',').map(l => l.trim()).filter(Boolean));
                        lang.forEach(l => existingLangs.add(l));
                        updatedItem.audioLang = Array.from(existingLangs).sort().join(', ');
                    }
                    return updatedItem;
                }
                return item;
            });
            setDataSource(updatedDataSource);

            messageApi.success(`Task submitted, files will be generated for ${selectedRowKeys.length} workouts.`);
            setIsBatchCreateModalVisible(false);

        } catch (errorInfo) {
            console.log('表单验证失败:', errorInfo);
        } finally {
            setBatchCreateLoading(false);
        }
    }, [batchCreateForm, selectedRowKeys, dataSource, messageApi]);

    // 7. 副作用 - 组件生命周期相关处理
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Workout');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create Workout',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate('/workouts/editor'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    /**
     * 重置操作标志
     */
    useEffect(() => {
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    // 8. 表格数据和配置
    /**
     * 筛选后的表格数据
     */
    const filteredDataForTable = useMemo(() => {
        setLoading(true);
        let tempData = [...dataSource];
        setLoading(false);
        return tempData;
    }, [dataSource]);

    /**
     * 左侧工具栏按钮定义
     */
    const leftToolbarItems = useMemo(() => [
        {
            key: 'batchCreate',
            label: 'Batch Create File',
            onClick: handleBatchCreateFile,
            icon: <PlusOutlined />,
            disabled: selectedRowKeys.length === 0
        }
    ], [handleBatchCreateFile, selectedRowKeys]);

    /**
     * 行选择配置
     */
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 60,
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
        ],
    };

    // 处理表格变更（排序、筛选、分页）
    const handleTableChange = useCallback((pagination, filters, sorter) => {
        console.log('【List组件】分页已变化:', pagination);
        console.log('【List组件】当前页:', pagination.current);
        console.log('【List组件】每页记录数:', pagination.pageSize);
        // 将分页信息传递给 performSearch 函数
        performSearch(searchValue, filters, pagination);
    }, [performSearch, searchValue]);

    // 9. 渲染 - 组件UI呈现
    // 渲染 - 组件UI呈现
    return (
        <div className="usersContainer">
            {/* 消息上下文提供器 */}
            {contextHolder}

            {/* 可配置表格组件 */}
            <ConfigurableTable
                uniqueId={'categoryList'}
                columns={allColumnDefinitions}
                dataSource={filteredDataForTable}
                rowKey="id"
                loading={loading}
                onRowClick={handleRowClick}
                actionColumnKey="actions"
                searchConfig={{
                    placeholder: "Search name or email...",
                    searchValue: searchValue,
                    onSearchChange: handleSearchInputChange,
                }}
                filterConfig={{
                    filterSections: filterSections,
                    activeFilters: selectedFilters,
                    onUpdate: handleFilterUpdate,
                    onReset: handleFilterReset,
                }}
            />

            {/* 删除确认弹窗 */}
            <Modal
                title="Confirm Delete"
                open={isDeleteModalVisible}
                onOk={() => {
                    setActionInProgress(true);
                    setDataSource(current => current.filter(item => item.id !== currentRecord.id));
                    setActionInProgress(false);
                    setIsDeleteModalVisible(false);
                    messageApi.success(`Successfully deleted user "${currentRecord.name}"`);
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
                <p>Are you sure you want to delete user "{currentRecord?.name}"? This action cannot be undone.</p>
            </Modal>
        </div>
    );
}   