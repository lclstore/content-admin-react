import axios from 'axios';
// 创建一个新的 Axios 实例，专门用于与文件服务器 API 通信
const fileRequest = axios.create({
    baseURL: process.env.VITE_FILE_BASE_URL,
    timeout: parseInt(process.env.VITE_FILE_REQUEST_TIMEOUT),
});


export default fileRequest; 