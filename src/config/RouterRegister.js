// const fileAddresList = import.meta.glob('@/components', true, /{suffix}/).keys()
/**
 * 构建数据
 * @constructor
 * @param {Object} registerData
 * @param {Array<String>} registerData.fileAddresList - 文件地址列表
 * @param {String} registerData.sign - 标记
 * @param {String} registerData.dir - 需要进行注册的文件根目录 格式: fileAddresList 为 ../xxx/xxx.xx  dir 应该为 ../xxx/
 * @param {Array<String>} registerData.sort - 排序所用的排序规则
 * @param {Function} registerData.createRule - 创建路由时会调用的钩子
 * @param {String} registerData.suffix - 所解析的文件后缀名
 * @param {Array<String>} registerData.nameTransform - 名称转化用的数组
 * @returns {Array<Object>}
 */
class RouterRegister {
    constructor({ fileAddresList, dir, sign, sort, createRule, suffix, nameTransform, iconConifg, FatherComponent }) {
        this.sign = sign;
        this.dir = dir;
        this.sort = sort;
        this.createRule = createRule;
        this.suffix = suffix;
        this.nameTransform = nameTransform //名称转化
        this.iconConifg = iconConifg // 绑定的icon
        this.FatherComponent = FatherComponent // 父节点的渲染规则
        // 去除了./ ,routeList 中都是  xxx/xxx/xxx{suffix} or xxx/xxx{suffix} 格式
        this.routeList = fileAddresList.filter(address => address.indexOf(dir) !== -1).map(i => i.replace(dir, ''))
        this.registerArray = []
        this.initRouter()
        return this.registerArray
    }
    initRouter() {
        // 创建节点
        // address 格式 xxx/xxx/xxx{suffix} or xxx/xxx{suffix}
        this.routeList.some(address => {
            let pathArray = address.split('/')
            // 创建容器
            let dirArry = this.registerArray
            // pathArray长度 大于2，说明是一个有父子层级的节点
            if (pathArray.length > 2) {
                const fatherList = pathArray.slice(0, -2)
                let dirAddress = []
                fatherList.some(dirName => {
                    dirAddress.push(dirName)
                    // 先查询，没有就创建并添加
                    let dirObj = this.searchDir(dirAddress)
                    if (!dirObj) {
                        dirObj = this.createRoute(dirAddress.join("/"))
                        // 添加进list
                        dirArry.push(dirObj)
                    }
                    // 更新list容器
                    dirArry = dirObj.children || []
                })
            }
            dirArry.push(this.createRoute(address))
        })
        // 节点排序
        this.sort && this.registerArray.sort((a, b) => {
            let aSort = this.sort.indexOf(a.meta) !== -1 ? this.sort.indexOf(a.meta) : this.registerArray.length
            let bSort = this.sort.indexOf(b.meta) !== -1 ? this.sort.indexOf(b.meta) : this.registerArray.length
            return aSort - bSort
        })
    }
    // 创建单个路由的方法
    createRoute(address) {
        let pathArray = address.split('/')
        let fatherPathSting = false
        // 文件夹名,文件的上一层肯定是它的模块名
        let routerHead = pathArray[pathArray.length - 2]
        // address 最后一位不带 vue 就是创建一个父节点
        if (pathArray.slice(-1)[0].indexOf(this.suffix) === -1) {
            fatherPathSting = true
            routerHead = pathArray.slice(-1)[0]
        }
        // 文件名，不带后缀
        let fileName = pathArray.slice(-1)[0].replace(this.suffix, '')
        // 首字母转小写
        fileName = fileName.replace(fileName[0], fileName[0].toLowerCase())
        // 初始化
        let RouterObj = {
            // 标记分组
            class: this.sign,
            // meta属性继承文件夹名称,meta字段为列表名称，优先级小于showName
            // meta同时也作为左侧侧边栏列表的权限key,主要功能是作为权限key，名称通过showName字段修改
            meta: routerHead,
            // path路由访问路径创建
            path: "/" + pathArray.slice(0, -1).join('/') + "/" + fileName,
            // 非list,且不为父节点 都隐藏
            noShow: (fileName !== 'list') && !fatherPathSting,
            // active设置绑定的左侧list,非父非list，绑定list，父节点绑自己的address
            active: `/${fatherPathSting ? address : pathArray.slice(0, -1).join('/') + '/' + 'list'}`,
            // 是否为父节点
            isFatherDom: fatherPathSting,
            children: fatherPathSting ? [] : false
        }
        // component路径创建
        {
            let component;
            component = this.FatherComponent
            if (!fatherPathSting) {
                component = address
            }
            RouterObj.component = component
        }
        // showName 创建
        {
            // 有大写的空格隔开
            let showName = routerHead.replace(/[A-Z]{1}/g, (val) => ' ' + val)
            // 名称统一首字母大写
            showName = showName.replace(routerHead[0], routerHead[0].toUpperCase())
            RouterObj.showName = showName
            // 名称转化
            if (this.nameTransform && this.nameTransform[showName]) {
                RouterObj.showName = this.nameTransform[showName]
            }
        }
        // 加入icon
        {
            // 模块对应icon
            this.iconConifg && (RouterObj.icon = this.iconConifg[RouterObj.active] || 'el-icon-document')
        }
        this.createRule && this.createRule(RouterObj)
        return RouterObj
    }
    // 查询 registerArray 中的节点
    searchDir(addressArr) {
        let list = this.registerArray
        let nodeCache = null
        addressArr.some((pathName, index) => {
            let searchRes = list.filter(i => i.meta === pathName)
            // 中途一层没找到就直接退出
            if (searchRes.length !== 0) {
                // 最后一层没退出找到的就是结果
                if (index === addressArr.length - 1) {
                    nodeCache = searchRes[0]
                } else {
                    list = searchRes[0].children
                }
            } else {
                return true
            }
        })
        return nodeCache
    }
}

export default RouterRegister
