import request from "@/request"
import { a } from "@/request"
export function uploadFile() {
    // 上传
    const func = ({file, dirKey, url}) => {
        let formData = new FormData();
        formData.append("file", file);
        dirKey && formData.append("dirKey", dirKey);
        let returnData = {
            localUrl: URL.createObjectURL(file)
        }
        return new Promise(resolve => {
            request(
                url,
                formData,
                res => {
                    if (!res.error) {
                        returnData.fileRelativeUrl = res.data.data.fileRelativeUrl
                        returnData.fileUrl = res.data.data.fileUrl
                    } else {
                        returnData.error = true
                    }
                    resolve(returnData)
                },
                "post",
                false,
                false
            );
        })
    }
    // s3上传
    const s3Func = async ({file, dirKey, url}) => {
        /**
         *  @returns {String} returnData.error - 返回的string，error
         *  @returns {String} returnData.fileRelativeUrl - 返回的文件读取的相对路径
         *  @returns {String} returnData.fileUrl - 返回的文件读取的绝对路径
         *  @returns {String} returnData.localUrl - 返回的文件的本地读取路径
         */
        let returnData = {
            localUrl: URL.createObjectURL(file)
        }
        // 生成uuid作为名称
        const params = {
            dirKey,
            fileName: file.name.replace(/.+\./, uuid() + '.'),
            contentType: file.type
        };
        let fileUrl = await new Promise(resolve => {
            request(url, params, res => {
                res != "error" ? resolve(res.data.data) : resolve('error')
            }, "get", false, false)
        })

        // 对fileUrl进行处理,如果返回url路径包含name，把name的值替换为file.name,如果不包含name则在url添加name且值为file.name
        function replaceName(url, name) {
            let urlObj = new URL(url)
            urlObj.searchParams.set('name', name)
            return urlObj.toString()
        }

        // 使用正则替换file.name文件名为uuid
        fileUrl.fileUrl = replaceName(fileUrl.fileUrl, file.name)
        let origin = 'https://test.com/'
        fileUrl.fileRelativeUrl = replaceName(origin + fileUrl.fileRelativeUrl, file.name).replace(origin, '')
        if (fileUrl != 'error') {
            await fetch(fileUrl.uploadUrl, {
                method: 'PUT',
                body: file,
            }).then(() => {
                // 上传成功
                returnData = {...returnData, ...fileUrl}
                Reflect.deleteProperty(returnData, 'uploadUrl')
            }).catch(() => returnData.error = true)
        } else {
            returnData.error = true
        }
        return returnData
    }
    return {
        fireBase: async (config) => {
            config.url = '/manage/file/upload';
            return await func(config)
        },
        comPress: async (config) => {
            config.url = '/manage/file/uploadCompressionFile';
            return await func(config)
        },
        cloudFlare: async (config) => {
            config.url = '/manage/file/uploadR2';
            return await func(config)
        },
        s3: async (config) => {
            config.url = '/manage/file/getTempUploadUrl';
            return await s3Func(config)
        }
    }
}
export const getList = async (moduleKey) => {
    return new Promise(resolve => {
        request.get({
            url:`/${moduleKey}/page`,
            callback: res => resolve(res)
        });
    })
}