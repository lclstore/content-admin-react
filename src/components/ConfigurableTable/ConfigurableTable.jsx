import React, { useState, useMemo, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useLocation, useNavigate } from "react-router"
import { useImmer } from "use-immer"
import { Table, Input, Button, Spin, Space, Dropdown, message, Modal, FloatButton } from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    SettingOutlined,
    EditOutlined,
    CopyOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    StopOutlined,
    EllipsisOutlined,
    MenuOutlined,
    RightOutlined,
    DownOutlined,
    VerticalAlignTopOutlined,
} from '@ant-design/icons';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import styles from './ConfigurableTable.module.less';
import MediaCell from '@/components/MediaCell/MediaCell';
import { defaultPagination, actionIconMap, optionsConstants } from '@/constants';
import { getPublicTableList, publicUpdateStatus, publicDeleteData, publicGenerate, sortPublicTableList } from "@/config/api.js";
import settings from "@/config/settings.js"
import Empty from '@/components/Empty';
import { debounce, times } from 'lodash';
import { useStore } from "@/store/index.js";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deepClone } from "@/utils/index.js";

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
 * @param {string} [props.operationName] - 操作名称
 * @param {number} [props.refreshKey=0] - 0 表示不刷新 1. 表示当前页面刷新 2. 表示全局刷新
 * @param {noDataTip} [props.noDataTip] // 没有数据时的提示信息
 * @param {boolean} [props.showPagination=true] // 是否显示分页
 * @param {boolean} [props.draggable=false] - 添加拖拽功能的开关
 * @param {function} [props.onDragEnd] - 添加拖拽结束的回调函数
 * @param {function} [props.expandedRowRender] - 展开行的渲染函数
 * @param {function} [props.getListAfer] - 获取列表数据后的回调函数
 */
const ConfigurableTable = forwardRef(({
    columns, // 所有列的定义
    dataSource = [],
    paddingTop = 20,
    noDataTip,
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
    moduleKey,
    operationName = 'page',
    showPagination = true, // 是否显示分页
    draggable = false, // 添加拖拽功能的开关
    onDragEnd, // 添加拖拽结束的回调函数
    expandedRowRender, // 修改为直接接收展开行渲染函数
    getListAfer,
}, ref) => {
    const optionsBase = useStore(i => i.optionsBase)
    const navigate = useNavigate(); // 路由导航
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const routeLevel = pathSegments.length;
    let pathUrl = location.pathname.split('/')[1];
    moduleKey = moduleKey || pathSegments[1];
    if (routeLevel == 3) {
        pathUrl = `${pathSegments[0]}/${pathSegments[1]}`;
    }
    const pathname = location.pathname.split('/')[1];
    const listConfig = settings.listConfig;
    const storageKey = `table_visible_columns_${moduleKey}`;
    const [messageApi, contextHolder] = message.useMessage();
    // paginationConfig load cache
    paginationConfig = sessionStorage.getItem(location.pathname) || paginationConfig
    // 添加上一次排序状态的引用
    const prevSorterRef = useRef(null);
    const [isEmptyTableData, setIsEmptyTableData] = useState(false);//判断是否没有创建数据
    const [tableData, setTableData] = useState(dataSource);
    const [items, setItems] = useState(dataSource);
    const [totalCount, setTotalCount] = useState(dataSource?.length || 0); // 使用dataSource的长度初始化
    const dataRef = useRef({ tableData, items });
    // 声明内部 loading，也可以接受外部传入
    const [loadingLocal, setLoadingLocal] = useState(loading)
    useEffect(() => { setLoadingLocal(loading) }, [loading]);
    // 用于取消请求的控制器
    const abortControllerRef = useRef(null);
    // 是否展示置顶按钮
    const [topping, setTopping] = useState(false);
    // load cache
    const searchData = sessionStorage.getItem(location.pathname)
    let loadCache = searchData ? JSON.parse(searchData) : null
    // select list
    const [selectList, setSelectList] = useState([]);
    //   ref
    const tableRef = useRef(null) // 表格组件的ref
    const activeFilters = useRef(loadCache ? loadCache.activeFilters : (filterConfig?.activeFilters || {})) //当前选中的筛选器
    const paginationParams = useRef(loadCache ? loadCache.paginationParams : {
        ...paginationConfig,
    })
    // 获取默认可见列
    const getVisibleKeys = (columns, visibleColumn) => {
        const defaultVisibleKeys = columns
            .filter(col => {
                const key = col.key || col.dataIndex;
                return key && col.visibleColumn === visibleColumn
            })
            .map(col => col.key || col.dataIndex);
        return defaultVisibleKeys
    }
    // filter data
    const filterDataHook = useImmer({});
    // 默认的列设置
    const [defaultFilters, setDefaultFilters] = useState({
        visibleColumns: getVisibleKeys(columns, 2)
    });
    // 内部维护一个列可见性状态，当外部没有传递时使用
    const [internalVisibleColumnKeys, setInternalVisibleColumnKeys] = useState(() => {
        // 尝试从localStorage读取
        const savedValue = localStorage.getItem(storageKey);
        if (savedValue) {
            return {
                visibleColumns: JSON.parse(savedValue)
            }
        }
        return defaultFilters
    });
    // 实际使用的可见列键（优先使用外部传入的值）
    const effectiveVisibleColumnKeys = useMemo(() => {
        const systemVisibleColumnKeys = getVisibleKeys(columns, 0);//强制显示的列
        const newVisibleColumnKeys = Array.isArray(visibleColumnKeys) ? visibleColumnKeys :
            (internalVisibleColumnKeys?.visibleColumns || []);
        const result = Array.from(new Set([...systemVisibleColumnKeys, ...newVisibleColumnKeys]));
        return result
    }, [visibleColumnKeys, internalVisibleColumnKeys]);

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
        // 创建选项数组，每个选项包含key、value、label
        const options = columns
            // .filter(col => col.key !== 'actions')
            .map(col => {
                const key = col.key || col.dataIndex;
                return {
                    key,
                    value: key, // value 与 key 相同
                    label: col.title,
                    disabled: col.visibleColumn === 0 || col.visibleColumn === undefined // 禁用强制显示的列
                };
            });
        return {
            type: 'multiple',
            title: 'Visible Columns',
            key: 'visibleColumns',
            options: options.filter(i => i.key != 'actions'), // 使用包含key和label的对象数组
        };
    }, [columns]);

    // 准备传递给列设置 Popover 的初始选中值
    const initialVisibleColumnTitles = useMemo(() => {
        const currentVisibleSet = new Set(effectiveVisibleColumnKeys || []);
        // 只选择可配置的列（visibleColumn 为 1 或 2）
        const visibleKeys = columns
            .filter(col => {
                const key = col.key || col.dataIndex;
                return (col.visibleColumn === 1 || col.visibleColumn === 2) && currentVisibleSet.has(key);
            })
            .map(col => col.key || col.dataIndex);

        return {
            visibleColumns: visibleKeys
        };
    }, [effectiveVisibleColumnKeys, columns]);

    // 处理列可见性 Popover 的更新
    const handleColumnVisibilityUpdate = useCallback((newSelections) => {
        const selectedKeys = newSelections.visibleColumns || [];
        // 如果外部提供了回调，则调用外部回调
        if (onVisibilityChange) {
            onVisibilityChange(finalKeys);
        } else {
            // 合并选中的列和强制显示的列
            localStorage.setItem(storageKey, JSON.stringify(selectedKeys));
            setInternalVisibleColumnKeys({
                visibleColumns: selectedKeys
            })
        }
    }, [onVisibilityChange, storageKey]);

    // 处理列可见性 Popover 的重置

    // 检查列设置是否有非默认值
    const hasActiveColumnSettings = useMemo(() => {
        // 1. 获取当前可见的可配置列
        const currentVisibleConfigurableKeys = effectiveVisibleColumnKeys
            .filter(key => {
                const col = columns.find(c => (c.key || c.dataIndex) === key);
                return col && (col.visibleColumn === 1 || col.visibleColumn === 2);
            });

        // 2. 获取默认的可配置列
        const defaultConfigurableKeys = columns
            .filter(col => col.visibleColumn === 2)
            .map(col => col.key || col.dataIndex);

        const currentSet = new Set(currentVisibleConfigurableKeys);
        const defaultSet = new Set(defaultConfigurableKeys);

        if (currentSet.size !== defaultSet.size) return true;
        for (const key of currentSet) {
            if (!defaultSet.has(key)) return true;
        }
        for (const key of defaultSet) {
            if (!currentSet.has(key)) return true;
        }
        return false;
    }, [effectiveVisibleColumnKeys, columns]);

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

    // if out search data hook is exist，use out search data replace inside
    useImperativeHandle(ref, () => ({
        getSearchData: () => ({ ...paginationParams.current, ...activeFilters.current, }),
        // select list
        selectList: {
            get: () => selectList,
            set: setSelectList
        },
        listData: {
            get: () => tableData
        }
    }))


    // --- 渲染逻辑 ---
    // 根据外部传入的完整 visibleColumnKeys 过滤列进行渲染
    const currentlyVisibleColumns = useMemo(() => {
        // 当 showColumnSettings 为 false 时，显示所有列
        if (showColumnSettings === false) {
            return columns;
        }

        // 原有逻辑：按照可见列设置过滤
        const visibleSet = new Set(effectiveVisibleColumnKeys || []);
        return columns.filter(col => {
            const key = col.key || col.dataIndex;
            return visibleSet.has(key) || col.key === 'actions'; //
        });
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
                // const isMediaClick = event.target.closest('td.media-cell') ||
                //     (event.target.classList &&
                //         (event.target.classList.contains('media-cell') ||
                //             event.target.classList.contains('mediaCell')));
                // if (isMediaClick) {
                //     console.log('行点击被阻止：点击了媒体单元格');
                //     return;
                // }

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

    // 更新 ref 中的数据
    useEffect(() => {
        dataRef.current = { tableData, items };
    }, [tableData, items]);

    // 监听外部数据源变化
    useEffect(() => {
        if (dataSource && dataSource.length > 0 &&
            JSON.stringify(dataSource) !== JSON.stringify(dataRef.current.tableData)) {
            setTableData(dataSource);
            setItems(dataSource);
        }
    }, [dataSource]);

    // 监听数据源变化，更新totalCount
    useEffect(() => {
        if (dataSource?.length > 0) {
            setTotalCount(dataSource.length);
            paginationParams.current.totalCount = dataSource.length;
        }
    }, [dataSource]);

    // 查询表格数据
    const searchTableData = useCallback(async (isFirstSearch) => {
        // 如果存在正在进行的请求，取消它
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 创建新的 AbortController
        abortControllerRef.current = new AbortController();
        const searchData = deepClone({
            ...paginationParams.current,
            ...activeFilters.current,
            orderBy: paginationParams.current.orderBy || 'id',
            orderDirection: paginationParams.current.orderDirection || 'DESC',
        })
        // 对searchData进行缓存
        sessionStorage.setItem(location.pathname, JSON.stringify({ paginationParams: paginationParams.current, activeFilters: activeFilters.current }))
        let res;
        try {
            setLoadingLocal(true);
            // 修改数据获取逻辑
            if (dataSource && dataSource.length > 0) {
                res = {
                    data: dataSource,
                    success: true,
                    totalCount: dataSource.length
                };
            } else {
                res = await (getTableList ? getTableList(searchData) : getPublicTableList(moduleKey, operationName, searchData, { signal: abortControllerRef.current.signal }))
            }

            // 请求完成后清除当前的 AbortController
            abortControllerRef.current = null;
            if (res && res.success) {
                const newData = res.data || [];
                setTableData(newData);
                setItems(newData);
                paginationParams.current.totalCount = res.totalCount;
                setTotalCount(res.data.length);

                if (isFirstSearch) {
                    setIsEmptyTableData(newData.length === 0);
                }
            } else {
                paginationParams.current.totalCount = 0;
                setTotalCount(0);
                setIsEmptyTableData(true);
                setTableData([]);
                setItems([]);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request cancelled');
                return;
            }
            console.error('Search error:', error);
            setIsEmptyTableData(true);
            setTableData([]);
            setItems([]);
        } finally {
            getListAfer && getListAfer(res)
            if (abortControllerRef.current === null) {
                setLoadingLocal(false);
            }
        }
    }, [moduleKey, operationName, getTableList, dataSource]);

    // 搜索框 输入框 变化 (使用防抖)
    const debouncedSearch = useCallback(
        debounce((value) => {
            paginationParams.current[searchConfig.fieldName ? searchConfig.fieldName : 'keywords'] = value;
            searchTableData(); // 查询表格数据
        }, 300), // 300ms 的防抖延迟
        [paginationParams]
    );

    const onSearchChange = useCallback((e) => {
        debouncedSearch(e.target.value);
    }, [debouncedSearch]);

    // 筛选器 更新
    const filterUpdate = useCallback((newFilters) => {
        paginationParams.current.pageIndex = 1;
        activeFilters.current = newFilters;
        searchTableData()// 查询 表格数据
    }, [paginationParams])
    const filterReset = useCallback((isClear) => {
        activeFilters.current = {};
        if (!isClear) {
            searchTableData()// 查询 表格数据
        }

    }, [paginationParams])

    // 处理列渲染: 根据 mediaType 渲染 MediaCell 并添加 Action Marker
    const processedColumns = useMemo(() => {
        const mediaTypes = ['image', 'video', 'audio']; // 定义合法的媒体类型
        return currentlyVisibleColumns.map(col => {
            let processedCol = { ...col };
            processedCol.showSorterTooltip = processedCol.showSorterTooltip ?? false;
            // 为align: 'center'的列添加类名
            if (processedCol.align === 'center') {
                processedCol.className = `td-center`
            }

            // 添加默认排序配置
            // if (processedCol.defaultSortOrder) {
            //     processedCol.defaultSortOrder = processedCol.defaultSort === 'ascend' ? 'ascend' :
            //         processedCol.defaultSort === 'descend' ? 'descend' :
            //             'ascend';  // 未指定时默认升序
            // }

            if (!col.render) {
                // 创建cell容器
                // 只要列有mediaType属性并且是有效的媒体类型，就添加media-cell类名
                if (mediaTypes.includes(processedCol.mediaType)) {
                    // 为包含媒体类型的列添加特殊的className
                    processedCol.className = styles.mediaCell;
                    processedCol.width = processedCol.width || 95
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
                    const options = typeof processedCol.options === 'string' ? optionsBase[processedCol.options] : processedCol.options;

                    processedCol.render = (text, record, index) => {
                        if (!record) return null; // 如果record不存在，返回null
                        if (!options) return text
                        if (Array.isArray(text)) {
                            text = text.map(enumVal => options.find(option => option.value === enumVal).label || enumVal).toString()
                        }
                        else {
                            const optionConfig = options.find(option => option.value === text); // 获取文本选项配置
                            // 决定显示的文本: 优先使用 options 的文本，如果不存在则使用原始 text
                            optionConfig && (text = (optionConfig.name || optionConfig.label || text));
                        }
                        return text;
                    };
                }

                // 如果列有 actionButtons 属性，添加对 actionButtons 的处理逻辑
                else if (processedCol.actionButtons && Array.isArray(processedCol.actionButtons)) {
                    // 默认的按钮显示规则
                    const defaultIsButtonVisible = (record, btnName) => {
                        const status = record.status;
                        // 简单的状态-按钮映射关系
                        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
                        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
                        if (status === 'ENABLED' && ['edit', 'duplicate'].includes(btnName)) return true;
                        return false;
                    };
                    const defaultActionClick = async (key, rowData, e, click) => {

                        switch (key) {
                            // generate 特殊处理下
                            case 'generate':
                                click && click({ selectList: [rowData] })
                                break;
                            // 编辑
                            case 'edit':
                                // 获取当前路径并分割成数组
                                // 判断路由层级
                                if (processedCol.edit) {
                                    processedCol.edit(rowData, e, click);
                                    return
                                }
                                navigate(`/${pathUrl}/editor?id=${rowData.id}`);
                                break;
                            // 复制
                            case 'duplicate':
                                if (processedCol.duplicate) {
                                    processedCol.duplicate(rowData, e, click);
                                    return
                                }
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
                        let DropdownItems = [...listConfig.rowButtonsPublic, ...(processedCol.customButtons || [])]
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
                                            defaultActionClick(key, record, e, click)
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
                    processedCol.width = 70;
                    processedCol.minWidth = 70;
                    processedCol.maxWidth = 70;
                    processedCol.fixed = 'right';
                    processedCol.align = 'center';

                    // 为操作列添加action-cell类名
                    processedCol.onCell = () => ({
                        className: 'action-cell', // 为单元格添加action-cell类名
                    });
                }
                // default
                else {
                    processedCol.render = (text, record, index) => {
                        return (<div key={`${record[rowKey] || index}-default-${processedCol.key || processedCol.dataIndex}`}>{text}</div>)
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
                const key = `${record[rowKey] || index}-${processedCol.key || processedCol.dataIndex}-cell`;
                return (
                    <div key={key} className="td-cell">
                        {C}
                    </div>
                )
            }
            return processedCol;
        });
    }, [currentlyVisibleColumns]);

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

    // 在组件挂载时从 localStorage 读取配置
    useEffect(() => {
        if (!visibleColumnKeys) {  // 只在没有外部传入 visibleColumnKeys 时执行
            try {
                const savedValue = localStorage.getItem(storageKey);
                if (savedValue) {
                    const parsedValue = JSON.parse(savedValue);
                    // setInternalVisibleColumnKeys(parsedValue);
                }
            } catch (error) {
                console.error("读取localStorage中的列配置失败:", error);
            }
        }
    }, [storageKey, visibleColumnKeys]);

    // 设置拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 0.5,
                delay: 0,
                tolerance: 1
            },
        })
    );

    // 处理拖拽结束
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id) return;

        setItems((prevItems) => {
            const oldIndex = prevItems.findIndex(item => item[rowKey] === active.id);
            const newIndex = prevItems.findIndex(item => item[rowKey] === over.id);

            if (oldIndex === -1 || newIndex === -1) return prevItems;

            const newItems = arrayMove(prevItems, oldIndex, newIndex);
            // 排序公共table列表
            sortPublicTableList(moduleKey, { idList: newItems.map(item => item[rowKey]) }).then(res => {
                if (res.success) {
                    setTableData(newItems); // 同步更新 tableData
                    if (onDragEnd) {
                        onDragEnd(newItems);
                    }
                }
            });
            return newItems;
        });
    }, [onDragEnd, rowKey]);

    // 定义内部expandable配置
    const expandableConfig = useMemo(() => {
        if (!expandedRowRender) return undefined;

        return {
            expandedRowRender: (record) => {
                // 获取展开行的内容
                const expandedContent = expandedRowRender(record);

                // 如果展开内容是Table组件，我们需要修改它的列配置
                if (React.isValidElement(expandedContent) && expandedContent.type === Table) {
                    // 克隆Table组件并修改它的columns配置
                    const modifiedTable = React.cloneElement(expandedContent, {
                        columns: expandedContent.props.columns.map(col => ({
                            ...col,
                            render: (text, record, index) => {
                                // 保存原始的render函数
                                const originalRender = col.render || ((text) => text);
                                // 调用原始render获取内容
                                const content = originalRender(text, record, index);
                                // 用td-cell包装内容
                                return <div className="td-cell">{content}</div>;
                            }
                        }))
                    });

                    // 用expandedRowRender类包裹修改后的表格
                    return <div className={`${styles.expandedRowRender} ${styles.configurableTableContainer}`}>{modifiedTable}</div>;
                }

                // 如果不是Table组件，也用expandedRowRender类包裹
                return <div className={`${styles.expandedRowRender} ${styles.configurableTableContainer}`}>{expandedContent}</div>;
            },
            rowExpandable: (record) => true,
            columnWidth: 50,
            fixed: 'left',
            indentSize: 20,
            expandIcon: ({ expanded, onExpand, record }) => {
                const Icon = expanded ? DownOutlined : RightOutlined;
                return (
                    <Icon
                        style={{
                            padding: '30px 20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#0000004b'
                        }}
                        onClick={e => {
                            onExpand(record, e);
                            e.stopPropagation();
                        }}
                    />
                );
            }
        };
    }, [expandedRowRender]);

    useEffect(() => {
        searchTableData(true)//初始化数据
        // setTableHeight(window.innerHeight - tableRef.current.nativeElement.getBoundingClientRect().top)
        return () => {
            // 组件卸载时取消所有未完成的请求
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // 修改表格组件的渲染内容
    const tableContent = useMemo(() => (
        <Table
            columns={draggable ? [
                {
                    title: 'Sort',
                    dataIndex: 'sort',
                    width: 60,
                    className: 'drag-visible',
                    align: 'center',
                },
                ...processedColumns,
            ] : processedColumns}
            dataSource={draggable ? items : tableData}
            components={draggable ? {
                body: {
                    row: SortableRow,
                },
            } : undefined}
            onRow={handleRow}
            rowKey={rowKey}
            ref={tableRef}
            loading={loadingLocal}
            pagination={showPagination ? {
                current: paginationParams.current.pageIndex,
                pageSize: paginationParams.current.pageSize,
                total: paginationParams.current.totalCount,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000'],
                showTotal: (total, range) => `${total} items`,
            } : false}
            scroll={finalScrollConfig}
            rowSelection={rowSelection ? {
                onChange(key, rowData) {
                    setSelectList(rowData)
                },
                columnWidth: 60,
                ...rowSelection
            } : false}
            virtual={tableVirtualConfig}
            expandable={expandableConfig} // 使用内部定义的expandable配置
            onChange={(pagination, filters, sorter) => {
                // 判断是否发生了排序变化
                const isSorterChanged =
                    prevSorterRef.current?.field !== sorter.field ||
                    prevSorterRef.current?.order !== sorter.order;

                // 更新分页参数
                if (showPagination) {
                    paginationParams.current.pageIndex = isSorterChanged ? 1 : pagination.current;
                    paginationParams.current.pageSize = pagination.pageSize;
                }

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
    ), [
        draggable,
        items,
        tableData,
        processedColumns,
        handleRow,
        rowKey,
        showPagination,
        paginationParams.current,
        finalScrollConfig,
        rowSelection,
        tableVirtualConfig,
        tableProps,
        loadingLocal,
        expandableConfig // 更新依赖
    ]);

    return (
        // isEmptyTableData ?

        //     // <Empty title={noDataTip || `You don't have any ${pathname} yet`} />
        //     :
        <div className={styles.configurableTableContainer} style={{ paddingTop: paddingTop }}>
            {/* 工具栏 */}
            {contextHolder}
            <FloatButton.BackTop target={() => document.querySelector('.ant-table-wrapper')} visibilityHeight={50} />
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
                            value={paginationParams.current[searchConfig.fieldName ? searchConfig.fieldName : 'keywords']}
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
                            activeFilters={internalVisibleColumnKeys}
                            defaultFilters={defaultFilters}
                            onUpdate={handleColumnVisibilityUpdate}
                            onReset={() => { }}
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

            {/* 根据draggable属性决定是否启用拖拽功能 */}
            {draggable ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(item => item[rowKey])}
                        strategy={verticalListSortingStrategy}
                    >
                        {tableContent}
                    </SortableContext>
                </DndContext>
            ) : (
                tableContent
            )}
            {/* 置顶按钮 */}
            <Button style={{
                opacity: topping ? 1 : 0, transition: "opacity 0.5s", position: "fixed", bottom: "100px", right: "20px", zIndex: 2
            }} icon={<VerticalAlignTopOutlined />} shape="circle" onClick={() => { document.querySelector('.ant-table-wrapper').scrollTo(0, 0) }}></Button>
            {/* 当不显示分页时显示总条数 */}
            {/*{console.log('totalCount:', totalCount, 'showPagination:', showPagination)}*/}
            {!showPagination && (
                <div className={styles.totalCountDisplay} style={{ padding: '16px 0', textAlign: 'right' }}>
                    {totalCount || 0} items
                </div>
            )}

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
})

// 创建可排序的行组件
const SortableRow = ({ children, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key']
    });

    const style = {
        ...props.style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr {...props} ref={setNodeRef} style={style}>
            {React.Children.map(children, (child, index) => {
                if (index === 0) {
                    return React.cloneElement(child, {
                        children: (
                            <div {...attributes} {...listeners}  >
                                <MenuOutlined
                                    style={{
                                        cursor: 'grab',
                                        fontSize: '16px',
                                        color: isDragging ? '#1890ff' : '#999',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            </div>
                        )
                    });
                }
                return child;
            })}
        </tr>
    );
};

export default ConfigurableTable; 