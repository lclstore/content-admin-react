import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message } from 'antd';
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
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [], createUser: [] }); // 筛选条件
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
        navigate(`/users/editor?id=${record.id}`);
    }, [navigate]);

    /**

    /**
     * 处理按钮点击事件
     */
    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 状态-按钮映射关系
        if (status === 'enable' && ['disable'].includes(btnName)) return true;
        if (status === 'disable' && ['enable'].includes(btnName)) return true;
        if (btnName === 'edit' || btnName === 'duplicate') return true;  // 编辑按钮始终显示

        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'ID',
                dataIndex: 'id',
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
                width: 120,
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
                dataIndex: 'met',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'New Start Time',
                dataIndex: 'structureType',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'New End Time',
                dataIndex: 'difficulty',
                sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['enable', 'disable', 'edit', 'duplicate'],
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
                onClick: () => navigate('/collections/Editor'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);




    // 表格数据和配置
    /**
     * 筛选后的表格数据
     */

    // 渲染 - 组件UI呈现
    return (
        <div className="usersContainer">
            {/* 消息上下文提供器 */}
            {contextHolder}

            {/* 可配置表格组件 */}
            <ConfigurableTable
                moduleKey={'category'}
                columns={allColumnDefinitions}
                showColumnSettings={false}
            />
        </div>
    );
}