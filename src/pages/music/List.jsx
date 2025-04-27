import React, { useState, useMemo, useEffect } from 'react';
import { Tooltip, message, Dropdown, Button, Modal } from 'antd'; // 添加 Dropdown, Button, Modal
import { EllipsisOutlined, EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'; // 添加图标
import { debounce } from 'lodash';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable'; // 导入可配置表格组件
import { mockMusicData, statusOrder, MANDATORY_COLUMN_KEYS, filterSections } from './Data'; // 从 Data.js 导入
// import './List.css'; // 如果需要自定义样式，可以取消注释

// 将 formatDuration 移到组件外部或 utils 文件中
const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
        return 'N/A';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
};

export default function MusicList() {
    const [dataSource, setDataSource] = useState(mockMusicData); // 数据源状态
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索值状态
    const [selectedFilters, setSelectedFilters] = useState({}); // 筛选器状态
    const [actionClicked, setActionClicked] = useState(false); // 操作区域点击状态
    const [currentRecord, setCurrentRecord] = useState(null); // 当前操作的记录
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // 删除确认模态框可见性
    const [actionInProgress, setActionInProgress] = useState(false); // 操作进行中状态 (用于按钮 loading)

    // --- 操作处理函数 (占位) ---
    const handleEdit = (record) => {
        console.log('Edit:', record);
        // navigate(`/music/editor?id=${record.id}`); // 例如跳转到编辑页
    };

    const handleDuplicate = (record) => {
        console.log('Duplicate:', record);
        // 实际复制逻辑
        message.success(`复制 "${record.name}" 成功 (模拟)`);
    };

    const handleDeleteConfirm = () => {
        if (!currentRecord) return;
        console.log('Delete:', currentRecord);
        setActionInProgress(true); // 开始删除操作
        // 模拟 API 调用
        setTimeout(() => {
            // 从 dataSource 中移除
            setDataSource(current => current.filter(item => item.id !== currentRecord.id));
            message.success(`删除 "${currentRecord.name}" 成功 (模拟)`);
            setIsDeleteModalVisible(false); // 关闭模态框
            setActionInProgress(false); // 结束删除操作
            setCurrentRecord(null); // 清除当前记录
        }, 500);
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalVisible(false);
        setCurrentRecord(null);
    };

    // --- 操作菜单项 ---
    const menuItems = (record) => {
        const items = [];

        const handleMenuClick = (key, record, e) => {
            // 阻止事件冒泡，防止触发行点击事件
            if (e && e.domEvent) {
                e.domEvent.stopPropagation();
            }
            setCurrentRecord(record); // 设置当前操作的记录

            switch (key) {
                case 'edit':
                    handleEdit(record);
                    break;
                case 'duplicate':
                    handleDuplicate(record);
                    break;
                case 'delete':
                    setIsDeleteModalVisible(true); // 显示删除确认模态框
                    break;
                // 可以根据音乐状态添加更多操作
                // case 'enable': handleStatusChange(record, 'Enabled'); break;
                // case 'disable': handleStatusChange(record, 'Disabled'); break;
                default:
                    break;
            }
        };

        // 添加菜单项的辅助函数
        const addItem = (key, label, icon) => {
            items.push({
                key,
                label,
                icon,
                onClick: (e) => {
                    e.domEvent.stopPropagation(); // 点击菜单项时也阻止冒泡
                    handleMenuClick(key, record, e);
                },
            });
        };

        // --- 根据记录状态决定显示哪些操作 ---
        // 示例：所有状态都有编辑、复制、删除操作
        addItem('edit', '编辑', <EditOutlined />);
        addItem('duplicate', '复制', <CopyOutlined />);
        addItem('delete', '删除', <DeleteOutlined />);

        // // 可以根据 record.status 添加条件判断
        // switch (record.status) {
        //     case 'Draft':
        //         addItem('publish', '发布', <CheckOutlined />);
        //         break;
        //     case 'Published':
        //         addItem('unpublish', '下架', <StopOutlined />);
        //         break;
        //     default:
        //         break;
        // }

        return items;
    };


    // --- 操作列渲染 ---
    const actionRender = (text, record) => (
        <div
            onClick={(e) => e.stopPropagation()} // 阻止点击操作区域时触发行点击
            onMouseDown={(e) => e.stopPropagation()} // 进一步阻止事件
        >
            <Dropdown
                menu={{ items: menuItems(record) }} // 使用 menuItems 函数生成菜单
                trigger={['click']} // 点击触发
                onClick={(e) => e.stopPropagation()} // 阻止 Dropdown 自身的点击冒泡
            >
                {/* 点击下拉按钮时也需要阻止冒泡 */}
                <Button
                    type="text"
                    icon={<EllipsisOutlined />}
                    onClick={(e) => e.stopPropagation()}
                />
            </Dropdown>
        </div>
    );

    // --- 列定义 ---
    // 注意：ConfigurableTable 需要所有可能的列定义
    const allColumns = useMemo(() => [
        {
            title: 'Audio', // 音频列
            dataIndex: 'audioUrl',
            key: 'audio',
            render: (url, record) => (
                // 简单的音频播放器示例
                <audio controls src={url} style={{ height: '30px', width: '100px' }} />
            ),
            width: 150,
        },
        {
            title: 'Name', // 名称列
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name), // 按名称字符串排序
            showSorterTooltip: false,
            render: (name) => (
                <Tooltip placement="topLeft" title={name}>
                    <span>{name}</span>
                </Tooltip>
            ),
            ellipsis: { showTitle: false },
        },
        {
            title: 'Status', // 状态列
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status], // 按预定义顺序排序
            showSorterTooltip: false,
            width: 100,
            ellipsis: true,
        },
        {
            title: 'Duration', // 时长列 (假设添加了)
            dataIndex: 'duration',
            key: 'duration',
            render: (duration) => formatDuration(duration), // 使用格式化函数
            sorter: (a, b) => (a.duration || 0) - (b.duration || 0), // 按时长排序
            showSorterTooltip: false,
            width: 100,
        },
        {
            title: 'Actions', // 操作列
            key: 'actions',
            fixed: 'right', // 固定在右侧
            width: 70,       // 列宽度
            align: 'center', // 内容居中
            render: actionRender, // 使用定义的渲染函数
        },
    ], []);

    // --- 数据过滤与搜索逻辑 ---
    const filteredData = useMemo(() => {
        setLoading(true);
        let tempData = [...dataSource];
        try {
            // 1. 文本搜索 (仅搜索名称)
            if (searchValue) {
                const lowerCaseSearch = searchValue.toLowerCase();
                tempData = tempData.filter(item =>
                    item.name && item.name.toLowerCase().includes(lowerCaseSearch)
                );
            }

            // 2. 筛选器过滤 (示例: 状态)
            Object.keys(selectedFilters).forEach(key => {
                const selectedOptions = selectedFilters[key];
                if (selectedOptions && selectedOptions.length > 0) {
                    if (key === 'status') {
                        tempData = tempData.filter(item => item[key] && selectedOptions.includes(item[key]));
                    }
                    // 可以扩展其他筛选字段
                }
            });

        } catch (error) {
            console.error("过滤数据时出错:", error);
            message.error("Error filtering data, please check the console");
        } finally {
            setLoading(false);
        }
        return tempData;
    }, [dataSource, searchValue, selectedFilters]);

    // --- 事件处理 ---

    // 搜索框变化 (防抖)
    const handleSearchChange = debounce((event) => {
        setSearchValue(event.target.value);
    }, 300);

    // 筛选器更新
    const handleFilterUpdate = (newFilters) => {
        setSelectedFilters(newFilters);
    };

    // 筛选器重置
    const handleFilterReset = () => {
        setSelectedFilters({});
    };

    // 行点击事件 (示例)
    const handleRowClick = (record, event) => {
        console.log('Clicked row:', record);
        // navigate(`/music/editor?id=${record.id}`); // 例如跳转到编辑页
    };

    // --- 处理全局点击事件，用于重置 actionClicked 状态 ---
    // 这确保了在点击操作按钮之外的区域后，再次点击行可以触发 onRowClick
    useEffect(() => {
        const handleGlobalClick = () => {
            // 如果 actionClicked 为 true，则在全局点击后将其设为 false
            // 这意味着下一次行点击将不再被阻止
            if (actionClicked) {
                setActionClicked(false);
            }
        };

        document.addEventListener('click', handleGlobalClick);

        // 组件卸载时移除监听器
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [actionClicked]); // 依赖 actionClicked 状态

    return (
        <div className="musicListContainer" style={{ padding: '20px' }}>
            <ConfigurableTable
                uniqueId="musicList" // 表格唯一 ID
                columns={allColumns} // 传入所有列定义
                dataSource={filteredData} // 传入处理后的数据
                rowKey="id" // 行 Key
                loading={loading} // 加载状态
                onRowClick={handleRowClick} // 行点击回调
                actionColumnKey="actions" // !!! 指定操作列的 key，以便 ConfigurableTable 识别 !!!
                mandatoryColumnKeys={MANDATORY_COLUMN_KEYS} // 强制显示的列

                searchConfig={{
                    placeholder: "Search content ID or name...",
                    searchValue: searchValue,
                    onSearchChange: handleSearchChange, // 使用防抖函数
                }}
                filterConfig={{
                    filterSections: filterSections, // 筛选配置
                    activeFilters: selectedFilters, // 当前激活的筛选
                    onUpdate: handleFilterUpdate,
                    onReset: handleFilterReset,
                    // showBadgeDot 和 showClearIcon 会根据 activeFilters 自动判断
                }}
                paginationConfig={{ // 自定义或使用默认分页配置
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}
                // extraToolbarItems={ // 可在工具栏右侧添加额外按钮
                //     <Button type="primary" icon={<PlusOutlined />}>添加音乐</Button>
                // }
                scrollX={true} // 启用横向滚动
                showColumnSettings={false} // 禁用列设置按钮
            // tableProps={{ size: 'small' }} // 可以透传其他 antd Table props
            />
            {/* 删除确认模态框 */}
            <Modal
                title="确认删除"
                open={isDeleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText="删除"
                cancelText="取消"
                okButtonProps={{
                    danger: true, // 红色按钮表示危险操作
                    loading: actionInProgress // 显示加载状态
                }}
                cancelButtonProps={{ disabled: actionInProgress }} // 操作进行中禁用取消按钮
                // 关闭时清空当前记录，防止意外操作
                afterClose={() => setCurrentRecord(null)}
            >
                <p>你确定要删除 "{currentRecord?.name}" 吗？此操作无法撤销。</p>
            </Modal>
        </div>
    );
}
