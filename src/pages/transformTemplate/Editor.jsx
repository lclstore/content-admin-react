import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';

import CommonEditorForm from '@/components/CommonEditorForm';
import { commonListData, filterSections } from '@/pages/Data';
import { arrayMove } from '@dnd-kit/sortable';
import {
    ThunderboltOutlined,
    TagsOutlined,
    PictureOutlined,
    VideoCameraOutlined,
    SettingOutlined
} from '@ant-design/icons';

export default function UserEditorWithCommon() {
    const navigate = useNavigate();
    // 初始用户数据状态--可设默认值
    const initialValues = {}
    const mockUsers = [{
        id: 1,
        name: 'John Doe',
        description: 'asasdasa',
        startTime: '2025-01-26',
        endTime: '2025-07-26',
        premium: 1,
        coverImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        detailImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        thumbnailImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        completeImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        difficulty: 1,
        equipment: 3,
        position: 2,
        target: [1, 5],
        introDuration: 10,
        exercisePreviewDuration: 20,
        exerciseExecutionDuration: 30,
        list: [{
            reps: 1,
            structureName: 'asd1',
            list: [commonListData[0], commonListData[1]]
        }, {
            reps: 2,
            structureName: 'asd2',
            list: [commonListData[1]]
        }]
    }];

    // 添加选中项状态管理
    const [selectedItem, setSelectedItem] = useState(null);

    // 处理选中项被添加到表单后的回调
    const handleItemAdded = (panelName, fieldName, itemData, expandedItemId, form) => {
        // 创建 formFields 的深拷贝
        const updatedFields = formFields.map(field => {
            // 找到匹配的面板
            if (field.name === panelName) {
                // 判断itemData是否为数组
                const itemsToAdd = Array.isArray(itemData) ? itemData : [itemData];

                // 检查是否有展开的项
                if (expandedItemId && Array.isArray(field.dataList)) {
                    // 查找展开项的索引
                    const expandedItemIndex = field.dataList.findIndex(item => item.id === expandedItemId);

                    if (expandedItemIndex !== -1) {
                        // 如果找到展开的项，在其后插入新项（可能是多个）
                        const newDataList = [...field.dataList];
                        newDataList.splice(expandedItemIndex + 1, 0, ...itemsToAdd);

                        return {
                            ...field,
                            dataList: newDataList
                        };
                    }
                }

                // 默认行为：如果没有展开的项或找不到展开的项，添加到末尾
                return {
                    ...field,
                    dataList: Array.isArray(field.dataList)
                        ? [...field.dataList, ...itemsToAdd] // 如果是数组，创建新数组并添加新项（可能是多个）
                        : itemsToAdd // 如果不是数组，创建新数组
                };
            }
            return field; // 返回未修改的其他面板
        });
        const formValues = form.getFieldsValue();
        // 更新状态
        setFormFields(updatedFields);
    };

    // 清空选中项的回调函数
    const handleSelectedItemProcessed = () => {
        console.log('清空选中项');
        setSelectedItem(null);
    };

    // 保存用户数据
    const handleSaveUser = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
        console.log('保存用户数据:', values, id);

        // 处理数据格式
        // const dataToSave = {
        //     ...(id && { id: parseInt(id, 10) }),
        //     name: values.name.trim(),
        //     email: values.email ? values.email.trim() : '',
        //     avatar: values.avatar,
        //     status: values.status,
        //     userPassword: values.userPassword,
        //     birthday: values.birthday,
        //     // 如果有timeRange，从中提取startDate和endDate
        //     ...(values.timeRange && values.timeRange.length === 2 ? {
        //         startDate: values.timeRange[0],
        //         endDate: values.timeRange[1]
        //     } : {}),
        //     selectedRoles: values.selectedRoles || [],
        //     // 保存联动选择器的值
        //     layoutType: values.layoutType,
        //     contentStyle: values.contentStyle
        // };

        // 模拟API请求（注意：这里为了演示，移除了 setTimeout 模拟延迟）
        // 实际应用中，这里应该是异步请求

        // 成功处理
        messageApi.success('用户数据保存成功！');

        // 检查 setLoading 是否为函数再调用，防止 CommonEditorForm 未传递该函数导致报错
        if (typeof setLoading === 'function') {
            setLoading(false);
        }
        setDirty(false);

        // 保存成功后立即跳转回列表页
        navigate(-1);
    };
    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue();
        form.setFieldsValue({
            coverImage: formValues.coverImage || value,
            detailImage: formValues.detailImage || value,
            thumbnailImage: formValues.thumbnailImage || value,
            completeImage: formValues.completeImage || value,
        });

    }
    //请求列数据方法
    const initFormData = (id) => {
        return new Promise((resolve) => {
            // 模拟延迟 1 秒
            setTimeout(() => {
                if (id) {
                    // 查找对应用户
                    // const user = mockUsers.find(u => u.id === parseInt(id, 10));
                    const user = mockUsers[0]
                    resolve(user || {});  // 找不到也返回空对象，避免 undefined
                } else {
                    // 新增场景：直接返回空对象
                    resolve(initialValues);
                }
            }, 1000);
        });
    };
    const initialFormFields = useMemo(() => [
        {
            label: 'Basic Information',
            name: 'basicInfo',
            icon: <ThunderboltOutlined />,
            fields: [
                {
                    type: 'input',
                    name: 'name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    showCount: true,
                },
                {
                    type: 'textarea',
                    name: 'description',
                    label: 'Description',
                    required: true,
                    maxLength: 1000,
                    showCount: true,
                },
                {
                    type: 'dateRange',
                    name: 'timeRange',
                    label: 'New Date',
                    keys: ['startTime', 'endTime'],
                    required: false,
                },
                {
                    type: 'switch',
                    name: 'premium',
                    label: 'Premium',
                    defaultChecked: 0,

                }
            ]
        },
        {
            label: 'Image',
            name: 'image',
            icon: <PictureOutlined />,
            fields: [
                {
                    type: 'upload',
                    name: 'coverImage',
                    label: 'Cover Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'detailImage',
                    label: 'Detail Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'thumbnailImage',
                    label: 'Thumbnail Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'completeImage',
                    label: 'Complete Image',
                    required: true,
                    onChange: imageUpload
                },

            ]
        },
        {
            label: 'Labels',
            name: 'labels',
            icon: <TagsOutlined />,
            fields: [
                {
                    type: 'select',
                    name: 'difficulty',
                    label: 'Difficulty',
                    required: true,
                    options: [
                        { label: 'Beginner', value: 1 },
                        { label: 'Intermediate', value: 2 },
                        { label: 'Advanced', value: 3 }
                    ],
                },
                {
                    type: 'select',
                    name: 'equipment',
                    label: 'Equipment',
                    required: true,
                    options: [
                        { label: 'Dumbbell', value: 1 },
                        { label: 'Resistance band', value: 2 },
                        { label: 'None', value: 3 }
                    ]
                },
                {
                    type: 'select',
                    name: 'position',
                    label: 'Position',
                    required: true,
                    options: [
                        { label: 'Standing', value: 1 },
                        { label: 'Lying', value: 2 },
                        { label: 'Seated', value: 3 },
                        { label: 'Prone', value: 4 },
                        { label: 'Kneeling', value: 5 }
                    ]
                },
                {
                    type: 'select',
                    mode: 'multiple',
                    name: 'target',
                    label: 'Target',
                    required: true,
                    options: [
                        { label: 'Full Body', value: 1 },
                        { label: 'Arm', value: 2 },
                        { label: 'Back', value: 3 },
                        { label: 'Butt', value: 4 },
                        { label: 'Abs', value: 5 },
                        { label: 'Leg', value: 6 },
                        { label: 'Core', value: 7 }
                    ]
                }
            ]
        },
        {
            label: 'Duration Settings',
            name: 'durationSettings',
            icon: <SettingOutlined />,
            fields: [
                {
                    type: 'numberStepper',
                    min: 0,
                    max: 10,
                    step: 10,
                    formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
                    name: 'introDuration', // 修改字段名避免重复
                    label: 'Intro Duration',

                },
                {
                    type: 'numberStepper',
                    min: 0,
                    max: 10,
                    step: 10,
                    formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
                    name: 'exercisePreviewDuration', // 修改字段名避免重复
                    label: 'Exercise Preview Duration',
                },
                {
                    type: 'numberStepper',
                    min: 10,
                    max: 40,
                    step: 10,
                    formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
                    name: 'exerciseExecutionDuration', // 修改字段名避免重复
                    label: 'Exercise Execution Duration',
                }
            ]
        },
        {

            title: 'Structure',
            label: 'Structure Settings',
            name: 'structure',
            isShowAdd: true,
            formterList: (dataList) => {
                return dataList.map(item => {
                    return {
                        name: item.name,
                        id: item.id
                    }
                })
            },
            dataList: [],
            dataKey: 'list',
            required: false,
            icon: <VideoCameraOutlined />,
            fields: [
                {
                    type: 'input',
                    name: 'structureName',
                    label: 'Structure Name',
                    required: true,
                },
                {
                    type: 'numberStepper',
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'reps', // 修改字段名避免重复
                    label: 'Reps',
                    required: true,
                }
            ]

        },
        {
            label: 'Workout Data',
            name: 'workoutData',
            fields: [
                {
                    type: 'displayText',
                    name: 'duration',
                    label: 'Duration (Min):',

                },
                {
                    type: 'displayText',
                    name: 'calorie',
                    label: 'Calorie:',

                },
            ]
        }


    ], []); // 使用useMemo优化性能，避免每次渲染重新创建
    const [formFields, setFormFields] = useState(initialFormFields);

    // 添加自定义面板的回调函数
    const handleAddCustomPanel = (newPanel) => {
        setFormFields(prevFields => {
            const lastIndexWithDatalist = [...prevFields]
                .map((item, index) => item.dataList ? index : -1)
                .filter(index => index !== -1)
                .pop();

            if (lastIndexWithDatalist !== undefined && lastIndexWithDatalist !== -1) {
                const newFields = [...prevFields];
                newFields.splice(lastIndexWithDatalist + 1, 0, newPanel);
                return newFields;
            } else {
                // 如果没有任何项包含 datalist，则默认追加到末尾
                return [...prevFields, newPanel];
            }
        });
    };
    const handleDeletePanel = (panelName) => {
        // 这里实现删除面板的逻辑
        // 比如从fields数组中移除对应name的面板
        const updatedFields = formFields.filter(item => item.name !== panelName);
        setFormFields(updatedFields);
    };


    //请求列表数据方法
    const initCommonListData = (params) => {
        return new Promise((resolve) => {
            // 模拟延迟 1 秒
            setTimeout(() => {
                resolve(commonListData.filter(item => item.status === 1));
            }, 1000);
        });
    }
    // 自定义渲染列表项展示
    const renderItemMata = (item) => {
        return <div>{item.displayName}</div>
    }

    // 处理排序
    const handleSortItems = (panelName, oldIndex, newIndex) => {
        console.log(`排序: ${panelName}, 从 ${oldIndex} 到 ${newIndex}`);

        if (oldIndex === newIndex) {
            console.log('位置未改变，跳过排序');
            return;
        }

        try {
            const updatedFields = formFields.map(field => {
                if (field.name === panelName && Array.isArray(field.dataList)) {
                    // 确保数据存在
                    if (oldIndex < 0 || oldIndex >= field.dataList.length ||
                        newIndex < 0 || newIndex >= field.dataList.length) {
                        console.error('索引超出范围:', { oldIndex, newIndex, length: field.dataList.length });
                        return field;
                    }

                    // 使用 arrayMove 辅助函数移动数组中的项
                    const newDataList = arrayMove([...field.dataList], oldIndex, newIndex);
                    console.log('排序后的数据:', newDataList.map(item => item.id));

                    return {
                        ...field,
                        dataList: newDataList
                    };
                }
                return field;
            });

            // 检查更新是否有效
            const changedPanel = updatedFields.find(f => f.name === panelName);
            if (changedPanel && changedPanel.dataList) {
                console.log('更新状态');
                setFormFields(updatedFields);
            } else {
                console.error('无法找到面板或更新数据:', { panelName });
            }
        } catch (error) {
            console.error('排序处理出错:', error);
        }
    };

    // 处理删除
    const handleDeleteItem = (panelName, itemId) => {
        const updatedFields = formFields.map(field => {
            if (field.name === panelName && Array.isArray(field.dataList)) {
                return {
                    ...field,
                    dataList: field.dataList.filter(item => item.id !== itemId)
                };
            }
            return field;
        });

        setFormFields(updatedFields);
    };

    // 处理复制
    const handleCopyItem = (panelName, itemId) => {
        const updatedFields = formFields.map(field => {
            if (field.name === panelName && Array.isArray(field.dataList)) {
                // 找到要复制的项
                const itemToCopy = field.dataList.find(item => item.id === itemId);
                if (itemToCopy) {
                    // 创建一个新的项，包含与原项相同的属性但具有新的ID
                    const newItem = {
                        ...itemToCopy,
                        id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
                    };

                    // 返回更新后的字段，包括新项
                    return {
                        ...field,
                        dataList: [...field.dataList, newItem]
                    };
                }
            }
            return field;
        });

        setFormFields(updatedFields);
    };

    // 处理替换（这里可以是打开替换模态框的逻辑）
    const handleReplaceItem = (panelName, itemId, newItemId, newItem) => {
        setFormFields(formFields =>
            formFields.map(panel => {
                if (panel.name !== panelName) return panel;
                const updatedItems = panel.dataList.map(item =>
                    item.id === itemId ? { ...newItem, id: newItemId } : item
                );

                return {
                    ...panel,
                    dataList: updatedItems,
                };
            })
        );
    };
    //折叠面板展开
    const handleCollapseChange = (activeKeys, form) => {
        // 如果在此函数内更新了 formFields，可以在更新回调中获取最新值
        if (activeKeys[0] === 'workoutData') {
            setFormFields(prevFields => {
                const newFields = [...prevFields]; // 进行某些更新操作、
                const formValues = form.getFieldsValue(true);//表单数据
                const preview = formValues.exercisePreviewDuration || 0;
                const execution = formValues.exerciseExecutionDuration || 0;
                const introDuration = formValues.introDuration || 0;

                let loopCount = 0;
                let workoutCalorie = 0;
                const MET = 1

                const structureList = newFields.filter(item => Array.isArray(item.dataList) && item.dataList.length > 0);
                if (structureList.length > 0) {
                    structureList.forEach((item, index) => {
                        const reps = formValues[`reps${index == 0 ? '' : index}`] | 0;
                        loopCount = reps * item.dataList.length;
                        const calories = MET * 75 / 3600 * execution * reps * item.dataList.length;
                        workoutCalorie += calories
                    })
                    const workOutTime = (preview + execution) * loopCount;
                    const workoutDurationRaw = introDuration + workOutTime;
                    // 如果时长小于30，则向下取整，否则向上取整
                    const workoutDuration = workoutDurationRaw < 30
                        ? Math.floor(workoutDurationRaw)
                        : Math.ceil(workoutDurationRaw);
                    form.setFieldsValue({
                        duration: workoutDuration,
                        calorie: Math.ceil(workoutCalorie)//向上取整
                    });
                } else {
                    form.setFieldsValue({
                        duration: 0,
                        calorie: 0
                    });
                }
                console.log(newFields);

                return newFields;
            });
        }

    };

    return (
        <CommonEditorForm
            // renderItemMata={renderItemMata}  // 自定义渲染列表项
            commonListConfig={
                {

                    initCommonListData: initCommonListData, // 搜索方法
                    placeholder: 'Search your content name...', // 搜索框提示
                    filterSections: filterSections, // 筛选器
                    defaultQueryParams: { // 默认查询参数
                        page: 1,
                        pageSize: 10,
                        status: 1
                    },
                    activeFilters: {
                        target: ["Core", "Leg"]
                    },
                    // 添加选中项的处理函数
                    onSelectItem: (item) => setSelectedItem(item)
                }
            }
            collapseFormConfig={
                {
                    // defaultActiveKeys: 'all',
                    fields: formFields, // 表单字段配置
                    initialValues: initialValues, // 默认初始值
                    isCollapse: true, //是否折叠分组
                    handleAddCustomPanel: handleAddCustomPanel, // 传递添加自定义面板的函数
                    handleDeletePanel: handleDeletePanel,// 删除面板的回调函数
                    // 添加选中项和回调函数
                    selectedItemFromList: selectedItem,// 选中项
                    onItemAdded: handleItemAdded,// 添加项的回调函数
                    onSelectedItemProcessed: handleSelectedItemProcessed,// 清空选中项的回调函数
                    // 添加处理结构项的功能
                    onSortItems: handleSortItems,// 排序项的回调函数
                    onDeleteItem: handleDeleteItem,// 删除项的回调函数
                    onCopyItem: handleCopyItem,// 复制项的回调函数
                    onReplaceItem: handleReplaceItem,// 替换项的回调函数
                    collapseChange: handleCollapseChange// 折叠面板展开的回调函数
                }
            }

            initFormData={initFormData}
            formType="advanced"
            config={{ formName: 'Collections' }}

            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 