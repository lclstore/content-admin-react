import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Popover, Badge } from 'antd';
import { FilterOutlined, CloseCircleOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './FiltersPopover.module.css';

/**
 * 通用过滤器/设置 Popover 组件
 * @param {Array<Object>} filterSections - 过滤器区域配置 (仅过滤器类型需要)
 *   - title: string - 区域标题
 *   - key: string - 区域标识符 (用于 selectedValues)
 *   - options: Array<string> - 区域内的选项
 * @param {Object} activeFilters - 外部传入的、当前已应用的过滤器值 (用于初始化 Popover 内部状态)
 * @param {Function} onUpdate - 点击 'Search' 按钮或选项 (当 applyImmediately=true 时) 时的回调, 参数为当前选中的过滤器值
 * @param {Function} onReset - 点击 'Clear' 按钮或清除图标时的回调
 * @param {string} [popoverPlacement='bottomRight'] - Popover 的弹出位置
 * @param {boolean} [applyImmediately=false] - 点击选项后是否立即触发 onUpdate 并关闭 Popover (仅过滤器类型有效)
 * @param {string} [clearButtonText='Clear'] - 清除按钮的文本 (仅过滤器类型有效)
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
    children,
    showBadgeDot = false,
    showClearIcon = false,
    isSettingsType = false,
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
        // 预先计算下一个状态值
        const calculateNextState = (prev) => {
            const currentSelection = prev[sectionKey] ? [...prev[sectionKey]] : [];
            const currentIndex = currentSelection.indexOf(optionValue);
            if (currentIndex === -1) {
                currentSelection.push(optionValue);
            } else {
                currentSelection.splice(currentIndex, 1);
            }
            return { ...prev, [sectionKey]: currentSelection };
        };

        // 直接使用当前状态计算出下一个状态，而不依赖异步的 setState 回调
        let nextSelectedValues;
        setTempSelectedValues(prev => {
            nextSelectedValues = calculateNextState(prev);
            return nextSelectedValues;
        });

        // 如果需要立即应用，则使用计算好的 nextSelectedValues 调用 onUpdate
        if (applyImmediately && onUpdate) {
            // 确保 nextSelectedValues 已经被 calculateNextState 函数赋值
            // 注意：虽然 setState 是异步的，但 calculateNextState 是同步执行的，
            // 并且 nextSelectedValues 在 setState 的 updater 函数内部被赋值。
            // 然而，为了确保在 if 条件判断时 nextSelectedValues 一定有值，
            // 应该在 setState 之外计算它。

            // 修正：在 setState 外部计算 nextSelectedValues
            const currentState = tempSelectedValues; // 获取当前状态
            const trulyNextSelectedValues = calculateNextState(currentState);

            // 使用修正后的值调用 onUpdate
            onUpdate(trulyNextSelectedValues);

            // 更新状态 （使用上面计算好的值）
            setTempSelectedValues(trulyNextSelectedValues);

            // setIsVisible(false); // 如果点击立即生效，通常也需要关闭 Popover
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

    const isSettingsPopover = isSettingsType;

    const shouldShowClearIcon = showClearIcon && !isSettingsPopover;
    const shouldShowBadgeDot = showBadgeDot && !isSettingsPopover;

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

            {(onReset || (!applyImmediately && onUpdate)) && (
                <div className={styles.filterFooter}>
                    <Space>
                        {onReset && (
                            <Button onClick={handleReset} className={styles.footerButton}>
                                {clearButtonText}
                            </Button>
                        )}
                        {!applyImmediately && onUpdate && (
                            <Button type="primary" onClick={handleUpdate} className={`${styles.footerButton} ${styles.updateButton}`}>
                                Search
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
                                e.stopPropagation();
                                handleReset();
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