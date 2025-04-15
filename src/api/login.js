import { get, post, put, del } from './request';

// API基础路径
const BASE_PATH = '/auth';

/**
 * 用户登录
 * @param {Object} data - 登录数据，通常包含用户名和密码
 * @returns {Promise}
 */
const login = (data) => {
    return post(`${BASE_PATH}/login`, data);
};

/**
 * 用户登出
 * @returns {Promise}
 */
const logout = () => {
    return post(`${BASE_PATH}/logout`);
};

/**
 * 获取当前登录用户信息
 * @returns {Promise}
 */
const getCurrentUser = () => {
    return get(`${BASE_PATH}/profile`);
};

/**
 * 刷新访问令牌
 * @param {Object} data - 刷新令牌数据
 * @returns {Promise}
 */
const refreshToken = (data) => {
    return post(`${BASE_PATH}/refresh-token`, data);
};

/**
 * 重置密码请求
 * @param {Object} data - 包含用户邮箱的数据对象
 * @returns {Promise}
 */
const requestPasswordReset = (data) => {
    return post(`${BASE_PATH}/password-reset-request`, data);
};

/**
 * 重置密码
 * @param {Object} data - 包含新密码和验证令牌的数据对象
 * @returns {Promise}
 */
const resetPassword = (data) => {
    return post(`${BASE_PATH}/password-reset`, data);
};

export default {
    login,
    logout,
    getCurrentUser,
    refreshToken,
    requestPasswordReset,
    resetPassword
}; 