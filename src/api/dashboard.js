import { get } from './request';

// API基础路径
const BASE_PATH = '/dashboard';

/**
 * 获取仪表盘概览数据
 * @returns {Promise}
 */
const getOverview = () => {
    return get(`${BASE_PATH}/overview`);
};

/**
 * 获取用户统计数据
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
const getUserStats = (params = {}) => {
    return get(`${BASE_PATH}/user-stats`, params);
};

/**
 * 获取内容统计数据
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
const getContentStats = (params = {}) => {
    return get(`${BASE_PATH}/content-stats`, params);
};

/**
 * 获取活动日志
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
const getActivityLogs = (params = {}) => {
    return get(`${BASE_PATH}/activity-logs`, params);
};

/**
 * 获取系统状态
 * @returns {Promise}
 */
const getSystemStatus = () => {
    return get(`${BASE_PATH}/system-status`);
};

export default {
    getOverview,
    getUserStats,
    getContentStats,
    getActivityLogs,
    getSystemStatus
}; 