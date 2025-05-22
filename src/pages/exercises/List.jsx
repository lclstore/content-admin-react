import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { statusOrder, filterSections,listData } from './Data';
import request from "@/request";

export default () => {
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const navigate = useNavigate();
    const [dataSource, setDataSource] = useState(listData); // 表格数据源
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [], createUser: [] }); // 筛选条件
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // 删除确认弹窗
    const [currentRecord, setCurrentRecord] = useState(null); // 当前操作的记录
    const [actionInProgress, setActionInProgress] = useState(false); // 操作进行中状态
    const [actionClicked, setActionClicked] = useState(false); // 操作按钮点击状态，用于阻止行点击事件
    const [messageApi, contextHolder] = message.useMessage();

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        let state = false
        if(btnName === 'edit'){ state = true }
        if (
            (status === 0 && (btnName === "enable" || btnName === "delete" || btnName === "duplication")) ||
            (status === 1 && (btnName === "disabled" || btnName === "duplication")) ||
            (status === 2 && (btnName === "enable" || btnName === "duplication"))
        ) {
            state = true
        }
        return state
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'ID',
                dataIndex: 'id',
            },
            {
                title: 'Image',
                dataIndex: 'imageCoverUrl',
                mediaType: 'image',
            },
            {
                title: 'Name',
                dataIndex: 'name',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Status',
                dataIndex: 'status',
                options:"displayStatus",
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'MET',
                dataIndex: 'met',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Structure Type',
                dataIndex: 'structureType',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Difficulty',
                dataIndex: 'difficulty',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Equipment',
                dataIndex: 'equipment',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Position',
                dataIndex: 'position',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Target',
                dataIndex: 'target',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Front Video Status',
                dataIndex: 'frontVideoStatus',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Side Video Status',
                dataIndex: 'sideVideoStatus',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['enable', 'disable','edit','duplicate','delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
            }
        ];
    }, [isButtonVisible]);

    /**
     * 搜索处理函数
     * 直接执行搜索，根据条件过滤数据
     */
    const performSearch = useCallback((searchText, filters) => {
        setLoading(true);
        setTimeout(() => {
            // 复制原始数据
            let filteredData = [...listData];

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

    // 获取数据
    const getData = useCallback(() => {
        return new Promise(resolve => {
            request.get({
                url:"/sound/page",
                load:true,
                callback(res){
                    console.log(res)
                    resolve()
                }
            })
        })
    },[])
    // 副作用 - 组件生命周期相关处理
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle && setCustomPageTitle('Exercise List');
        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate(`/exercises/editor`),
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
        // getData().then()
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);


    // 渲染 - 组件UI呈现
    return (
        <div>
            {/* 消息上下文提供器 */}
            {contextHolder}

            {/* 可配置表格组件 */}
            <ConfigurableTable
                uniqueId={'exerciseList'}
                columns={allColumnDefinitions}
                dataSource={dataSource}
                rowKey="id"
                loading={loading}
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