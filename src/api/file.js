import { get } from './request';

export const uploadFile = async (file, dir, bucketType = 'MKTPROMO_7M') => {
    let params = {
        contentType: file.type,
        dir,
        fileName: file.name,
        bucketType 
    }


    let { uploadUrl, fileRelativeUrl } = await
        get(`/internal/cloudflare/getTempUploadUrl`, params)
    await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
    })
    return fileRelativeUrl
};

export default {
    uploadFile
};
