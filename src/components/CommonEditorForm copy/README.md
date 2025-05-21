# 通用编辑器组件 (CommonEditorForm)

这是一个灵活的通用编辑表单组件，可以根据配置渲染不同类型的表单：
- 基础表单（如用户资料编辑）
- 高级表单（如带结构面板的工作区编辑器）

## 基本用法

```jsx
import React from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/CommonEditorForm';

// 基础表单示例
function UserEditPage() {
  // 表单字段配置
  const fields = [
    {
      type: 'avatar',
      name: 'avatarUrl',  // 遵循命名规范，上传组件使用Url后缀
      label: '用户头像',
      required: true,
      uploadUrl: '/api/upload/avatar',
    },
    {
      type: 'input',
      name: 'userName',  // 遵循命名规范，使用驼峰命名
      label: '姓名',
      required: true,
      placeholder: '请输入用户姓名',
    },
    {
      type: 'input',
      name: 'email',
      label: '邮箱地址',
      required: true,
      rules: [
        { type: 'email', message: '请输入有效的邮箱地址' }
      ]
    },
    {
      type: 'password',
      name: 'userPassword',  // 遵循命名规范，使用驼峰命名
      label: '密码',
      required: true,
    },
    {
      type: 'switch',
      name: 'isActive',  // 遵循命名规范，开关使用is前缀
      label: '状态',
      showStatus: true,
      enableText: '启用',
      disableText: '禁用'
    },
    {
      type: 'transfer', // 新增穿梭框类型
      name: 'selectedRoles', // 遵循命名规范，使用复数名词或Selected前缀
      label: '角色分配',
      dataSource: [
        { key: 'admin', title: '管理员' },
        { key: 'editor', title: '编辑者' },
        { key: 'viewer', title: '查看者' }
      ],
      titles: ['可选角色', '已选角色']
    }
  ];
  
  // 表单配置
  const config = {
    itemName: '用户',
    editTitle: '编辑',
    addTitle: '新增',
    saveButtonText: '保存用户',
    backButtonText: '返回',
    confirmUnsavedChanges: true,
    unsavedChangesMessage: '你有未保存的更改，确定要离开吗？'
  };
  
  // 初始值
  const initialValues = {
    userName: '',
    email: '',
    isActive: true,
    selectedRoles: []
  };
  
  // 保存处理函数
  const handleSave = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
    console.log('保存数据:', values, id);
    
    // 模拟API请求
    setTimeout(() => {
      messageApi.success('Saved successfully!');
      setLoading(false);
      setDirty(false);
      navigate('/users');
    }, 800);
  };
  
  return (
    <CommonEditorForm
      formType="basic" // 使用新的表单类型名称
      config={config}
      fields={fields}
      initialValues={initialValues}
      onSave={handleSave}
    />
  );
}

// 高级表单示例请参考工作区编辑器的实现
```

## 字段命名规范

```jsx
/**
 * 表单字段命名规范：
 * 1. 基本类型字段：
 *    - text/input: 普通文本 - 使用驼峰命名，如 userName, postTitle
 *    - textarea: 多行文本 - 使用驼峰命名，如 description, longContent
 *    - password: 密码字段 - 使用驼峰命名，如 userPassword, secretKey
 *    - select: 选择框 - 使用驼峰命名，如 userRole, categoryId
 *    - date/datepicker: 日期选择器 - 使用驼峰命名，如 startDate, publishTime
 *    - switch: 开关 - 使用is或has前缀的布尔值，如 isActive, hasPermission
 *    - upload/avatar: 上传组件 - 使用Url后缀，如 avatarUrl, imageUrl
 * 
 * 2. 穿梭框字段：
 *    - transfer: 穿梭框 - 使用复数名词或Selected后缀，如 selectedRoles, assignedPermissions
 * 
 * 3. 复杂表单字段：
 *    - 结构化数据 - 使用有意义的复数名词，如 workoutItems, mediaContent
 *    - 嵌套数据 - 使用层次结构命名，如 workout.exercises, user.contactInfo
 */
```

## 属性

### 基本属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| formType | string | 'basic' | 表单类型：'basic'（基础表单）或'advanced'（高级表单） |
| config | object | {} | 表单配置对象 |
| fields | array | [] | 表单字段配置数组（基础表单使用） |
| initialValues | object | {} | 表单初始值 |
| onSave | function | - | 保存回调函数 |
| validate | function | - | 自定义验证函数 |
| loading | boolean | false | 是否显示加载状态 |
| complexConfig | object | {} | 高级表单特有配置（如workouts编辑器） |

### config 配置对象

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| itemName | string | '' | 编辑项目名称 |
| editTitle | string | '编辑' | 编辑模式标题前缀 |
| addTitle | string | '新增' | 新增模式标题前缀 |
| saveButtonText | string | '保存' | 保存按钮文本 |
| backButtonText | string | '返回' | 返回按钮文本 |
| backUrl | string | -1 | 返回按钮导航URL，不传时默认为navigate(-1)返回上一页 |
| confirmUnsavedChanges | boolean | true | 有未保存更改时是否提示确认 |
| unsavedChangesMessage | string | '你有未保存的更改，确定要离开吗？' | 未保存更改提示消息 |
| onInitialize | function | - | 初始化回调函数 |
| onFormChange | function | - | 表单变化回调函数 |
| layout | string | 'vertical' | 表单布局方式 |
| saveSuccessMessage | string | '保存成功！' | 保存成功提示消息 |
| validationErrorMessage | string | '请检查表单填写是否正确' | 验证失败提示消息 |
| navigateAfterSave | boolean | false | 保存后是否自动导航 |
| afterSaveUrl | string | -1 | 保存后导航URL，默认返回上一页 |
| containerClassName | string | styles.commonEditorContainer | 容器CSS类名 |

### field 字段配置对象

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| type | string | 字段类型：input, textarea, password, select, date, switch, upload, transfer |
| name | string | 字段名称（请遵循命名规范） |
| label | string | 字段标签 |
| placeholder | string | 占位文本 |
| required | boolean | 是否必填 |
| rules | array | 验证规则数组 |
| disabled | boolean | 是否禁用 |
| className | string | CSS类名 |
| props | object | 传递给表单控件的额外属性 |
| render | function | 自定义渲染函数 |

#### 特定字段类型属性

**switch**
- showStatus: boolean - 是否显示状态文本
- enableText: string - 启用状态文本
- disableText: string - 禁用状态文本

**select**
- options: array - 选项数组，格式为 [{label: '选项1', value: 'value1'}]

**upload**
- uploadUrl: string - 上传API地址
- acceptedFileTypes: string|array - 允许的文件类型，可以是逗号分隔的字符串(如 "jpg,png,pdf") 或数组
- maxFileSize: number - 最大文件大小，单位KB
- beforeUpload: function - 自定义上传前验证函数 (可选，将在内部验证后执行)
- uploadText: string - 上传提示文本，默认为"Click or drag file to upload"
- uploadDescription: string - 上传说明文本 (可选，如不提供将根据acceptedFileTypes和maxFileSize自动生成)
- showUploadInfo: boolean - 是否显示上传说明，默认true
- showChangeButton: boolean - 是否显示"更改/上传"按钮，默认true
- changeButtonText: string - 按钮文本 (可选，如不提供会根据是否有文件显示"Change"或"Upload")
- changeButtonProps: object - 更改按钮额外属性

**media preview options**
- previewStyle: object - 预览元素的自定义样式
- previewHeight: string - 视频预览高度，默认'200px'
- showControls: boolean - 是否显示视频/音频控制栏，默认true
- autoPlay: boolean - 是否自动播放视频/音频，默认false
- loop: boolean - 是否循环播放视频/音频，默认false
- muted: boolean - 视频是否静音，默认false

**transfer**
- dataSource: array - 数据源，格式为 [{key: 'key1', title: '选项1'}]
- titles: array - 穿梭框两侧标题，如 ['源数据', '目标数据']
- render: function - 自定义渲染项的函数
- showSearch: boolean - 是否显示搜索框
- filterOption: function - 过滤选项的函数
- locale: object - 本地化配置
- onChange: function - 值变化的回调函数

## complexConfig 高级表单配置

用于配置像workouts编辑器这样的高级表单，包含结构面板和内容库等高级功能。
具体配置请参考实际使用的组件文档。

```jsx
// 高级表单示例（workouts编辑器）
<CommonEditorForm
  formType="advanced" // 使用新的表单类型名称
  config={{
    itemName: '训练',
    // 其他基本配置...
  }}
  initialValues={workoutData}
  onSave={handleSaveWorkout}
  complexConfig={{
    // 结构面板数据
    structurePanels: structurePanels,
    
    // 是否显示内容库
    showContentLibrary: true,
    
    // 内容库数据
    contentLibraryData: mockEditorStructureData,
    
    // 各种回调函数
    onAddItem: addItemToStructure,
    onDeleteItem: deleteStructureItem,
    onRoundChange: handleRoundChange,
    // 其他回调...
    
    // 样式类设置
    containerClassName: styles.advancedEditorContainer,
    contentLibraryClassName: styles.contentLibraryPanel,
    editorPanelClassName: styles.editorFormPanel,
  }}
/>
```

## CSS 模块

组件使用 CSS 模块化方案，所有样式定义在 `CommonEditorForm.module.css` 文件中。
主要的样式类包括：

```css
/* 主要容器样式 */
.commonEditorContainer  /* 通用容器 */
.loadingContainer       /* 加载状态容器 */
.advancedEditorContainer /* 高级编辑器容器 */
.contentLibraryPanel    /* 内容库面板 */
.editorFormPanel        /* 编辑表单面板 */

/* 上传组件样式 */
.uploadContainer        /* 上传组件容器 */
.uploadWrapper          /* 上传元素包装器 */
.avatarUploader         /* 头像上传器 */
.avatarImg              /* 头像图片 */
.uploadButton           /* 上传按钮 */
.uploadIcon             /* 上传图标 */

/* 个人资料信息 */
.profileInfo            /* 个人资料信息 */
.profilePictureTitle    /* 个人资料标题 */
.profilePictureDesc     /* 个人资料描述 */
``` 