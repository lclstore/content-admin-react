import request from "@/request"
// s3上传
/**
 *  @param {File} file - 文件
 *  @param {String} dirKey - 文件目录
 *  @returns {String} returnData.error - 返回的string，error
 *  @returns {String} returnData.fileRelativeUrl - 返回的文件读取的相对路径
 *  @returns {String} returnData.fileUrl - 返回的文件读取的绝对路径
 *  @returns {String} returnData.localUrl - 返回的文件的本地读取路径
 */
export const uploadFile = async function ({ file, dirKey }) {
    const fileType = file.type.split('/')[0];  //文件类型
    let returnData = {
        localUrl: URL.createObjectURL(file)
    }
    // 生成uuid作为名称
    const params = {
        dirKey: `${dirKey}-${fileType}`,
        fileName: file.name,
        contentType: file.type
    };
    let fileUrl = await new Promise(resolve => {
        request.get({
            url: "/s3/getTempUploadUrl",
            data: params,
            callback: res => {
                res.error ? resolve('error') : resolve(res.data.data)
            }
        })
    })

    if (fileUrl !== 'error') {
        await fetch(fileUrl.uploadUrl, {
            method: 'PUT',
            body: file,
        }).then(() => {
            // 上传成功
            returnData = { ...returnData, ...fileUrl }
            Reflect.deleteProperty(returnData, 'uploadUrl')
        }).catch(() => returnData.error = true)
    } else {
        returnData.error = true
    }
    return returnData
}
// 获取公共table列表
export const getPublicTableList = async (moduleKey, operationName, params) => {
    return new Promise(resolve => {
        request.get({
            url: `/${moduleKey}/${operationName}`,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}
// 排序公共table列表
export const sortPublicTableList = async (moduleKey, params) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/sort`,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}
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
export const savePublicFormData = (params, url) => {
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
// 公共生成
export const publicGenerate = (params, url) => {
    return new Promise(resolve => {
        request.post({
            url: url,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}
// 公共启用/禁用数据
export const publicUpdateStatus = (params, url) => {
    return new Promise(resolve => {
        request.post({
            url: url,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}
// 公共删除数据
export const publicDeleteData = (params, url) => {
    return new Promise(resolve => {
        request.post({
            url: url,
            load: true,
            data: params,
            callback: res => resolve(res?.data)
        });
    })
}
export const enable = async ({ moduleKey, idList }) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/enable`,
            data: { idList },
            callback: res => resolve(res)
        });
    })
}
export const disable = async ({ moduleKey, idList }) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/disable`,
            data: { idList },
            callback: res => resolve(res)
        });
    })
}
export const del = async ({ moduleKey, idList }) => {
    return new Promise(resolve => {
        request.post({
            url: `/${moduleKey}/del`,
            data: { idList },
            callback: res => resolve(res)
        });
    })
}
export const getEnumList = async () => {
    return new Promise(resolve => {
        request.get({
            url: `/enum/list`,
            data: {},
            callback: (res) => {
                const enumList = {}
                res.data.data.forEach(i => {
                    enumList[i.displayName] = i.datas.map(data => ({
                        value: data.enumName,
                        label: data.displayName,
                        ...data
                    }))
                })
                resolve(enumList)
            }
        });
    })
}