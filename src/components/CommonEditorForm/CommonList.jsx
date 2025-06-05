import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useStore } from "@/store/index.js";
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
    CaretRightOutlined,
    LoadingOutlined,
    PauseOutlined
} from '@ant-design/icons';
import FiltersPopover from '@/components/FiltersPopover/FiltersPopover';
import { optionsConstants } from '@/constants/options';
import { getFileCategoryFromUrl } from '@/utils';
import noDataImg from '@/assets/images/no-data.png';
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

// 获取状态对应的颜色
const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT':
            return '#889e9e';
        case 'ENABLED':
            return '#52c41a';
        case 'DISABLED':
            return '#ff4d4f';
        default:
            return '#889e9e';
    }
};

/**
 * 处理可能为数组的字段展示
 * @param {string|array} value - 需要处理的值
 * @param {string} type - 字段类型
 * @returns {array} - 返回处理后的数组
 */
const handleArrayDisplay = (value, type) => {
    if (!value) return [];
    const optionsBase = useStore.getState().optionsBase;
    const valueArray = Array.isArray(value) ? value : [value];

    // 如果是injuredCodes，需要从optionsConstants.BizExerciseInjuredEnums中匹配displayName
    if (type === 'injuredCodes') {
        return valueArray.map(code => {
            const matchedItem = optionsBase["BizExerciseInjuredEnums"].find(item => item.value === code);
            return matchedItem ? matchedItem.displayName : code;
        });
    }

    return valueArray;
};


// 添加全局音频管理
const audioManager = {
    currentAudio: null,
    currentCallback: null,
    stopCurrent: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
            if (this.currentCallback) {
                this.currentCallback(false);
            }
        }
    },
    setCurrentAudio: function (audio, callback) {
        this.stopCurrent();
        this.currentAudio = audio;
        this.currentCallback = callback;
    }
};

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
 * @param {string} title - 列表标题
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
        pageIndex: 1,
        pageSize: 10,
    },
    title
}) => {
    const [scrollableId] = useState(() => `commonListScrollableDiv-${Math.random().toString(36).substring(2, 9)}`);
    const [keyword, setKeyword] = useState(searchValue);
    // 使用防抖hook，延迟500ms
    const debouncedKeyword = useDebounce(keyword, 500);
    const [selectedFilters, setSelectedFilters] = useState({ ...activeFilters }); // 筛选条件
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const scrollableContainerRef = useRef(null);
    const [internalListData, setInternalListData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // 添加当前页码状态
    const [currentPlayingItem, setCurrentPlayingItem] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

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
    const fetchData = async (filters, page = 1) => {
        setLoading(true);
        try {
            // 优先使用传入的filters，如果没有则使用组件内部的selectedFilters
            const params = {
                ...defaultQueryParams,
                ...(filters || selectedFilters),
                keywords: debouncedKeyword,
                pageIndex: page,  // 添加页码参数
                pageSize: defaultQueryParams.pageSize
            };

            const { success, data, totalCount } = await initCommonListData(params);

            if (success) {
                let newData = []
                if (params.pageIndex === 1) {
                    newData = data || [];
                    // 如果是第一页，直接设置数据
                    setInternalListData(newData);
                    // 将滚动位置重置到顶部
                    if (scrollableContainerRef.current) {
                        scrollableContainerRef.current.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                } else {
                    // 如果不是第一页，追加数据到现有数据后面
                    newData = [...internalListData, ...(data || [])];
                    setInternalListData(newData); // 更新内部数据
                }
                console.log('totalCount', newData.length < totalCount);
                // 根据当前显示的数据长度和总数来判断是否还有更多数据
                setHasMore(newData.length < totalCount);
            }
        } catch (error) {
            console.error('获取列表数据失败:', error);
            if (page === 1) {
                setInternalListData([]);
            }
        } finally {
            setLoading(false);
        }
    };



    // 监听防抖后的关键词和筛选条件变化,请求数据
    useEffect(() => {
        setCurrentPage(1); // 重置页码
        fetchData(selectedFilters, 1);
    }, [selectedFilters, debouncedKeyword]);

    // 修改加载更多数据的方法
    const loadMoreItems = useCallback(() => {
        if (loading || !hasMore) return;

        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchData(selectedFilters, nextPage);
    }, [loading, hasMore, currentPage, selectedFilters]);
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

    // 处理音频播放结束
    const handleAudioEnded = useCallback(() => {
        setIsPlaying(false);
        audioManager.currentAudio = null;
        audioManager.currentCallback = null;
    }, []);

    // 播放新音频的辅助函数
    const playNewAudio = useCallback((item) => {
        // 清理当前音频
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeEventListener('ended', handleAudioEnded);
        }

        // 创建新的音频实例
        const audio = new Audio(item.audioUrl);

        // 设置事件监听器
        audio.addEventListener('ended', handleAudioEnded);

        audioRef.current = audio;

        // 停止其他正在播放的音频
        audioManager.stopCurrent();

        // 设置当前音频为活动音频
        audioManager.setCurrentAudio(audio, (playing) => {
            if (!playing) {
                setIsPlaying(false);
            }
        });

        // 开始播放
        setIsPlaying(true);
        audio.play().catch(error => {
            console.error('播放失败:', error);
            setIsPlaying(false);
        });
    }, [handleAudioEnded]);

    // 处理音频播放/暂停
    const handleAudioToggle = useCallback((item) => {
        if (!item || !item.audioUrl) {
            // 如果点击了一个无效的项目，并且当前有音频在播放，则停止当前音频
            if (isPlaying) {
                audioManager.stopCurrent(); // 这会暂停音频并通过回调将 isPlaying 设置为 false
                setCurrentPlayingItem(null); // 清除当前播放项目
            }
            return;
        }

        // 如果点击的是当前正在播放的音频项目
        if (currentPlayingItem?.id === item.id && isPlaying) {
            audioManager.stopCurrent(); // 暂停当前音频，isPlaying 将通过回调变为 false
            // currentPlayingItem 保持不变，但由于 isPlaying 变为 false，图标会更新
        } else {
            // 否则 (点击了不同的项目，或当前项目未在播放，或没有项目在播放)
            // 播放点击的项目。playNewAudio 会处理停止其他任何音频。
            playNewAudio(item); // playNewAudio 会将 isPlaying 设置为 true
            setCurrentPlayingItem(item); // 设置当前激活的音频项目
        }
    }, [isPlaying, currentPlayingItem, playNewAudio, setCurrentPlayingItem, audioManager]);

    // 修改点击事件处理
    const handleAudioClick = useCallback((e, item) => {
        handleAudioToggle(item);
    }, [handleAudioToggle]);

    // 清理音频资源
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('ended', handleAudioEnded);
                audioRef.current.pause();
                if (audioManager.currentAudio === audioRef.current) {
                    audioManager.currentAudio = null;
                    audioManager.currentCallback = null;
                }
                audioRef.current = null;
            }
            setCurrentPlayingItem(null);
            setIsPlaying(false);
        };
    }, [handleAudioEnded]);

    // 修改默认的列表项渲染函数中的音频预览部分
    const defaultRenderItemMeta = useCallback((item) => {
        return <List.Item.Meta style={{ alignItems: 'center' }}
            avatar={
                getFileCategoryFromUrl(item.coverImage || item.audioUrl || item.animationPhoneUrl) === 'audio' ?
                    <div className={styles.audioPreview}>
                        <div
                            className={styles.audioPreview_box}
                            onClick={(e) => handleAudioClick(e, item)}
                        >
                            {(currentPlayingItem?.id === item.id && isPlaying) ? (
                                <PauseOutlined style={{ fontSize: '20px' }} />
                            ) : (
                                <CaretRightOutlined style={{ fontSize: '20px' }} />
                            )}
                        </div>
                    </div>
                    :
                    <div className={styles.itemAvatar}>
                        <Avatar shape="square" size={64} src={item.coverImage || item.imageUrl || item.animationPhoneUrl} />
                        <CaretRightOutlined
                            className={styles.playIcon}
                        />
                    </div>
            }
            title={<Text ellipsis={{ tooltip: item.displayName || item.title }}>{item.name || item.displayName || item.title}</Text>}
            description={
                <div>
                    <div>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: '12px',
                                color: getStatusColor(item.status)
                            }}
                            ellipsis={{ tooltip: item.status }}
                        >
                            {optionsConstants.statusList.find(status => status.value === item.status)?.label}
                        </Text>
                    </div>
                    {
                        (item.functionType || item.type || item.injuredCodes) && <div>
                            {handleArrayDisplay(
                                item.injuredCodes || item.functionType || item.type,
                                item.injuredCodes ? 'injuredCodes' : 'other'
                            ).map((value, index, array) => (
                                <Text
                                    key={index}
                                    type="secondary"
                                    style={{
                                        fontSize: '12px',
                                        marginRight: index !== array.length - 1 ? '8px' : '0',
                                        display: 'inline-block'
                                    }}
                                    ellipsis={{ tooltip: value }}
                                >
                                    {value}
                                </Text>
                            ))}
                        </div>
                    }
                </div>
            }
        />
    }, [currentPlayingItem, isPlaying, handleAudioClick, styles]);

    // 列表项渲染函数
    const renderListItem = useCallback((item) => {
        if (!item || !item.id) return null;

        let actions = [];
        const isDisabled = selectionMode === 'replace' && item.status !== 'ENABLED';
        if (selectionMode === 'add') {
            if (item.status === 'ENABLED') {
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
    }, [onAddItem, selectionMode, selectedItemId, styles, defaultRenderItemMeta]);

    return (

        <div className={styles.commonList}>
            <div className={styles.search}>
                <div className={styles.titleContainer}  >
                    <div className={styles.title}>{title}</div>
                </div>
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
                    dataLength={internalListData.length}
                    next={loadMoreItems}
                    hasMore={hasMore}
                    loader={
                        currentPage > 1 && (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <LoadingOutlined style={{ fontSize: '16px' }} />
                                loading more...
                            </div>
                        )
                    }
                    endMessage={
                        !hasMore && internalListData.length > 0 && (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                                no more data
                            </div>
                        )
                    }
                    scrollableTarget={scrollableId}
                >
                    <Spin spinning={loading} tip="Loading...">
                        <List
                            itemLayout="horizontal"
                            dataSource={internalListData}
                            className="common-list"
                            renderItem={renderListItem}
                            locale={{
                                emptyText: (
                                    <div className={styles.customEmptyWrapper}>
                                        <div className={styles.customEmptyImageWrapper}>
                                            <img src={noDataImg} alt="No Data" className={styles.customEmptyImage} />
                                        </div>
                                        <div className={styles.customEmptyTitle}>{
                                            `You don't have any ${title} yet`
                                        } </div>
                                    </div>
                                )
                            }}
                        />
                    </Spin>

                </InfiniteScroll>
            </div>
        </div>

    );
};

export default CommonList;