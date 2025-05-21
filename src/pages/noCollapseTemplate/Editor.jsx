import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';

import CommonEditorForm from '@/components/CommonEditorForm';
import { commonListData, filterSections } from '@/pages/Data';
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
        },
        {
            reps: 3,
            structureName: 'asd3',
            list: [commonListData[4]]
        }
        ]
    }];

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
            required: true,
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

    // 使用新设计：只维护一个formFields状态，并提供更新回调
    const [formFields, setFormFields] = useState(initialFormFields);

    // 处理formFields变更的回调
    const handleFormFieldsChange = (updatedFields) => {
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
    //折叠面板展开
    const handleCollapseChange = (activeKeys, form) => {
        // 如果在此函数内更新了 formFields，可以在更新回调中获取最新值
        if (activeKeys[0] == 'workoutData') {
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
            // 传递当前formFields状态
            fields={formFields}
            // 提供更新配置项回调
            onFormFieldsChange={handleFormFieldsChange}
            // 提供折叠面板展开回调
            onCollapseChange={handleCollapseChange}
            // 其他基本配置
            // renderItemMata={renderItemMata}
            commonListConfig={{
                initCommonListData: initCommonListData,
                placeholder: 'Search your content name...',
                filterSections: filterSections,
            }}
            isCollapse={true}
            initFormData={initFormData}
            formType="advanced"
            config={{ formName: 'Collections' }}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 