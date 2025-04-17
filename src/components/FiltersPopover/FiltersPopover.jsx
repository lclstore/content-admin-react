import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Popover, Badge } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import styles from './FiltersPopover.module.css';

/**
 * 通用过滤器 Popover 组件 (已包含 Popover 逻辑和触发按钮)
 * @param {Array<Object>} filterSections - 过滤器区域配置
 *   - title: string - 区域标题
 *   - key: string - 区域标识符 (用于 selectedValues)
 *   - options: Array<string> - 区域内的选项
 * @param {Object} activeFilters - 当前选中的值 (用于控制 Popover 内部状态)
 * @param {Function} onUpdate - 点击 Update 按钮时的回调函数，接收选中的值作为参数
 * @param {Function} onReset - 点击 Reset 按钮时的回调函数
 * @param {string} popoverPlacement - Popover 的弹出位置
 * @param {boolean} [applyImmediately=false] - 点击选项后是否立即应用并隐藏底部按钮
 * @param {string} [clearButtonText='Clear'] - 清除按钮的文本
 * @param {React.ReactNode} children - 触发 Popover 的元素 (替代 icon/buttonText 等)
 */
const FiltersPopover = ({
    filterSections = [],
    activeFilters = {},
    onUpdate,
    onReset,
    popoverPlacement = 'bottomRight',
    applyImmediately = false,
    clearButtonText = 'Clear',
    children
}) => {
    const [tempSelectedValues, setTempSelectedValues] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    const prevActiveFiltersRef = useRef(activeFilters);
    const prevIsVisibleRef = useRef(isVisible);

    useEffect(() => {
        if (!prevIsVisibleRef.current && isVisible) {
            console.log('[FiltersPopover] Opening, received activeFilters:', JSON.stringify(activeFilters));
            setTempSelectedValues(JSON.parse(JSON.stringify(activeFilters || {})));
        }

        prevIsVisibleRef.current = isVisible;
    }, [isVisible, activeFilters]);

    const handleOpenChange = (open) => {
        setIsVisible(open);
    };

    const handleOptionClick = (sectionKey, optionValue) => {
        setTempSelectedValues(prev => {
            const currentSelection = prev[sectionKey] ? [...prev[sectionKey]] : [];
            const currentIndex = currentSelection.indexOf(optionValue);
            if (currentIndex === -1) {
                currentSelection.push(optionValue);
            } else {
                currentSelection.splice(currentIndex, 1);
            }
            const nextSelectedValues = { ...prev, [sectionKey]: currentSelection };
            return nextSelectedValues;
        });

        if (applyImmediately && onUpdate) {
            const currentSelection = tempSelectedValues[sectionKey] ? [...tempSelectedValues[sectionKey]] : [];
            const currentIndex = currentSelection.indexOf(optionValue);
            const nextStateForUpdate = { ...tempSelectedValues };
            const nextSelectionForUpdate = nextStateForUpdate[sectionKey] ? [...nextStateForUpdate[sectionKey]] : [];

            if (currentIndex === -1) {
                nextSelectionForUpdate.push(optionValue);
            } else {
                nextSelectionForUpdate.splice(currentIndex, 1);
            }
            nextStateForUpdate[sectionKey] = nextSelectionForUpdate;

            setTimeout(() => {
                onUpdate(JSON.parse(JSON.stringify(nextStateForUpdate)));
            }, 0);
        }
    };

    const handleReset = () => {
        if (onReset) {
            onReset();
        }
        setTempSelectedValues({});
        setIsVisible(false);
    };

    const handleUpdate = () => {
        if (onUpdate) {
            onUpdate(JSON.parse(JSON.stringify(tempSelectedValues)));
        }
        setIsVisible(false);
    };

    const content = (
        <div className={styles.filterContent}>
            {filterSections.map((section, index) => (
                <React.Fragment key={section.key}>
                    <div className={styles.filterSectionItem}>
                        <div className={styles.filterSectionTitle}>{section.title}</div>
                        <div className={styles.filterSection}>
                            {section.options.map(option => {
                                const isSelected = tempSelectedValues[section.key]?.includes(option);
                                return (
                                    <div
                                        key={option}
                                        onClick={() => handleOptionClick(section.key, option)}
                                        className={`${styles.filterButton} ${isSelected ? styles.active : ''}`}
                                    >
                                        {option}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {index < filterSections.length - 1 && <hr className={styles.divider} />}
                </React.Fragment>
            ))}

            <div className={styles.filterFooter}>
                <Space>
                    <Button onClick={handleReset} className={styles.footerButton}>
                        {clearButtonText}
                    </Button>
                    {!applyImmediately && (
                        <Button type="primary" onClick={handleUpdate} className={`${styles.footerButton} ${styles.updateButton}`}>
                            Search
                        </Button>
                    )}
                </Space>
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            open={isVisible}
            onOpenChange={handleOpenChange}
            placement={popoverPlacement}
        >
            {children}
        </Popover>
    );
};

export default FiltersPopover; 