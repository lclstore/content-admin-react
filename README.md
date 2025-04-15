# CMS 管理系统

基于 React + Vite + Ant Design 的现代化 CMS 管理系统模板。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 核心框架 | React | ^18.2.0 |
| 构建工具 | Vite | ^5.0.4 |
| UI组件库 | Ant Design | ^5.11.5 |
| 状态管理 | Redux Toolkit | ^1.9.7 |
| 路由 | React Router | ^7.5.0 |
| HTTP请求 | Axios | ^1.6.2 |

## 环境要求

- Node.js: v20.19.0+
- npm: v10.8.2+

## 项目结构

```
src/
├── api/                  # API接口统一管理
│   ├── request.js        # 请求封装
│   ├── user.js           # 用户相关接口
│   ├── team.js           # 团队相关接口
│   ├── dashboard.js      # 仪表盘相关接口
│   └── index.js          # API统一导出
├── assets/               # 静态资源
│   ├── images/           # 图片资源
│   ├── styles/           # 样式资源
│   │   └── variables.css # CSS变量定义
│   └── icons/            # 图标资源
├── components/           # 公共组件
│   ├── common/           # 通用基础组件
│   │   ├── DataTable/    # 数据表格组件
│   │   └── AuthGuard.jsx # 权限控制组件
│   ├── business/         # 业务组件
├── config/               # 全局配置
│   ├── routes.js         # 路由配置
│   ├── menu.js           # 菜单配置
│   └── settings.js       # 系统配置
├── constants/            # 常量定义
│   ├── http.js           # HTTP相关常量
│   ├── app.js            # 应用相关常量
│   └── index.js          # 常量统一导出
├── hooks/                # 自定义Hooks
│   ├── useAuth.js        # 认证相关钩子
│   ├── useTable.js       # 表格数据处理钩子
│   ├── useAsync.js       # 异步操作处理钩子
│   └── index.js          # Hooks统一导出
├── layout/               # 布局页面
├── pages/                # 页面
│   ├── auth/             # 认证相关页面
│   ├── dashboard/        # 仪表盘页面
│   ├── user/             # 用户管理页面
│   ├── team/             # 团队管理页面
│   ├── settings/         # 系统设置页面
│   └── error/            # 错误页面
├── router/               # 路由
│   ├── index.js          # 路由注册
│   └── guards.js         # 路由守卫
├── services/             # 业务服务层
│   ├── user.service.js   # 用户服务
│   └── index.js          # 服务统一导出
├── store/                # 状态管理
│   ├── index.js          # store配置
│   ├── modules/          # 按模块划分状态
│   └── slices/           # Redux Toolkit 切片
├── types/                # 类型定义
│   └── index.d.ts        # 全局类型定义
├── utils/                # 工具函数
├── App.jsx               # 应用根组件
├── main.jsx              # 入口文件
└── index.css             # 全局样式
```

## 核心特性

1. **模块化架构**：按功能和职责划分目录
2. **路由系统**：基于 React Router 7，支持路由守卫和懒加载
3. **状态管理**：使用 Redux Toolkit 管理应用状态
4. **UI组件**：集成 Ant Design 5，支持主题定制
5. **请求封装**：基于 Axios 的统一请求处理
6. **类型支持**：完整的 TypeScript 类型定义
7. **测试支持**：集成 Vitest 测试框架

## 开发指南

### 安装依赖
```bash
npm install
```

### 运行命令
- 开发环境：`npm run dev`
- 测试环境：`npm run dev:test`
- 生产环境：`npm run dev:prod`
- 构建生产：`npm run build`
- 构建测试：`npm run build:test`
- 运行测试：`npm run test`

### 环境配置
支持开发、测试和生产三种环境：
- `.env.development` - 开发环境
- `.env.test` - 测试环境
- `.env.production` - 生产环境

## 项目规范

- **代码风格**：ESLint + Prettier
- **提交规范**：Conventional Commits
- **命名规范**：
  - 组件：PascalCase
  - 工具/Hooks：camelCase
  - 常量：UPPER_SNAKE_CASE
- **路径引用**：使用别名路径（如`@/components`）
- **API组织**：按业务模块划分
- **服务层**：复杂业务逻辑放在服务层
- **常量管理**：集中管理，避免魔法字符串

## 版本信息

- **当前版本**：v1.0.0
- **创建日期**：2025年4月9日
- **基础环境**：Node.js v20.19.0, npm v10.8.2

# 版本记录

本文档记录项目依赖的主要技术栈版本信息，便于项目维护和版本管理。

## 运行环境

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | v20.19.0 | 运行时环境 |
| npm | v10.8.2 | 包管理器 |

## 核心依赖

| 依赖 | 版本 | 说明 |
|------|------|------|
| React | ^18.2.0 | 前端框架 |
| React DOM | ^18.2.0 | React DOM 渲染 |
| React Router | ^7.5.0 | 路由管理 |
| Redux Toolkit | ^1.9.7 | 状态管理 |
| Ant Design | ^5.11.5 | UI 组件库 |
| Ant Design Icons | ^5.2.6 | 图标库 |
| Axios | ^1.6.2 | HTTP 客户端 |
| Lodash | ^4.17.21 | 工具库 |
| PropTypes | ^15.8.1 | 类型检查 |

## 开发依赖

| 依赖 | 版本 | 说明 |
|------|------|------|
| Vite | ^5.0.4 | 构建工具 |
| ESLint | ^8.55.0 | 代码检查 |
| Vitest | ^1.6.1 | 测试框架 |
| JSDOM | ^24.1.3 | DOM 环境模拟 |

## 版本兼容性说明

- React Router v7 要求 Node.js >= v20.0.0
- React Router v7 要求 React >= 18
- 当前项目配置满足所有依赖的版本要求 