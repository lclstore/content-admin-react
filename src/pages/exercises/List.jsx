import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message } from 'antd';
import { PlusOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { statusIconMap, optionsConstants } from '@/constants';
import { statusOrder, listData } from './Data';

import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';

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
                }
            ],
        }
    ];
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const navigate = useNavigate();

       // 定义按钮显示规则
        const isButtonVisible = useCallback((record, btnName) => {
    
            const status = record.status;
            //  console.log(status)
            // 简单的状态-按钮映射关系
            if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
            if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
            if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
            if (status === 'Premium' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
            if (status === 'Deprecated' && ['duplicate'].includes(btnName)) return true;
    
            return false;
        }, []);
    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'ID',
                dataIndex: 'id',
                visibleColumn: 0,
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

            {
                title: 'Name',
                dataIndex: 'name',
                sorter: true,
                width: 120,
                visibleColumn: 0,
                key: 'name'
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                showSorterTooltip: false,
                options: 'displayStatus',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'MET',
                dataIndex: 'met',
                sorter: true,
                width: 120,
                visibleColumn: 2,
                key: 'met'
            },
            {
                title: 'Structure Type',
                dataIndex: 'structureTypeCode',
                sorter: true,
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
                title: 'Difficulty',
                dataIndex: 'difficultyCode',
                sorter: true,
                width: 120,
                visibleColumn: 2,
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
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
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
                title: 'Equipment',
                dataIndex: 'equipmentCode',
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
                sorter: true,
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
                width: 140,
                visibleColumn: 1,
                key: 'frontVideoStatus'
            },
            {
                title: 'Side Video Status',
                dataIndex: 'sideVideoStatus',
                width: 140,
                visibleColumn: 1,
                key: 'sideVideoStatus'
            },
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
            }
        ];
    }, []);




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



    // 渲染 - 组件UI呈现
    return (
        <div className="workoutsContainer page-list">
            <ConfigurableTable
                columns={allColumnDefinitions}
                moduleKey="exercise"
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={true}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </div>
    );
}