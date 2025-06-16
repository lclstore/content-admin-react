import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Table } from 'antd';
import { useNavigate } from 'react-router';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { HeaderContext } from '@/contexts/HeaderContext';
import { statusIconMap } from '@/constants';
import {
    PlusOutlined,
} from '@ant-design/icons';

export default () => {
    // 1. 状态定义 - 组件内部状态管理
    const navigate = useNavigate();
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const [messageApi, contextHolder] = message.useMessage();

    /**
     * 处理按钮点击事件
     */
    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 状态-按钮映射关系
        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [

            {
                title: 'Cover Image',
                dataIndex: 'coverImgUrl',
                mediaType: 'image',
                showNewBadge: true,
                width:200,
            },
            {
                title: 'Detail Image',
                dataIndex: 'detailImgUrl',
                mediaType: 'image',
                width:200,
            },
            {
                title: 'Name',
                dataIndex: 'name',
                visibleColumn: 0,
                render: (text,row) => (<div>
                    <div style={{ fontWeight:600 }}>{text}</div>
                    <div style={{ color:"var(--text-secondary)",fontSize:"12px" }}>ID:{row.id}</div>
                </div>),
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                iconOptions: statusIconMap,
                options: 'displayStatus',
                visibleColumn: 0,
                // width:200
            },
            {
                title: 'Show Type',
                dataIndex: 'showTypeCode',
                sorter: true,
                options: 'BizCategoryShowTypeEnums',
                visibleColumn: 0
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['enable', 'disable', 'edit', 'duplicate', 'delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
                // 按钮点击处理函数
            }
        ];
    }, []);


    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Programs');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create Programs',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate('/collections/programs/editor'),
            },
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);




    // 渲染 - 组件UI呈现
    return (
        <div className="usersContainer">
            {/* 消息上下文提供器 */}
            {contextHolder}

            {/* 可配置表格组件 */}
            <ConfigurableTable
                moduleKey={'program'}
                operationName={'list'}
                showPagination={false}
                draggable={true}
                columns={allColumnDefinitions}
                showColumnSettings={false}
            />
        </div>
    );
}