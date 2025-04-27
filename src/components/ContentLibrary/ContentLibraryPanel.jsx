import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import {
    Input,
    Button,
    List,
    Avatar,
    Typography,
    Badge,
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
import './ContentLibrary.css';

const { Text } = Typography;

const ITEMS_PER_PAGE = 10;

const contentLibraryFilterSections = [
    {
        title: 'Status',
        key: 'status',
        options: ['Draft', 'Enabled', 'Disabled', 'Deprecated'],
    },
    {
        title: 'Function Type',
        key: 'functionType',
        options: ['Main', 'Warm Up', 'Cool Down'],
    },
    {
        title: 'Difficulty',
        key: 'difficulty',
        options: ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
        title: 'Premium',
        key: 'Premium',
        options: ['Standing', 'Lying', 'Seated', 'Prone'],
    },
    {
        title: 'Target',
        key: 'target',
        options: ['Core', 'Arm', 'Butt', 'Leg', 'Thigh', 'Face Muscles', 'Abs', 'Hip', 'Back', 'Shoulder', 'Chest', 'Spine', 'Lower back', 'Total body', 'Upper body', 'Lower body'],
    },

];

/**
 * 内容库面板组件
 * @param {Array} contentLibraryData - 要显示的内容库数据项数组
 * @param {function} onAddItem - 点击添加按钮或选择项目时的回调函数
 * @param {function} onFilterChange - 筛选条件变化时的回调函数
 * @param {function} onSearchChange - 搜索框内容变化时的回调函数
 * @param {string} searchValue - 当前搜索框的值
 * @param {boolean} hasActiveFilters - 是否有激活的筛选器
 * @param {object} activeFilters - 当前激活的筛选器对象
 * @param {string} [selectionMode='add'] - 选择模式 ('add' 或 'replace')，默认为 'add'
 * @param {string} [selectedItemId=null] - 在 'replace' 模式下，当前选中的项目 ID
 */
const ContentLibraryPanel = ({
    contentLibraryData,
    onAddItem,
    onFilterChange,
    onSearchChange,
    searchValue,
    hasActiveFilters,
    activeFilters,
    selectionMode = 'add',
    selectedItemId = null,
}) => {
    const [scrollableId] = useState(() => `contentLibraryScrollableDiv-${Math.random().toString(36).substring(2, 9)}`);
    const [displayedItems, setDisplayedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const scrollableContainerRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        const initialItems = (contentLibraryData || []).slice(0, ITEMS_PER_PAGE);
        setDisplayedItems(initialItems);
        setHasMore((contentLibraryData || []).length > ITEMS_PER_PAGE);
        setLoading(false);
        if (scrollableContainerRef.current) {
            scrollableContainerRef.current.scrollTop = 0;
        }
    }, [contentLibraryData, searchValue, activeFilters]);

    const loadMoreItems = useCallback(() => {
        if (loading || !hasMore) return;

        setLoading(true);
        setTimeout(() => {
            const currentLength = displayedItems.length;
            const nextItems = (contentLibraryData || []).slice(currentLength, currentLength + ITEMS_PER_PAGE);
            setDisplayedItems(prevItems => [...prevItems, ...nextItems]);
            setHasMore((contentLibraryData || []).length > currentLength + nextItems.length);
            setLoading(false);
        }, 300);
    }, [loading, hasMore, displayedItems, contentLibraryData]);

    const handleFilterUpdate = useCallback((newFilters) => {
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    }, [onFilterChange]);

    const handleFilterReset = useCallback(() => {
        const resetFilters = Object.keys(activeFilters || {}).reduce((acc, key) => {
            acc[key] = [];
            return acc;
        }, {});
        if (onFilterChange) {
            onFilterChange(resetFilters);
        }
    }, [onFilterChange, activeFilters]);


    return (
        <div className="content-library-panel">
            <div className="content-library-search">
                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search content display name..."
                    className="content-library-search-input"
                    value={searchValue}
                    onChange={onSearchChange}
                    allowClear
                />
                <FiltersPopover
                    filterSections={contentLibraryFilterSections}
                    onUpdate={handleFilterUpdate}
                    onReset={handleFilterReset}
                    activeFilters={activeFilters}
                    showBadgeDot={hasActiveFilters}
                    showClearIcon={hasActiveFilters}
                >
                    <Button icon={<FilterOutlined />}>
                        Filters
                    </Button>
                </FiltersPopover>
            </div>
            <div
                id={scrollableId}
                ref={scrollableContainerRef}
                className="content-library-scroll-container"
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
                                No more items
                            </div>
                        ) : null
                    }
                    scrollableTarget={scrollableId}
                >
                    <List

                        itemLayout="horizontal"
                        dataSource={displayedItems}
                        className="content-library-list"
                        renderItem={(item) => {
                            let actions = [];
                            const isDisabled = selectionMode === 'replace' && item.status !== 'Enabled';

                            if (selectionMode === 'add') {
                                if (item.status === 'Enabled') {
                                    actions.push(
                                        <Button
                                            key={`add-${item.id}`}
                                            type="text"
                                            shape="circle"
                                            icon={<PlusOutlined style={{ color: 'var(--active-color)', fontSize: '16px' }} />}
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
                                    className={`content-library-item ${selectionMode === 'replace' ? 'selectable-item' : ''} ${selectedItemId === item.id && selectionMode === 'replace' ? 'item-selected' : ''} ${isDisabled ? 'item-disabled' : ''}`}
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
                                    <List.Item.Meta
                                        avatar={
                                            <div className="content-library-item-avatar">
                                                <Avatar shape="square" size={64} src={item.animationPhoneUrl} />
                                                <CaretRightOutlined
                                                    className="content-library-item-play-icon"
                                                />
                                            </div>
                                        }
                                        title={<Text ellipsis={{ tooltip: item.displayName }}>{item.displayName}</Text>}
                                        description={
                                            <div>
                                                <div>
                                                    <Text
                                                        type="secondary"
                                                        style={{ fontSize: '12px' }}
                                                        ellipsis={{ tooltip: item.status }}
                                                    >
                                                        {item.status}
                                                    </Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: item.functionType }}>
                                                        {item.functionType}
                                                    </Text>
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                    {loading && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.5)', display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
                            <Spin />
                        </div>
                    )}
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default ContentLibraryPanel; 