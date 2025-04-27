/**
 * 用户模块数据定义
 */

// 状态排序优先级
export const statusOrder = {
    'enable': 1,
    'Disable': 2,
};

// 筛选器部分定义
export const filterSections = [
    {
        title: 'Status',
        key: 'status',
        options: ['enable', 'Disable']
    },
    {
        title: 'Create User',
        key: 'createUser',
        options: ['Admin', 'Manager']
    }
];

export const mockUsers = [
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Admin',
        createTime: '2024-01-15 10:00:00',
        status: 'enable'
    },
    {
        id: 2,
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        avatar: '',  // 空头像测试
        createUser: 'Admin',
        createTime: '2024-01-16 14:30:00',
        status: 'enable'
    },
    {
        id: 3,
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        avatar: null,  // 空头像测试
        createUser: 'Manager',
        createTime: '2024-01-17 09:15:00',
        status: 'disable'
    },
    {
        id: 4,
        name: 'Sarah Davis',
        email: 'sarah.davis@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Manager',
        createTime: '2024-01-18 16:45:00',
        status: 'enable'
    }
];