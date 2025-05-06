import React, { useCallback, useMemo } from 'react';
import { Image } from 'antd';
import PropTypes from 'prop-types';
import './TagSelector.css';

/**
 * 自定义标签选择器组件，用于替换 Select 组件，提供类似 Tag 的视觉选项
 */
const TagSelector = ({
    options,
    value,
    defaultValue,
    onChange,
    mode = 'single',
    disabled = false,
    previewStyle = {} // 添加预览样式参数
}) => {
    // 规范化当前值，确保与选项值类型一致
    const normalizedCurrentValue = useMemo(() => {
        const current = value !== undefined ? value : defaultValue;
        if (mode === 'single' && Array.isArray(current) && current.length > 0) {
            const singleValue = current[0];
            return typeof singleValue === 'string' && !isNaN(singleValue) ? Number(singleValue) : singleValue;
        }
        if (typeof current === 'string' && !isNaN(current)) {
            return Number(current);
        }
        return current;
    }, [value, defaultValue, mode]);

    // 处理标签点击事件
    const handleTagClick = useCallback((option) => {
        if (disabled) return;
        const optionValue = typeof option === 'object' ? option.value : option;

        let newValue;
        if (mode === 'multiple') {
            const valueArray = Array.isArray(value) ? [...value] :
                (value === undefined && defaultValue !== undefined && Array.isArray(defaultValue)) ? [...defaultValue] : [];
            const index = valueArray.indexOf(optionValue);
            if (index > -1) {
                valueArray.splice(index, 1);
            } else {
                valueArray.push(optionValue);
            }
            newValue = valueArray.length > 0 ? valueArray : undefined;
        } else {
            const currentValue = normalizedCurrentValue;
            if (currentValue === optionValue) return;
            newValue = optionValue;
        }
        if (typeof onChange === 'function') {
            onChange(newValue);
        }
    }, [value, defaultValue, onChange, mode, disabled, normalizedCurrentValue]);

    // 检查某个选项是否被选中
    const isSelected = useCallback((option) => {
        const optionValue = typeof option === 'object' ? option.value : option;
        if (mode === 'multiple') {
            return Array.isArray(normalizedCurrentValue) && normalizedCurrentValue.includes(optionValue);
        }
        return normalizedCurrentValue === optionValue;
    }, [normalizedCurrentValue, mode]);

    // 获取当前选中的选项对象
    const selectedOption = useMemo(() => {
        if (mode === 'single') {
            return options.find(opt => isSelected(opt));
        } else if (mode === 'multiple' && Array.isArray(normalizedCurrentValue)) {
            return options.filter(opt => isSelected(opt));
        }
        return null;
    }, [options, isSelected, normalizedCurrentValue, mode]);
    console.log(selectedOption);

    // 渲染预览内容
    const renderPreview = () => {
        if (mode === 'single' && selectedOption && selectedOption.preview) {
            const { type, content } = selectedOption.preview;
            return (
                <div className="tag-selector-preview" style={previewStyle}>
                    {type === 'image' ? (
                        <Image
                            src={content}
                            alt={selectedOption.label || ''}
                            className="tag-selector-preview-image"
                        />
                    ) : (
                        <div className="tag-selector-preview-text">
                            {content}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div >
            <div className={`tag-selector-options tag-selector-container-${mode} ${disabled ? 'tag-selector-disabled' : ''}`}>
                {options.map(option => (
                    <div
                        key={option.value}
                        className={`tag-option ${isSelected(option) ? 'selected' : ''}`}
                        onClick={() => handleTagClick(option)}
                    >
                        {option.label || option.name || option.value}
                    </div>
                ))}
            </div>
            {renderPreview()}
        </div>
    );
};

TagSelector.propTypes = {
    options: PropTypes.array.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
    onChange: PropTypes.func.isRequired,
    mode: PropTypes.string,
    disabled: PropTypes.bool,
    previewStyle: PropTypes.object
};

export default TagSelector;
