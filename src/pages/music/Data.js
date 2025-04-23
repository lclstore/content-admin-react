// 模拟音乐数据
export const mockMusicData = [
    { id: 1, name: 'Relaxing Melody', status: 'Enabled', audioUrl: 'path/to/audio1.mp3', duration: 180 },
    { id: 2, name: 'Focus Rhythm', status: 'Enabled', audioUrl: 'path/to/audio2.mp3', duration: 240 },
    { id: 3, name: 'Meditation Sound', status: 'Disabled', audioUrl: 'path/to/audio3.mp3', duration: 300 },
    { id: 4, name: 'Energetic Beats', status: 'Draft', audioUrl: 'path/to/audio4.mp3', duration: 150 },
];

// 状态排序优先级
export const statusOrder = {
    'Enabled': 1,
    'Disabled': 2,
    'Draft': 3,
};

// (可选) 定义强制显示和默认显示的列 key
export const MANDATORY_COLUMN_KEYS = ['audio', 'name'];
export const DEFAULT_VISIBLE_TABLE_COLUMN_KEYS = ['audio', 'name', 'status', 'duration', 'actions']; // 添加 actions 列

// (可选) 定义筛选器配置
export const filterSections = [
    {
        title: 'Status',
        key: 'status',
        options: ['Enabled', 'Disabled', 'Draft'],
    },
    // 可以根据需要添加更多筛选条件
];
