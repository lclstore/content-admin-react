import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
    Form,
    Spin,
    Collapse,
    List,
    Avatar,
    Divider,
    Tabs,
    Space,
    notification
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { initialWorkoutData, mockEditorStructureData, mockWorkoutsForList, equipmentOptions } from './Data';
import ContentLibraryPanel from '@/components/ContentLibrary/ContentLibraryPanel';
import EditorFormPanel from '@/components/EditorFormPanel/EditorFormPanel';
import './Editor.css';

// 格式化时长（秒 -> MM:SS）
const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
        return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper function for moving array elements
const simpleArrayMove = (array, from, to) => {
    const newArray = array.slice();
    newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
    return newArray;
};

export default function WorkoutsEditor() {
    const { setSaveButtonState, setCustomPageTitle } = useContext(HeaderContext);
    const location = useLocation();
    const navigate = useNavigate();
    const { workoutId } = useParams();
    const searchParams = new URLSearchParams(location.search);
    const [form] = Form.useForm();
    const [workoutData, setWorkoutData] = useState(initialWorkoutData);
    const [structurePanels, setStructurePanels] = useState([]);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);

    // --- 内容库状态 ---
    const [fullContentLibraryData] = useState(mockEditorStructureData);
    const [contentSearchValue, setContentSearchValue] = useState('');
    const [contentFilters, setContentFilters] = useState({});

    // --- EditorFormPanel 内 Structure Item 展开状态 ---
    const [expandedItems, setExpandedItems] = useState({});

    // --- EditorFormPanel Collapse 展开状态 (提升到父级) ---
    const initialActiveKey = useMemo(() => {
        // 如果有 structure panel，则默认展开第一个 panel 的 key
        if (structurePanels.length > 0 && structurePanels[0]?.id) {
            return [`structure-${structurePanels[0].id}`];
        }
        // 否则默认展开基础设置 '1'
        return ['1'];
    },
        [structurePanels] // 依赖 structurePanels 数组本身，而不是仅长度
    );
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(initialActiveKey);

    // 当 structurePanels 首次从 0 变为 > 0 时，更新 activeKey
    useEffect(() => {
        // 检查是否从无到有，并且当前激活的是 '1'
        if (structurePanels.length > 0 && structurePanels[0]?.id && activeCollapseKeys.length === 1 && activeCollapseKeys[0] === '1') {
            // 设置为第一个 structure panel 的 key
            setActiveCollapseKeys([`structure-${structurePanels[0].id}`]);
        }
        // 注意：这里可能需要更复杂的逻辑来处理编辑现有 workout 时的情况
        // 如果加载 workout 时 structurePanels 已经有内容，initialActiveKey 会处理
    }, [structurePanels, activeCollapseKeys]); // 依赖 structurePanels 和 activeCollapseKeys

    // 处理 Collapse 切换
    const handleCollapseChange = (keys) => {
        // setActiveCollapseKeys(keys); // <-- 旧的逻辑

        // --- 新逻辑：实现全局手风琴效果 ---
        console.log('[Editor] handleCollapseChange received keys:', keys); // 调试日志
        if (!keys || keys.length === 0) {
            // 如果 keys 为空或 null/undefined，则关闭所有面板
            setActiveCollapseKeys([]);
            console.log('[Editor] Setting active keys to: []'); // 调试日志
        } else {
            // 如果 keys 不为空，只保留最后一个 key（用户刚刚点击的那个）
            const latestKey = keys[keys.length - 1];
            setActiveCollapseKeys([latestKey]);
            console.log('[Editor] Setting active keys to:', [latestKey]); // 调试日志
        }
        // --- 新逻辑结束 ---
    };

    // 处理 EditorFormPanel 内展开/折叠项
    const handleToggleExpandItem = useCallback((panelId, itemId) => {
        setExpandedItems(prev => {
            const isCurrentlyExpanded = prev[panelId] === itemId;
            return isCurrentlyExpanded ? {} : { [panelId]: itemId };
        });
    }, []);

    // 过滤后的内容库数据
    const [filteredContentLibraryData, setFilteredContentLibraryData] = useState(mockEditorStructureData);

    // 保存 Workout
    const handleSaveChanges = useCallback(() => {
        form.submit();
    }, [form]);

    // 返回按钮
    const handleBackClick = useCallback(() => {
        if (isFormDirty) {
            if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                navigate(-1);
            }
        } else {
            navigate(-1);
        }
    }, [isFormDirty, navigate]);

    // 计算内容库筛选器是否激活
    const hasActiveContentFilters = useMemo(() => {
        return Object.values(contentFilters).some(filterArray => filterArray && filterArray.length > 0);
    }, [contentFilters]);

    // 内容库筛选与搜索逻辑
    useEffect(() => {
        let tempData = [...fullContentLibraryData];

        // 1. 按搜索词筛选 (displayName)
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
                    // 其他筛选条件直接比较值
                    tempData = tempData.filter(item => item[key] && selectedOptions.includes(item[key]));
                }
            }
        });

        setFilteredContentLibraryData(tempData);
    }, [contentSearchValue, contentFilters, fullContentLibraryData]);

    // 内容库搜索框变化处理
    const handleContentSearchChange = useCallback((e) => {
        setContentSearchValue(e.target.value || '');
    }, []);

    // 内容库筛选器更新处理
    const handleContentFilterChange = useCallback((newFilters) => {
        setContentFilters(newFilters);
    }, []);

    // 编辑或新建 Workout 初始化逻辑
    useEffect(() => {
        const currentId = workoutId ? parseInt(workoutId, 10) : null;
        if (currentId !== null) {
            // 编辑模式：加载现有数据
            setPageLoading(true);
            console.log('编辑 Workout，ID:', currentId);
            // TODO: 替换为实际的 API 调用
            setTimeout(() => {
                const workoutToEdit = mockWorkoutsForList.find(w => w.id === currentId);
                if (workoutToEdit) {
                    // 模拟获取完整数据（实际应包含 structure, videoPreferences 等）
                    const fullWorkoutData = {
                        ...initialWorkoutData,
                        ...workoutToEdit,
                        structure: mockEditorStructureData, // 使用模拟结构数据
                        videoPreferences: { transition: 'Wipe Left', backgroundMusic: 'Energetic' },
                        musicLinks: [{ platform: 'Spotify', url: 'https://spotify.link/123' }],
                    };
                    setWorkoutData(fullWorkoutData);
                    // TODO: 将加载的 workout 结构转换为面板结构
                    // 暂时保持为空，或者根据 fullWorkoutData.structure 进行转换
                    // setStructurePanels([]); // 初始化或根据加载数据设置
                    // --- 示例：将加载的 flat structure 转换为带默认 name/round 的 panel 结构 ---
                    if (fullWorkoutData.structure && Array.isArray(fullWorkoutData.structure)) {
                        const initialPanels = [{
                            id: `panel-initial-${Date.now()}`,
                            round: 1, // 默认轮次
                            items: fullWorkoutData.structure.map(item => ({ // Add default item properties if missing
                                ...item,
                                id: `struct-item-${item.id || Math.random()}`,
                                executionType: item.executionType || 'duration', // Default execution type
                                duration: item.duration || 30, // Ensure duration exists (default 30s)
                                repetitions: item.repetitions || 10, // Default repetitions
                                showPreview: item.showPreview === undefined ? true : item.showPreview, // Default showPreview
                            }))
                        }];
                        setStructurePanels(initialPanels);
                    } else {
                        setStructurePanels([]);
                    }
                    // --- 结束示例转换 ---
                    form.setFieldsValue({
                        workoutName: fullWorkoutData.name,
                        // ... 其他表单字段
                    });
                    setIsFormDirty(false);
                } else {
                    console.error("未找到 Workout，ID:", currentId);
                    setTimeout(() => navigate('/workouts'), 1500);
                }
                setPageLoading(false);
            }, 500);
        } else {
            // 新建模式：设置初始数据
            setWorkoutData(initialWorkoutData);
            setStructurePanels([]); // 结构初始为空面板数组
            form.resetFields();
            setIsFormDirty(false);
            setActiveCollapseKeys(['1']); // 新建时默认展开第一个面板
        }
    }, [workoutId, form, navigate]);

    // 设置页面头部按钮和标题
    useEffect(() => {
        const title = workoutId ? `编辑 Workout: ${form.getFieldValue('workoutName') || '加载中...'}` : '添加 Workout';
        setCustomPageTitle(title);
        setSaveButtonState({
            showSaveButton: true,
            saveButtonText: 'Save',
            saveButtonLoading: saveLoading,
            saveButtonDisabled: pageLoading,
            onSaveButtonClick: handleSaveChanges,
            saveButtonIcon: SaveOutlined,
            showBackButton: true,
            onBackButtonClick: handleBackClick,
            backButtonIcon: ArrowLeftOutlined,
        });
        // 清理函数：组件卸载时移除按钮和标题
        return () => {
            setSaveButtonState({ showSaveButton: false, showBackButton: false });
            setCustomPageTitle(null);
        };
    }, [workoutId, form, saveLoading, pageLoading, setSaveButtonState, setCustomPageTitle, handleSaveChanges, handleBackClick]); // 更新依赖项

    // 表单变化处理
    const handleFormChange = () => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }
        const newName = form.getFieldValue('workoutName');
        // 动态更新页面标题中的 Workout 名称
        setCustomPageTitle(workoutId ? `编辑 Workout: ${newName || ''}` : '添加 Workout');
    };

    // Structure 结构变化处理
    const handleStructureChange = (newPanels) => {
        setStructurePanels(newPanels);
        if (!isFormDirty) {
            setIsFormDirty(true);
        }
    };

    // 从内容库添加项到 Structure
    const addItemToStructure = (newItemData) => {
        let updated = false; // 标记状态是否真的更新了
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

            let panelIdToExpand = null; // 记录需要展开的面板 ID

            if (newPanelsData.length === 0) {
                // 情况1: 添加第一个面板
                const newPanelId = `struct-panel-${Date.now()}`;
                newPanelsData.push({
                    id: newPanelId,
                    name: 'Structure',
                    round: 1,
                    items: [itemToAdd]
                });
                console.log('[Editor.jsx] Added first structure panel with item.', newPanelsData);
                updated = true;
                panelIdToExpand = newPanelId;
            } else {
                // 情况2: 已存在面板
                // 优先检查是否有选中的项 (expandedItems)
                let expandedPanelId = null;
                let expandedItemId = null;
                // 从 expandedItems 获取选中的 panelId 和 itemId
                // 注意：expandedItems 的结构是 { panelId: itemId }，所以需要 Object.entries
                const expandedEntry = Object.entries(expandedItems).find(([pId, iId]) => iId !== null);
                if (expandedEntry) {
                    [expandedPanelId, expandedItemId] = expandedEntry;
                }

                if (expandedPanelId && expandedItemId) {
                    // 情况2.1: 找到了选中的项，插入其下方
                    const panelIndex = newPanelsData.findIndex(p => p.id === expandedPanelId);
                    if (panelIndex !== -1) {
                        const itemIndex = newPanelsData[panelIndex].items.findIndex(item => item.id === expandedItemId);
                        if (itemIndex !== -1) {
                            newPanelsData[panelIndex].items.splice(itemIndex + 1, 0, itemToAdd); // 插入到 itemIndex + 1 的位置
                            console.log(`[Editor.jsx] Added item after selected item ${expandedItemId} in panel ${expandedPanelId}.`, newPanelsData);
                            updated = true;
                            panelIdToExpand = expandedPanelId; // 保持当前面板展开
                        } else {
                            // 如果 expandedItemId 找不到（理论上不应发生），则添加到该面板末尾
                            console.warn(`[Editor.jsx] Selected item ${expandedItemId} not found in panel ${expandedPanelId}, adding to end of this panel.`);
                            newPanelsData[panelIndex].items.push(itemToAdd);
                            updated = true;
                            panelIdToExpand = expandedPanelId;
                        }
                    } else {
                        // 如果 expandedPanelId 找不到（理论上不应发生），则添加到最后一个面板
                        console.warn(`[Editor.jsx] Selected panel ${expandedPanelId} not found, adding to end of last panel.`);
                        const lastPanelIndex = newPanelsData.length - 1;
                        newPanelsData[lastPanelIndex].items.push(itemToAdd);
                        updated = true;
                        panelIdToExpand = newPanelsData[lastPanelIndex].id;
                    }
                } else {
                    // 情况2.2: 没有选中的项，检查当前展开的面板 (activeCollapseKeys)
                    let targetPanelId = null;
                    const activeKey = activeCollapseKeys.find(key => key.startsWith('structure-'));
                    if (activeKey) {
                        targetPanelId = activeKey.replace('structure-', '');
                    }

                    let targetPanelIndex = -1;
                    if (targetPanelId) {
                        targetPanelIndex = newPanelsData.findIndex(p => p.id === targetPanelId);
                    }

                    if (targetPanelIndex !== -1) {
                        // 情况2.2.1: 找到当前展开的 Structure Panel，添加到其末尾
                        newPanelsData[targetPanelIndex].items.push(itemToAdd);
                        console.log(`[Editor.jsx] No selected item found. Added item to the end of the currently expanded panel ${targetPanelId}.`, newPanelsData);
                        updated = true;
                        panelIdToExpand = targetPanelId;
                    } else {
                        // 情况2.2.2: 没有展开的 Structure Panel，添加到最后一个面板
                        const lastPanelIndex = newPanelsData.length - 1;
                        newPanelsData[lastPanelIndex].items.push(itemToAdd);
                        console.log(`[Editor.jsx] No selected item or active structure panel found. Added item to the end of the last panel (index ${lastPanelIndex}).`, newPanelsData);
                        updated = true;
                        panelIdToExpand = newPanelsData[lastPanelIndex].id;
                    }
                }
            }

            // --- 状态更新和展开逻辑 --- 
            if (updated) {
                if (!isFormDirty) {
                    setIsFormDirty(true);
                }
                if (panelIdToExpand) {
                    setActiveCollapseKeys([`structure-${panelIdToExpand}`]);
                    console.log(`[Editor.jsx] Setting active collapse key to: structure-${panelIdToExpand}`);
                }
            }

            console.log('[Editor.jsx] addItemToStructure: Returning updated panels:', newPanelsData);
            return newPanelsData;
        });
    };

    // 从 Structure 删除项 (需要修改以适配面板结构)
    const deleteStructureItem = (panelId, itemId) => {
        // TODO: 实现从特定面板删除项的逻辑
        console.log('Delete item functionality needs update for panel structure.');
        const newPanels = structurePanels.map(panel => {
            if (panel.id === panelId) {
                const updatedItems = panel.items.filter(item => item.id !== itemId);
                // 如果删除后 panel 为空，可以选择是否移除该 panel
                // if (updatedItems.length === 0) return null; // 返回 null 以便在后续 filter 中移除
                return { ...panel, items: updatedItems };
            }
            return panel;
        });
        // 可选：过滤掉空的 panel
        // const filteredPanels = newPanels.filter(panel => panel !== null);
        // handleStructureChange(filteredPanels);
        handleStructureChange(newPanels.filter(panel => panel && panel.items.length > 0)); // 直接过滤掉空面板
    };

    // --- 新增：处理面板轮次变化 ---
    const handleRoundChange = (panelId, value) => {
        const newPanels = structurePanels.map(panel => {
            if (panel.id === panelId) {
                const safeValue = Math.max(1, Math.min(5, parseInt(value, 10) || 1));
                return { ...panel, round: safeValue };
            }
            return panel;
        });
        handleStructureChange(newPanels);
    };

    // --- 新增占位符：处理替换和排序 ---
    /**
     * @description 替换指定面板中的某个项目
     * @param {string} panelId 面板 ID
     * @param {string} itemId 要被替换的项目的 ID (原始结构项的 ID)
     * @param {object} newItemData 包含更新信息的新项目数据对象
     */
    const replaceStructureItem = (panelId, itemId, newItemData) => {
        console.log('[Editor.jsx] replaceStructureItem called:', { panelId, itemId, newItemData });

        const newPanels = structurePanels.map(panel => {
            if (panel.id === panelId) {
                // 查找要替换的项目的索引
                const itemIndex = panel.items.findIndex(item => item.id === itemId);

                if (itemIndex !== -1) {
                    console.log(`[Editor.jsx] Replacing item at index ${itemIndex} in panel ${panelId}`);
                    // 创建更新后的 items 数组
                    const updatedItems = [
                        ...panel.items.slice(0, itemIndex),
                        newItemData, // 插入包含新 ID 和更新数据的新项目
                        ...panel.items.slice(itemIndex + 1),
                    ];
                    return { ...panel, items: updatedItems }; // 返回更新后的面板
                } else {
                    console.warn(`[Editor.jsx] Item with id ${itemId} not found in panel ${panelId} for replacement.`);
                }
            }
            return panel; // 其他面板保持不变
        });

        // 检查是否有实际变化（虽然理论上总有变化，因为 ID 变了）
        if (newPanels !== structurePanels) {
            handleStructureChange(newPanels); // 更新状态
        } else {
            console.warn('[Editor.jsx] No changes detected after replacement attempt.');
        }
    };

    // --- 修改：处理排序，现在实际移动项目 ---
    const handleSortItemsInPanel = (panelId, oldIndex, newIndex) => {

        const panelIndex = structurePanels.findIndex(panel => panel.id === panelId);
        if (panelIndex !== -1 && oldIndex !== newIndex) {
            const newPanels = [...structurePanels]; // 创建面板数组的副本
            // 使用辅助函数移动项目
            newPanels[panelIndex] = {
                ...newPanels[panelIndex],
                items: simpleArrayMove(newPanels[panelIndex].items, oldIndex, newIndex)
            };
            handleStructureChange(newPanels); // 更新状态
        }
    };

    // --- 新增：处理复制项目 ---
    const handleCopyItem = (panelId, itemId) => {
        let panelToUpdate = null;
        let itemToCopy = null;
        let originalItemIndex = -1;

        // 找到目标面板和项目
        const targetPanel = structurePanels.find(panel => panel.id === panelId);
        if (targetPanel) {
            panelToUpdate = targetPanel;
            itemToCopy = targetPanel.items.find((item, index) => {
                if (item.id === itemId) {
                    originalItemIndex = index;
                    return true;
                }
                return false;
            });
        }

        if (panelToUpdate && itemToCopy && originalItemIndex !== -1) {
            // 创建项目的深拷贝并生成新 ID
            const newItem = {
                ...JSON.parse(JSON.stringify(itemToCopy)), // 深拷贝
                id: `struct-item-${Date.now()}-${Math.random().toString(16).slice(2)}` // 新的唯一 ID
            };

            // 将新项目插入到原项目之后
            const updatedItems = [
                ...panelToUpdate.items.slice(0, originalItemIndex + 1),
                newItem,
                ...panelToUpdate.items.slice(originalItemIndex + 1)
            ];

            // 更新面板状态
            const newPanels = structurePanels.map(panel => {
                if (panel.id === panelId) {
                    return { ...panel, items: updatedItems };
                }
                return panel;
            });
            handleStructureChange(newPanels);
            // 可以选择添加成功提示，如果需要的话
            // messageApi.success('Item copied successfully');
        } else {
            console.error('Could not find panel or item to copy', { panelId, itemId });
        }
    };

    // --- 新增：处理面板内单个项目属性变化 ---
    const handleItemChange = (panelId, itemId, field, value) => {
        const newPanels = structurePanels.map(panel => {
            if (panel.id === panelId) {
                const updatedItems = panel.items.map(item => {
                    if (item.id === itemId) {
                        // Add specific logic if needed, e.g., validation
                        return { ...item, [field]: value };
                    }
                    return item;
                });
                return { ...panel, items: updatedItems };
            }
            return panel;
        });
        handleStructureChange(newPanels);
    };

    // --- 新增：表单验证成功后的处理逻辑 ---
    const onFormFinish = (values) => {
        console.log('Form validation successful, values:', values);
        // 组合需要保存的数据
        const dataToSave = {
            ...(workoutId && { id: parseInt(workoutId, 10) }), // 如果是编辑，则包含 ID
            ...workoutData, // 包含未在表单中直接体现的数据（如 videoPreferences）
            // --- 从 values 中获取表单字段 --- 
            workoutName: values.workoutName,
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
            newTimeStart: values.newTimeStart ? values.newTimeStart.toISOString() : null, // 格式化日期
            newTimeEnd: values.newTimeEnd ? values.newTimeEnd.toISOString() : null, // 格式化日期
            introDuration: values.introDuration,
            exercisePreviewDuration: values.exercisePreviewDuration,
            exerciseDuration: values.exerciseDuration,
            // --- 结束从 values 中获取 --- 
            structure: structurePanels.flatMap(panel => panel.items), // 展平成扁平列表 (或根据后端要求调整)
        };

        console.log('保存 Workout 数据:', dataToSave);
        setSaveLoading(true); // 开始保存时设置 loading

        // TODO: 替换为实际的 API 调用
        setTimeout(() => {
            const currentId = dataToSave.id;
            // --- 模拟更新或创建列表数据 --- (开始)
            if (currentId) {
                const index = mockWorkoutsForList.findIndex(w => w.id === currentId);
                if (index !== -1) {
                    mockWorkoutsForList[index] = {
                        ...mockWorkoutsForList[index],
                        name: dataToSave.workoutName, // 使用 workoutName
                        // ... 其他可能需要在列表页更新的字段
                    };
                    console.log('已更新模拟列表中的 Workout (基本信息):', mockWorkoutsForList[index]);
                } else {
                    console.warn('在模拟列表中未找到要更新的 Workout ID:', currentId);
                }
            } else {
                const newId = mockWorkoutsForList.length > 0 ? Math.max(...mockWorkoutsForList.map(w => w.id)) + 1 : 1;
                dataToSave.id = newId;
                const newListItem = {
                    id: newId,
                    name: dataToSave.workoutName, // 使用 workoutName
                    status: 'Draft',
                    difficulty: dataToSave.difficulty || 'Medium', // 使用表单数据
                    image: dataToSave.thumbnailImageUrl || 'https://via.placeholder.com/100/cccccc', // 使用表单数据
                };
                mockWorkoutsForList.push(newListItem);
                console.log('已添加新的 Workout 到模拟列表 (基本信息):', newListItem);
            }
            // --- 模拟更新或创建列表数据 --- (结束)

            setSaveLoading(false);
            setIsFormDirty(false);
            // navigate('/workouts'); // 可选：保存后返回列表页
        }, 800);
    };

    // 准备传递给 EditorFormPanel 的数据 (使用 useMemo 避免不必要的重渲染)
    const dataForPanel = useMemo(() => ({
        equipmentOptions: equipmentOptions // 传递器材选项
    }), []);

    // 添加新的 Structure Panel
    const handleAddStructurePanel = () => {
        // --- 新增：检查最后一个 panel 是否为空 ---
        if (structurePanels.length > 0) {
            const lastPanel = structurePanels[structurePanels.length - 1];
            if (lastPanel.items.length === 0) {
                notification.warning({
                    message: 'Cannot Add New Structure',
                    description: 'Please add exercises to the current last structure before adding a new one.',
                    placement: 'topRight',
                });
                return; // 阻止添加新面板
            }
        }
        // --- 检查结束 ---

        const newPanelId = `struct-panel-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newPanel = {
            id: newPanelId,
            name: '',
            round: 1,
            items: [],
        };
        setExpandedItems({});
        handleStructureChange([...structurePanels, newPanel]);
        // --- 重点：添加新 Panel 时设置其为 active key --- 
        setActiveCollapseKeys([`structure-${newPanelId}`]);
        console.log('[Editor.jsx] Added new empty structure panel:', newPanel);
    };

    return (
        <div className="workouts-editor-container">
            {pageLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    <ContentLibraryPanel
                        className="content-library-panel editor-item"
                        contentLibraryData={filteredContentLibraryData}
                        onAddItem={addItemToStructure}
                        searchValue={contentSearchValue}
                        onSearchChange={handleContentSearchChange}
                        onFilterChange={handleContentFilterChange}
                        hasActiveFilters={hasActiveContentFilters}
                        activeFilters={contentFilters}
                    />

                    <EditorFormPanel
                        className="workout-editor-panel editor-item"
                        formInstance={form}
                        onFinish={onFormFinish}
                        structurePanelsData={structurePanels}
                        onFormChange={handleFormChange}
                        onDeleteItem={deleteStructureItem}
                        onRoundChange={handleRoundChange}
                        onReplaceItem={replaceStructureItem}
                        onSortItems={handleSortItemsInPanel}
                        onItemChange={handleItemChange}
                        onCopyItem={handleCopyItem}
                        onStructureNameChange={() => { }}
                        onAddStructurePanel={handleAddStructurePanel}
                        workoutData={dataForPanel}
                        // --- Expansion Props ---
                        expandedItems={expandedItems}
                        onToggleExpandItem={handleToggleExpandItem}
                        // --- Collapse Props ---
                        activeCollapseKeys={activeCollapseKeys}
                        onCollapseChange={handleCollapseChange}
                        // --- Content Library Props for Modal ---
                        contentLibraryData={fullContentLibraryData}
                        contentSearchValue={contentSearchValue}
                        contentFilters={contentFilters}
                        onContentSearchChange={handleContentSearchChange}
                        onContentFilterChange={handleContentFilterChange}
                        hasActiveContentFilters={hasActiveContentFilters}
                    />
                </>
            )}
        </div>
    );
}   