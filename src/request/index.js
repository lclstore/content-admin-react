import axios from 'axios'
import settings from "@/config/settings.js";
import { message as Message } from "antd"
import { useStore } from "@/store"
// 从环境变量获取数据
const VITE_ENV = import.meta.env.VITE_ENV;
const baseUrl = import.meta.env.VITE_API_BASE_URL;

console.log('VITE_ENV =>>>>>>', VITE_ENV)
console.log("Message",Message)
const axios_default = axios.create({
    timeout: 0,
})
// const Loading = useStore(state => state.setLoadingGlobal);
const { setLoadingGlobal } = useStore.getState();
const Loading  = setLoadingGlobal;

// message弹窗管理器
class MessageC {
    constructor() {
        this.codeControl = {}
    }

    open(messageConfig, code) {
        if (this.codeControl[code]) {
            return true
        } else {
            this.codeControl[code] = true
            Message.open({
                ...messageConfig,
                onClose: (() => {
                    return () => {
                        this.codeControl[code] = false
                    }
                })()
            })
        }
    }
}

let message = new MessageC()
// load是否要load状态 ，customBox是否进行返回提示
/**
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Function} callback - 请求成功回调函数
 * @param {String} method - 请求方法
 * @param {Boolean} load - 是否显示加载框
 * @param {Boolean} point - 是否进行提示
 * @param {Boolean} warningPoint - 是否进行warning提示
 * @param {Function} resInit - response 处理
 * */
class Request {
    constructor(config) {
        this.config = {
            ...config,
            callback:config.callback || (() => {}),
            warningPoint:config.warningPoint ? config.warningPoint : true,
            tokenCheck:config.tokenCheck,
            successCheck:config.successCheck,
            method:config.method || 'post',
            point:config.point ? config.point : false,
            url:(config.baseUrl || baseUrl) + config.url,
        }
    }
    async send(){
        let loading = Loading,config = this.config;
        if (config.load) {
            loading(true)
        }
        // resInit init
        const resInit = config.resInit || settings.request.resInit;
        await axios_default({
            ...config,
            [config.method === 'get' ? 'params' : 'data']: config.data,
        }).then((res) => {
            if (config.load) {
                loading(false)
            }
            res = resInit(res)
            // token 校验
            if (res.tokenError) {
                localStorage.removeItem(settings.request.tokenName)
                useStore.getState().navigate('/login')
            }
            if (res.data.success) {
                config.point && message.open({content: "success", type: 'success'},'success')
            }else {
                // error
                config.warningPoint && message.open({
                    content: res.data.errMessage,
                    type: 'warning',
                    duration: 3,
                }, res.data.errCode)
                res.error = res.data.errMessage
            }
            config.callback(res)
        }).catch((err) => {
            if (config.load) {
                loading(false)
            }
            message.open({content: err, type: 'error'}, 'error')
            config.callback({error: err})
            console.log(err)
        })
    }
    post(){ this.config.method = "post"; this.send() }
    get(){ this.config.method = "get"; this.send() }
    put(){ this.config.method = "put"; this.send() }
    delete(){ this.config.method = "post"; this.send() }
}

axios_default.interceptors.request.use(config => {
    settings?.request?.interceptors(config)
    // 跨域申请
    config.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    config.method === "get" && config.params && Object.keys(config.params)
        .some(key => {
            config.params[key] === '' && (config.params[key] = null)
        })

    return config
})
export default {
    send: (config) => new Request(config).send(),
    get:(config) => new Request(config).get(),
    post:(config) => new Request(config).post(),
    put:(config) => new Request(config).put(),
    delete:(config) => new Request(config).delete(),
}