import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { message, Form, Switch, Space, } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';

export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    //查询条件数组
    const filterSections = [
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
            title: 'Usage',
            key: 'usageCodeList',
            options: "BizSoundUsageEnums"
        },
        {
            title: 'Gender',
            key: 'genderCodeList',
            options: 'BizSoundGenderEnums'
        },
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [

            { title: 'Female Audio', mediaType: 'audio', dataIndex: 'femaleAudioUrl', key: 'femaleAudioUrl', visibleColumn: 0, align: 'center' },
            { title: 'Male Audio', mediaType: 'audio', dataIndex: 'maleAudioUrl', key: 'maleAudioUrl', visibleColumn: 0, align: 'center' },
            {
                title: 'Name',
                sorter: true,
                showSorterTooltip: false,
                dataIndex: 'name',
                render: (text, row) => (<div>
                    <div className='cell-name'>{text}</div>
                    <div className='cell-id'>ID:{row.id}</div>
                </div>),
                key: 'name',
                // width: 300,
                visibleColumn: 1
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                showSorterTooltip: false,
                options: 'displayStatus',
                // width: 150,
                visibleColumn: 0
            },
            {
                title: 'Usage',
                dataIndex: 'usageCode',
                sorter: true,
                showSorterTooltip: false,
                options: 'BizSoundUsageEnums',
                // width: 150,
                visibleColumn: 0
            },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
                showSorterTooltip: false,
                options: 'BizSoundGenderEnums',
                // width: 120,
                visibleColumn: 0
            },
            {
                title: 'Has a Script',
                sorter: true,
                showSorterTooltip: false,
                // align: 'center',
                dataIndex: 'translation',
                key: 'translation',
                // width: 120,
                visibleColumn: 2,
                render: (text, record) => {
                    return (
                        <Space direction="vertical">
                            <Switch disabled={true} checked={text} />
                        </Space>
                    );
                }
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],

            },
        ];
    }, []);
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Sounds');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Sound',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate('/sounds/editor'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    //渲染表格组件
    return (
        <ConfigurableTable
            columns={allColumnDefinitions}
            moduleKey="sound"
            searchConfig={{
                placeholder: "Search name or ID...",
            }}
            showColumnSettings={false}
            filterConfig={{
                filterSections: filterSections,
            }}
        />
    );
}   