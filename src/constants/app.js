/**
 * 应用相关常量
 */

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

// 操作类型
export const ACTION_TYPES = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    VIEW: 'view',
    EXPORT: 'export',
    IMPORT: 'import',
};

// 响应状态
export const RESPONSE_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
}; 