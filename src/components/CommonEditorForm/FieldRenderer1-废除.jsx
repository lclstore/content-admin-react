import { renderFormControl, renderFormItem, renderBasicForm, renderPanelFields } from '../FormFields';

// 导出所有函数，保持与旧文件相同的接口
export {
    renderFormControl,
    renderFormItem,
    renderBasicForm,
    renderPanelFields
};

// 导出单个函数作为默认导出
export const renderFormField = renderFormItem;
export default renderFormItem; 