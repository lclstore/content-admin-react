import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import {
    Input,
    Button,
    List,
    Avatar,
    Typography,
    Spin,
    Checkbox
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    FilterOutlined,
    CaretRightOutlined
} from '@ant-design/icons';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import { optionsConstants } from '@/constants/options';
import styles from './CommonList.module.css';

// 创建防抖hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // 设置延迟定时器
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // 清除定时器
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

const { Text } = Typography;


/**
 * 通用列表组件，支持搜索、筛选、无限滚动
 * @param {function} initCommonListData - 控制组件渲染的数据请求方法
 * @param {function} onSearchChange - 搜索框内容变化时的回调函数
 * @param {string} searchValue - 当前搜索框的值
 * @param {Array} filterSections - 过滤器数组
 * @param {object} activeFilters - 当前激活的筛选器对象
 * @param {string} placeholder - 搜索框的占位文本
 * @param {function} onAddItem - 点击添加按钮时的回调函数
 * @param {string} [selectionMode='add'] - 选择模式 ('add' 或 'replace')
 * @param {string} [selectedItemId=null] - 当前选中的项目 ID
 * @param {function} renderItemMata - 自定义渲染列表项的函数
 * @param {object} defaultQueryParams - 默认查询参数
 */
const CommonList = ({
    initCommonListData,
    onSearchChange,
    searchValue = '',
    filterSections = [],
    placeholder = 'Search...',
    onAddItem,
    selectionMode = 'add',
    selectedItemId = null,
    onFilterChange,
    renderItemMata,
    activeFilters = {},// 外部传入的默认选中的筛选条件
    defaultQueryParams = {
        page: 1,
        pageSize: 10,
        status: 'ENABLE'
    }
}) => {
    const [scrollableId] = useState(() => `commonListScrollableDiv-${Math.random().toString(36).substring(2, 9)}`);
    const [keyword, setKeyword] = useState(searchValue);
    // 使用防抖hook，延迟500ms
    const debouncedKeyword = useDebounce(keyword, 500);
    const [selectedFilters, setSelectedFilters] = useState({ ...activeFilters }); // 筛选条件
    const [displayedItems, setDisplayedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const scrollableContainerRef = useRef(null);
    const [internalListData, setInternalListData] = useState([]);
    // 默认的搜索方法
    const defaultSearchCommonListData = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([]);
            }, 1000);
        });
    }
    // 如果searchCommonListData为空，则使用默认的搜索方法
    if (!initCommonListData) {
        initCommonListData = defaultSearchCommonListData;
    }
    // 数据请求
    const fetchData = async (filters) => {
        setLoading(true);
        try {
            // 优先使用传入的filters，如果没有则使用组件内部的selectedFilters
            const params = {
                ...defaultQueryParams,
                ...(filters || selectedFilters),
                keyword: debouncedKeyword
            };

            const data = await initCommonListData(params);
            setInternalListData(data || []);
        } catch (error) {
            console.error('获取列表数据失败:', error);
            setInternalListData([]);
        } finally {
            setLoading(false);
        }
    };

    // 使用内部获取的数据
    const currentListData = useMemo(() => {
        return internalListData;
    }, [internalListData]);

    // 初始加载和数据变化时更新显示项 - 使用useMemo简化
    useEffect(() => {
        if (!currentListData) return;

        const initialItems = (currentListData || []).slice(0, defaultQueryParams.pageSize);
        setDisplayedItems(initialItems);
        setHasMore((currentListData || []).length > defaultQueryParams.pageSize);

        if (scrollableContainerRef.current) {
            scrollableContainerRef.current.scrollTop = 0;
        }
    }, [currentListData]);

    // 监听防抖后的关键词和筛选条件变化,请求数据
    useEffect(() => {
        fetchData();
    }, [selectedFilters, debouncedKeyword]);

    // 加载更多数据
    const loadMoreItems = useCallback(() => {
        if (loading || !hasMore) return;

        setLoading(true);
        setTimeout(() => {
            const currentLength = displayedItems.length;
            const nextItems = (currentListData || []).slice(currentLength, currentLength + defaultQueryParams.pageSize);
            setDisplayedItems(prevItems => [...prevItems, ...nextItems]);
            setHasMore((currentListData || []).length > currentLength + nextItems.length);
            setLoading(false);
        }, 500);
    }, [loading, hasMore, displayedItems, currentListData]);
    // 判断是否有激活的筛选器
    const hasActiveFilters = useMemo(() => {
        return selectedFilters && Object.keys(selectedFilters).length > 0
    }, [selectedFilters]);
    // 处理搜索框变化 - 使用useCallback优化
    const handleSearchChange = useCallback((e) => {
        setKeyword(e.target.value);

        // 更新搜索关键词
        if (onSearchChange) {
            onSearchChange(e.target.value);
        }

    }, [setKeyword, onSearchChange]);

    // 处理筛选器更新
    const handleFilterUpdate = useCallback((newFilters) => {
        // 先保存最新的筛选条件再请求数据
        setSelectedFilters(newFilters);
        // 如果外部提供了onFilterChange回调，则调用
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    }, [onFilterChange, defaultQueryParams]);

    // 重置筛选器
    const handleFilterReset = useCallback(() => {
        // 更新本地筛选器状态
        setSelectedFilters({});

        // 如果外部提供了onFilterChange回调，则调用
        if (onFilterChange) {
            onFilterChange({});
        }
    }, [onFilterChange]);

    // 列表项渲染函数
    const renderListItem = useCallback((item) => {
        if (!item || !item.id) return null;

        let actions = [];
        const isDisabled = selectionMode === 'replace' && item.status !== defaultQueryParams.status;

        if (selectionMode === 'add') {
            if (item.status === defaultQueryParams.status) {
                actions.push(
                    <Button
                        key={`add-${item.id}`}
                        type="text"
                        shape="circle"
                        icon={<PlusOutlined style={{ color: 'var(--active-color)', fontSize: '20px' }} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddItem(item);
                        }}
                        title="Add to structure"
                    />
                );
            }
        } else if (selectionMode === 'replace') {
            actions.push(
                <Checkbox
                    key={`select-${item.id}`}
                    checked={selectedItemId === item.id}
                    disabled={isDisabled}
                    onChange={(e) => {
                        if (isDisabled) return;
                        e.stopPropagation();
                        if (selectedItemId === item.id) {
                            onAddItem(null);
                        } else {
                            onAddItem(item);
                        }
                    }}
                />
            );
        }

        return (
            <List.Item
                key={item.id}
                className={`${styles.item} 
                    ${selectionMode === 'replace' ? styles.selectableItem : ''} 
                    ${selectedItemId === item.id && selectionMode === 'replace' ? styles.itemSelected : ''} 
                    ${isDisabled ? styles.itemDisabled : ''}`}
                actions={actions}
                onClick={() => {
                    if (isDisabled) return;
                    if (selectionMode === 'replace') {
                        if (selectedItemId === item.id) {
                            onAddItem(null);
                        } else {
                            onAddItem(item);
                        }
                    }
                }}
            >
                {renderItemMata ? renderItemMata(item) : defaultRenderItemMeta(item)}
            </List.Item>
        );
    }, [onAddItem, selectionMode, selectedItemId, styles]);
    // 默认的列表项渲染函数
    const defaultRenderItemMeta = useCallback((item) => {
        return <List.Item.Meta
            avatar={
                <div className={styles.itemAvatar}>
                    <Avatar shape="square" size={64} src={item.imageUrl || item.animationPhoneUrl} />
                    <CaretRightOutlined
                        className={styles.playIcon}
                    />
                </div>
            }
            title={<Text ellipsis={{ tooltip: item.displayName || item.title }}>{item.displayName || item.title || '未命名项目'}</Text>}
            description={
                <div>
                    <div>
                        <Text
                            type="secondary"
                            style={{ fontSize: '12px' }}
                            ellipsis={{ tooltip: item.status }}
                        >
                            {optionsConstants.status.find(status => status.value === item.status)?.name || '-'}
                        </Text>
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: item.functionType || item.type }}>
                            {item.functionType || item.type || '-'}
                        </Text>
                    </div>
                </div>
            }
        />
    }, [renderListItem]);

    return (

        <div className={styles.commonList}>
            <div className={styles.search}>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder={placeholder}
                    className={styles.searchInput}
                    defaultValue={searchValue}
                    onChange={handleSearchChange}
                    allowClear
                />
                {filterSections && filterSections.length > 0 && (
                    <FiltersPopover
                        filterSections={filterSections}
                        activeFilters={selectedFilters}
                        onUpdate={handleFilterUpdate}
                        onReset={handleFilterReset}
                        showBadgeDot={hasActiveFilters}
                        showClearIcon={hasActiveFilters}
                    >
                        <Button icon={<FilterOutlined />}>
                            Filters
                        </Button>
                    </FiltersPopover>
                )}
            </div>
            <div
                id={scrollableId}
                ref={scrollableContainerRef}
                className={styles.scrollContainer}
            >
                <InfiniteScroll
                    dataLength={displayedItems.length}
                    next={loadMoreItems}
                    hasMore={hasMore}
                    loader={
                        <div style={{ textAlign: 'center', padding: '10px' }}>
                            <Spin size="small" /> Loading...
                        </div>
                    }
                    endMessage={
                        !loading && !hasMore && displayedItems.length > 0 ? (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#aaa' }}>
                                No more data available
                            </div>
                        ) : null
                    }
                    scrollableTarget={scrollableId}
                >
                    <Spin spinning={loading}>
                        <List
                            itemLayout="horizontal"
                            dataSource={displayedItems}
                            className="common-list"
                            renderItem={renderListItem}
                        />
                    </Spin>

                </InfiniteScroll>
            </div>
        </div>

    );
};

export default CommonList;