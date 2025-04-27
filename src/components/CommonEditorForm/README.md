# 通用编辑器组件 (CommonEditor)

这是一个灵活的通用编辑表单组件，可以根据配置渲染不同类型的表单：
- 简单表单（如用户资料编辑）
- 复杂表单（如带结构面板的工作区编辑器）

## 基本用法

```jsx
import React from 'react';
import CommonEditor from '@/components/CommonEditor';

// 简单表单示例
function UserEditPage() {
  // 表单字段配置
  const fields = [
    {
      type: 'avatar',
      name: 'avatar',
      label: '用户头像',
      required: true,
      uploadUrl: '/api/upload/avatar',
    },
    {
      type: 'input',
      name: 'name',
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
      name: 'password',
      label: '密码',
      required: true,
    },
    {
      type: 'switch',
      name: 'status',
      label: '状态',
      showStatus: true,
      enableText: '启用',
      disableText: '禁用'
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
    name: '',
    email: '',
    status: true,
  };
  
  // 保存处理函数
  const handleSave = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
    console.log('保存数据:', values, id);
    
    // 模拟API请求
    setTimeout(() => {
      messageApi.success('用户数据保存成功！');
      setLoading(false);
      setDirty(false);
      navigate('/users');
    }, 800);
  };
  
  return (
    <CommonEditor
      formType="simple"
      config={config}
      fields={fields}
      initialValues={initialValues}
      onSave={handleSave}
    />
  );
}

// 复杂表单示例请参考工作区编辑器的实现
```

## 属性

### 基本属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| formType | string | 'simple' | 表单类型：'simple'（简单表单）或'complex'（复杂表单） |
| config | object | {} | 表单配置对象 |
| fields | array | [] | 表单字段配置数组（简单表单使用） |
| initialValues | object | {} | 表单初始值 |
| onSave | function | - | 保存回调函数 |
| validate | function | - | 自定义验证函数 |
| loading | boolean | false | 是否显示加载状态 |
| complexConfig | object | {} | 复杂表单特有配置（如workouts编辑器） |

### config 配置对象

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| itemName | string | '' | 编辑项目名称 |
| editTitle | string | '编辑' | 编辑模式标题前缀 |
| addTitle | string | '新增' | 新增模式标题前缀 |
| saveButtonText | string | '保存' | 保存按钮文本 |
| backButtonText | string | '返回' | 返回按钮文本 |
| confirmUnsavedChanges | boolean | true | 有未保存更改时是否提示确认 |
| unsavedChangesMessage | string | '你有未保存的更改，确定要离开吗？' | 未保存更改提示消息 |
| onInitialize | function | - | 初始化回调函数 |
| onFormChange | function | - | 表单变化回调函数 |
| layout | string | 'vertical' | 表单布局方式 |
| saveSuccessMessage | string | '保存成功！' | 保存成功提示消息 |
| validationErrorMessage | string | '请检查表单填写是否正确' | 验证失败提示消息 |
| navigateAfterSave | boolean | false | 保存后是否自动导航 |
| afterSaveUrl | string | -1 | 保存后导航URL |
| containerClassName | string | 'common-editor-container' | 容器CSS类名 |

### field 字段配置对象

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| type | string | 字段类型：input, textarea, password, select, date, switch, upload, avatar |
| name | string | 字段名称 |
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

**upload/avatar**
- uploadUrl: string - 上传API地址
- beforeUpload: function - 上传前验证函数
- accept: string - 接受的文件类型
- width/height: string/number - 上传控件尺寸
- uploadText: string - 上传提示文本
- uploadDescription: string - 上传说明文本
- showUploadInfo: boolean - 是否显示上传说明
- showChangeButton: boolean - 是否显示"更改"按钮
- changeButtonText: string - 更改按钮文本
- changeButtonProps: object - 更改按钮额外属性

## complexConfig 复杂表单配置

用于配置像workouts编辑器这样的复杂表单，包含结构面板和内容库等高级功能。
具体配置请参考实际使用的组件文档。

```jsx
// 复杂表单示例（workouts编辑器）
<CommonEditor
  formType="complex"
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
    containerClassName: "workouts-editor-container",
    contentLibraryClassName: "content-library-panel editor-item",
    editorPanelClassName: "workout-editor-panel editor-item",
  }}
/>
``` 