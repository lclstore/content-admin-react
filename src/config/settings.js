/**
 * 系统全局配置
 */
const settings = {

  // 布局设置
  layout: {
    // 侧边栏宽度
    sidebarWidth: 250,
    // 头部高度
    headerHeight: 64,
    // 主题
    theme: 'dark',
  },

  // 请求设置
  request: {
    // 接口基础路径
    baseURL: process.env.VITE_API_BASE_URL,
    // 请求超时时间
    timeout: 10000,
    // 是否开启接口错误提示
    showErrorMessage: true,
  },

  // 路由重定向设置
  router: {
    // 首页路由
    homePath: '/login',
  },

  // 菜单设置
  menu: {
    // 菜单顺序映射表（值越小越靠前）
    menuOrder: {
      'exercises': 1,
      'workouts': 2,
      'users': 3,
      'profile-settings': 4
    },
  },

  // 存储设置
  storage: {
    // token键名
    tokenKey: 'admin_token',
    // 用户信息键名
    userKey: 'admin_user',
  },
  // 自定义主题配置
  themeConfig: {
    token: {
      colorPrimary: '#243636',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      borderRadius: 12,
      colorBgHeader: '#243636',
      colorTextHeading: '#ffffff',
    },
    components: {
      Button: {
        // 高度设置为auto
        controlHeight: 40,
        borderRadius: 12,
        // 边框
        borderWidth: 1,
        // 字体大小
        fontSize: 12,
        fontWeight: 700,
      },
      Switch: {
        colorPrimary: '#1c8',
        colorPrimaryHover: '#11af75',
        inactiveColor: '#c0c6c6',
      },
      Input: {
        activeBorderColor: '#1c8',
        hoverBorderColor: '#1c8',
        activeShadow: 'none',
        paddingBlock: 8,
        controlHeight: 40

      },
      Select: {
        activeBorderColor: '#1c8',
        hoverBorderColor: '#1c8',
        activeShadow: 'none',
        activeColor: '#1c8',
        paddingBlock: 8,
        controlHeight: 40
      },
      Form: {
        labelColor: '#243636',
        labelFontSize: 16,
      },
      Modal: {
        colorIcon: '#ffffff',
        colorIconHover: '#ffffff',
      },
      Checkbox: {
        colorPrimary: '#1c8',
        colorPrimaryHover: '#11af75',
        inactiveColor: '#c0c6c6',
      },
      DatePicker: {
        colorPrimary: '#1c8',
        colorPrimaryHover: '#11af75',
        inactiveColor: '#c0c6c6',
        cellHeight: 40,
        controlHeight: 40,
        borderWidth: 1,
        activeBorderColor: '#1c8',
        hoverBorderColor: '#1c8',
        activeShadow: 'none',
        cellInRangeBg: 'none',
      },

    }
  }

};

export default settings; 