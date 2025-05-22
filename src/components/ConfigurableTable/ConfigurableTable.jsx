import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from "react-router"
import { useImmer } from "use-immer"
import { Table, Input, Button, Spin, Space, Dropdown } from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    SettingOutlined,
    EditOutlined,
    CopyOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    StopOutlined,
    EllipsisOutlined
} from '@ant-design/icons';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import styles from './ConfigurableTable.module.less';
import MediaCell from '@/components/MediaCell/MediaCell';
import { defaultPagination, actionIconMap, optionsConstants } from '@/constants';
import { getList as getListPublick } from "@/config/api.js";
import settings from "@/config/settings.js"

/**
 * 可配置表格组件
 *
 * @param {object} props - 组件属性
 * @param {string} props.uniqueId - 表格的唯一标识符，用于 localStorage 存储列设置
 * @param {Array} props.columns - Ant Design Table 的列定义数组 (包含所有列的定义)
 * @param {Array} props.dataSource - 表格数据源
 * @param {string|function} props.rowKey - 表格行的 Key，一般是 id
 * @param {boolean} [props.loading=false] - 表格加载状态
 * @param {function} [props.onRowClick] - 行点击事件回调 (record, event) => {}
 * @param {Array<string>} [props.mandatoryColumnKeys=[]] - 强制显示的列的 key 数组 (由外部计算并传入)
 * @param {Array<string>} props.visibleColumnKeys - 当前可见列的 key 数组 (包含强制列和可见的可配置列)
 * @param {function} props.onVisibilityChange - 可见列 key 数组变化的回调 (包含强制列和更新后的可见可配置列)
 * @param {object} [props.searchConfig] - 搜索框配置
 * @param {object} [props.filterConfig] - 筛选器配置
 * @param {object|boolean} [props.paginationConfig=defaultPagination] - 分页配置
 * @param {boolean|number} [props.scrollX=true] - 横向滚动
 * @param {object} [props.rowSelection] - Ant Design Table 的行选择配置对象
 * @param {object} [props.tableProps] - 其他 Table props
 * @param {boolean} [props.showColumnSettings=true] - 当为true时显示列设置按钮并执行列设置逻辑，当为false时显示所有列且不显示列设置按钮
 * @param {Array<object>} [props.leftToolbarItems=[]] - 左侧工具栏按钮配置数组，每个对象包含 key, label, onClick 等属性
 * @param {boolean} [props.isInteractionBlockingRowClick] - 接收状态
 * @param {function} [props.getList] - 获取表格数据的回调函数
 * @param {String} [props.moduleKey] - 业务功能相关的key，用于公共接口传参和业务逻辑判断
 */
function ConfigurableTable({
    uniqueId,
    columns, // 所有列的定义
    dataSource,
    rowKey,
    loading = false,
    onRowClick,
    isInteractionBlockingRowClick, // 接收状态
    mandatoryColumnKeys = [], // 强制列 Key
    visibleColumnKeys, // 当前所有可见列 Key (包括强制和可配置)
    onVisibilityChange, // 更新所有可见列的回调
    searchConfig,
    filterConfig,
    paginationConfig = defaultPagination,
    scrollX = true,
    rowSelection,
    tableProps,
    showColumnSettings = true,//当为true时显示列设置按钮
    leftToolbarItems = [], // 左侧工具栏按钮
    getList,
    moduleKey
}) {
    moduleKey = moduleKey || useLocation().pathname.split('/').at(-2);
    const listConfig = settings.listConfig;
    const storageKey = `table_visible_columns_${uniqueId}`;

    // 内部维护一个列可见性状态，当外部没有传递时使用
    const [internalVisibleColumnKeys, setInternalVisibleColumnKeys] = useState(() => {
        // 尝试从localStorage读取
        try {
            const savedValue = localStorage.getItem(storageKey);
            if (savedValue) {
                return JSON.parse(savedValue);
            }
        } catch (error) {
            console.error("读取localStorage中的列配置失败:", error);
        }

        // 无法从localStorage读取时，基于列的visibleColumn属性确定默认可见列
        return columns
            .filter(col => {
                const key = col.key || col.dataIndex;
                // 未设置visibleColumn或visibleColumn=0或2的列作为默认可见列
                return key && (!col.visibleColumn || col.visibleColumn === 0 || col.visibleColumn === 2);
            })
            .map(col => col.key || col.dataIndex);
    });

    // 实际使用的可见列键（优先使用外部传入的值）
    const effectiveVisibleColumnKeys = visibleColumnKeys || internalVisibleColumnKeys;

    // 计算可能的列分类：禁用列、可配置列和默认可见列
    const columnCategories = useMemo(() => {
        // 根据visibleColumn属性分类列
        const disabledKeys = []; // visibleColumn = 0 的列
        const configurableOptionKeys = []; // visibleColumn = 1 的列（可选）
        const defaultVisibleKeys = []; // visibleColumn = 2 的列（默认可见）

        columns.forEach(col => {
            const key = col.key || col.dataIndex;
            if (!key) return;

            // 根据visibleColumn属性确定列的类别
            if (col.visibleColumn === 0 || col.visibleColumn === undefined) {
                disabledKeys.push(key);
            } else if (col.visibleColumn === 1) {
                configurableOptionKeys.push(key);
            } else if (col.visibleColumn === 2) {
                defaultVisibleKeys.push(key);
                configurableOptionKeys.push(key); // 默认可见的列也是可配置的
            }
        });

        return {
            disabledKeys,
            configurableOptionKeys,
            defaultVisibleKeys
        };
    }, [columns]);

    // 基于列分类计算可选列和默认可见列
    const { disabledKeys, configurableOptionKeys, defaultVisibleKeys } = columnCategories;

    // 计算实际生效的默认可见列（当localStorage没有存储时使用）
    const effectiveDefaultVisibleKeys = useMemo(() => {
        // 合并强制显示列和默认可见列
        return Array.from(new Set([...disabledKeys, ...defaultVisibleKeys]));
    }, [disabledKeys, defaultVisibleKeys]);

    // 可选列（用于列设置 Popover）- 基于visibleColumn=1或2的列
    const optionalColumnsForSetting = useMemo(() => {
        return columns
            .filter(col => {
                const key = col.key || col.dataIndex;
                return key && (col.visibleColumn === 1 || col.visibleColumn === 2);
            })
            .map(col => ({
                key: col.key || col.dataIndex,
                title: col.title || (col.key || col.dataIndex)
            }));
    }, [columns]);

    // 列设置 Filter Section 数据
    const columnSettingsSection = useMemo(() => {
        // 创建选项数组，每个选项包含key和title
        const options = columns.map(col => ({
            key: col.key,
            label: col.title,
            disabled: !col.visibleColumn
        }));

        return {
            title: 'Visible Columns',
            key: 'visibleColumns',
            options: options.filter(i => i.key != 'actions'), // 使用包含key和label的对象数组
        };
    }, [optionalColumnsForSetting]);

    // 准备传递给列设置 Popover 的初始选中值 (仅包含当前可见的 *可配置* 列)
    const initialVisibleColumnTitles = useMemo(() => {
        const currentVisibleSet = new Set(effectiveVisibleColumnKeys || []);
        // 选择当前可见的列键
        const visibleKeys = optionalColumnsForSetting
            .filter(col => currentVisibleSet.has(col.key))
            .map(col => col.key);

        return {
            visibleColumns: visibleKeys
        };
    }, [effectiveVisibleColumnKeys, optionalColumnsForSetting]);

    // 处理列可见性 Popover 的更新
    const handleColumnVisibilityUpdate = (newSelections) => {
        const selectedKeys = newSelections.visibleColumns || [];

        // 合并强制列
        const finalKeys = Array.from(new Set([...selectedKeys, ...disabledKeys]));

        // 如果外部提供了回调，则调用外部回调
        if (onVisibilityChange) {
            onVisibilityChange(finalKeys);
        } else {
            // 否则由内部状态管理
            setInternalVisibleColumnKeys(finalKeys);
            try {
                localStorage.setItem(storageKey, JSON.stringify(finalKeys));
            } catch (error) {
                console.error("保存列配置到localStorage失败:", error);
            }
        }
    };

    // 处理列可见性 Popover 的重置
    const handleColumnVisibilityReset = () => {
        // 重置为计算出的包含强制列的有效默认值
        const resetKeys = effectiveDefaultVisibleKeys;

        if (onVisibilityChange) {
            onVisibilityChange(resetKeys);
        } else {
            // 由内部状态管理
            setInternalVisibleColumnKeys(resetKeys);
            try {
                localStorage.setItem(storageKey, JSON.stringify(resetKeys));
            } catch (error) {
                console.error("重置列配置到localStorage失败:", error);
            }
        }
    };

    // 检查列设置是否有非默认值
    const hasActiveColumnSettings = useMemo(() => {
        // 1. 获取当前可见的可配置列
        const currentVisibleConfigurableKeys = (effectiveVisibleColumnKeys || [])
            .filter(key => configurableOptionKeys.includes(key));
        // 2. 获取默认的可配置列
        const defaultSet = new Set(defaultVisibleKeys);

        const currentSet = new Set(currentVisibleConfigurableKeys);

        if (currentSet.size !== defaultSet.size) return true;
        for (const key of currentSet) {
            if (!defaultSet.has(key)) return true;
        }
        for (const key of defaultSet) {
            if (!currentSet.has(key)) return true;
        }
        return false;
    }, [effectiveVisibleColumnKeys, configurableOptionKeys, defaultVisibleKeys]);


    // 判断是否有可用的列设置选项
    const hasColumnSettingOptions = useMemo(() => {
        // 检查是否有可配置的列
        return optionalColumnsForSetting.length > 0;
    }, [optionalColumnsForSetting]);

    // 判断是否有激活的筛选器
    const hasActiveFilters = useMemo(() => {
        if (!filterConfig || !filterConfig.activeFilters) return false;
        return Object.values(filterConfig.activeFilters).some(arr => Array.isArray(arr) && arr.length > 0);
    }, [filterConfig?.activeFilters]);

    // --- 渲染逻辑 ---
    // 根据外部传入的完整 visibleColumnKeys 过滤列进行渲染
    const currentlyVisibleColumns = useMemo(() => {
        // 当 showColumnSettings 为 false 时，显示所有列
        if (showColumnSettings === false) {
            return columns;
        }

        // 原有逻辑：按照可见列设置过滤
        const visibleSet = new Set(effectiveVisibleColumnKeys || []);
        return columns.filter(col => visibleSet.has(col.key || col.dataIndex));
    }, [columns, effectiveVisibleColumnKeys, showColumnSettings]);

    // 计算可见列的总宽度
    const totalVisibleWidth = useMemo(() => {
        if (!scrollX) return undefined;
        return currentlyVisibleColumns.reduce((acc, col) => {
            let width = 0;
            if (typeof col.width === 'number') width = col.width;
            else if (typeof col.width === 'string') {
                const parsedWidth = parseInt(col.width, 10);
                if (!isNaN(parsedWidth)) width = parsedWidth;
            }
            return acc + (width > 0 ? width : 150);
        }, 0);
    }, [currentlyVisibleColumns, scrollX]);

    // 处理行事件 (根据 isInteractionBlockingRowClick 决定是否绑定 onClick)
    const handleRow = (record) => {
        // 如果交互状态阻止点击，则不为行附加 onClick 处理器
        if (isInteractionBlockingRowClick) {
            // 返回空对象，不绑定任何事件
            return {};
        }

        // 否则，正常绑定 onClick
        return {
            onClick: (event) => {
                // 首先检查全局媒体预览状态 - 如果任何预览激活，直接阻止行点击
                if (window.MEDIA_PREVIEW && window.MEDIA_PREVIEW.isAnyPreviewActive()) {
                    console.log('Row click blocked: Media preview is active');
                    return;
                }

                if (onRowClick) {
                    // 检查是否点击了操作列或媒体单元格
                    let targetElement = event.target;
                    let isActionColumnClick = false;
                    let isMediaCellClick = false;
                    let isCheckboxClick = false;

                    // 向上遍历DOM树检查目标元素
                    while (targetElement && targetElement !== event.currentTarget) {
                        // 检查是否点击了操作列
                        if (targetElement.dataset && targetElement.dataset.actionKey === 'actions') {
                            isActionColumnClick = true;
                            break;
                        }

                        // 检查是否点击了媒体单元格
                        // 使用多种选择器以提高检测精度
                        if (
                            targetElement.closest('td.action-cell') ||
                            targetElement.closest('td.media-cell') ||
                            targetElement.classList && (
                                targetElement.classList.contains('media-cell') ||
                                targetElement.classList.contains(styles.mediaCell)
                            )
                        ) {
                            isMediaCellClick = true;
                            break;
                        }

                        // 检查是否点击了复选框单元格
                        if (
                            targetElement.closest('td.ant-table-cell.ant-table-selection-column') ||
                            (targetElement.classList && (
                                targetElement.classList.contains('ant-table-selection-column') ||
                                targetElement.classList.contains('ant-checkbox-wrapper') ||
                                targetElement.classList.contains('ant-checkbox') ||
                                targetElement.classList.contains('ant-checkbox-input')
                            ))
                        ) {
                            isCheckboxClick = true;
                            break;
                        }

                        targetElement = targetElement.parentElement;
                    }

                    // 如果是操作列点击、媒体单元格点击或复选框点击，不触发行点击事件
                    if (!isActionColumnClick && !isMediaCellClick && !isCheckboxClick) {
                        onRowClick(record, event);
                    } else {
                        console.log('Row click blocked:',
                            isActionColumnClick ? 'Action column clicked' :
                                isMediaCellClick ? 'Media cell clicked' : 'Checkbox clicked');
                    }
                }
            },
            style: onRowClick ? { cursor: 'pointer' } : {}, // 保持光标样式
        };
    };

    // 最终的分页配置
    const finalPaginationConfig = useMemo(() => {
        if (paginationConfig === false) return false;
        const config = { ...defaultPagination, ...paginationConfig };
        config.total = dataSource?.length || 0;
        return config;
    }, [paginationConfig, dataSource]);

    // 表格性能优化配置
    const tableVirtualConfig = useMemo(() => {
        // 只有当scrollX和scrollY都有明确的数值时才启用虚拟滚动
        if (!scrollX || !tableProps?.scroll?.y || typeof tableProps?.scroll?.y !== 'number') {
            return undefined;
        }

        return {
            scrollToFirstRowOnChange: true, // 分页时滚动到首行
        };
    }, [scrollX, tableProps?.scroll?.y]);

    // 最终的滚动配置
    const finalScrollConfig = useMemo(() => {
        if (!scrollX && !tableProps?.scroll?.y) return undefined;

        const config = {};

        if (scrollX) {
            config.x = totalVisibleWidth;
            config.scrollToFirstRowOnChange = true;
        }

        // 如果外部传入了明确的scroll.y数值，则使用它
        if (tableProps?.scroll?.y && typeof tableProps.scroll.y === 'number') {
            config.y = tableProps.scroll.y;
        }

        return config;
    }, [scrollX, totalVisibleWidth, tableProps?.scroll?.y]);

    // 处理列渲染: 根据 mediaType 渲染 MediaCell 并添加 Action Marker
    const processedColumns = useMemo(() => {
        const mediaTypes = ['image', 'video', 'audio']; // 定义合法的媒体类型
        return currentlyVisibleColumns.map(col => {
            let processedCol = { ...col };
            if (!col.render) {
                // 创建cell容器
                // 只要列有mediaType属性并且是有效的媒体类型，就添加media-cell类名
                if (mediaTypes.includes(processedCol.mediaType)) {
                    // 为包含媒体类型的列添加特殊的className
                    processedCol.className = styles.mediaCell;
                    // 添加 onCell 方法给单元格添加类名
                    processedCol.onCell = () => ({
                        className: 'media-cell', // 为单元格添加 media-cell 类名
                    });

                    // 只有在没有自定义render函数时才设置默认的MediaCell渲染
                    if (typeof processedCol.render === 'undefined') {
                        // 设置 render 函数来渲染 MediaCell
                        processedCol.render = (text, record) => {
                            // 直接将列定义的 mediaType ('image', 'video', 'audio') 传递给 MediaCell
                            return (
                                <MediaCell
                                    record={record}
                                    processedCol={processedCol} // 直接使用列定义的配置信息
                                />
                            );
                        };
                    }
                }

                // 如果列有  options 属性，设置渲染逻辑
                if (processedCol.options) {
                    const options = typeof processedCol.options === 'string' ? optionsConstants[processedCol.options] : processedCol.options;

                    processedCol.render = (text, record) => {
                        const key = text;
                        const optionConfig = options ? options.find(option => option.value === key) : null; // 获取文本选项配置
                        // 决定显示的文本: 优先使用 options 的文本，如果不存在则使用原始 text
                        const DisplayText = optionConfig ? (optionConfig.name ?? text) : text;
                        // 如果 iconOptions 和 options 都没有为当前 key 提供配置，则返回原始文本
                        if (!optionConfig) {
                            return text;
                        }
                        const B = () => DisplayText
                        return (
                            <B />
                        );
                    };
                }

                // 如果列有 actionButtons 属性，添加对 actionButtons 的处理逻辑
                if (processedCol.actionButtons && Array.isArray(processedCol.actionButtons)) {
                    processedCol.render = (_, rowData) => {
                        console.log(listConfig.rowButtonsPublic)
                        let DropdownItems = listConfig.rowButtonsPublic.filter(i => processedCol.actionButtons.includes(i.key))
                            .filter(({ key }) => processedCol.isShow(rowData, key))
                            .map(({ key, click, icon }) => {
                                const ItemIcon = icon
                                return {
                                    key,
                                    label: key.charAt(0).toUpperCase() + key.slice(1), // 首字母大写
                                    icon: <ItemIcon />,
                                    // 使用style属性只控制字体颜色
                                    style: key === 'delete' ? { color: '#ff4d4f' } : {},
                                    // 删除danger属性，避免hover背景色变化
                                    onClick: (e) => {
                                        if (e.domEvent) e.domEvent.stopPropagation();
                                        click && click({ moduleKey, selectList: [rowData] });
                                    }
                                };
                            })
                        return (
                            <div className="actions-container" onClick={(e) => e.stopPropagation()}>
                                <Dropdown
                                    menu={{ items: DropdownItems }}
                                    trigger={['click']}
                                    className="action-dropdown"
                                >
                                    <Button
                                        type="text"
                                        icon={<EllipsisOutlined />}
                                        className="action-button"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Dropdown>
                            </div>
                        )
                    };

                    // 为操作列添加action-cell类名
                    processedCol.onCell = () => ({
                        className: 'action-cell', // 为单元格添加action-cell类名
                    });
                }
                // 添加最小宽度
                processedCol.minWidth = 100;
            }
            return processedCol;
        });
    }, [currentlyVisibleColumns]);
    // search data
    const [filterData, uodateFilterData] = useImmer({});
    // getData 的方法
    const getData = useCallback(async () => {
        const res = await (getList ? getList : getListPublick)()
    }, [currentlyVisibleColumns, dataSource, rowKey]);

    return (
        <div className={styles.configurableTableContainer}>
            {/* 工具栏 */}
            <div className="configurable-table-toolbar"
                style={leftToolbarItems.length === 0 ? { justifyContent: "flex-end" } : {}}>
                {/* 左侧按钮区域 */}
                <Space wrap className={styles.configurableTableToolbarLeft}>
                    {leftToolbarItems.map(item => (
                        <Button
                            key={item.key}
                            onClick={item.onClick}
                            type={item.type || 'default'} // 默认为 default 类型
                            icon={item.icon}
                            disabled={item.disabled}
                            // 可以传递其他 Button props
                            {...item.buttonProps}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Space>

                {/* 右侧工具区域 */}
                <Space wrap className={styles.configurableTableToolbarRight}>
                    {searchConfig && (
                        <Input
                            maxLength={100}
                            showCount
                            placeholder={searchConfig.placeholder || 'Search...'}
                            value={searchConfig.searchValue}
                            prefix={<SearchOutlined />}
                            onChange={searchConfig.onSearchChange}
                            className="configurable-table-search-input"
                            suffix={loading ? <Spin size="small" /> : null}
                            allowClear
                        />
                    )}
                    {filterConfig && filterConfig.filterSections?.length > 0 && (
                        <FiltersPopover
                            filterSections={filterConfig.filterSections}
                            activeFilters={filterConfig.activeFilters || {}}
                            onUpdate={() => {
                                getData()
                                filterConfig.onUpdate()
                            }}
                            onReset={filterConfig.onReset}
                            showBadgeDot={hasActiveFilters}
                            showClearIcon={hasActiveFilters}
                        >
                            <Button
                                icon={<FilterOutlined />}
                                className={styles.configurableTableToolbarBtn}
                            >
                                Filters
                            </Button>
                        </FiltersPopover>
                    )}
                    {showColumnSettings && hasColumnSettingOptions && (
                        <FiltersPopover
                            filterSections={[columnSettingsSection]}
                            activeFilters={initialVisibleColumnTitles}
                            onUpdate={handleColumnVisibilityUpdate}
                            onReset={handleColumnVisibilityReset}
                            popoverPlacement="bottomRight"
                            applyImmediately={false}
                            clearButtonText="Reset"
                            confirmButtonText="Apply"
                            showBadgeDot={hasActiveColumnSettings}
                            showClearIcon={false}
                            isSettingsType
                        >
                            <Button
                                icon={<SettingOutlined />}
                                className={`${styles.configurableTableToolbarBtn} ${styles.configurableTableSettingsBtn}`}
                            >
                                Table Settings
                            </Button>
                        </FiltersPopover>
                    )}
                </Space>
            </div>

            {/* 表格主体 (使用包含强制列的 currentlyVisibleColumns) */}
            <Table
                columns={processedColumns}
                dataSource={dataSource}
                rowKey={rowKey}
                loading={loading}
                onRow={handleRow}
                pagination={finalPaginationConfig}
                scroll={finalScrollConfig}
                rowSelection={rowSelection}
                virtual={tableVirtualConfig} // 只有在有效的配置下才启用虚拟滚动
                onChange={(pagination, filters, sorter) => {
                    // 调用原有的onChange回调(如果存在)
                    if (tableProps?.onChange) {
                        tableProps.onChange(pagination, filters, sorter);
                    }
                }}
                {...tableProps}
            />
        </div>
    );
}

export default ConfigurableTable; 