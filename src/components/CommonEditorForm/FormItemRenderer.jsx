import React from 'react';
import { Form } from 'antd';
import {
    TextField,
    InputField,
    TextAreaField,
    PasswordField,
    SelectField,
    DatePickerField,
    DateRangePickerField,
    TransferField,
    UploadField,
    SwitchField
} from './formFields';
import TagSelector from '@/components/TagSelector/TagSelector'; // 导入TagSelector组件
import NumberStepper from '@/components/NumberStepper/NumberStepper'; //导入NumberStepper组件
/**
 * 表单项渲染器
 * 根据字段类型渲染相应的表单控件
 * 接收独立属性而不是完整的field对象，避免循环引用
 */
const FormItemRenderer = ({
    type,
    name,
    form,
    label,
    placeholder,
    required,
    requiredMessage,
    maxLength,
    showCount,
    rules = [],
    options = [],
    format,
    returnMoment,
    labelCol,
    wrapperCol,
    dependencies,
    shouldUpdate,
    valuePropName,
    hidden,
    noStyle,
    className,
    componentProps = {},
    previewStyle,
    value,
    defaultValue,
    preview,
    onChange,
    disabled,
    render
}) => {
    // 如果提供了自定义渲染函数，使用它
    if (render) {
        return render(value, onChange);
    }

    // 准备表单项属性
    const formItemProps = {
        name,
        label,
        className,
        hidden,
        noStyle
    };

    // 处理必填规则
    const finalRules = [...rules];
    if (required && !finalRules.some(rule => rule.required)) {
        finalRules.push({
            required: true,
            message: requiredMessage || `Please ${type === 'select' || type === 'single' || type === 'multiple' || type === 'date' || type === 'datepicker' || type === 'dateRange' ? 'select' : type === 'upload' ? 'upload' : 'input'} ${label}`
        });
    }

    formItemProps.rules = finalRules;

    // 设置布局
    if (labelCol) formItemProps.labelCol = labelCol;
    if (wrapperCol) formItemProps.wrapperCol = wrapperCol;

    // 确定valuePropName
    let finalValuePropName = valuePropName;
    // 针对不同控件类型设置适当的valuePropName
    if (type === 'switch' && !finalValuePropName) {
        finalValuePropName = 'checked';
    } else if (type === 'upload' && !finalValuePropName) {
        // 对于上传组件，我们需要明确告诉Form.Item从哪个prop获取值
        finalValuePropName = 'value';
    }
    if (finalValuePropName) {
        formItemProps.valuePropName = finalValuePropName;
    }

    // 处理特殊渲染情况
    if (shouldUpdate) {
        formItemProps.shouldUpdate = shouldUpdate;
    }

    if (dependencies) {
        formItemProps.dependencies = dependencies;
    }

    // 根据类型选择要渲染的控件
    let Control;
    const controlProps = {
        disabled,
        value,
        defaultValue,
        onChange: (newValue) => {
            // 安全处理值变更后再调用外部onChange
            if (typeof onChange === 'function') {
                try {
                    // 假设控件级别的onChange已经做了安全处理，直接传递
                    onChange(newValue);
                } catch (error) {
                    // 移除console.error
                    // console.error(`表单项 ${name} 处理值变更出错:`, error);
                }
            }
        }
    };

    // 为不同控件类型添加特殊属性
    switch (type) {
        case 'text':
            Control = TextField;
            controlProps.fieldValue = value; // TextField接收fieldValue属性
            break;
        case 'input':
            Control = InputField;
            controlProps.placeholder = placeholder || `Please input ${label}`;
            controlProps.maxLength = maxLength;
            controlProps.showCount = showCount;
            controlProps.componentProps = componentProps;
            break;
        case 'textarea':
            Control = TextAreaField;
            controlProps.placeholder = placeholder || `Please input ${label}`;
            controlProps.maxLength = maxLength;
            controlProps.showCount = showCount;
            controlProps.componentProps = componentProps;
            break;
        case 'password':
            Control = PasswordField;
            controlProps.placeholder = placeholder || `Please input ${label}`;
            controlProps.maxLength = maxLength;
            controlProps.showCount = showCount;
            controlProps.componentProps = componentProps;
            break;


        case 'numberStepper':
            <Form.Item {...formItemProps}>
                <NumberStepper
                    form={form}
                    options={options}
                    previewStyle={previewStyle}
                    value={value}
                    {... !name && defaultValue ? { defaultValue } : {}}
                    onChange={onChange}
                    mode='single'
                    disabled={disabled}
                    {...componentProps}
                />
            </Form.Item>

        case 'single':

            return (
                <Form.Item {...formItemProps}>
                    <TagSelector
                        form={form}
                        options={options}
                        previewStyle={previewStyle}
                        value={value}
                        {... !name && defaultValue ? { defaultValue } : {}}
                        onChange={onChange}
                        mode='single'
                        disabled={disabled}
                        {...componentProps}
                    />
                </Form.Item>
            );
        case 'multiple':
            // 使用TagSelector组件，多选模式
            return (
                <Form.Item {...formItemProps}>
                    <TagSelector
                        options={options}
                        value={value}
                        {... !name && defaultValue ? { defaultValue } : {}}
                        onChange={onChange}
                        mode='multiple'
                        disabled={disabled}
                        {...componentProps}
                    />
                </Form.Item>
            );

        case 'date':
        case 'datepicker':
            Control = DatePickerField;
            controlProps.placeholder = placeholder || `Please select ${label}`;
            controlProps.returnMoment = returnMoment;

            // 添加弹出层相关配置，防止撑开容器
            const datePickerProps = {
                ...componentProps,
                style: { width: '400px', ...componentProps?.style },
                popupStyle: {
                    position: 'absolute',
                    zIndex: 1050,
                    width: componentProps?.style?.width || '400px',
                    minWidth: '280px',
                    ...componentProps?.popupStyle
                },
                getPopupContainer: componentProps?.getPopupContainer ||
                    (triggerNode => triggerNode.parentNode)
            };

            // 确保format属性被正确传递
            if (format) {
                datePickerProps.format = format;
            }

            controlProps.componentProps = datePickerProps;
            break;

        case 'dateRange':
            Control = DateRangePickerField;
            controlProps.placeholder = placeholder || ['startDate', 'endDate'];

            // 设置默认格式
            const rangePickerProps = { ...componentProps };

            // 优先使用字段定义中的format
            if (format) {
                rangePickerProps.format = format;
            } else if (!rangePickerProps.format) {
                rangePickerProps.format = 'YYYY-MM-DD';
            }

            // 检查是否使用分离字段模式
            const useSeparatedFields = rangePickerProps.fieldNames &&
                rangePickerProps.fieldNames.start &&
                rangePickerProps.fieldNames.end;

            // 分离字段模式处理
            if (useSeparatedFields) {
                const startFieldName = rangePickerProps.fieldNames.start;
                const endFieldName = rangePickerProps.fieldNames.end;

                // 添加隐藏的表单项，用于提交值
                const hiddenFields = (
                    <>
                        <Form.Item name={startFieldName} hidden noStyle></Form.Item>
                        <Form.Item name={endFieldName} hidden noStyle></Form.Item>
                    </>
                );

                // 传递表单实例和字段名
                controlProps.fieldNames = rangePickerProps.fieldNames;
                controlProps.form = rangePickerProps.form;
                controlProps.componentProps = rangePickerProps;
                controlProps.format = rangePickerProps.format; // 确保format被传递

                return (
                    <div style={{ width: '100%', display: 'block' }}>
                        {hiddenFields}
                        <Control {...controlProps} />
                    </div>
                );
            }

            // 非分离模式，直接使用标准渲染流程
            controlProps.componentProps = rangePickerProps;
            controlProps.format = rangePickerProps.format; // 确保format被传递
            break;

        case 'switch':
            Control = SwitchField;
            controlProps.name = name; // SwitchField需要名称
            controlProps.componentProps = componentProps;
            controlProps.required = required;
            // 直接传递preview和previewStyle属性
            controlProps.preview = preview;
            controlProps.previewStyle = previewStyle;

            // 确保Switch组件接收布尔值作为checked属性
            formItemProps.valuePropName = 'value'; // 仍然使用value让Form.Item工作
            break;
        case 'upload':
            Control = UploadField;
            // 不仅传递 componentProps，而是直接构造 field 对象
            controlProps.field = {
                acceptedFileTypes: componentProps.acceptedFileTypes,
                maxFileSize: componentProps.maxFileSize,
                uploadDescription: componentProps.uploadDescription,
                uploadSuccessMessage: componentProps.uploadSuccessMessage,
                uploadFailMessage: componentProps.uploadFailMessage,
                uploadErrorMessage: componentProps.uploadErrorMessage,
                dirKey: componentProps.dirKey,
                uploadFn: componentProps.uploadFn,
                previewWidth: componentProps.previewWidth,
                previewHeight: componentProps.previewHeight,
                ...componentProps
            };

            // 确保onChange被正确传递并处理
            controlProps.onChange = (newValue) => {
                if (typeof onChange === 'function') {
                    try {
                        onChange(newValue);
                    } catch (error) {
                        console.error('上传字段处理值变更出错:', error);
                    }
                }
            };

            break;
        case 'transfer':
            Control = TransferField;
            controlProps.componentProps = componentProps;
            break;
        default:
            Control = InputField;
            controlProps.placeholder = placeholder || `Please input ${label}`;
            controlProps.componentProps = componentProps;
    }

    return (
        <Form.Item {...formItemProps}>
            <Control {...controlProps} />
        </Form.Item>
    );
};

export default FormItemRenderer; 