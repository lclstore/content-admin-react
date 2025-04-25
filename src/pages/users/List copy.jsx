import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Table, Input, Button, Avatar, Dropdown, Menu, message } from 'antd';
import { UserOutlined, PlusOutlined, CheckCircleFilled, CloseCircleOutlined, CloseCircleFilled, EllipsisOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils';
import _debounce from 'lodash/debounce';

// 模拟用户数据
const mockUsers = [
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Admin',
        createTime: '2024-01-15 10:00:00',
        status: 'Enable'
    },
    {
        id: 2,
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        avatar: '',  // 空头像测试
        createUser: 'Admin',
        createTime: '2024-01-16 14:30:00',
        status: 'Enable'
    },
    {
        id: 3,
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        avatar: null,  // 空头像测试
        createUser: 'Manager',
        createTime: '2024-01-17 09:15:00',
        status: 'Disable'
    },
    {
        id: 4,
        name: 'Sarah Davis',
        email: 'sarah.davis@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Manager',
        createTime: '2024-01-18 16:45:00',
        status: 'Enable'
    }
];

// 操作菜单项，根据状态动态生成
const menuItems = (record, setDataSource) => {
    const items = [];

    // 处理菜单点击事件 (移到 menuItems 内部以访问 setDataSource)
    const handleMenuClick = (key, record) => {
        console.log(`Clicked ${key} for record:`, record);
        if (key === 'enable' || key === 'disable') {
            // 更新用户状态
            const nextStatus = key === 'enable' ? 'Enable' : 'Disable';
            setDataSource(currentDataSource =>
                currentDataSource.map(user =>
                    user.id === record.id ? { ...user, status: nextStatus } : user
                )
            );
            // 添加成功提示
            const messageText = nextStatus === 'Enable' ? 'User enabled successfully' : 'User disabled successfully';
            message.success(messageText);
            // 这里可以添加调用 API 更新后端数据的逻辑
            console.log(`User ${record.id} status changed to ${nextStatus}`);
        }
    };

    if (record.status === 'Enable') {
        items.push({
            key: 'disable',
            label: 'Disable',
            onClick: () => handleMenuClick('disable', record),
        });
    } else {
        items.push({
            key: 'enable',
            label: 'Enable',
            onClick: () => handleMenuClick('enable', record),
        });
    }

    return items;
};

export default function UsersList() {
    // 获取header上下文中的保存按钮状态设置函数
    const { setButtons } = useContext(HeaderContext);
    // 表格数据状态
    const [dataSource, setDataSource] = useState(mockUsers);
    // loading 状态
    const [loading, setLoading] = useState(false);
    // 搜索输入框的值
    const [searchValue, setSearchValue] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // 设置保存按钮状态
    useEffect(() => {
        setButtons([]); // 清除所有按钮
    }, [setButtons]);

    // 处理搜索输入框内容变化
    const handleSearchInputChange = (value) => {
        setSearchValue(value);
        setLoading(true); // 开始搜索时设置 loading
        // 使用 debounce 处理搜索逻辑
        debouncedSearch(value);
    };

    // 防抖的搜索函数
    const debouncedSearch = useCallback(
        _debounce((value) => {
            // 模拟 API 请求或执行过滤
            setTimeout(() => {
                const filteredData = mockUsers.filter(user =>
                    user.name.toLowerCase().includes(value.toLowerCase()) ||
                    user.email.toLowerCase().includes(value.toLowerCase())
                );
                setDataSource(filteredData);
                setLoading(false); // 结束搜索时取消 loading
            }, 300); // 设置 300ms 防抖延迟
        }, 300),
        [] // 依赖项为空数组，确保 debounce 函数只创建一次
    );

    // 表格列配置
    const columns = [
        {
            title: 'Name',
            key: 'Name',
            render: (record) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {record.avatar ? (
                        <img
                            src={record.avatar}
                            alt={`${record.name}'s avatar`}
                            className="userAvatar"
                        />
                    ) : (
                        <Avatar
                            icon={<UserOutlined />}
                            className="userAvatar"
                        />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', lineHeight: '1.4' }}>{record.name}</span>
                        <span style={{ fontSize: 'var(--font-md-sm)', color: 'var( --text-secondary)', lineHeight: '1.4', fontWeight: 400 }}>{record.email}</span>
                    </div>
                </div>
            ),
        },

        {
            title: 'Status',
            align: 'center',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => { // 增加 record 参数方便打印 ID
                console.log(`Rendering Status for User ${record.id}:`, status); // 添加调试日志
                const isActive = status === 'Enable';
                const displayText = isActive ? 'Enable' : 'Disable'; // 根据状态确定显示文本
                return (
                    <div className='statusTag'>
                        <span className='statusText'>{displayText}</span> {/* 显示 Enable 或 Disable */}
                        <span className='statusIcon'> {isActive ? <CheckCircleFilled className='successIcon' /> : <CloseCircleFilled className='errorIcon' />}</span>
                    </div>
                );
            }
        },
        {
            title: 'Create User',
            dataIndex: 'createUser',
            key: 'createUser',
        },
        {
            title: 'Create Time',
            dataIndex: 'createTime',
            key: 'createTime',
            sorter: (a, b) => new Date(b.createTime) - new Date(a.createTime),
            showSorterTooltip: false,
            render: (createTime) => formatDate(createTime, 'YYYY-MM-DD HH:mm:ss')
        },
        {
            title: 'Actions', // 操作栏标题
            key: 'actions',
            align: 'center', // 居中对齐
            render: (text, record) => ( // record 包含当前行的数据
                <Dropdown
                    menu={{ items: menuItems(record, setDataSource) }}
                    trigger={['click']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span>
                        <Button type="text" icon={<EllipsisOutlined />} />
                    </span>
                </Dropdown>
            ),
        },
    ];

    return (
        <div className="usersContainer">
            {/* 顶部搜索栏 */}
            <div className="searchBar">
                <Input
                    placeholder="Search..."
                    value={searchValue}
                    onChange={(e) => handleSearchInputChange(e.target.value)} // 直接调用带 debounce 的处理函数
                    allowClear // 添加清除按钮
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/${location.pathname}/editor`)}
                >
                    Add User
                </Button>
            </div>
            {/* 用户列表表格 */}
            <Table
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                loading={loading} // 表格 loading 状态
                pagination={{
                    total: dataSource.length,
                    pageSize: 10,
                    showTotal: (total) => `Total ${total} items`
                }}
                onRow={(record) => {
                    return {
                        onClick: (event) => {
                            // 检查点击的目标是否是操作按钮或下拉菜单内的元素，如果是则不跳转
                            const targetNode = event.target;
                            if (targetNode.closest('.ant-dropdown-trigger') || targetNode.closest('.ant-dropdown-menu')) {
                                return;
                            }
                            console.log('Row clicked:', record);
                            navigate(`/${location.pathname}/editor?id=${record.id}`); // 使用查询参数跳转
                        },
                        style: { cursor: 'pointer' } // 添加鼠标悬停样式
                    };
                }}
            />
        </div>
    );
}