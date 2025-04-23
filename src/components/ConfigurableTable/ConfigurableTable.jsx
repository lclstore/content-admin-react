import React, { useState, useMemo, useEffect } from 'react';
import { Table, Input, Button, Spin, Space } from 'antd';
import { SearchOutlined, FilterOutlined, SettingOutlined } from '@ant-design/icons';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import './ConfigurableTable.css';
import MediaCell from '@/components/MediaCell/MediaCell';

// 默认分页配置
const DEFAULT_PAGINATION = {
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: (total, range) => `${total} items`,
};

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
 * @param {string} [props.actionColumnKey] - 操作列的 key
 * @param {Array<string>} [props.mandatoryColumnKeys=[]] - 强制显示的列的 key 数组 (由外部计算并传入)
 * @param {Array<string>} [props.defaultVisibleColumnKeys] - 默认可见的"可配置"列的 key 数组
 * @param {Array<string>} props.visibleColumnKeys - 当前可见列的 key 数组 (包含强制列和可见的可配置列)
 * @param {function} props.onVisibilityChange - 可见列 key 数组变化的回调 (包含强制列和更新后的可见可配置列)
 * @param {object} [props.searchConfig] - 搜索框配置
 * @param {object} [props.filterConfig] - 筛选器配置
 * @param {object|boolean} [props.paginationConfig=DEFAULT_PAGINATION] - 分页配置
 * @param {React.ReactNode} [props.extraToolbarItems] - 额外工具栏项
 * @param {boolean|number} [props.scrollX=true] - 横向滚动
 * @param {object} [props.rowSelection] - Ant Design Table 的行选择配置对象
 * @param {object} [props.tableProps] - 其他 Table props
 * @param {boolean} [props.showColumnSettings=true] - 是否显示列设置按钮
 * @param {Array<string>} [props.configurableColumnKeys=[]] - 定义哪些列是用户可以配置显示/隐藏的 key 数组
 * @param {Array<object>} [props.leftToolbarItems=[]] - 左侧工具栏按钮配置数组，每个对象包含 key, label, onClick 等属性
 * @param {boolean} [props.isInteractionBlockingRowClick] - 接收状态
 */
function ConfigurableTable({
    uniqueId,
    columns, // 所有列的定义
    dataSource,
    rowKey,
    loading = false,
    onRowClick,
    isInteractionBlockingRowClick, // 接收状态
    actionColumnKey,
    mandatoryColumnKeys = [], // 强制列 Key
    defaultVisibleColumnKeys, // 默认可见的 *可配置* 列 Key (可能为 undefined)
    visibleColumnKeys = [], // 当前所有可见列 Key (包括强制和可配置)
    onVisibilityChange, // 更新所有可见列的回调
    searchConfig,
    filterConfig,
    paginationConfig = DEFAULT_PAGINATION,
    extraToolbarItems,
    scrollX = true,
    rowSelection,
    tableProps,
    showColumnSettings = true,
    configurableColumnKeys = [], // 可配置列的 Key 列表
    leftToolbarItems = [], // 左侧工具栏按钮
}) {
    const storageKey = `table_visible_columns_${uniqueId}`;

    // 计算实际生效的默认可见列 (合并 mandatory 和 default)
    const effectiveDefaultVisibleKeys = useMemo(() => {
        // defaultVisibleColumnKeys 只包含可配置列的默认值
        // 需要合并 mandatoryKeys
        return Array.from(new Set([...(defaultVisibleColumnKeys || []), ...mandatoryColumnKeys]));
    }, [defaultVisibleColumnKeys, mandatoryColumnKeys]);

    // 可选列（用于列设置 Popover）- 仅基于传入的 configurableColumnKeys
    const optionalColumnsForSetting = useMemo(() => {
        const columnMap = new Map();
        columns.forEach(col => {
            const key = col.key || col.dataIndex;
            if (key) {
                columnMap.set(key, col.title || key);
            }
        });

        // 基于传入的可配置 Key 列表生成选项
        return configurableColumnKeys
            .map(key => ({
                key: key,
                title: columnMap.get(key) || key
            }))
            .filter(col => col.title);
    }, [configurableColumnKeys, columns]);

    // 列设置 Filter Section 数据 (基于 configurableColumnKeys)
    const columnSettingsSection = useMemo(() => ({
        title: 'Visible Columns',
        key: 'visibleColumns',
        options: optionalColumnsForSetting.map(col => col.title),
        keys: optionalColumnsForSetting.map(col => col.key),
    }), [optionalColumnsForSetting]);

    // 准备传递给列设置 Popover 的初始选中值 (仅包含当前可见的 *可配置* 列)
    const initialVisibleColumnTitles = useMemo(() => {
        const currentVisibleSet = new Set(visibleColumnKeys || []);
        return {
            visibleColumns: optionalColumnsForSetting
                .filter(col => currentVisibleSet.has(col.key))
                .map(col => col.title)
        };
    }, [visibleColumnKeys, optionalColumnsForSetting]);

    // 处理列可见性 Popover 的更新
    const handleColumnVisibilityUpdate = (newSelections) => {
        const selectedTitles = newSelections.visibleColumns || [];
        // titleToKeyMap 基于可配置列
        const titleToKeyMap = new Map(optionalColumnsForSetting.map(col => [col.title, col.key]));
        // selectedKeys 只包含用户在 popover 中勾选的 *可配置* 列
        const selectedKeys = selectedTitles.map(title => titleToKeyMap.get(title)).filter(Boolean);

        // 调用外部回调，传递合并强制列后的完整可见列表 (强制列会被强制加回)
        if (onVisibilityChange) {
            const finalKeys = Array.from(new Set([...selectedKeys, ...mandatoryColumnKeys]));
            onVisibilityChange(finalKeys);
        }
    };

    // 处理列可见性 Popover 的重置
    const handleColumnVisibilityReset = () => {
        // 重置为计算出的包含强制列的有效默认值
        if (onVisibilityChange) {
            onVisibilityChange(effectiveDefaultVisibleKeys);
        }
    };

    // 检查列设置是否有非默认值 (比较当前可见的 *可配置* 列 与 默认的 *可配置* 列)
    const hasActiveColumnSettings = useMemo(() => {
        // 1. 获取当前可见的可配置列
        const currentVisibleConfigurableKeys = (visibleColumnKeys || []).filter(key => configurableColumnKeys.includes(key));
        // 2. 获取默认的可配置列 (prop 本身就只包含可配置列)
        const defaultConfigurableKeys = defaultVisibleColumnKeys || [];

        const currentSet = new Set(currentVisibleConfigurableKeys);
        const defaultSet = new Set(defaultConfigurableKeys);

        if (currentSet.size !== defaultSet.size) return true;
        for (const key of currentSet) {
            if (!defaultSet.has(key)) return true;
        }
        return false;
    }, [visibleColumnKeys, defaultVisibleColumnKeys, configurableColumnKeys]);

    // 判断是否有可用的筛选选项
    const hasFilterOptions = useMemo(() => {
        return (
            filterConfig &&
            Array.isArray(filterConfig.filterSections) &&
            filterConfig.filterSections.some(
                (section) => Array.isArray(section.options) && section.options.length > 0
            )
        );
    }, [filterConfig]);

    // 判断是否有可用的列设置选项 (基于传入的 configurableColumnKeys)
    const hasColumnSettingOptions = useMemo(() => {
        // 检查传入的可配置 key 列表是否有内容
        return configurableColumnKeys.length > 0;
    }, [configurableColumnKeys]);

    // 判断是否有激活的筛选器
    const hasActiveFilters = useMemo(() => {
        if (!filterConfig || !filterConfig.activeFilters) return false;
        return Object.values(filterConfig.activeFilters).some(arr => Array.isArray(arr) && arr.length > 0);
    }, [filterConfig?.activeFilters]);

    // --- 渲染逻辑 ---
    // 根据外部传入的完整 visibleColumnKeys 过滤列进行渲染
    const currentlyVisibleColumns = useMemo(() => {
        const visibleSet = new Set(visibleColumnKeys || []);
        return columns.filter(col => visibleSet.has(col.key || col.dataIndex));
    }, [columns, visibleColumnKeys]);

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
                // 首先检查全局图片预览状态 - 如果预览激活，直接阻止行点击
                if (window.IMAGE_PREVIEW_ACTIVE === true) {
                    console.log('Row click blocked: Image preview is active');
                    return;
                }

                if (onRowClick) {
                    // 保持原有的检查逻辑（操作列等）
                    let targetElement = event.target;
                    let isActionColumnClick = false;
                    let isMediaCellClick = false; // 添加媒体单元格点击检查

                    while (targetElement && targetElement !== event.currentTarget) {
                        if (targetElement.dataset && targetElement.dataset.actionKey === actionColumnKey) {
                            isActionColumnClick = true;
                            break;
                        }
                        // 启用对媒体单元格的检查
                        if (targetElement.closest('td.media-cell')) {
                            isMediaCellClick = true; // 标记为媒体单元格点击
                            break;
                        }
                        targetElement = targetElement.parentElement;
                    }

                    // 如果既不是操作列点击，也不是媒体单元格点击，才触发行点击事件
                    if (!isActionColumnClick && !isMediaCellClick) {
                        onRowClick(record, event);
                    }
                }
            },
            style: onRowClick ? { cursor: 'pointer' } : {}, // 保持光标样式
        };
    };

    // 为操作列的 render 函数包裹一层 div
    const columnsWithActionMarker = useMemo(() => {
        if (!actionColumnKey) return currentlyVisibleColumns;
        return currentlyVisibleColumns.map(col => {
            if ((col.key || col.dataIndex) === actionColumnKey && col.render) {
                const originalRender = col.render;
                return {
                    ...col,
                    render: (...args) => (
                        <div data-action-key={actionColumnKey}>
                            {originalRender(...args)}
                        </div>
                    ),
                };
            }
            return col;
        });
    }, [currentlyVisibleColumns, actionColumnKey]);

    // 最终的分页配置
    const finalPaginationConfig = useMemo(() => {
        if (paginationConfig === false) return false;
        const config = { ...DEFAULT_PAGINATION, ...paginationConfig };
        config.total = dataSource?.length || 0;
        return config;
    }, [paginationConfig, dataSource]);

    // 处理列渲染: 根据 type 渲染 MediaCell 并添加 Action Marker
    const processedColumns = useMemo(() => {
        const mediaTypes = ['image', 'video', 'audio']; // 定义合法的媒体类型
        return currentlyVisibleColumns.map(col => {
            let processedCol = { ...col };

            // 检查 type 是否是定义的媒体类型之一，且没有自定义 render
            if (mediaTypes.includes(processedCol.type) && typeof processedCol.render === 'undefined') {
                // 设置 render 函数来渲染 MediaCell
                processedCol.render = (text, record) => {
                    // 直接将列定义的 type ('image', 'video', 'audio') 传递给 MediaCell
                    return (
                        <MediaCell
                            record={record}
                            processedCol={processedCol} // 直接使用列定义的配置信息
                        />
                    );
                };
            }

            // 为操作列添加标记 (保持不变)
            if ((processedCol.key || processedCol.dataIndex) === actionColumnKey && processedCol.render) {
                const originalRender = processedCol.render;
                processedCol.render = (...args) => (
                    <div data-action-key={actionColumnKey}>
                        {originalRender(...args)}
                    </div>
                );
            }

            return processedCol;
        });
    }, [currentlyVisibleColumns, actionColumnKey]);

    return (
        <div className="configurable-table-container">
            {/* 工具栏 */}
            <div className="configurable-table-toolbar">
                {/* 左侧按钮区域 */}
                <Space wrap className="configurable-table-toolbar-left">
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
                <Space wrap className="configurable-table-toolbar-right">
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
                    {hasFilterOptions && (
                        <FiltersPopover
                            filterSections={filterConfig.filterSections}
                            activeFilters={filterConfig.activeFilters || {}}
                            onUpdate={filterConfig.onUpdate}
                            onReset={filterConfig.onReset}
                            showBadgeDot={hasActiveFilters}
                            showClearIcon={hasActiveFilters}
                        >
                            <Button
                                icon={<FilterOutlined />}
                                className="configurable-table-toolbar-btn"
                            >
                                Filters
                            </Button>
                        </FiltersPopover>
                    )}
                    {showColumnSettings && hasColumnSettingOptions && (
                        <FiltersPopover
                            filterSections={[columnSettingsSection]} // 现在基于 configurableColumnKeys
                            activeFilters={initialVisibleColumnTitles} // 只包含当前可见的非强制列
                            onUpdate={handleColumnVisibilityUpdate} // 更新时会合并强制列
                            onReset={handleColumnVisibilityReset} // 重置时会包含强制列
                            popoverPlacement="bottomRight"
                            applyImmediately={true}
                            clearButtonText="Reset"
                            showBadgeDot={hasActiveColumnSettings} // 比较的是非强制列状态
                            showClearIcon={false}
                            isSettingsType
                        >
                            <Button
                                icon={<SettingOutlined />}
                                className="configurable-table-toolbar-btn configurable-table-settings-btn"
                            >
                                Table Settings
                            </Button>
                        </FiltersPopover>
                    )}
                </Space>
            </div>

            {/* 表格主体 (使用包含强制列的 currentlyVisibleColumns) */}
            <div className="configurable-table-body">
                <Table
                    columns={processedColumns}
                    dataSource={dataSource}
                    rowKey={rowKey}
                    loading={loading}
                    onRow={handleRow}
                    pagination={finalPaginationConfig}
                    scroll={scrollX ? { x: totalVisibleWidth } : undefined}
                    rowSelection={rowSelection}
                    {...tableProps}
                />
            </div>
        </div>
    );
}

export default ConfigurableTable; 