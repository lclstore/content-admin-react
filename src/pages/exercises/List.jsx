import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message } from 'antd';
import { PlusOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { statusIconMap, optionsConstants } from '@/constants';
import { statusOrder, listData } from './Data';

import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import request from "@/request";

export default () => {
    // 定义筛选器配置
    var filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: [{
                label: 'Draft',
                value: 'DRAFT'
            }, {
                label: 'Enabled',
                value: 'ENABLED'
            }, {
                label: 'Disabled',
                value: 'DISABLED'
            }],
        },
        {
            title: 'Structure Type',
            key: 'structureTypeCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: [{
                label: 'Warm Up',
                value: 'WARM_UP'
            }, {
                label: 'Main',
                value: 'MAIN'
            }, {
                label: 'Cool Down',
                value: 'COOL_DOWN'
            }]
        },
        {
            title: 'Gender',
            key: 'genderCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: [
                {
                    label: 'Male',
                    value: 'MALE'
                }, {
                    label: 'Female',
                    value: 'FEMALE'
                }
            ]
        },
        {
            title: 'Difficulty',
            key: 'difficultyCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: [
                {
                    label: 'Beginner',
                    value: 'BEGINNER'
                }, {
                    label: 'Intermediate',
                    value: 'INTERMEDIATE'
                }, {
                    label: 'Advanced',
                    value: 'ADVANCED'
                }
            ]
        },
        {
            title: 'Equipment',
            key: 'equipmentCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: [
                {
                    label: 'No equipment',
                    value: 'NO_EQUIPMENT'
                }, {
                    label: 'Chair',
                    value: 'CHAIR'
                },
            ]
        },
        {
            title: 'Position',
            key: 'positionCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: [
                {
                    label: 'Seated',
                    value: 'SEATED'
                }, {
                    label: 'Standing',
                    value: 'STANDING'
                },
            ],
        },
        {
            title: 'Injured',
            key: 'injuredCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: [
                {
                    label: 'Shoulder',
                    value: 'SHOULDER'
                }, {
                    label: 'Back',
                    value: 'BACK'
                }, {
                    label: 'Wrist',
                    value: 'WRIST'
                }, {
                    label: 'Knee',
                    value: 'KNEE'
                }, {
                    label: 'Ankle',
                    value: 'ANKLE'
                }, {
                    label: 'Hip',
                    value: 'HIP'
                }, {
                    label: 'None',
                    value: 'NONE'
                },
            ],
        }
    ];
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // 删除确认弹窗
    const [currentRecord, setCurrentRecord] = useState(null); // 当前操作的记录
    const [actionInProgress, setActionInProgress] = useState(false); // 操作进行中状态
    const [actionClicked, setActionClicked] = useState(false); // 操作按钮点击状态，用于阻止行点击事件
    const [messageApi, contextHolder] = message.useMessage();

    /**
     * 编辑按钮处理
     * 导航到用户编辑页面
     */
    const handleEdit = useCallback((record) => {
        navigate(`/exercises/editor?id=${record.id}`);
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
        let state = false
        if (btnName === 'edit') { state = true }
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
                visibleColumn: 2,
                width: 50,
                key: 'id'
            },
            {
                title: 'Image',
                width: 120,
                mediaType: 'image',
                dataIndex: 'coverImgUrl',
                key: 'coverImgUrl',
                visibleColumn: 0
            },
            // { title: 'Audio', mediaType: 'audio', dataIndex: 'audioUrl', key: 'audioUrl', width: 80 },

            {
                title: 'Name',
                dataIndex: 'name',
                visibleColumn: 0,
                key: 'name'
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                iconOptions: statusIconMap,
                options: 'displayStatus',
                options: [{
                    label: 'Draft',
                    value: 'DRAFT'
                }, {
                    label: 'Enabled',
                    value: 'ENABLED'
                }, {
                    label: 'Disabled',
                    value: 'DISABLED'
                }],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'MET',
                dataIndex: 'met',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 2,
                key: 'met'
            },
            {
                title: 'Structure Type',
                dataIndex: 'structureTypeCode',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 2,
                options: [{
                    label: 'Warm Up',
                    value: 'WARM_UP'
                }, {
                    label: 'Main',
                    value: 'MAIN'
                }, {
                    label: 'Cool Down',
                    value: 'COOL_DOWN'
                }],
                key: 'structureTypeCode'
            },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'Male',
                        value: 'MALE'
                    }, {
                        label: 'Female',
                        value: 'FEMALE'
                    }
                ],
                key: 'genderCode'
            },
            {
                title: 'Difficulty',
                dataIndex: 'difficultyCode',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'Beginner',
                        value: 'BEGINNER'
                    }, {
                        label: 'Intermediate',
                        value: 'INTERMEDIATE'
                    }, {
                        label: 'Advanced',
                        value: 'ADVANCED'
                    }
                ],
                key: 'difficultyCode'
            },
            {
                title: 'Equipment',
                dataIndex: 'equipmentCode',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'No equipment',
                        value: 'NO_EQUIPMENT'
                    }, {
                        label: 'Chair',
                        value: 'CHAIR'
                    },
                ],
                key: 'equipmentCode'
            },
            {
                title: 'Position',
                dataIndex: 'positionCode',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'Seated',
                        value: 'SEATED'
                    }, {
                        label: 'Standing',
                        value: 'STANDING'
                    },
                ],
                key: 'positionCode'
            },
            {
                title: 'Injured',
                dataIndex: 'injuredCodes',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'Shoulder',
                        value: 'SHOULDER'
                    }, {
                        label: 'Back',
                        value: 'BACK'
                    }, {
                        label: 'Wrist',
                        value: 'WRIST'
                    }, {
                        label: 'Knee',
                        value: 'KNEE'
                    }, {
                        label: 'Ankle',
                        value: 'ANKLE'
                    }, {
                        label: 'Hip',
                        value: 'HIP'
                    }, {
                        label: 'None',
                        value: 'NONE'
                    },
                ],
                key: 'injuredCodes'
            },
            {
                title: 'Front Video Status',
                dataIndex: 'frontVideoStatus',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 140,
                visibleColumn: 1,
                key: 'frontVideoStatus'
            },
            {
                title: 'Side Video Status',
                dataIndex: 'sideVideoStatus',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 140,
                visibleColumn: 1,
                key: 'sideVideoStatus'
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['enable', 'disable', 'edit', 'duplicate', 'delete'],
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

    /**
     * 筛选更新处理
     */

    /**
     * 重置筛选器处理
     */

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
        navigate(`/exercises/editor?id=${record.id}`);
    }, [navigate, actionClicked]);

    // 获取数据
    const getData = useCallback(() => {
        return new Promise(resolve => {
            request.get({
                url: "/sound/page",
                load: true,
                callback(res) {
                    console.log('res', res)
                    resolve()
                }
            })
        })
    }, [])
    // 副作用 - 组件生命周期相关处理
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle && setCustomPageTitle('Exercises');
        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Exercise',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate(`/exercises/editor`),
            },
            {
                key: 'Import',
                text: 'Feishu Import',
                icon: <ArrowDownOutlined />,
                type: 'primary',
                // onClick: () => navigate(`/exercises/editor`),
            },
            {
                key: 'Export',
                text: 'Export Feishu',
                icon: <ArrowUpOutlined />,
                type: 'primary',
                // onClick: () => navigate(`/exercises/editor`),
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
        console.log('111')
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
                moduleKey="exercise"
                columns={allColumnDefinitions}
                searchConfig={{
                    placeholder: "Search name or id...",
                    searchValue: searchValue,
                    // onSearchChange: handleSearchInputChange,
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </div>
    );
}