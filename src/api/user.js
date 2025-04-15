import { get, post, put, del } from './request';

// API基础路径
const BASE_PATH = '/users';
const AUTH_PATH = '/auth';

/**
 * 用户登录
 * @param {Object} params - 登录参数
 * @returns {Promise}
 */
export const login = (params) => {
  return post(`${AUTH_PATH}/login`, params);
};

/**
 * 用户注册
 * @param {Object} params - 注册参数
 * @returns {Promise}
 */
export const register = (params) => {
  return post(`${AUTH_PATH}/register`, params);
};

/**
 * 退出登录
 * @returns {Promise}
 */
export const logout = () => {
  return post(`${AUTH_PATH}/logout`);
};

/**
 * 获取用户信息
 * @returns {Promise}
 */
export const getUserInfo = () => {
  return get(`${BASE_PATH}/info`);
};

/**
 * 获取用户列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getUserList = (params) => {
  return get(BASE_PATH, params);
};

/**
 * 获取用户详情
 * @param {string|number} id - 用户ID
 * @returns {Promise}
 */
export const getUserDetail = (id) => {
  return get(`${BASE_PATH}/${id}`);
};

/**
 * 创建用户
 * @param {Object} data - 用户数据
 * @returns {Promise}
 */
export const createUser = (data) => {
  return post(BASE_PATH, data);
};

/**
 * 更新用户
 * @param {string|number} id - 用户ID
 * @param {Object} data - 用户数据
 * @returns {Promise}
 */
export const updateUser = (id, data) => {
  return put(`${BASE_PATH}/${id}`, data);
};

/**
 * 删除用户
 * @param {string|number} id - 用户ID
 * @returns {Promise}
 */
export const deleteUser = (id) => {
  return del(`${BASE_PATH}/${id}`);
};

/**
 * 批量删除用户
 * @param {Array} ids - 用户ID数组
 * @returns {Promise}
 */
export const batchDeleteUsers = (ids) => {
  return post(`${BASE_PATH}/batch-delete`, { ids });
};

/**
 * 修改密码
 * @param {Object} data - 密码数据
 * @returns {Promise}
 */
export const changePassword = (data) => {
  return post(`${BASE_PATH}/change-password`, data);
};

/**
 * 重置密码
 * @param {string|number} id - 用户ID
 * @returns {Promise}
 */
export const resetPassword = (id) => {
  return post(`${BASE_PATH}/${id}/reset-password`);
};

/**
 * 更新用户状态
 * @param {string|number} id - 用户ID
 * @param {string} status - 用户状态
 * @returns {Promise}
 */
export const updateUserStatus = (id, status) => {
  return put(`${BASE_PATH}/${id}/status`, { status });
};

/**
 * 上传用户头像
 * @param {FormData} formData - 表单数据
 * @returns {Promise}
 */
export const uploadAvatar = (formData) => {
  return post(`${BASE_PATH}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}; 