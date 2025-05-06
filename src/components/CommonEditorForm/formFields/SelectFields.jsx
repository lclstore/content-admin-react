import React from 'react';
import PropTypes from 'prop-types';
import { Form, Select } from 'antd';
import TagSelector from '@/components/TagSelector/TagSelector';

/**
 * 扩展的选择字段组件，支持标准Select和TagSelector
 * @param {Object} field - 字段配置
 * @param {boolean} disabled - 是否禁用
 * @param {string} name - 字段名称
 * @param {function} onChange - 值变化回调
 * @param {string|string[]} value - 当前值
 * @param {string} type - 控件类型，'select'为默认下拉选择，'tag'为标签选择器
 */
const SelectFields = ({
    field = {},
    disabled = false,
    name,
    onChange,
    value,
    type = 'select'
}) => {
    // 从field中提取options
    const { options = [], mode = 'single' } = field;

    // 将options转换为TagSelector需要的格式
    const formattedOptions = Array.isArray(options)
        ? options.map(opt => {
            if (typeof opt === 'string') {
                return {
                    value: opt,
                    name: opt
                };
            } else {
                return {
                    value: opt.value,
                    name: opt.name || opt.label || String(opt.value)
                };
            }
        })
        : [];

    // 根据type渲染不同组件
    if (type === 'tag') {
        return (
            <TagSelector
                options={formattedOptions}
                value={value}
                onChange={onChange}
                mode={mode}
                disabled={disabled}
            />
        );
    }

    // 默认使用antd的Select组件
    return (
        <Select
            onChange={onChange}
            value={value}
            mode={mode === 'multiple' ? 'multiple' : undefined}
            disabled={disabled}
            allowClear
            style={{ width: '100%' }}
            {...field.props}
        >
            {Array.isArray(options) && options.map((option, index) => {
                // 处理不同格式的options
                if (typeof option === 'string') {
                    return (
                        <Select.Option key={option} value={option}>
                            {option}
                        </Select.Option>
                    );
                }

                return (
                    <Select.Option
                        key={option.value || index}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.name || option.label || String(option.value)}
                    </Select.Option>
                );
            })}
        </Select>
    );
};

/**
 * 创建一个包装了Form.Item的SelectFields组件
 * 便于在Form中直接使用
 */
const FormSelectFields = ({
    field = {},
    ...props
}) => {
    const {
        name,
        label,
        rules = [],
        required,
        requiredMessage,
        labelCol,
        wrapperCol,
        ...restFieldProps
    } = field;

    // 处理必填规则
    const finalRules = [...rules];
    if (required && !finalRules.some(rule => rule.required)) {
        finalRules.push({
            required: true,
            message: requiredMessage || `Please select ${label}`
        });
    }

    return (
        <Form.Item
            name={name}
            label={label}
            rules={finalRules}
            labelCol={labelCol}
            wrapperCol={wrapperCol}
        >
            <SelectFields field={{ ...restFieldProps, ...field }} {...props} />
        </Form.Item>
    );
};

SelectFields.propTypes = {
    field: PropTypes.object,
    disabled: PropTypes.bool,
    name: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    type: PropTypes.oneOf(['select', 'tag'])
};

FormSelectFields.propTypes = {
    field: PropTypes.object.isRequired
};

export { SelectFields, FormSelectFields };
export default SelectFields;
