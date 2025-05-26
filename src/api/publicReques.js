import request from "@/request";

// API基础路径
const BASE_PATH = '/user';
const AUTH_PATH = '/add';


// 根据id获取表单数据
export const getformDataById = (url) => {
    return new Promise((resolve, reject) => {
        request.get({
            url: url,
            callback(res) {
                resolve(res?.data);
            }
        });
    });
};
// 保存公共表单数据
export const savePublicFormData = (params, url, method = 'post') => {
    return new Promise((resolve, reject) => {
        request.post({
            url: url,
            load: false,
            data: params,
            callback(res) {
                resolve(res?.data);
            }
        });
    });
};


