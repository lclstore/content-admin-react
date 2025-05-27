import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from "react-router"
import { useImmer } from "use-immer"
import { Table, Input, Button, Spin, Space, Dropdown, message, Modal } from 'antd';
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
import { getPublicTableList, publicUpdateStatus, publicDeleteData } from "@/config/api.js";
import settings from "@/config/settings.js"
import noDataImg from '@/assets/images/no-data.png';
import { debounce, times } from 'lodash';
/**
 * 可配置表格组件
 *
 * @param {object} props - 组件属性
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
 * @param {function} [props.getTableList] - 获取表格数据的回调函数
 * @param {String} [props.moduleKey] - 业务功能相关的key，用于公共接口传参和业务逻辑判断
 * @param {number} [props.refreshKey=0] - 0 表示不刷新 1. 表示当前页面刷新 2. 表示全局刷新
 */
function ConfigurableTable({
    columns, // 所有列的定义
    dataSource = [],
    refreshKey = 0,
    rowKey = 'id',
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
    getTableList,
    moduleKey
}) {
    const pathSegments = useLocation().pathname.split('/').filter(Boolean);
    const routeLevel = pathSegments.length;
    let pathUrl = useLocation().pathname.split('/')[1];
    moduleKey = moduleKey || pathSegments[1];
    if (routeLevel == 3) {
        pathUrl = `${pathSegments[0]}/${pathSegments[1]}`;
    }
    const pathname = useLocation().pathname.split('/')[1];
    const listConfig = settings.listConfig;
    const storageKey = `table_visible_columns_${moduleKey}`;
    const paginationParams = useRef({
        ...paginationConfig,
    })
    const [messageApi, contextHolder] = message.useMessage();
    const navigate = useNavigate(); // 路由导航
    // 添加上一次排序状态的引用
    const prevSorterRef = useRef(null);
    const [isEmptyTableData, setIsEmptyTableData] = useState(false);//判断是否没有创建数据
    const [tableData, setTableData] = useState(dataSource)
    // 声明内部 loading，也可以接受外部传入
    const [loadingLocal, setLoadingLocal] = useState(loading)
    useEffect(() => { setLoadingLocal(loading) }, [loading]);

    // 用于取消请求的控制器
    const abortControllerRef = useRef(null);

    //   ref
    const tableRef = useRef(null) // 表格组件的ref
    const activeFilters = useRef(filterConfig?.activeFilters || {}) //当前选中的筛选器
    // filter data
    const filterDataHook = useImmer({});
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
        if (!activeFilters.current) return false;
        return Object.values(activeFilters.current).some(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return !!value; // 非数组时判断值是否存在
        });
    }, [activeFilters.current]);

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
    // 计算可见列的总高度
    const [tableHeight, setTableHeight] = useState(0)
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
                    console.log('行点击被阻止：媒体预览处于激活状态');
                    return;
                }

                // 检查是否点击了操作区域
                const isActionClick = event.target.closest('.actions-container');
                if (isActionClick) {
                    console.log('行点击被阻止：点击了操作区域');
                    return;
                }

                // 检查是否点击了媒体单元格
                const isMediaClick = event.target.closest('td.media-cell') ||
                    (event.target.classList &&
                        (event.target.classList.contains('media-cell') ||
                            event.target.classList.contains('mediaCell')));
                if (isMediaClick) {
                    console.log('行点击被阻止：点击了媒体单元格');
                    return;
                }

                // 检查是否点击了复选框单元格
                const isCheckboxClick = event.target.closest('td.ant-table-cell.ant-table-selection-column') ||
                    (event.target.classList &&
                        (event.target.classList.contains('ant-table-selection-column') ||
                            event.target.classList.contains('ant-checkbox-wrapper') ||
                            event.target.classList.contains('ant-checkbox') ||
                            event.target.classList.contains('ant-checkbox-input')));
                if (isCheckboxClick) {
                    console.log('行点击被阻止：点击了复选框');
                    return;
                }

                if (onRowClick) {
                    onRowClick(record, event);
                } else {
                    // 默认行为：导航到编辑页面
                    navigate(`/${pathUrl}/editor?id=${record.id}`);
                }
            },
            style: { cursor: 'pointer' }, // 保持光标样式
        };
    };



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
        // config.y = tableHeight
        if (tableProps?.scroll?.y && typeof tableProps.scroll.y === 'number') {
            config.y = tableProps.scroll.y;
        }
        return config;
    }, [scrollX, totalVisibleWidth, tableHeight, tableProps?.scroll?.y]);

    // 查询 表格数据
    const searchTableData = useCallback(async (isFirstSearch) => {
        const fetchTableData = getTableList || getPublicTableList

        // 如果存在正在进行的请求，取消它
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 创建新的 AbortController
        abortControllerRef.current = new AbortController();

        try {
            setLoadingLocal(true);
            let res = {
                data: dataSource,
                success: true,
                totalCount: dataSource.length
            }
            //外部传入优先使用外部传入的
            if (dataSource.length === 0) {
                res = await fetchTableData(moduleKey, {
                    ...paginationParams.current,
                    ...activeFilters.current
                }, { signal: abortControllerRef.current.signal });
            }

            // 请求完成后清除当前的 AbortController
            abortControllerRef.current = null;

            if (res && res.success) {

                setTableData(res.data);
                paginationParams.current.totalCount = res.totalCount
                if (isFirstSearch) {
                    setIsEmptyTableData(res.data.length === 0)
                }
            } else {
                paginationParams.current.totalCount = 0
                setIsEmptyTableData(true)
            }
        } catch (error) {
            // 如果是取消请求导致的错误，不做处理
            if (error.name === 'AbortError') {
                console.log('Request cancelled');
                return;
            }
            // 其他错误正常处理
            console.error('Search error:', error);
            setIsEmptyTableData(true);
        } finally {
            // 如果不是被取消的请求，才设置 loading 为 false
            if (abortControllerRef.current === null) {
                setLoadingLocal(false);
            }
        }
    }, [currentlyVisibleColumns, dataSource, rowKey]);

    // 搜索框 输入框 变化 (使用防抖)
    const debouncedSearch = useCallback(
        debounce((value) => {
            paginationParams.current.keywords = value;
            searchTableData(); // 查询表格数据
        }, 300), // 300ms 的防抖延迟
        [paginationParams]
    );

    const onSearchChange = useCallback((e) => {
        debouncedSearch(e.target.value);
    }, [debouncedSearch]);

    // 筛选器 更新
    const filterUpdate = useCallback((newFilters) => {
        activeFilters.current = newFilters;
        searchTableData()// 查询 表格数据
    }, [paginationParams])
    const filterReset = useCallback(() => {
        activeFilters.current = {};
        searchTableData()// 查询 表格数据
    }, [paginationParams])

    // 处理列渲染: 根据 mediaType 渲染 MediaCell 并添加 Action Marker
    const processedColumns = useMemo(() => {
        const mediaTypes = ['image', 'video', 'audio']; // 定义合法的媒体类型
        return currentlyVisibleColumns.map(col => {
            let processedCol = { ...col };

            // 添加默认排序配置
            if (processedCol.sorter) {
                processedCol.defaultSortOrder = processedCol.defaultSort === 'ascend' ? 'ascend' :
                    processedCol.defaultSort === 'descend' ? 'descend' :
                        'ascend';  // 未指定时默认升序
            }

            if (!col.render) {
                // 创建cell容器
                // 只要列有mediaType属性并且是有效的媒体类型，就添加media-cell类名
                if (mediaTypes.includes(processedCol.mediaType)) {
                    // 为包含媒体类型的列添加特殊的className
                    processedCol.className = styles.mediaCell;
                    processedCol.width = 95
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
                                    key={`${record[rowKey]}-${processedCol.key || processedCol.dataIndex}`}
                                    record={record}
                                    processedCol={processedCol} // 直接使用列定义的配置信息
                                />
                            );
                        };
                    }
                }

                // 如果列有  options 属性，设置渲染逻辑
                else if (processedCol.options) {
                    const options = typeof processedCol.options === 'string' ? optionsConstants[processedCol.options] : processedCol.options;

                    processedCol.render = (text, record, index) => {
                        if (!record) return null; // 如果record不存在，返回null
                        const key = text;
                        const optionConfig = options ? options.find(option => option.value === key) : null; // 获取文本选项配置
                        // 决定显示的文本: 优先使用 options 的文本，如果不存在则使用原始 text
                        const DisplayText = optionConfig ? (optionConfig.name ?? text) : text;
                        // 如果 iconOptions 和 options 都没有为当前 key 提供配置，则返回原始文本
                        if (!optionConfig) {
                            return text;
                        }
                        return DisplayText;
                    };
                }

                // 如果列有 actionButtons 属性，添加对 actionButtons 的处理逻辑
                else if (processedCol.actionButtons && Array.isArray(processedCol.actionButtons)) {
                    // 默认的按钮显示规则
                    const defaultIsButtonVisible = (record, btnName) => {
                        const status = record.status;
                        // 简单的状态-按钮映射关系
                        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
                        if (status === 'DISABLE' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
                        if (status === 'ENABLE' && ['edit', 'duplicate'].includes(btnName)) return true;
                        return false;
                    };
                    const defaultActionClick = async (key, rowData) => {

                        switch (key) {

                            // 编辑
                            case 'edit':
                                // 获取当前路径并分割成数组
                                // 判断路由层级
                                navigate(`/${pathUrl}/editor?id=${rowData.id}`);
                                break;
                            // 复制
                            case 'duplicate':
                                navigate(`/${pathUrl}/editor?id=${rowData.id}&isDuplicate=true`);
                                break;
                            // 删除
                            case 'delete':
                                // 显示确认对话框
                                setDeleteRowData(rowData);
                                setDeleteModalVisible(true);
                                break;
                            // 启用/禁用
                            case 'enable':
                            case 'disable':
                                const status = key.toUpperCase();
                                const result = await publicUpdateStatus({ idList: [rowData.id] }, `/${moduleKey}/${key}`);
                                if (result.success) {
                                    messageApi.success(`successfully!`);
                                    searchTableData()// 刷新表格数据
                                } else {
                                    messageApi.error(`failed!`);
                                }

                                break;
                            // 弃用
                            case 'deprecate':

                                break;
                            default:
                                break;
                        }
                    }
                    processedCol.render = (text, record, index) => {
                        if (!record) return null; // 如果record不存在，返回null
                        let DropdownItems = listConfig.rowButtonsPublic
                            .filter(i => processedCol.actionButtons.includes(i.key))
                            .filter(({ key }) => processedCol.isShow ? processedCol.isShow(record, key) : defaultIsButtonVisible(record, key))
                            // 添加排序步骤，按照 actionButtons 中的顺序排序
                            .sort((a, b) => {
                                return processedCol.actionButtons.indexOf(a.key) - processedCol.actionButtons.indexOf(b.key);
                            })
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
                                        // 有自定义就执行自定义方法
                                        if (processedCol.onActionClick) {
                                            processedCol.onActionClick(key, record, e, click)
                                        } else {
                                            // 默认的处理方法
                                            defaultActionClick(key, record, e)
                                        }
                                    }
                                };
                            })

                        return (
                            <div className="actions-container" onClick={(e) => e.stopPropagation()} key={`actions-${record[rowKey] || index}`}>
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
                    // 固定action宽度
                    processedCol.width = 56
                    // 为操作列添加action-cell类名
                    processedCol.onCell = () => ({
                        className: 'action-cell', // 为单元格添加action-cell类名
                    });
                }
                // default
                else {
                    processedCol.render = (text, record) => {
                        return (<>{text}</>)
                    };
                }
                // 添加最小宽度
                processedCol.minWidth = 100;
            }
            const childrenRender = processedCol.render
            // 给所有渲染添加一个 class td-cell 的容器
            processedCol.render = (text, record, index) => {
                if (!record) return null; // 如果record不存在，返回null
                const C = childrenRender(text, record, index);
                return (
                    <div key={`${record[rowKey] || index}-${processedCol.key || processedCol.dataIndex}`} className="td-cell">
                        {C}
                    </div>
                )
            }
            return processedCol;
        });
    }, [currentlyVisibleColumns]);

    useEffect(() => {
        searchTableData(true)//初始化数据

        // setTableHeight(window.innerHeight - tableRef.current.nativeElement.getBoundingClientRect().top)
    }, []);

    // 组件卸载时取消所有未完成的请求
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);
    // 刷新表格数据
    useEffect(() => {
        if (refreshKey === 1) {
            searchTableData()//当前页面刷新
        } else if (refreshKey === 2) {
            paginationParams.current.pageIndex = 1;
            searchTableData()//全局刷新
        }
    }, [refreshKey])

    // 添加删除确认对话框的状态
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteRowData, setDeleteRowData] = useState(null);

    return (
        isEmptyTableData ?
            <div className={styles.customEmptyWrapper}>
                <div className={styles.customEmptyImageWrapper}>
                    <img src={noDataImg} alt="No Data" className={styles.customEmptyImage} />
                </div>
                <div className={styles.customEmptyTitle}>Start Building Your Content </div>
                <div className={styles.customEmptyDescription}>Create your first program.</div>
            </div>
            :
            <div className={styles.configurableTableContainer}>
                {/* 工具栏 */}
                {contextHolder}
                <div className="configurable-table-toolbar"
                    style={leftToolbarItems.length === 0 ? { justifyContent: "flex-end" } : {}}>
                    {/* 左侧按钮区域 */}
                    <Space wrap className={styles.configurableTableToolbarLeft}>
                        {leftToolbarItems.map((item, index) => (
                            <Button
                                key={`${item.key || index}`}
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
                                value={paginationParams.keywords}
                                prefix={<SearchOutlined />}
                                onChange={onSearchChange}
                                className="configurable-table-search-input"
                                suffix={loadingLocal ? <Spin size="small" /> : null}
                                allowClear
                            />
                        )}
                        {filterConfig && filterConfig.filterSections?.length > 0 && (
                            <FiltersPopover
                                filterSections={filterConfig.filterSections}
                                dataHook={filterDataHook}
                                activeFilters={activeFilters.current}
                                onUpdate={filterUpdate}
                                onReset={filterReset}
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
                    dataSource={tableData}
                    rowKey={rowKey}
                    onRow={handleRow}
                    ref={tableRef}
                    pagination={{
                        current: paginationParams.current.pageIndex,//当前页码
                        pageSize: paginationParams.current.pageSize,//每页条数
                        total: paginationParams.current.totalCount,//总条数
                        showSizeChanger: true,//显示分页器
                        showQuickJumper: true,//显示快速跳转
                        pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000'],//每页条数选项
                        showTotal: (total, range) => `${total} items`,//显示总条数
                    }}
                    scroll={finalScrollConfig}
                    rowSelection={rowSelection}
                    virtual={tableVirtualConfig} // 只有在有效的配置下才启用虚拟滚动
                    onChange={(pagination, filters, sorter) => {
                        // 判断是否发生了排序变化
                        const isSorterChanged =
                            prevSorterRef.current?.field !== sorter.field ||
                            prevSorterRef.current?.order !== sorter.order;

                        // 更新分页参数 
                        paginationParams.current.pageIndex = isSorterChanged ? 1 : pagination.current;
                        paginationParams.current.pageSize = pagination.pageSize;

                        // 更新排序参数 
                        const isAscending = sorter.order === 'ascend';
                        const orderBy = sorter.field;
                        const orderDirection = isAscending ? 'ASC' : 'DESC';
                        paginationParams.current.orderBy = orderBy;
                        paginationParams.current.orderDirection = orderDirection;

                        // 更新上一次的排序状态
                        prevSorterRef.current = { ...sorter };

                        searchTableData();// 查询表格数据
                    }}
                    {...tableProps}
                />

                {/* 删除确认对话框 */}
                <Modal
                    title="Confirm Delete"
                    open={deleteModalVisible}
                    centered
                    width={500}
                    zIndex={100}
                    onOk={async () => {
                        if (deleteRowData) {
                            const result = await publicDeleteData({ idList: [deleteRowData.id] }, `/${moduleKey}/del`);
                            if (result.success) {
                                messageApi.success('successful!');
                                searchTableData(); // 刷新表格数据
                            } else {
                                messageApi.error('failed!');
                            }
                        }
                        setDeleteModalVisible(false);
                        setDeleteRowData(null);
                    }}
                    onCancel={() => {
                        setDeleteModalVisible(false);
                        setDeleteRowData(null);
                    }}
                    okText="DELETE"
                    cancelText="CANCEL"
                    okButtonProps={{ danger: true }}
                >
                    <p style={{ fontSize: 15, textAlign: 'center' }}>Delete【{deleteRowData?.name}】? You will not be able to use it anymore once it is deleted.</p>
                </Modal>
            </div>
    );
}

export default ConfigurableTable; 