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
        if (status === 'ENABLED' && ['edit', 'duplicate', 'disable', 'delete'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'ID',
                dataIndex: 'id',
                width: 60,
            },
            {
                title: 'Cover Image',
                dataIndex: 'imageCoverUrl',
                mediaType: 'image',
            },
            {
                title: 'Detail Image',
                dataIndex: 'imageCoverUrl',
                mediaType: 'image',
            },
            {
                title: 'Name',
                dataIndex: 'name',
                visibleColumn: 0
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                iconOptions: statusIconMap,
                options: 'displayStatus',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Show Type',
                dataIndex: 'showTypeCode',
                sorter: true,
                options: [
                    {
                        label: 'Horizontal',
                        value: 'HORIZONTAL'
                    }, {
                        label: 'Card',
                        value: 'CARD'
                    }
                ],
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
        setCustomPageTitle('Category');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create Category',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate('/collections/category/editor'),
            },
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);



    // 定义展开行渲染函数
    const expandedRowRender = (record) => {
        const data = [{
            "coverImgUrl": "",
            "detailImgUrl": "",
            "id": 2,
            "name": "ccc3",
            "newEndTime": null,
            "newStartTime": null,
            "showTypeCode": "HORIZONTAL",
            "status": "DRAFT"
        },
        {
            "coverImgUrl": "",
            "detailImgUrl": "",
            "id": 2,
            "name": "ccc3",
            "newEndTime": null,
            "newStartTime": null,
            "showTypeCode": "HORIZONTAL",
            "status": "DRAFT"
        },
        {
            "coverImgUrl": "",
            "detailImgUrl": "",
            "id": 2,
            "name": "ccc3",
            "newEndTime": null,
            "newStartTime": null,
            "showTypeCode": "HORIZONTAL",
            "status": "DRAFT"
        }, {
            "coverImgUrl": "",
            "detailImgUrl": "",
            "id": 2,
            "name": "ccc3",
            "newEndTime": null,
            "newStartTime": null,
            "showTypeCode": "HORIZONTAL",
            "status": "DRAFT"
        }
        ];

        // 定义展开行表格的列配置
        const columns = [
            {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                width: 80
            },
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                width: 200
            },
            {
                title: 'Show Type',
                dataIndex: 'showTypeCode',
                key: 'showTypeCode',
                width: 120
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 100
            },
            {
                title: 'New Start Time',
                dataIndex: 'newStartTime',
                key: 'newStartTime',
                width: 160
            },
            {
                title: 'New End Time',
                dataIndex: 'newEndTime',
                key: 'newEndTime',
                width: 160,
            }
        ];

        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                rowKey="id"
                size="small"
                bordered={false}
            />
        );
    };
    // 渲染 - 组件UI呈现
    return (
        <div className="usersContainer">
            {/* 消息上下文提供器 */}
            {contextHolder}

            {/* 可配置表格组件 */}
            <ConfigurableTable
                moduleKey={'category'}
                operationName={'list'}
                showPagination={false}
                draggable={true}
                // expandable={true}
                // expandedRowRender={expandedRowRender}
                columns={allColumnDefinitions}
                showColumnSettings={false}
            />
        </div>
    );
}