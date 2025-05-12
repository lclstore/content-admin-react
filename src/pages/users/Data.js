/**
 * 用户模块数据定义
 */

// 状态码 -> 显示名称 映射 (考虑用于UI显示)
export const statusMap = {
    1: '启用', // 之前是 'enable'
    0: '禁用'  // 之前是 'Disable'/'disable'
};

// 状态排序优先级
export const statusOrder = {
    'enable': 1,
    'Disable': 2,
};

// 筛选器部分定义
export const filterSections = [
    {
        title: 'Status', // 更新标题为中文
        key: 'status',
        options: [1, 0], // 使用数字状态码
        // 可以考虑添加 optionLabels: ['启用', '禁用'] 用于UI下拉框显示
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
        avatar: 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png',
        createUser: 'Admin',
        createTime: '2024-01-15 10:00:00',
        status: 2, // 'enable' -> 1
        status1: 1,
        birthday: '1990-01-15',
        startDate: '2024-05-01',
        endDate: '2024-12-31'
    },
    {
        id: 2,
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        avatar: '',  // 空头像测试
        createUser: 'Admin',
        createTime: '2024-01-16 14:30:00',
        status: 1, // 'enable' -> 1
        birthday: '1992-03-22',
        startDate: '2024-06-15',
        endDate: '2025-06-14'
    },
    {
        id: 3,
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        avatar: null,  // 空头像测试
        createUser: 'Manager',
        createTime: '2024-01-17 09:15:00',
        status: 0, // 'disable' -> 0
        birthday: '1985-11-08',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
    },
    {
        id: 4,
        name: 'Sarah Davis',
        displayImage: 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png',
        email: 'sarah.davis@example.com',
        avatar: 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png',
        createUser: 'Manager',
        createTime: '2024-02-18 16:45:00',
        birthday: "2001-05-13",
        status: 1,
        status1: 'Enabled1',
        status221: 1,
        status2: [1, 2],
        startDate: '2024-07-25',
        endDate: '2025-09-25',
        contentStyle: 'style2',
        layoutType: 2,
        layoutTypeText: 'saasdadas',
        soundScript: 'soundScript饿饿饿饿',
        name23: 'textareaxx soundScript饿饿饿饿 soundScript饿饿饿饿 s  soundScript饿饿饿饿soundScript饿饿饿饿soundScript饿饿饿饿soundScript饿饿饿饿 oundScript饿饿饿饿 soundScript饿饿饿饿 xxx',
        warmNumber: 30,
        warmCycles: 4,
        warmName: 'warmName',
        userPassword: '1sdf23456',
    }
];