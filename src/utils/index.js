import settings from '@/config/settings';
import { v4 as uuidv4 } from 'uuid';


const { file: fileSettings } = settings;
/**
 * 工具函数集合
 */

/**
 * 深度克隆对象
 * @param {any} obj 需要克隆的对象
 * @returns {any} 克隆后的新对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  // 处理普通对象
  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否为有效邮箱格式
 */
export function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * 格式化日期
 * @param {Date|string|number} date 日期对象/日期字符串/时间戳
 * @param {string} format 格式化模板，如：'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';

  date = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const formatMap = {
    'YYYY': year,
    'MM': month < 10 ? `0${month}` : month,
    'DD': day < 10 ? `0${day}` : day,
    'HH': hours < 10 ? `0${hours}` : hours,
    'mm': minutes < 10 ? `0${minutes}` : minutes,
    'ss': seconds < 10 ? `0${seconds}` : seconds,
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
}
/**
* 格式化一段日期区间
* @param {string|Date|null|undefined} start - 开始时间
* @param {string|Date|null|undefined} end - 结束时间
* @param {string} pattern - 格式化模板，默认 'YYYY-MM-DD'
* @returns {string} - 返回 'start to end'，或全部为空时返回 '-'
*/
export function formatDateRange(start, end, pattern = 'YYYY-MM-DD') {
  const formattedStart = start ? formatDate(start, pattern) : '-';
  const formattedEnd = end ? formatDate(end, pattern) : '-';
  // 如果两端都为空，就直接返回 '-'
  if (formattedStart === '-' && formattedEnd === '-') {
    return '-';
  }
  return `${formattedStart} to ${formattedEnd}`;
}
/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {number} delay 延迟时间，单位毫秒
 * @returns {Function} 防抖处理后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;

  return function (...args) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 生成随机字符串
 * @param {number} length 随机字符串长度
 * @returns {string} 生成的随机字符串
 */
export function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// 格式化时长 (秒 -> MM:SS)
export const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  return `${formattedMinutes}:${formattedSeconds}`;
};
/**
 * 获取完整URL的辅助函数
 * @param {string} url 需要处理的URL
 * @returns {string} 完整URL
 */
export const getFullUrl = (url) => {
  if (!url) return '';
  // 如果已经是完整URL或者是数据URL，则不添加baseURL
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return `${fileSettings.baseURL}${url}`;
};

/**
 * 验证密码格式
 * @param {string} password - 需要验证的密码字符串
 * @returns {boolean} 如果密码格式有效（8-12位，包含字母和数字），则返回 true，否则返回 false
 */
export const validatePassword = (password) => {
  // 密码必须包含字母（大写或小写）和数字，且长度为8到12位
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;
  return passwordRegex.test(password);
};

/**
 * 生成 UUID (v4)
 * @returns {string} 返回一个新的 UUID 字符串
 */
export const generateUUID = () => {
  return uuidv4();
};


