import { generateUUID } from '@/utils';
import fileApi from '@/api/file';
import { Tabs } from 'antd';

//文件上传
const uploadFileFn = async ({ file }) => {
  let fileUrl = await fileApi.uploadFile(file, settings.file.dirname)
  return fileUrl
}

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

  //附件设置
  file: {
    baseURL: import.meta.env.VITE_FILE_PREVIEW_URL,
    // 文件目录
    dirname: 'test',
    uploadFile: async ({ file }) => {
      return await uploadFileFn({
        file,
      });
    }
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
        lineHeight: 1.7
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
      Tabs: {
        colorBorderSecondary: 'none', //默认下划线
        inkBarColor: '#1c8',          // 下划线颜色（激活tab）
        lineWidthBold: 5,             // 下划线高度
        itemColor: '#243636',            // 非激活tab颜色
        itemActiveColor: '#243636',      // 激活tab文字颜色
        itemHoverColor: '#243636',       // hover时颜色
        itemSelectedColor: '#243636',    // 被选中tab文字颜色（等于 itemActiveColor）
      },
      Collapse:{
        colorTextHeading:"rgba(0,0,0,0.7)"
      }
    }
  }

};

export default settings; 