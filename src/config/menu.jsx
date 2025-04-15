/**
 * 应用菜单配置 - 根据pages目录动态生成
 * 
 * 菜单生成规则：
 * 1. 文件命名规则影响菜单显示和URL路径
 *    - xxxList.jsx: 生成列表页面，如 /workouts-list
 *    - xxxEditor.jsx: 生成编辑页面，如 /workouts-editor
 *    - xxxDetail.jsx: 生成详情页面，如 /workouts-detail
 * 2. 文件夹名决定菜单分组，如 workouts 文件夹下的文件都归属于 Workouts 菜单组
 * 3. 菜单排序通过 settings 配置中的 menuOrder 字段控制
 * 4. 菜单项Key生成规则：
 *    - 文件夹名转为大驼峰格式，如 profile-settings 转为 ProfileSettings
 *    - 文件特性拼接在后面，如 ProfileSettingsList、ProfileSettingsEditor
 */
import React from 'react';
import {
    DashboardOutlined,
    UserOutlined,
    SettingOutlined,
    LoginOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import settings from './settings';

// 左侧菜单栏图标映射表
export const iconMap = {
    exercises: <ThunderboltOutlined />,
    workouts: <DashboardOutlined />,
    users: <UserOutlined />,
    'profile-settings': <SettingOutlined />,
    login: <LoginOutlined />
};

// 静态菜单项 - 只有登录页
const staticMenus = [
    {
        key: 'login',
        path: '/login',
        title: 'Login',
        icon: iconMap.login,
        hideInMenu: true,
    }
];

// 动态生成菜单
const dynamicMenus = [];

try {
    // 动态获取所有pages目录下的jsx文件
    const pageFiles = import.meta.glob('../pages/**/*.jsx', { eager: true });

    // 处理页面文件并生成菜单
    Object.keys(pageFiles).forEach(filePath => {
        // 跳过login目录的index.jsx（已在静态菜单中）
        if (filePath.includes('/login/index.jsx')) return;

        // 解析文件路径获取文件夹和文件名
        const pathSegments = filePath.split('/');
        const fileName = pathSegments[pathSegments.length - 1].replace('.jsx', '');
        const folderName = pathSegments[pathSegments.length - 2];

        // 获取菜单名称
        let menuName = fileName;

        // 根据文件夹名和文件名生成菜单显示名称
        if (folderName.includes('-')) {
            // 如果文件夹名包含连字符，将其转换为空格分隔的标题格式
            menuName = folderName
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        } else if (fileName.endsWith('List')) {
            // 列表页面：去掉"List"后缀，只显示资源名称（如"Workouts"）
            menuName = fileName.replace('List', '');
        } else if (fileName.endsWith('Editor')) {
            // 编辑页面：显示为"资源名 Editor"（如"Workouts Editor"）
            menuName = folderName.charAt(0).toUpperCase() + folderName.slice(1) + ' Editor';
        } else if (fileName.endsWith('Detail')) {
            // 详情页面：显示为"资源名 Detail"（如"Workouts Detail"）
            menuName = folderName.charAt(0).toUpperCase() + folderName.slice(1) + ' Detail';
        } else {
            // 其他页面：将文件名转换为友好显示格式
            menuName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        }

        // 为菜单项设置hideInMenu属性 - List结尾显示在菜单中，其他隐藏
        const hideInMenu = !fileName.endsWith('List');

        // 生成路径 - 根据文件名特性生成不同的URL路径
        let pathSuffix = 'detail';
        if (fileName.endsWith('List')) {
            pathSuffix = 'list';
        } else if (fileName.endsWith('Editor')) {
            pathSuffix = 'editor';
        } else if (fileName.endsWith('Detail')) {
            pathSuffix = 'detail';
        } else {
            // 保留原始文件名作为路径后缀（小写）
            pathSuffix = fileName.toLowerCase();
        }
        const pathValue = `/${folderName}-${pathSuffix}`;

        // 生成菜单项唯一标识符 - 组合文件夹名和文件特性
        // 处理文件夹名，转换为大驼峰格式（如 profile-settings -> ProfileSettings）
        const folderKey = folderName.split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

        // 组合文件夹名和文件特性生成最终的key
        const camelCaseKey = folderKey +
            (fileName.endsWith('List') ? 'List' :
                fileName.endsWith('Editor') ? 'Editor' :
                    fileName.endsWith('Detail') ? 'Detail' :
                        fileName.charAt(0).toUpperCase() + fileName.slice(1));

        // 添加到菜单
        dynamicMenus.push({
            key: camelCaseKey,
            path: pathValue,
            title: menuName,
            icon: iconMap[folderName] || null,
            hideInMenu: hideInMenu,
            folderName: folderName,
            meta: {
                title: menuName,
            },
            order: settings.menu?.menuOrder?.[folderName] || 999
        });
    });

    // 按照order字段排序菜单
    dynamicMenus.sort((a, b) => a.order - b.order);

} catch (error) {
    console.error('菜单生成错误:', error);
}

// 合并静态菜单和动态菜单
const menus = [...dynamicMenus, ...staticMenus];
console.log('菜单配置:', menus);

export default menus; 