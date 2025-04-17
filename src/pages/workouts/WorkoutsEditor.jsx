import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Form,
    message,
    Spin,
    Collapse,
    List,
    Avatar,
    Divider,
    Tabs,
    Space
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { initialWorkoutData, mockEditorStructureData, mockWorkoutsForList, equipmentOptions } from './Data';
import ContentLibraryPanel from '@/components/ContentLibrary/ContentLibraryPanel';
import EditorFormPanel from '@/components/EditorFormPanel/EditorFormPanel';
import './WorkoutsEditor.css';

const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
        return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function WorkoutsEditor() {
    const { setSaveButtonState, setCustomPageTitle } = useContext(HeaderContext);
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const workoutId = searchParams.get('id');
    const [form] = Form.useForm();
    const [workoutData, setWorkoutData] = useState(initialWorkoutData);
    const [structureItems, setStructureItems] = useState([]);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // --- 内容库状态 --- 添加内容库筛选相关状态
    const [fullContentLibraryData] = useState(mockEditorStructureData); // 原始完整数据
    const [filteredContentLibraryData, setFilteredContentLibraryData] = useState(mockEditorStructureData); // 过滤后的数据
    const [contentSearchValue, setContentSearchValue] = useState(''); // 搜索框的值
    const [contentFilters, setContentFilters] = useState({}); // 筛选器的值
    // -----------------------------

    // --- 计算内容库筛选器是否激活 --- 添加计算逻辑
    const hasActiveContentFilters = useMemo(() => {
        // 检查 contentFilters 对象的值（数组），是否有任何一个数组长度大于 0
        return Object.values(contentFilters).some(filterArray => filterArray && filterArray.length > 0);
    }, [contentFilters]);
    // -------------------------------------------------------

    // --- 筛选逻辑 --- 添加筛选和搜索逻辑
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
                    // 特殊处理 target，因为它是逗号分隔的字符串
                    tempData = tempData.filter(item => {
                        if (!item.target) return false;
                        const itemTargets = item.target.split(',').map(t => t.trim());
                        return selectedOptions.some(filterTarget => itemTargets.includes(filterTarget));
                    });
                } else {
                    // 其他筛选条件直接比较
                    tempData = tempData.filter(item => item[key] && selectedOptions.includes(item[key]));
                }
            }
        });

        setFilteredContentLibraryData(tempData);
    }, [contentSearchValue, contentFilters, fullContentLibraryData]);
    // -------------------------

    // --- 内容库事件处理函数 --- 使用 useCallback
    const handleContentSearchChange = useCallback((e) => {
        setContentSearchValue(e.target.value || '');
    }, []); // 空依赖数组，函数引用稳定

    const handleContentFilterChange = useCallback((newFilters) => {
        setContentFilters(newFilters);
    }, []); // 空依赖数组，函数引用稳定
    // -------------------------------------------

    useEffect(() => {
        const currentId = workoutId ? parseInt(workoutId, 10) : null;
        if (currentId !== null) {
            setPageLoading(true);
            console.log('Editing workout with ID:', currentId);
            setTimeout(() => {
                const workoutToEdit = mockWorkoutsForList.find(w => w.id === currentId);
                if (workoutToEdit) {
                    const fullWorkoutData = {
                        ...initialWorkoutData,
                        ...workoutToEdit,
                        structure: mockEditorStructureData,
                        videoPreferences: { transition: 'Wipe Left', backgroundMusic: 'Energetic' },
                        musicLinks: [{ platform: 'Spotify', url: 'https://spotify.link/123' }],
                    };
                    setWorkoutData(fullWorkoutData);
                    setStructureItems(fullWorkoutData.structure);
                    form.setFieldsValue({
                        workoutName: fullWorkoutData.name,
                    });
                    setIsFormDirty(false);
                } else {
                    console.error("Workout not found with ID:", currentId);
                    messageApi.error("Workout not found. Redirecting...");
                    setTimeout(() => navigate('/workouts'), 1500);
                }
                setPageLoading(false);
            }, 500);
        } else {
            setWorkoutData(initialWorkoutData);
            setStructureItems([]); // 新建 workout 时结构为空
            form.resetFields();
            setIsFormDirty(false);
        }
    }, [workoutId, form, messageApi, navigate]);

    useEffect(() => {
        const title = workoutId ? `Edit Workout: ${form.getFieldValue('workoutName') || 'Loading...'}` : 'Add Workout';
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
        return () => {
            setSaveButtonState({ showSaveButton: false, showBackButton: false });
            setCustomPageTitle(null);
        };
    }, [workoutId, form, saveLoading, pageLoading, setSaveButtonState, setCustomPageTitle, navigate]);

    const handleFormChange = () => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }
        const newName = form.getFieldValue('workoutName');
        setCustomPageTitle(workoutId ? `Edit Workout: ${newName || ''}` : 'Add Workout');
    };

    const handleStructureChange = (newStructure) => {
        setStructureItems(newStructure);
        if (!isFormDirty) {
            setIsFormDirty(true);
        }
    };

    const addItemToStructure = (item) => {
        const newItem = {
            ...item,
            id: `struct-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        };
        handleStructureChange([...structureItems, newItem]);
        message.success(`${item.name} added to structure`);
    };

    const addRestTime = () => {
        const newRestItem = {
            id: `rest-${Date.now()}`,
            type: 'rest',
            duration: 30,
        };
        handleStructureChange([...structureItems, newRestItem]);
        message.success(`Rest time added`);
    };

    const deleteStructureItem = (itemId) => {
        const newStructure = structureItems.filter(item => item.id !== itemId);
        handleStructureChange(newStructure);
        message.success(`Item removed`);
    };

    const handleSaveChanges = () => {
        setSaveLoading(true);
        form.validateFields()
            .then(values => {
                const dataToSave = {
                    ...(workoutId && { id: parseInt(workoutId, 10) }),
                    ...workoutData,
                    name: values.workoutName,
                    structure: structureItems,
                };

                console.log('Saving workout data:', dataToSave);

                setTimeout(() => {
                    const currentId = dataToSave.id;
                    if (currentId) {
                        const index = mockWorkoutsForList.findIndex(w => w.id === currentId);
                        if (index !== -1) {
                            mockWorkoutsForList[index] = {
                                ...mockWorkoutsForList[index],
                                name: dataToSave.name,
                            };
                            console.log('Updated workout in mock list (basic info):', mockWorkoutsForList[index]);
                        } else {
                            console.warn('Workout ID not found in mock list for update:', currentId);
                        }
                    } else {
                        const newId = mockWorkoutsForList.length > 0 ? Math.max(...mockWorkoutsForList.map(w => w.id)) + 1 : 1;
                        dataToSave.id = newId;
                        const newListItem = {
                            id: newId,
                            name: dataToSave.name,
                            status: 'Draft',
                            difficulty: 'Medium',
                            image: 'https://via.placeholder.com/100/cccccc',
                        };
                        mockWorkoutsForList.push(newListItem);
                        console.log('Added new workout to mock list (basic info):', newListItem);
                    }

                    messageApi.success('Workout saved successfully!');
                    setSaveLoading(false);
                    setIsFormDirty(false);
                }, 800);
            })
            .catch(err => {
                console.error('Validation failed:', err);
                setSaveLoading(false);
                messageApi.error('Please check the form fields.');
            });
    };

    const handleBackClick = () => {
        if (isFormDirty) {
            if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                navigate(-1);
            }
        } else {
            navigate(-1);
        }
    };

    // 准备传递给 EditorFormPanel 的数据，使用导入的 equipmentOptions
    const dataForPanel = useMemo(() => ({
        equipmentOptions: equipmentOptions // 使用导入的选项
    }), []); // 空依赖数组，因为选项是静态的

    return (
        <div className="workouts-editor-container">
            {contextHolder}
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
                        structureItems={structureItems}
                        onFormChange={handleFormChange}
                        onAddRestTime={addRestTime}
                        onDeleteItem={deleteStructureItem}
                        workoutData={dataForPanel} // 传递包含选项的数据对象
                    />
                </>
            )}
        </div>
    );
}   