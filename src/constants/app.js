/**
 * 应用相关常量
 */

// localStorage键名
export const storageKeys = {
    TOKEN: 'admin_token',
    USER_INFO: 'admin_user',
    THEME: 'admin_theme',
    LANGUAGE: 'admin_language',
    REMEMBER_ME: 'admin_remember',
};



// 主题模式
export const themeModes = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
};

// 默认分页配置
export const defaultPagination = {
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000'],
    showTotal: (total, range) => `${total} items`,
};





// 响应状态
export const responseStatus = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};
