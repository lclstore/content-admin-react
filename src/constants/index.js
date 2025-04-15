/**
 * 常量统一导出
 */
import { HTTP_STATUS, HTTP_METHODS, CONTENT_TYPES } from "./http";
import { STORAGE_KEYS, THEME_MODES, ACTION_TYPES, RESPONSE_STATUS } from "./app";

// 分页默认值
export const PAGINATION = {
  DEFAULT_CURRENT: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: ["10", "20", "50", "100"],
};

// 导出所有常量
export {
  // HTTP相关常量
  HTTP_STATUS,
  HTTP_METHODS,
  CONTENT_TYPES,

  // 应用相关常量
  STORAGE_KEYS,
  THEME_MODES,
  ACTION_TYPES,
  RESPONSE_STATUS,
};
