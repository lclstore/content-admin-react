import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import CommonEditorForm from '@/components/CommonEditorForm';
import { initialWorkoutData, mockEditorStructureData, mockWorkoutsForList, equipmentOptions } from './Data';

// Helper function for moving array elements
const simpleArrayMove = (array, from, to) => {
    const newArray = array.slice();
    newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
    return newArray;
};

/**
 * 使用通用编辑器的训练编辑页面
 * 展示如何使用CommonEditor实现复杂表单
 */
export default function WorkoutEditorWithCommon() {
    const { workoutId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    // --- 状态管理 ---
    const [initialValues, setInitialValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [structurePanels, setStructurePanels] = useState([]);
    const [contentSearchValue, setContentSearchValue] = useState('');
    const [contentFilters, setContentFilters] = useState({});
    const [filteredContentLibraryData, setFilteredContentLibraryData] = useState(mockEditorStructureData);

    // --- 内容库筛选状态 ---
    const hasActiveContentFilters = Object.values(contentFilters).some(
        filterArray => filterArray && filterArray.length > 0
    );

    // --- 加载Workout数据 ---
    useEffect(() => {
        if (workoutId) {
            setLoading(true);
            // 模拟API调用
            setTimeout(() => {
                const currentId = parseInt(workoutId, 10);
                const workoutToEdit = mockWorkoutsForList.find(w => w.id === currentId);

                if (workoutToEdit) {
                    // 模拟获取完整数据
                    const fullWorkoutData = {
                        ...initialWorkoutData,
                        ...workoutToEdit,
                        structure: mockEditorStructureData, // 使用模拟结构数据
                        videoPreferences: { transition: 'Wipe Left', backgroundMusic: 'Energetic' },
                        musicLinks: [{ platform: 'Spotify', url: 'https://spotify.link/123' }],
                    };

                    // 设置基础表单初始值
                    setInitialValues({
                        workoutName: fullWorkoutData.name,
                        description: fullWorkoutData.description || '',
                        coverImageUrl: fullWorkoutData.coverImageUrl || '',
                        detailImageUrl: fullWorkoutData.detailImageUrl || '',
                        thumbnailImageUrl: fullWorkoutData.thumbnailImageUrl || '',
                        completeImageUrl: fullWorkoutData.completeImageUrl || '',
                        difficulty: fullWorkoutData.difficulty || 'Medium',
                        position: fullWorkoutData.position || '',
                        target: fullWorkoutData.target || [],
                        equipment: fullWorkoutData.equipment || [],
                        PremiumRequired: fullWorkoutData.PremiumRequired || false,
                        introDuration: fullWorkoutData.introDuration || 30,
                        exercisePreviewDuration: fullWorkoutData.exercisePreviewDuration || 5,
                        exerciseDuration: fullWorkoutData.exerciseDuration || 45,
                    });

                    // 将结构数据转换为面板
                    if (fullWorkoutData.structure && Array.isArray(fullWorkoutData.structure)) {
                        const initialPanels = [{
                            id: `panel-initial-${Date.now()}`,
                            round: 1, // 默认轮次
                            items: fullWorkoutData.structure.map(item => ({
                                ...item,
                                id: `struct-item-${item.id || Math.random()}`,
                                executionType: item.executionType || 'duration',
                                duration: item.duration || 30,
                                repetitions: item.repetitions || 10,
                                showPreview: item.showPreview === undefined ? true : item.showPreview,
                            }))
                        }];
                        setStructurePanels(initialPanels);
                    }
                } else {
                    notification.error({
                        message: '找不到训练',
                        description: `ID为${currentId}的训练不存在或已被删除`,
                    });
                    setTimeout(() => navigate('/workouts'), 1500);
                }
                setLoading(false);
            }, 800);
        } else {
            // 新建模式
            setInitialValues({
                workoutName: '',
                description: '',
                coverImageUrl: '',
                detailImageUrl: '',
                thumbnailImageUrl: '',
                completeImageUrl: '',
                difficulty: 'Medium',
                position: '',
                target: [],
                equipment: [],
                PremiumRequired: false,
                introDuration: 30,
                exercisePreviewDuration: 5,
                exerciseDuration: 45,
            });
            setStructurePanels([]); // 空结构
        }
    }, [workoutId, navigate]);

    // --- 内容库搜索和筛选 ---
    useEffect(() => {
        let tempData = [...mockEditorStructureData];

        // 1. 按搜索词筛选
        if (contentSearchValue) {
            const lowerCaseSearch = contentSearchValue.toLowerCase();
            tempData = tempData.filter(item =>
                item.displayName && item.displayName.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // 2. 按选定的筛选器筛选
        Object.keys(contentFilters).forEach(key => {
            const selectedOptions = contentFilters[key];
            if (selectedOptions && selectedOptions.length > 0) {
                if (key === 'target') {
                    // 特殊处理 target（逗号分隔字符串）
                    tempData = tempData.filter(item => {
                        if (!item.target) return false;
                        const itemTargets = item.target.split(',').map(t => t.trim());
                        return selectedOptions.some(filterTarget => itemTargets.includes(filterTarget));
                    });
                } else {
                    // 其他筛选条件
                    tempData = tempData.filter(item => item[key] && selectedOptions.includes(item[key]));
                }
            }
        });

        setFilteredContentLibraryData(tempData);
    }, [contentSearchValue, contentFilters]);

    // --- 内容库搜索处理 ---
    const handleContentSearchChange = useCallback((e) => {
        setContentSearchValue(e.target.value || '');
    }, []);

    // --- 内容库筛选处理 ---
    const handleContentFilterChange = useCallback((newFilters) => {
        setContentFilters(newFilters);
    }, []);

    // --- 从内容库添加项到结构 ---
    const addItemToStructure = useCallback((newItemData) => {
        setStructurePanels(prevPanelsData => {
            const newPanelsData = [...prevPanelsData];
            const itemToAdd = {
                ...newItemData,
                executionType: newItemData.executionType || 'duration',
                duration: newItemData.duration || 30,
                repetitions: newItemData.repetitions || 10,
                showPreview: newItemData.showPreview === undefined ? true : newItemData.showPreview,
                libraryId: newItemData.id,
                id: `struct-item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            };

            if (newPanelsData.length === 0) {
                // 添加第一个面板
                const newPanelId = `struct-panel-${Date.now()}`;
                newPanelsData.push({
                    id: newPanelId,
                    name: '结构',
                    round: 1,
                    items: [itemToAdd]
                });
            } else {
                // 添加到最后一个面板
                const lastPanelIndex = newPanelsData.length - 1;
                newPanelsData[lastPanelIndex].items.push(itemToAdd);
            }

            return newPanelsData;
        });
    }, []);

    // --- 删除结构项 ---
    const deleteStructureItem = useCallback((panelId, itemId) => {
        setStructurePanels(prevPanels => {
            const newPanels = prevPanels.map(panel => {
                if (panel.id === panelId) {
                    const updatedItems = panel.items.filter(item => item.id !== itemId);
                    return { ...panel, items: updatedItems };
                }
                return panel;
            });

            // 过滤掉空面板
            return newPanels.filter(panel => panel && panel.items.length > 0);
        });
    }, []);

    // --- 更改面板轮次 ---
    const handleRoundChange = useCallback((panelId, value) => {
        setStructurePanels(prevPanels => {
            return prevPanels.map(panel => {
                if (panel.id === panelId) {
                    const safeValue = Math.max(1, Math.min(5, parseInt(value, 10) || 1));
                    return { ...panel, round: safeValue };
                }
                return panel;
            });
        });
    }, []);

    // --- 复制结构项 ---
    const handleCopyItem = useCallback((panelId, itemId) => {
        setStructurePanels(prevPanels => {
            const updatedPanels = [...prevPanels];

            // 找到目标面板和项目
            const panelIndex = updatedPanels.findIndex(p => p.id === panelId);
            if (panelIndex === -1) return prevPanels;

            const panel = updatedPanels[panelIndex];
            const itemIndex = panel.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return prevPanels;

            // 创建深拷贝
            const itemToCopy = panel.items[itemIndex];
            const newItem = {
                ...JSON.parse(JSON.stringify(itemToCopy)),
                id: `struct-item-${Date.now()}-${Math.random().toString(16).slice(2)}`
            };

            // 插入到原项目后面
            const updatedItems = [
                ...panel.items.slice(0, itemIndex + 1),
                newItem,
                ...panel.items.slice(itemIndex + 1)
            ];

            updatedPanels[panelIndex] = { ...panel, items: updatedItems };
            return updatedPanels;
        });
    }, []);

    // --- 排序结构项 ---
    const handleSortItemsInPanel = useCallback((panelId, oldIndex, newIndex) => {
        setStructurePanels(prevPanels => {
            const panelIndex = prevPanels.findIndex(panel => panel.id === panelId);
            if (panelIndex === -1 || oldIndex === newIndex) return prevPanels;

            const newPanels = [...prevPanels];
            newPanels[panelIndex] = {
                ...newPanels[panelIndex],
                items: simpleArrayMove(newPanels[panelIndex].items, oldIndex, newIndex)
            };

            return newPanels;
        });
    }, []);

    // --- 更新结构项属性 ---
    const handleItemChange = useCallback((panelId, itemId, field, value) => {
        setStructurePanels(prevPanels => {
            return prevPanels.map(panel => {
                if (panel.id === panelId) {
                    const updatedItems = panel.items.map(item => {
                        if (item.id === itemId) {
                            return { ...item, [field]: value };
                        }
                        return item;
                    });
                    return { ...panel, items: updatedItems };
                }
                return panel;
            });
        });
    }, []);

    // --- 替换结构项 ---
    const replaceStructureItem = useCallback((panelId, itemId, newItemData) => {
        setStructurePanels(prevPanels => {
            return prevPanels.map(panel => {
                if (panel.id === panelId) {
                    const itemIndex = panel.items.findIndex(item => item.id === itemId);
                    if (itemIndex !== -1) {
                        const updatedItems = [
                            ...panel.items.slice(0, itemIndex),
                            newItemData,
                            ...panel.items.slice(itemIndex + 1),
                        ];
                        return { ...panel, items: updatedItems };
                    }
                }
                return panel;
            });
        });
    }, []);

    // --- 添加新结构面板 ---
    const handleAddStructurePanel = useCallback(() => {
        // 检查最后一个面板是否为空
        if (structurePanels.length > 0) {
            const lastPanel = structurePanels[structurePanels.length - 1];
            if (lastPanel.items.length === 0) {
                notification.warning({
                    message: '无法添加新结构',
                    description: '请先向当前最后一个结构添加练习',
                });
                return;
            }
        }

        // 添加新面板
        const newPanelId = `struct-panel-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newPanel = {
            id: newPanelId,
            name: '',
            round: 1,
            items: [],
        };

        setStructurePanels(prev => [...prev, newPanel]);
    }, [structurePanels]);

    // --- 保存Workout数据 ---
    const handleSaveWorkout = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
        console.log('保存训练数据:', values, id);
        console.log('结构面板:', structurePanels);

        // 准备保存数据
        const dataToSave = {
            ...(id ? { id: parseInt(id, 10) } : {}),
            name: values.workoutName,
            description: values.description,
            coverImageUrl: values.coverImageUrl,
            detailImageUrl: values.detailImageUrl,
            thumbnailImageUrl: values.thumbnailImageUrl,
            completeImageUrl: values.completeImageUrl,
            difficulty: values.difficulty,
            position: values.position,
            target: values.target,
            equipment: values.equipment,
            PremiumRequired: values.PremiumRequired,
            introDuration: values.introDuration,
            exercisePreviewDuration: values.exercisePreviewDuration,
            exerciseDuration: values.exerciseDuration,
            // 将面板结构展平为列表
            structure: structurePanels.flatMap(panel => panel.items),
        };

        // 模拟API请求
        setTimeout(() => {
            // TODO: 实际API调用
            messageApi.success('训练保存成功！');
            setLoading(false);
            setDirty(false);

            // 3秒后跳转回列表页
            setTimeout(() => navigate('/workouts'), 1000);
        }, 800);
    };

    // 基础字段配置（简单表单部分）
    const formFields = [
        {
            type: 'input',
            name: 'workoutName',
            label: '训练名称',
            required: true,
            placeholder: 'Enter workout name',
        },
        {
            type: 'textarea',
            name: 'description',
            label: '描述',
            placeholder: 'Enter description',
            props: { rows: 4 }
        },
        {
            type: 'input',
            name: 'thumbnailImageUrl',
            label: '缩略图URL',
            placeholder: 'Enter thumbnail URL',
        },
        {
            type: 'input',
            name: 'coverImageUrl',
            label: '封面图URL',
            placeholder: 'Enter cover image URL',
        },
        {
            type: 'select',
            name: 'difficulty',
            label: '难度',
            options: [
                { label: 'Easy', value: 'Easy' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Hard', value: 'Hard' },
            ],
        },
        {
            type: 'select',
            name: 'equipment',
            label: '器材',
            options: equipmentOptions.map(item => ({
                label: item.label,
                value: item.value
            })),
            props: { mode: 'multiple' }
        },
        {
            type: 'switch',
            name: 'PremiumRequired',
            label: '是否需要会员',
            showStatus: true,
            enableText: 'Required',
            disableText: 'Not Required'
        },
    ];

    // 编辑器配置
    const editorConfig = {
        itemName: '训练',
        editTitle: '编辑',
        addTitle: '新增',
        saveButtonText: '保存训练',
        backButtonText: '返回',
        backUrl: '/workouts',
        confirmUnsavedChanges: true,
        unsavedChangesMessage: '你有未保存的更改，确定要离开吗？',
        saveSuccessMessage: '训练保存成功！',
        validationErrorMessage: '请检查表单填写是否正确',
        containerClassName: 'workouts-editor-container'
    };

    // 复杂表单特有配置
    const complexConfig = {
        structurePanels: structurePanels,
        showContentLibrary: true,
        contentLibraryData: filteredContentLibraryData,
        contentLibraryClassName: "content-library-panel editor-item",
        editorPanelClassName: "workout-editor-panel editor-item",

        // 内容库相关
        contentSearchValue: contentSearchValue,
        onContentSearchChange: handleContentSearchChange,
        contentFilters: contentFilters,
        onContentFilterChange: handleContentFilterChange,
        hasActiveContentFilters: hasActiveContentFilters,

        // 结构面板回调
        onAddItem: addItemToStructure,
        onDeleteItem: deleteStructureItem,
        onRoundChange: handleRoundChange,
        onReplaceItem: replaceStructureItem,
        onSortItems: handleSortItemsInPanel,
        onItemChange: handleItemChange,
        onCopyItem: handleCopyItem,
        onAddStructurePanel: handleAddStructurePanel,

        // 结构面板数据
        includeStructurePanels: true,
        flattenStructurePanels: true,

        // 其他配置
        workoutData: { equipmentOptions }
    };

    return (
        <CommonEditorForm
            formType="complex"
            config={editorConfig}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveWorkout}
            loading={loading}
            complexConfig={complexConfig}
        />
    );
} 