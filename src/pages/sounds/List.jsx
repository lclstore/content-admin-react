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
    const [actionClicked, setActionClicked] = useState(false); // 操作按钮点击状态，用于阻止行点击事件
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: [{
                label: 'Draft',
                value: 'DRAFT'
            }, {
                label: 'Enable',
                value: 'ENABLE'
            }, {
                label: 'Disable',
                value: 'DISABLE'
            }],
        }
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [

            { title: 'Female Audio', mediaType: 'audio', dataIndex: 'femaleAudioUrl', key: 'femaleAudioUrl', width: 80, visibleColumn: 0 },
            { title: 'Male Audio', mediaType: 'audio', dataIndex: 'maleAudioUrl', key: 'maleAudioUrl', width: 80, visibleColumn: 0 },
            { title: 'ID', dataIndex: 'id', key: 'id', width: 60, visibleColumn: 1 },
            {
                title: 'Name',
                sorter: true,
                showSorterTooltip: false,
                dataIndex: 'name',
                key: 'name',
                width: 350,
                visibleColumn: 1
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
                title: 'Has a Script',
                sorter: true,
                showSorterTooltip: false,
                align: 'center',
                dataIndex: 'translation',
                key: 'translation',
                width: 120,
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
                align: 'center',
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],

            },
        ];
    }, []);





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
        navigate(`/sounds/editor?id=${record.id}`);
    }, [navigate, actionClicked]);



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



    // 9. 渲染 - 组件UI呈现
    return (
        <div className="workoutsContainer page-list">
            <ConfigurableTable
                columns={allColumnDefinitions}
                moduleKey="sound"
                onRowClick={handleRowClick}
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </div>
    );
}   