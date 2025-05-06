import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { statusIconMap, optionsConstants } from '@/constants';
import { statusOrder, filterSections, mockUsers } from './Data';
import settings from '@/config/settings';
const { file: fileSettings } = settings;
export default function UsersList() {
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const navigate = useNavigate();
    const [dataSource, setDataSource] = useState(mockUsers); // 表格数据源
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [], createUser: [] }); // 筛选条件
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // 删除确认弹窗
    const [currentRecord, setCurrentRecord] = useState(null); // 当前操作的记录
    const [actionInProgress, setActionInProgress] = useState(false); // 操作进行中状态
    const [actionClicked, setActionClicked] = useState(false); // 操作按钮点击状态，用于阻止行点击事件
    const [messageApi, contextHolder] = message.useMessage();

    // 2. 回调函数定义 - 用户交互和事件处理
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
     * 导航到用户编辑页面
     */
    const handleEdit = useCallback((record) => {
        navigate(`/users/editor?id=${record.id}`);
    }, [navigate]);

    /**
     * 状态变更å处理
     * 更新用户的状态（启用/禁用）
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
        messageApi.success(`Successfully ${newStatus} user "${record.name}"`);
    }, [messageApi]);

    /**
     * 处理按钮点击事件
     */
    const handleActionClick = useCallback((actionName, record, event) => {
        if (event) event.stopPropagation();
        setCurrentRecord(record);
        // 编辑按钮点击
        if (actionName === 'edit') {
            handleEdit(record);
        } else {
            // 状态变更按钮点击
            handleStatusChange(record, actionName);
        }
    }, [handleEdit, handleStatusChange]);

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 状态-按钮映射关系
        if (status === 1 && ['disable'].includes(btnName)) return true;
        if (status === 0 && ['enable'].includes(btnName)) return true;
        if (btnName === 'edit') return true;  // 编辑按钮始终显示

        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name & Email',
                key: 'nameAndEmail',
                width: 350,
                visibleColumn: 0,
                render: (record) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {record.avatar ? (
                            <img
                                src={`${fileSettings.baseURL}${record.avatar}`}
                                alt={`${record.name}'s avatar`}
                                className="userAvatar"
                                style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 12 }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    backgroundColor: '#f0f2f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                    color: '#999'
                                }}
                            >
                                {record.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', lineHeight: '1.4' }}>{record.name}</span>
                            <span style={{ fontSize: 'var(--font-md-sm)', color: 'var( --text-secondary)', lineHeight: '1.4', fontWeight: 400 }}>{record.email}</span>
                        </div>
                    </div>
                )
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                iconOptions: statusIconMap,
                options: 'displayStatus',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Create Time',
                dataIndex: 'createTime',
                key: 'createTime',
                sorter: (a, b) => new Date(b.createTime) - new Date(a.createTime),
                showSorterTooltip: false,
                width: 180,
                visibleColumn: 0,
                render: (createTime) => formatDate(createTime, 'YYYY-MM-DD HH:mm:ss')
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['enable', 'disable'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
                // 按钮点击处理函数
                onActionClick: handleActionClick
            }
        ];
    }, [isButtonVisible, handleActionClick]);

    /**
     * 搜索处理函数
     * 直接执行搜索，根据条件过滤数据
     */
    const performSearch = useCallback((searchText, filters) => {
        setLoading(true);
        setTimeout(() => {
            // 复制原始数据
            let filteredData = [...mockUsers];

            // 按状态过滤
            const statuses = filters?.status || [];
            if (statuses.length > 0) {
                filteredData = filteredData.filter(user => statuses.includes(user.status));
            }

            // 按创建者过滤
            const createUsers = filters?.createUser || [];
            if (createUsers.length > 0) {
                filteredData = filteredData.filter(user => createUsers.includes(user.createUser));
            }

            // 关键词搜索
            if (searchText) {
                const lowerCaseSearch = searchText.toLowerCase();
                filteredData = filteredData.filter(user =>
                    (user.name && user.name.toLowerCase().includes(lowerCaseSearch)) ||
                    (user.email && user.email.toLowerCase().includes(lowerCaseSearch))
                );
            }

            setDataSource(filteredData);
            setLoading(false);
        }, 0); // 立即执行
    }, []);

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
        // 如果操作按钮被点击，不处理行点击
        if (actionClicked) {
            setActionClicked(false);
            return;
        }

        // 检查是否点击了操作区域
        const isActionClick = event.target.closest('.actions-container');
        if (isActionClick) {
            return;
        }

        // 正常导航到编辑页面
        navigate(`/users/editor?id=${record.id}`);
    }, [navigate, actionClicked]);

    // 副作用 - 组件生命周期相关处理
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle && setCustomPageTitle('User List');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create User',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate(`/users/editor`),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle && setCustomPageTitle(null);
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

    // 表格数据和配置
    /**
     * 筛选后的表格数据
     */
    const filteredDataForTable = useMemo(() => {
        setLoading(true);
        let tempData = [...dataSource];
        setLoading(false);
        return tempData;
    }, [dataSource]);

    // 渲染 - 组件UI呈现
    return (
        <div className="usersContainer page-list">
            {/* 消息上下文提供器 */}
            {contextHolder}

            {/* 可配置表格组件 */}
            <ConfigurableTable
                uniqueId={'usersList'}
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