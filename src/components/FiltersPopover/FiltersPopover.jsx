import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Popover, Badge } from 'antd';
import { FilterOutlined, CloseCircleOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './FiltersPopover.module.css';
import { useStore } from "@/store/index.js";

/**
 * 通用过滤器/设置 Popover 组件
 * @param {Array<Object>} filterSections - 过滤器区域配置 (仅过滤器类型需要)
 *   - title: string - 区域标题
 *   - key: string - 区域标识符 (用于 selectedValues)
 *   - type: string - 选择类型 ('single' 或 'multiple')
 *   - options: Array<Object> - 区域内的选项
 * @param {Object} activeFilters - 外部传入的、当前已应用的过滤器值 (用于初始化 Popover 内部状态)
 * @param {Function} onUpdate - 点击 'Search' 按钮或选项 (当 applyImmediately=true 时) 时的回调, 参数为当前选中的过滤器值
 * @param {Function} onReset - 点击 'Clear' 按钮或清除图标时的回调
 * @param {string} [popoverPlacement='bottomRight'] - Popover 的弹出位置
 * @param {boolean} [applyImmediately=false] - 点击选项后是否立即触发 onUpdate 并关闭 Popover (仅过滤器类型有效)
 * @param {string} [clearButtonText='Clear'] - 清除按钮的文本 (仅过滤器类型有效)
 * @param {string} [confirmButtonText='Search'] - 确认按钮的文本
 * @param {boolean} [showBadgeDot=false] - 是否在触发元素上显示小红点 (设置类型按钮不会显示)
 * @param {React.ReactNode} children - 触发 Popover 的元素 (必需)
 * @param {boolean} [showClearIcon=false] - 是否在触发元素旁边显示清除图标 (设置类型按钮不会显示)
 * @param {boolean} [isSettingsType=false] - 标识 Popover 是否为设置类型 (用于区分样式和行为, 如是否显示清除按钮和小红点)
 */
const FiltersPopover = ({
    filterSections = [],
    activeFilters = {},
    onUpdate,
    onReset,
    popoverPlacement = 'bottomRight',
    applyImmediately = false,
    clearButtonText = 'Clear',
    confirmButtonText = 'Search',
    children,
    showBadgeDot = false,
    showClearIcon = false,
    isSettingsType = false,
}) => {
    const [tempSelectedValues, setTempSelectedValues] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    const prevActiveFiltersRef = useRef(activeFilters);
    const prevIsVisibleRef = useRef(isVisible);
    const optionsBase = useStore(i => i.optionsBase)
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

    const handleOptionClick = (section, optionValue, isDisabled) => {
        if (isDisabled) return;

        // 预先计算下一个状态值
        const calculateNextState = (prev) => {
            const isSingleSelect = section.type === 'single';
            const currentValue = prev[section.key];

            if (isSingleSelect) {
                // 单选模式：直接设置值
                return { ...prev, [section.key]: currentValue === optionValue ? null : optionValue };
            } else {
                // 多选模式：处理数组
                const currentSelection = Array.isArray(currentValue) ? [...currentValue] : [];
                const currentIndex = currentSelection.indexOf(optionValue);

                if (currentIndex === -1) {
                    currentSelection.push(optionValue);
                } else {
                    currentSelection.splice(currentIndex, 1);
                }

                return { ...prev, [section.key]: currentSelection.length > 0 ? currentSelection : null };
            }
        };

        // 直接使用当前状态计算出下一个状态
        let nextSelectedValues;
        setTempSelectedValues(prev => {
            nextSelectedValues = calculateNextState(prev);
            return nextSelectedValues;
        });

        // 如果需要立即应用且不是设置类型，则使用计算好的 nextSelectedValues 调用 onUpdate
        if (applyImmediately && !isSettingsType && onUpdate) {
            const currentState = tempSelectedValues;
            const trulyNextSelectedValues = calculateNextState(currentState);
            onUpdate(trulyNextSelectedValues);
            setTempSelectedValues(trulyNextSelectedValues);
        }
    };

    // 重置
    const handleReset = (isClear = false) => {
        if (onReset) {
            onReset();
        }
        setTempSelectedValues({});
    };

    // 确认/更新
    const handleUpdate = () => {
        if (onUpdate) {
            // 清理空值
            const cleanValues = Object.entries(tempSelectedValues).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined &&
                    (!Array.isArray(value) || value.length > 0)) {
                    acc[key] = value;
                }
                return acc;
            }, {});
            onUpdate(cleanValues);
        }
        setIsVisible(false);
    };

    const isSettingsPopover = isSettingsType;
    const shouldShowClearIcon = showClearIcon && !isSettingsPopover;
    const shouldShowBadgeDot = showBadgeDot && !isSettingsPopover;
    const shouldShowFooter = onReset || (!applyImmediately && onUpdate) || isSettingsType;

    const content = (
        <div className={styles.filterContent}>
            <div className={styles.scrollContent}>
                {filterSections.map((section, index) => (
                    <React.Fragment key={index}>
                        <div className={styles.filterSectionItem}>
                            <div className={styles.filterSectionTitle}>{section.title}</div>
                            <div className={styles.filterSection}>
                                {(typeof section.options === "string"?optionsBase[section.options]:section.options).map((option, optionIndex) => {
                                    const optionValue = option.value || option;
                                    const optionLabel = option.label || option;

                                    let isSelected;
                                    if (section.type === 'single') {
                                        isSelected = tempSelectedValues[section.key] === optionValue;
                                    } else {
                                        isSelected = Array.isArray(tempSelectedValues[section.key]) &&
                                            tempSelectedValues[section.key]?.includes(optionValue);
                                    }

                                    return (
                                        <div
                                            key={optionIndex}
                                            onClick={() => handleOptionClick(section, optionValue, option.disabled)}
                                            className={`${styles.filterButton} ${isSelected ? styles.active : ''} ${option.disabled ? styles.disabled : ''}`}
                                        >
                                            {optionLabel}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {index < filterSections.length - 1 && <hr className={styles.divider} />}
                    </React.Fragment>
                ))}
            </div>

            {shouldShowFooter && (
                <div className={styles.filterFooter}>
                    <Space>
                        {onReset && (
                            <Button onClick={() => setTempSelectedValues({})} className={styles.footerButton}>
                                {clearButtonText}
                            </Button>
                        )}
                        {((!applyImmediately && onUpdate) || isSettingsType) && (
                            <Button type="primary" onClick={handleUpdate} className={`${styles.footerButton} ${styles.updateButton}`}>
                                {isSettingsType ? 'Apply' : confirmButtonText}
                            </Button>
                        )}
                    </Space>
                </div>
            )}
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
            <Badge dot={shouldShowBadgeDot} offset={isSettingsPopover ? [0, 0] : [-35, 5]} className={styles.filterBadge}>
                <Space>
                    {children}
                    {shouldShowClearIcon && (
                        <Button
                            type="text"
                            shape="circle"
                            icon={<CloseCircleOutlined style={{ color: 'rgb(184, 204, 204)', fontSize: '22px' }} />}
                            size="small"
                            onClick={(e) => {
                                handleReset();
                                e.stopPropagation();
                            }}
                            style={{ marginLeft: '-4px', cursor: 'pointer' }}
                            className={styles.clearIcon}
                        />
                    )}
                </Space>
            </Badge>
        </Popover>
    );
};

export default FiltersPopover;