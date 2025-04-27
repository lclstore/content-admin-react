/**
 * 应用相关常量
 */
import {
    EditOutlined,
    StopOutlined,
    CheckCircleOutlined,
    CheckCircleFilled,
    CheckOutlined,
    CloseOutlined,
    CopyOutlined,
    DeleteOutlined,
    CloseCircleFilled,
    EditFilled,
    ThunderboltOutlined,
    DashboardOutlined,
    UserOutlined,
    SettingOutlined,
    LoginOutlined,
    AudioOutlined
} from '@ant-design/icons';
// localStorage键名
export const STORAGE_KEYS = {
    TOKEN: 'admin_token',
    USER_INFO: 'admin_user',
    THEME: 'admin_theme',
    LANGUAGE: 'admin_language',
    REMEMBER_ME: 'admin_remember',
};

// 主题模式
export const THEME_MODES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
};

// 默认分页配置
export const DEFAULT_PAGINATION = {
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000'],
    showTotal: (total, range) => `${total} items`,
};

// 定义操作按钮图标映射
export const ACTION_ICON_MAP = {
    'edit': EditOutlined,
    'duplicate': CopyOutlined,
    'delete': DeleteOutlined,
    'enable': CheckCircleOutlined,
    'disable': StopOutlined,
    'deprecate': StopOutlined
};
// 状态图标
export const STATUS_ICON_MAP = {
    draft: {
        icon: EditFilled,
        color: '#889e9e',
    },
    disabled: {
        icon: CloseCircleFilled,
        color: '#ff4d4f',
    },
    enabled: {
        icon: CheckCircleFilled,
        color: '#52c41a',
    }
};

// 左侧菜单图标映射
export const MENU_ICON_MAP = {
    exercises: ThunderboltOutlined,
    workouts: DashboardOutlined,
    users: UserOutlined,
    'profile-settings': SettingOutlined,
    login: LoginOutlined,
    music: AudioOutlined

};
// 勾 叉 图标映射配置
export const RESULT_ICON_MAP = {
    1: {
        icon: CheckOutlined,
        color: '#52c41a' // 绿色，表示正确
    },
    0: {
        icon: CloseOutlined,
        color: '#ff4d4f' // 红色，表示错误
    }
};
export const FILE_STATUS_ICON_MAP = {
    successful: {
        color: '#52c41a' // 绿色，表示正确
    },
    processing: {
        color: '#889e9e' //  表示处理中
    },
    failed: {
        color: '#ff4d4f' // 红色，表示错误  
    }
}


// 响应状态
export const RESPONSE_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

export const USER_STATUS_ICON_MAP = {
    Enable: {
        icon: CheckCircleFilled,
        color: '#52c41a', // 绿色，表示启用状态
    },
    Disable: {
        icon: CloseCircleFilled,
        color: '#ff4d4f', // 红色，表示禁用状态
    }
}; 