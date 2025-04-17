import React from 'react';
import PropTypes from 'prop-types';
import './TagSelector.css'; // 引入样式文件

/**
 * @description 自定义标签选择器组件，用于替换 Select 组件，提供类似 Tag 的视觉选项。
 * @param {string} label - (可选) 显示在选项上方的标签。
 * @param {string[]} options - 可供选择的标签字符串数组。
 * @param {string|string[]} value - 当前选中的值（单个或数组，取决于 mode）。
 * @param {function} onChange - 值改变时的回调函数。
 * @param {string} mode - 选择模式 ('single' 或 'multiple')，默认为 'single'。
 * @param {string} placeholder - (可选) 没有选项被选中时显示的占位文本。
 */
const TagSelector = ({ options, value, onChange, mode = 'single', placeholder }) => {

    // 处理标签点击事件
    const handleTagClick = (option) => {
        if (mode === 'multiple') {
            // 多选模式
            const newValue = Array.isArray(value) ? [...value] : [];
            const index = newValue.indexOf(option);
            if (index > -1) {
                newValue.splice(index, 1); // 如果已选中，则移除
            } else {
                newValue.push(option); // 如果未选中，则添加
            }
            onChange(newValue.length > 0 ? newValue : undefined); // Antd Form 需要 undefined 来清除值
        } else {
            // 单选模式
            onChange(value === option ? undefined : option); // 点击已选项则取消选择
        }
    };

    // 检查某个选项是否被选中
    const isSelected = (option) => {
        if (mode === 'multiple') {
            return Array.isArray(value) && value.includes(option);
        }
        return value === option;
    };

    // 检查当前是否有值被选中
    const hasValue = mode === 'multiple' ? (Array.isArray(value) && value.length > 0) : !!value;

    return (
        <div className="tag-selector-container">
            <div className="tag-selector-options">
                {options.length > 0 ? (
                    options.map(option => (
                        <div
                            key={option}
                            className={`tag-option ${isSelected(option) ? 'selected' : ''}`}
                            onClick={() => handleTagClick(option)}
                        >
                            {option}
                        </div>
                    ))
                ) : (
                    // 如果没有选项，并且没有值被选中，显示占位符
                    !hasValue && placeholder && <span className="tag-selector-placeholder">{placeholder}</span>
                )}
                {/* 如果有选项但没有值被选中，且需要显示占位符 */}
                {options.length > 0 && !hasValue && placeholder && mode === 'single' && <span className="tag-selector-placeholder" style={{ marginLeft: '5px' }}>{placeholder}</span>}
            </div>
        </div>
    );
};

TagSelector.propTypes = {
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    onChange: PropTypes.func,
    mode: PropTypes.oneOf(['single', 'multiple']),
    placeholder: PropTypes.string,
};

// 当在 Ant Design Form.Item 中使用时，需要模拟一些 Form 控制项的行为
// Ant Design Form.Item 会自动注入 id, value, onChange 等 props
// 我们已经处理了 value 和 onChange，id 可以直接传递（如果需要的话），但通常不需要显式处理

export default TagSelector; 