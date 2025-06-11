import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Button } from 'antd';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { statusOrder, filterSections, listData } from './Data';
import request from "@/request";
// import { c } from 'vite/dist/node/types.d-aGj9QkWt';

export default ({ bizType }) => {
    let num = [
        {
            label: "Musics",
            value: "biz-music"
        },
        {
            label: "Playlists",
            value: "biz-playlist"
        },
        {
            label: "Sounds",
            value: "biz-sound"
        }, {
            label: "Images",
            value: "biz-music"
        }, {
            label: "Exercises",
            value: "biz-exercise"
        }, {
            label: "Workouts",
            value: "biz-workout"
        }, {
            label: "Categories",
            value: "biz-category"
        }, {
            label: "Programs",
            value: "biz-program"
        }, {
            label: "Templates",
            value: "biz-template"
        }
    ]

    // 1. 状态定义 - 组件内部状态管理
    const [dataSource, setDataSource] = useState(listData); // 表格数据源
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [], createUser: [] }); // 筛选条件
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // 删除确认弹窗
    const [currentRecord, setCurrentRecord] = useState(null); // 当前操作的记录
    const [actionInProgress, setActionInProgress] = useState(false); // 操作进行中状态
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dataAfter, setDataAfter] = useState(null);

    const showModal = (e) => {
        console.log(1111111111)
        console.log(JSON.parse(e))
        setDataAfter(JSON.parse(e));
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'ID',
                dataIndex: 'dataId',
                width: 50,
            },
            {
                title: 'Name',
                dataIndex: 'dataInfo',
                width: 120,
                visibleColumn: 0,
                render: (text) => <span style={{ fontWeight: 700 }}>{text}</span>,
            },
            {
                title: 'Operation Type',
                dataIndex: 'operationType',
                options: [{ name: "Add", value: "ADD" }],
                width: 120,
                visibleColumn: 0,

            },
            {
                title: 'After Data',
                dataIndex: 'dataAfter',
                width: 120,
                visibleColumn: 0,
                render: (value, row) => {
                    return (

                        <Button style={{ height: '25px', padding: "0px 10px" }} onClick={() => {
                            showModal(value)
                        }} type="primary">View</Button>
                    )
                }
            },
            {
                title: 'Operation Time',
                dataIndex: 'operationTime',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Operation User',
                dataIndex: 'operationUser',
                width: 120,
                visibleColumn: 0
            },

        ];
    }, []);

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
        console.log(value)
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
        // 检查是否点击了操作区域
        const isActionClick = event.target.closest('.actions-container');
        if (isActionClick) {
            return;
        }

    }, []);
    /**
     * 筛选后的表格数据
     */
    const filteredDataForTable = useMemo(() => {
        setLoading(true);
        let tempData = [...dataSource];
        setLoading(false);
        return tempData;
    }, [dataSource]);

    // 副作用 - 组件生命周期相关处理getTableList

    const getTableList = useCallback(async (params) => {
        let value = num.filter(item => item.label == bizType)[0].value
        return new Promise(resolve => {
            request.get({
                url: '/opLogs/page', data: { bizType:value, ...params },
                callback: (res) => {
                    resolve(res.data)
                }
            });
        })
    }, [])
    // 获取数据
    const getData = useCallback((value) => {
        return new Promise(resolve => {
            request.get({
                url: "/opLogs/page",
                load: true,
                data: {
                    bizType: value,
                    pageSize: 20
                },
                callback(res) {
                    // setDataSource(res.data.data)
                    console.log('res', res.data.data)
                    setDataSource(res.data.data)
                    resolve()
                }
            })
        })
    }, [])
    /**
     * 重置操作标志
     */

    // 表格数据和配置
    // 渲染 - 组件UI呈现
    return (
        <div className="usersContainer">
            {/* 消息上下文提供器 */}
            {contextHolder}

            {/* 可配置表格组件 */}
            <ConfigurableTable
                uniqueId={'categoryList'}
                columns={allColumnDefinitions}
                getTableList={getTableList}
                dataSource={filteredDataForTable}
                rowKey="id"
                loading={loading}
                onRowClick={handleRowClick}
                actionColumnKey="actions"
                searchConfig={{
                    placeholder: "Search name or ID...",
                    searchValue: searchValue,
                    onSearchChange: handleSearchInputChange,
                }}
                filterConfig={{
                    filterSections: bizType == 'Templates' || bizType == 'Workouts' ? filterSections : null,
                    activeFilters: selectedFilters,
                    onUpdate: handleFilterUpdate,
                    onReset: handleFilterReset,
                }}
            />

            {/* 展示JSON数据 */}
            <Modal
                title="Basic Modal"
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        close
                    </Button>,
                ]}
            >
                <p>
                    {{ dataAfter } && JSON.stringify(dataAfter, null, 2)}
                </p>
            </Modal>
        </div>
    );
}