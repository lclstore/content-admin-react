import React, { useContext, useEffect, useState } from 'react';
import { Table, Input, Button, Avatar, Image, Spin, Popover, Space, Tag, Badge } from 'antd'; // 引入 Tag 和 Badge
import { SearchOutlined, PlusOutlined, FileImageOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils'; //  formatDate 工具函数可用
import { debounce } from 'lodash'; // 引入 debounce

// 模拟 Workout 数据 (更新状态以包含 Draft, Enabled, Disabled, Deprecated)
const mockWorkouts = [
    {
        id: 1,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'Morning Run',
        status: 'Enabled', // 更新状态
        difficulty: 'Medium',
        equipment: 'Running Shoes',
        position: 1,
        target: 'Cardio',
        newStartTime: '2024-07-26 06:00:00',
        newEndTime: '2024-07-26 07:00:00',
    },
    {
        id: 2,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'Weight Lifting',
        status: 'Disabled', // 更新状态
        difficulty: 'Hard',
        equipment: 'Dumbbells, Barbell',
        position: 3,
        target: 'Strength',
        newStartTime: '2024-07-27 18:00:00',
        newEndTime: '2024-07-27 19:30:00',
    },
    {
        id: 3,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'Yoga Session',
        status: 'Enabled', // 更新状态
        difficulty: 'Easy',
        equipment: 'Yoga Mat',
        position: 2,
        target: 'Flexibility',
        newStartTime: '2024-07-28 08:00:00',
        newEndTime: '2024-07-28 09:00:00',
    },
    {
        id: 4,
        image: null,
        name: 'Cycling',
        status: 'Draft', // 更新状态
        difficulty: 'Medium',
        equipment: 'Bicycle, Helmet',
        position: 5,
        target: 'Cardio, Endurance',
        newStartTime: '2024-07-29 17:00:00',
        newEndTime: '2024-07-29 18:30:00',
    },
    {
        id: 5,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'HIIT Workout',
        status: 'Deprecated', // 更新状态
        difficulty: 'Hard',
        equipment: 'None',
        position: 4,
        target: 'Fat Loss, Fitness',
        newStartTime: '2024-07-30 12:00:00',
        newEndTime: '2024-07-30 12:30:00',
    },
];

// 定义状态排序逻辑 (可以根据需要调整顺序)
const statusOrder = { 'Enabled': 1, 'Draft': 2, 'Disabled': 3, 'Deprecated': 4 };
// 定义难度排序逻辑 (例如: Easy < Medium < Hard)
const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };


export default function WorkoutsList() {
    // 获取header上下文中的保存按钮状态设置函数
    const { setSaveButtonState } = useContext(HeaderContext);
    const navigate = useNavigate(); // 获取 navigate 函数
    // 表格数据状态
    const [dataSource, setDataSource] = useState(mockWorkouts);
    // loading 状态
    const [loading, setLoading] = useState(false);
    // 搜索输入框的值
    const [searchValue, setSearchValue] = useState('');
    // 状态过滤器的值
    const [selectedStatus, setSelectedStatus] = useState([]); // 改为数组，存储最终确认的状态
    const [tempSelectedStatus, setTempSelectedStatus] = useState([]); // 改为数组，存储 Popover 中临时选择的状态
    const [isFilterPopoverVisible, setIsFilterPopoverVisible] = useState(false); // 控制 Popover 显示

    // 设置保存按钮状态
    useEffect(() => {
        setSaveButtonState({ showSaveButton: false });
    }, [setSaveButtonState]);

    // 防抖的搜索和过滤函数
    const debouncedSearch = debounce((searchText, statuses) => {
        setLoading(true);
        setTimeout(() => {
            let filteredData = mockWorkouts;

            // 应用状态过滤器 (多选)
            if (statuses && statuses.length > 0) {
                filteredData = filteredData.filter(workout => statuses.includes(workout.status));
            }

            // 应用文本搜索过滤器
            if (searchText) {
                const lowerCaseSearch = searchText.toLowerCase();
                filteredData = filteredData.filter(workout =>
                    (workout.name && workout.name.toLowerCase().includes(lowerCaseSearch)) ||
                    (workout.equipment && workout.equipment.toLowerCase().includes(lowerCaseSearch)) ||
                    (workout.target && workout.target.toLowerCase().includes(lowerCaseSearch))
                );
            }
            setDataSource(filteredData);
            setLoading(false);
        }, 500);
    }, 300);

    // 处理搜索框内容变化
    const handleSearchInputChange = (e) => {
        const { value } = e.target;
        setSearchValue(value);
        debouncedSearch(value, selectedStatus); // 使用最终确认的状态数组进行搜索
    };

    // 处理 Popover 可见性变化
    const handlePopoverOpenChange = (open) => {
        if (open) {
            // Popover 打开时，同步当前应用的 filter
            setTempSelectedStatus([...selectedStatus]); // 使用浅拷贝避免直接修改
        }
        setIsFilterPopoverVisible(open);
    };

    // 处理 Popover 内按钮点击 (多选逻辑)
    const handleTempStatusChange = (statusValue) => {
        if (statusValue === null) { // 点击 'All'
            setTempSelectedStatus([]);
        } else {
            const currentIndex = tempSelectedStatus.indexOf(statusValue);
            const newSelected = [...tempSelectedStatus];

            if (currentIndex === -1) {
                newSelected.push(statusValue); // 添加状态
            } else {
                newSelected.splice(currentIndex, 1); // 移除状态
            }
            setTempSelectedStatus(newSelected);
        }
    };

    // Popover Filter 重置
    const handleFilterReset = () => {
        setTempSelectedStatus([]); // 清空临时选择
        setSelectedStatus([]);     // 清空最终选择并应用
        debouncedSearch(searchValue, []); // 触发搜索
        setIsFilterPopoverVisible(false);
    };

    // Popover Filter 应用
    const handleFilterApply = () => {
        setSelectedStatus([...tempSelectedStatus]); // 更新最终状态 (浅拷贝)
        debouncedSearch(searchValue, tempSelectedStatus);
        setIsFilterPopoverVisible(false);
    };

    // 处理行点击事件
    const handleRowClick = (record) => {
        console.log('Row clicked:', record);
        navigate(`/workouts-editor?id=${record.id}`); // 跳转到编辑页面并传递 ID
    };

    // 表格列配置
    const columns = [
        {
            title: 'Image', // 图片列
            dataIndex: 'image',
            key: 'image',
            render: (image, record) => (
                image && <Image
                    src={image}
                    alt={`${record.name}'s image`}
                    className="tabImg"
                />
            ),
            width: 150, // 限制图片列宽度
        },
        {
            title: 'Name', // 名称列
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Status', // 状态列
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status], // 使用新的排序逻辑
            showSorterTooltip: false,
        },
        {
            title: 'Difficulty', // 难度列
            dataIndex: 'difficulty',
            key: 'difficulty',
            sorter: (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty], // 自定义排序
            showSorterTooltip: false,
        },
        {
            title: 'Equipment', // 设备列
            dataIndex: 'equipment',
            key: 'equipment',
        },
        {
            title: 'Position', // 位置列
            dataIndex: 'position',
            key: 'position',
            sorter: (a, b) => a.position - b.position, // 数字排序
            showSorterTooltip: false,
        },
        {
            title: 'Target', // 目标列
            dataIndex: 'target',
            key: 'target',
        },
        {
            title: 'Start Time', // 新开始时间列
            dataIndex: 'newStartTime',
            key: 'newStartTime',
            sorter: (a, b) => new Date(a.newStartTime) - new Date(b.newStartTime), // 时间排序
            showSorterTooltip: false,
            render: (time) => formatDate(time, 'YYYY-MM-DD HH:mm'), // 格式化时间，秒可能不需要
        },
        {
            title: 'End Time', // 新结束时间列
            dataIndex: 'newEndTime',
            key: 'newEndTime',
            sorter: (a, b) => new Date(a.newEndTime) - new Date(b.newEndTime), // 时间排序
            showSorterTooltip: false,
            render: (time) => formatDate(time, 'YYYY-MM-DD HH:mm'), // 格式化时间
        },
        // 可以添加操作列，例如编辑、删除等
        // {
        //   title: 'Action',
        //   key: 'action',
        //   render: (_, record) => (
        //     <Space size="middle">
        //       <a>Edit</a>
        //       <a>Delete</a>
        //     </Space>
        //   ),
        // },
    ];

    // 定义状态选项
    const statusOptions = ['Draft', 'Enabled', 'Disabled', 'Deprecated'];

    // Popover 的内容组件
    const filterContent = (
        <div className='filterContent' style={{ width: 280 }}>
            <Space wrap style={{ marginBottom: 16 }}>
                {statusOptions.map(status => (
                    <div
                        onClick={() => handleTempStatusChange(status)}
                        key={status}
                        className={`filterButtonItem ${tempSelectedStatus.includes(status) ? 'active' : ''}`}
                    >
                        {status}
                    </div>
                ))}
            </Space>

            <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                <Space>
                    <Button onClick={handleFilterReset}>Reset</Button>
                    <Button type="primary" onClick={handleFilterApply}>update</Button>
                </Space>
            </div>
        </div>
    );

    return (
        <div className="workoutsContainer">
            {/* 添加自定义样式增大 Badge 的点 */}
            <style>{`
                .larger-badge-dot .ant-badge-dot {
                    width: 10px;  /* 设置点的宽度 */
                    height: 10px; /* 设置点的高度 */
                    box-shadow: 0 0 0 1px #fff; /* 可选：保持 Ant Design 的白色边框 */
                }
            `}</style>
            {/* 顶部搜索栏 */}
            <div className="searchBar"> {/* 可以复用 UsersList 的样式或自定义 */}
                <Input
                    placeholder="Search content ID or name..." // 更新 placeholder
                    value={searchValue}
                    onChange={handleSearchInputChange}
                    className="searchInput" // 保持类名一致性
                    suffix={loading ? <Spin size="small" /> : null}
                    allowClear // 允许清除输入
                    style={{ marginRight: 8 }} // 添加右边距
                />
                {/* Filters Popover */}
                <Popover
                    content={filterContent}
                    trigger="click"
                    open={isFilterPopoverVisible}
                    onOpenChange={handlePopoverOpenChange}
                    placement="bottomRight" // 控制弹出位置
                >
                    {/* 将 Badge 包裹 Button，并使用 dot 属性 */}
                    <Badge dot={selectedStatus.length > 0} offset={[-10, 5]} className="larger-badge-dot"> {/* 使用 offset 微调位置, 添加自定义类名 */}
                        <Button>
                            Filters
                            <FilterOutlined />
                        </Button>
                    </Badge>
                </Popover>
                {/* 添加 Workout 按钮 */}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/workouts-editor')} // 添加 onClick 跳转
                >
                    Add Workout
                </Button>
            </div>

            {/* Workout 列表表格 */}
            <Table
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                loading={loading} // 将表格的 loading 状态与组件的 loading 状态绑定
                onRow={(record) => ({
                    onClick: (event) => {
                        // 可选：检查是否点击了操作按钮/链接等，如果是则阻止跳转
                        // const targetNode = event.target;
                        // if (targetNode.closest('.action-button-class')) {
                        //     return;
                        // }
                        handleRowClick(record);
                    },
                    style: { cursor: 'pointer' }, // 添加手型光标
                })}
                pagination={{
                    total: dataSource.length,
                    pageSize: 10, // 每页显示条数
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`, // 显示总数和当前范围
                    showSizeChanger: true, // 允许用户改变每页大小
                    pageSizeOptions: ['10', '20', '50'], // 可选的每页大小
                }}
                scroll={{ x: 1200 }} // 如果列数较多，建议添加水平滚动
            />
        </div>
    );
}   