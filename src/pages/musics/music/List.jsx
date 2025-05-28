import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Form, Table, Switch, Space, Button } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import TagSelector from '@/components/TagSelector/TagSelector';
import { statusIconMap, optionsConstants } from '@/constants';

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
    }
];
export default function Musics() {
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [] }); // 筛选条件
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行

    // 批量创建文件 Modal 状态
    const [isBatchCreateModalVisible, setIsBatchCreateModalVisible] = useState(false); // 批量创建弹窗可见性
    const [batchCreateForm] = Form.useForm(); // 批量创建表单实例

    // 在Modal打开时重置表单
    useEffect(() => {
        if (isBatchCreateModalVisible) {
            batchCreateForm.resetFields();
            batchCreateForm.setFieldsValue({ files: ['Video-M3U8'], lang: ['EN'] }); // 设置默认值
        }
    }, [isBatchCreateModalVisible, batchCreateForm]);



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
            { title: 'Audio', mediaType: 'audio', dataIndex: 'audioUrl', key: 'audioUrl', width: 80, visibleColumn: 1 },
            {
                title: 'ID', dataIndex: 'id',
                key: 'id',
                width: 60,
                visibleColumn: 1,
                sorter: true
            },
            {
                title: 'Name',
                sorter: true,
                dataIndex: 'name', key: 'name', width: 350, visibleColumn: 1
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                iconOptions: statusIconMap,
                sorter: true,
                options: 'displayStatus',
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
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
            },
        ];
    }, [isButtonVisible]);

    //设置导航栏按钮
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Musics');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Music',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate('/musics/musicsEditor'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);


    //渲染表格
    return (
        <div className="workoutsContainer page-list"  >
            <ConfigurableTable
                moduleKey={'music'}
                columns={allColumnDefinitions}
                searchConfig={{
                    placeholder: "Search content name or ID...",
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </div>
    );
}   