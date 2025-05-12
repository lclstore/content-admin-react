import React, { useState, useEffect, useMemo } from 'react';
import { Image, Input, Form } from 'antd';
import PropTypes from 'prop-types';
import './TagSelector.css';

/**
 * 自定义标签选择器组件，用于替换 Select 组件，提供类似 Tag 的视觉选项
 * 已优化支持在Form.Item中作为表单控件使用，通过配置项控制验证规则
 * 
 * previewStyle: 预览区域的样式，可通过外部传入自定义宽高，默认宽度400px，高度200px
 */


const TagSelector = ({
    options,
    value,
    defaultValue,
    onChange,
    mode = 'single',
    disabled = false,
    previewStyle = {
        height: '200px'
    }, // 移除默认值，完全使用外部传入的样式
    form, // 父级表单实例
    fieldConfig = {} // 接收字段配置对象
}) => {
    // 使用内部状态跟踪选中的选项，以防父组件没有正确更新 value
    const [internalValue, setInternalValue] = useState(() => {
        const initialValue = value !== undefined ? value : defaultValue;
        if (initialValue === undefined || initialValue === null) {
            return mode === 'multiple' ? [] : undefined;
        }
        return initialValue;
    });

    // 存储预览输入框的值
    const [previewInputValue, setPreviewInputValue] = useState('');

    // 当外部 value 变化时更新内部状态
    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    // 规范化当前值，同时考虑内部状态和外部传入的值
    const normalizedValue = useMemo(() => {
        // 优先使用外部传入的值
        const current = value !== undefined ? value : internalValue;

        if (current === undefined || current === null) {
            return mode === 'multiple' ? [] : undefined;
        }

        if (mode === 'single') {
            if (Array.isArray(current) && current.length > 0) {
                return current[0];
            }
            return current;
        } else {
            if (!Array.isArray(current)) {
                return [current];
            }
            return current;
        }
    }, [value, internalValue, mode]);

    // 判断选项是否被选中 (使用当前规范化的值)
    const isSelected = (option) => {
        const optionValue = typeof option === 'object' ? option.value : option;

        if (mode === 'multiple') {
            if (!Array.isArray(normalizedValue)) return false;

            return normalizedValue.some(val => {
                if (typeof val === 'object') return val.value === optionValue;
                return val === optionValue;
            });
        } else {
            if (typeof normalizedValue === 'object') {
                return normalizedValue.value === optionValue;
            }
            return normalizedValue === optionValue;
        }
    };

    // 获取当前选中的选项对象(s)
    const selectedOptions = useMemo(() => {
        if (mode === 'single') {
            return options.find(opt => isSelected(opt));
        } else if (mode === 'multiple') {
            return options.filter(opt => isSelected(opt));
        }
        return null;
    }, [options, normalizedValue, mode]);

    // 处理标签点击事件
    const handleTagClick = (option) => {
        if (disabled) return;

        const optionValue = typeof option === 'object' ? option.value : option;

        let newValue;

        if (mode === 'multiple') {
            const currentValues = Array.isArray(normalizedValue) ? [...normalizedValue] : [];
            const isCurrentlySelected = isSelected(option);

            if (isCurrentlySelected) {
                newValue = currentValues.filter(val =>
                    val !== optionValue && (typeof val === 'object' ? val.value !== optionValue : true)
                );
            } else {
                newValue = [...currentValues, optionValue];
            }

            if (newValue.length === 0) {
                newValue = undefined;
            }
        } else {
            // 单选模式下不允许取消选择，只能切换
            // 如果点击已选中的项，不做任何操作
            if (isSelected(option)) return;

            // 否则切换为新选项
            newValue = optionValue;
        }

        // 无论父组件是否正确处理，先更新内部状态
        setInternalValue(newValue);

        // 通知父组件值变化 - 适用于Form.Item使用
        if (typeof onChange === 'function') {
            onChange(newValue);

            // 如果有表单实例，手动触发所在字段的验证
            // 这是确保表单验证状态更新的关键
            if (form && fieldConfig.name) {
                setTimeout(() => {
                    form.validateFields([fieldConfig.name]).catch(() => {
                        // 忽略验证错误
                    });
                }, 0);
            }
        }
    };

    // 当选中选项变化时处理预览类型输入框
    useEffect(() => {
        if (!selectedOptions) return;

        if (mode === 'single' && selectedOptions.preview && selectedOptions.preview.type === 'input') {
            // 从selectedOptions.preview中获取content
            const { content, defaultValue = '' } = selectedOptions.preview;

            // 设置内部状态 
            setPreviewInputValue(defaultValue);

            // 如果有表单实例并且有content字段，同步到表单
            if (form && content) {
                // 检查表单中是否已有该字段的值
                const currentValue = form.getFieldValue(content);

                // 如果字段值不存在，设置默认值
                if (currentValue) {
                    setPreviewInputValue(currentValue);
                }
            }
        }
    }, [selectedOptions, form, mode]);


    return (
        <div className="tag-selector-container">
            <div className={`tag-selector-options tag-selector-container-${mode} ${disabled ? 'tag-selector-disabled' : ''}`}>
                {options.map(option => {
                    const selected = isSelected(option);

                    return (
                        <div
                            key={typeof option === 'object' ? option.value : option}
                            className={`tag-option ${selected ? 'selected' : ''}`}
                            onClick={() => handleTagClick(option)}
                        >
                            {typeof option === 'object' ? (option.label || option.name || option.value) : option}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

TagSelector.propTypes = {
    options: PropTypes.array.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    // onChange: PropTypes.func.isRequired,
    mode: PropTypes.string,
    disabled: PropTypes.bool,
    previewStyle: PropTypes.object,
    form: PropTypes.object, // 父级表单实例
    fieldConfig: PropTypes.object // 字段配置对象
};

export default TagSelector;
