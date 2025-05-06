import React, { useEffect, useState, useCallback } from 'react';
import { Input, InputNumber, Select, DatePicker, TimePicker, Radio, Checkbox, Switch, Form, Image } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import styles from '../style.module.css';
import dayjs from 'dayjs';
/**
 * 文本字段 - 只读显示
 */
export const TextField = React.memo(({ fieldValue }) => {
    return (
        <div className={styles.textField}>
            {fieldValue !== undefined ? fieldValue : ''}
        </div>
    );
});

/**
 * 输入框字段
 */
export const InputField = React.memo(({
    placeholder,
    label,
    maxLength,
    showCount,
    componentProps = {},
    disabled,
    value,
    onChange
}) => {
    // 维护内部状态以确保初始值正确显示
    const [inputValue, setInputValue] = useState(value !== undefined ? value : '');

    // 当props中的value改变时更新内部状态
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value);
        }
    }, [value]);

    // 处理输入变化
    const handleChange = (e) => {
        // 安全获取输入值
        const newValue = e && e.target ? e.target.value : '';

        // 更新内部状态
        setInputValue(newValue);

        // 如果外部提供了onChange回调，通知外部
        if (onChange) {
            // 安全传递字符串值，避免传递event对象
            onChange(newValue);
        }
    };

    return (
        <Input
            placeholder={placeholder || `Please input ${label}`}
            disabled={disabled}
            allowClear
            maxLength={maxLength}
            showCount={showCount !== undefined ? showCount : maxLength}
            autoComplete="off"
            value={inputValue}
            onChange={handleChange}
            {...componentProps}
        />
    );
});

/**
 * 多行文本框字段
 */
export const TextAreaField = React.memo(({
    placeholder,
    label,
    maxLength,
    showCount,
    componentProps = {},
    disabled,
    value,
    onChange
}) => {
    // 维护内部状态以确保初始值正确显示
    const [textValue, setTextValue] = useState(value !== undefined ? value : '');

    // 当props中的value改变时更新内部状态
    useEffect(() => {
        if (value !== undefined) {
            setTextValue(value);
        }
    }, [value]);

    // 处理输入变化
    const handleChange = (e) => {
        const newValue = e.target.value;
        setTextValue(newValue);

        // 如果外部提供了onChange回调，通知外部
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <Input.TextArea
            placeholder={placeholder || `Please input ${label}`}
            disabled={disabled}
            maxLength={maxLength}
            showCount={showCount !== undefined ? showCount : maxLength}
            allowClear
            autoComplete="off"
            value={textValue}
            onChange={handleChange}
            {...componentProps}
        />
    );
});

/**
 * 密码字段
 */
export const PasswordField = React.memo(({
    placeholder,
    label,
    maxLength,
    showCount,
    componentProps = {},
    disabled,
    value,
    onChange
}) => {
    // 维护内部状态以确保初始值正确显示
    const [passwordValue, setPasswordValue] = useState(value !== undefined ? value : '');

    // 当props中的value改变时更新内部状态
    useEffect(() => {
        if (value !== undefined) {
            setPasswordValue(value);
        }
    }, [value]);

    // 处理输入变化
    const handleChange = (e) => {
        const newValue = e.target.value;
        setPasswordValue(newValue);

        // 如果外部提供了onChange回调，通知外部
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <Input.Password
            placeholder={placeholder || `Please input ${label}`}
            disabled={disabled}
            iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            allowClear
            maxLength={maxLength}
            showCount={showCount !== undefined ? showCount : maxLength}
            autoComplete="off"
            value={passwordValue}
            onChange={handleChange}
            {...componentProps}
        />
    );
});

/**
 * 选择框字段
 */
export const SelectField = React.memo(({
    label,
    options = [],
    componentProps = {},
    disabled,
    value,
    onChange
}) => {
    // 维护内部状态以确保初始值正确显示
    const [selectValue, setSelectValue] = useState(value);

    // 当props中的value改变时更新内部状态
    useEffect(() => {
        if (value !== undefined) {
            setSelectValue(value);
        }
    }, [value]);

    // 处理选择变化
    const handleChange = (newValue) => {
        setSelectValue(newValue);

        // 如果外部提供了onChange回调，通知外部
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <Select
            disabled={disabled}
            value={selectValue}
            onChange={handleChange}
            {...componentProps}
        >
            {options.map(option => (
                <Select.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                >
                    {option.label}
                </Select.Option>
            ))}
        </Select>
    );
});

/**
 * 日期选择器字段 - 原生实现
 */
export const DatePickerField = React.memo(({
    placeholder,
    label,
    returnMoment,
    componentProps = {},
    disabled,
    value,
    onChange
}) => {
    // 添加调试日志
    console.log('DatePickerField 收到原始值:', value);

    // 日期格式设置
    const finalFormat = componentProps.format || 'YYYY-MM-DD';
    const dateFormat = 'YYYY/MM/DD'; // 为dayjs设置格式

    // 处理日期变化
    const handleChange = (date, dateString) => {
        if (onChange) {
            onChange(dateString);
        }
    };

    // 尝试创建dayjs对象
    let dateValue;
    if (value) {
        try {
            if (typeof value === 'string') {
                const date = dayjs(value);
                if (date.isValid()) {
                    dateValue = date;
                    console.log('成功创建dayjs日期:', dateValue);
                }
            }
        } catch (e) {
            console.error('创建dayjs日期失败:', e);
        }
    }

    // 弹出层样式，防止撑开容器
    const popupStyle = {
        position: 'absolute',
        zIndex: 1050
    };

    // 创建新的组件属性对象，避免修改原始对象
    const finalComponentProps = { ...componentProps };

    // 确保不传递可能导致类型错误的属性
    delete finalComponentProps.defaultPickerValue;

    // 只有当明确设置了showTime=true并且格式包含时间时，才启用时间选择器
    const hasTimeFormat = finalFormat.includes('HH') || finalFormat.includes('mm') || finalFormat.includes('ss');
    if (finalComponentProps.showTime === true && hasTimeFormat) {
        finalComponentProps.showTime = {
            format: 'HH:mm:ss'
        };
    } else if (!hasTimeFormat || finalComponentProps.showTime === false) {
        // 如果格式不包含时间部分，或明确设置为false，确保关闭时间选择器
        finalComponentProps.showTime = false;
    }

    return (
        <div style={{ width: '100%', display: 'block' }}>
            <DatePicker
                format={finalFormat}
                placeholder={placeholder || `Please select ${label}`}
                disabled={disabled}
                defaultValue={dateValue}
                onChange={handleChange}
                style={{ width: '100%', ...(componentProps?.style || {}) }}
                popupStyle={popupStyle}
                getPopupContainer={triggerNode => triggerNode.parentNode}
                {...finalComponentProps}
            />
        </div>
    );
});

/**
 * 日期范围选择器组件 - 简化版本
 */
export const DateRangePickerField = React.memo((props) => {
    // 弹出层样式，防止撑开容器
    const popupStyle = {
        position: 'absolute',
        zIndex: 1050
    };

    // 提取format和其他属性，确保format不被覆盖
    const { componentProps = {}, format, onChange, value, placeholder, disabled } = props;

    // 使用componentProps中的format或者props中的format
    const finalFormat = componentProps.format || format || 'YYYY-MM-DD';
    const dateFormat = 'YYYY/MM/DD'; // 为dayjs设置格式

    // 添加调试日志
    console.log('DateRangePickerField 收到原始值:', value);

    // 根据原始值创建dayjs对象数组
    let dateRangeValue;
    if (value && Array.isArray(value) && value.length === 2) {
        try {
            // 尝试将日期字符串转换为dayjs对象
            const [startStr, endStr] = value;
            if (startStr && endStr) {
                // 创建dayjs对象
                const start = dayjs(startStr);
                const end = dayjs(endStr);
                if (start.isValid() && end.isValid()) {
                    dateRangeValue = [start, end];
                    console.log('成功创建dayjs日期范围:', dateRangeValue);
                }
            }
        } catch (e) {
            console.error('创建dayjs日期范围失败:', e);
        }
    }

    // 创建新的组件属性对象，避免修改原始对象
    const finalComponentProps = { ...componentProps };

    // 确保不传递可能导致类型错误的属性
    delete finalComponentProps.defaultPickerValue;
    delete finalComponentProps.value;
    delete finalComponentProps.onChange;
    delete finalComponentProps.format;

    // 只有当明确设置了showTime=true并且格式包含时间时，才启用时间选择器
    const hasTimeFormat = finalFormat.includes('HH') || finalFormat.includes('mm') || finalFormat.includes('ss');
    if (finalComponentProps.showTime === true && hasTimeFormat) {
        finalComponentProps.showTime = {
            format: 'HH:mm:ss'
        };
    } else if (!hasTimeFormat || finalComponentProps.showTime === false) {
        // 如果格式不包含时间部分，或明确设置为false，确保关闭时间选择器
        finalComponentProps.showTime = false;
    }

    // 处理日期变更，确保使用正确的格式
    const handleChange = (dates, dateStrings) => {
        if (onChange) {
            onChange(dateStrings);
        }
    };

    return (
        <div style={{ width: '100%', display: 'block' }}>
            <DatePicker.RangePicker
                style={{ width: '100%' }}
                format={finalFormat}
                placeholder={placeholder}
                disabled={disabled}
                popupStyle={popupStyle}
                getPopupContainer={triggerNode => triggerNode.parentNode}
                {...finalComponentProps}
                defaultValue={dateRangeValue}
                onChange={handleChange}
            />
        </div>
    );
});

/**
 * 开关控件组件
 * 支持将布尔值转换为0/1
 * 支持预览功能，可根据开关状态显示不同内容
 */
export const SwitchField = React.memo(({ name, componentProps = {}, disabled, value, onChange, preview, previewStyle, form }) => {
    // 使用内部状态管理开关值，确保正确处理各种值类型
    const [checked, setChecked] = useState(value === 1 || value === true);

    // 存储预览输入框的值
    const [previewInputValue, setPreviewInputValue] = useState('');

    // 当外部值变化时更新内部状态
    useEffect(() => {
        // 确保value是有效值，处理undefined和null的情况
        const newChecked = value === 1 || value === true;

        // 仅当状态真正需要更新时才设置状态
        if (checked !== newChecked) {
            setChecked(newChecked);
        }
    }, [value]); // 移除checked作为依赖，避免循环依赖

    // 值变化处理函数 - 拆分为局部函数和useCallback以减少依赖
    const handleChange = useCallback((newChecked) => {
        // 更新内部状态
        setChecked(newChecked);

        // 将布尔值转换为 0 或 1
        const numericValue = newChecked ? 1 : 0;

        // 调用外部onChange，传递数字值
        if (typeof onChange === 'function') {
            onChange(numericValue);
        }
    }, [onChange]);  // 只依赖onChange

    // 当开关状态变化时处理预览类型输入框
    useEffect(() => {
        if (!preview) return;

        // 根据当前开关状态选择预览配置
        const previewConfig = checked ? preview.on : preview.off;
        if (!previewConfig) return;

        if (previewConfig.type === 'input') {
            // 从预览配置中获取content和默认值
            const { content, defaultValue = '' } = previewConfig;

            // 设置内部状态
            setPreviewInputValue(defaultValue);

            // 如果有表单实例并且有content字段，同步到表单
            if (form && content) {
                // 检查表单中是否已有该字段的值
                const currentValue = form.getFieldValue(content);

                // 如果字段值已存在，使用该值
                if (currentValue) {
                    setPreviewInputValue(currentValue);
                }
            }
        }
    }, [checked, preview, form]);

    // 渲染预览内容
    const renderPreview = () => {
        if (!preview) return null;

        // 根据当前开关状态选择预览配置
        const previewConfig = checked ? preview.on : preview.off;
        if (!previewConfig) return null;

        // 设置默认预览样式，如果外部没有传入则使用默认值
        const finalPreviewStyle = previewStyle || {
            width: '400px',
            height: '200px'
        };

        const { type, content, required } = previewConfig;

        switch (type) {
            case 'image':
                return (
                    <div className="switch-preview" style={finalPreviewStyle}>
                        <Image
                            src={content}
                            alt={checked ? '启用' : '禁用'}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            className="switch-preview-image"
                        />
                    </div>
                );
            case 'text':
                return (
                    <div className="switch-preview" style={finalPreviewStyle}>
                        <div className="switch-preview-text" style={{ padding: '10px', fontSize: '14px', color: '#666' }}>
                            {content}
                        </div>
                    </div>
                );
            case 'input':
                const rules = required ? [{ required: true, message: `Please input ${content}` }] : [];

                return (
                    <div className="switch-preview" style={{ width: finalPreviewStyle.width, minHeight: '65px' }}>
                        <Form.Item
                            name={content}
                            rules={rules}
                            className="switch-preview-input-item"
                        >
                            <Input
                                placeholder={`Please input ${content}`}
                                className="switch-preview-input"
                                disabled={disabled}
                                value={previewInputValue}
                                onChange={(e) => setPreviewInputValue(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </div>
                );
            default:
                return null;
        }
    };

    // 创建switch组件，确保使用checked属性而不是value
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
                <Switch
                    disabled={disabled}
                    checked={checked}
                    onChange={handleChange}
                    {...(({ preview, previewStyle, ...rest }) => rest)(componentProps)}
                />
            </div>
            {preview && (
                <div>
                    {renderPreview()}
                </div>
            )}
        </div>
    );
});

