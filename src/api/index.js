import request, { get, post, put, del, upload, download } from './request';
import userApi from './user';
import teamApi from './login';
import dashboardApi from './dashboard';

// 导出所有API
const api = {
  // 通用请求方法
  request,
  get,
  post,
  put,
  delete: del,
  upload,
  download,

  // 业务模块API
  user: userApi,
  team: teamApi,
  dashboard: dashboardApi
};

export default api; 