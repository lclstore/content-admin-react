import React, { useState, useMemo, useEffect } from 'react';
import { formatDate } from '@/utils/index';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from "@/request";

import {
    ThunderboltOutlined,
    TagsOutlined,
    PictureOutlined,
    VideoCameraOutlined,
    SettingOutlined
} from '@ant-design/icons';

export default function UserEditorWithCommon() {

    var filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList',
        },
        {
            title: 'Structure Type',
            key: 'structureTypeCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseStructureTypeEnums'
        },
        {
            title: 'Gender',
            key: 'genderCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseGenderEnums'
        },
        {
            title: 'Difficulty',
            key: 'difficultyCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseDifficultyEnums'
        },
        {
            title: 'Equipment',
            key: 'equipmentCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseEquipmentEnums'
        },
        {
            title: 'Position',
            key: 'positionCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExercisePositionEnums',
        },
        {
            title: 'Injured',
            key: 'injuredCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseInjuredEnums'
        },

    ];
    // 初始用户数据状态--可设默认值
    const defaultInitialValues = {
        premium: 0,
        genderCode: 'MALE',
        difficultyCode: 'BEGINNER',
        positionCode: 'SEATED',
        newStartTime: formatDate(new Date(), 'YYYY-MM-DDTHH:mm:ss'),
        newEndTime: formatDate(new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), 'YYYY-MM-DDTHH:mm:ss'),//往后14天
    }
    const [initialValues, setInitialValues] = useState(defaultInitialValues);



    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue();
        form.setFieldsValue({
            coverImgUrl: formValues.coverImgUrl || value,
            detailImgUrl: formValues.detailImgUrl || value,
            thumbnailImgUrl: formValues.thumbnailImgUrl || value,
            completeImgUrl: formValues.completeImgUrl || value,
        });
    }

    //请求列数据方法
    const initFormData = (id) => {
        return new Promise((resolve) => {
            // 模拟延迟 1 秒
            setTimeout(() => {
                if (id) {

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
                    type: 'select',
                    name: 'premium',
                    label: 'Premium',
                    options: [
                        { label: 'Yes', value: 1 },
                        { label: 'No', value: 0 },
                    ],

                },
                {
                    type: 'dateRange',
                    name: 'timeRange',
                    label: 'New Date',
                    keys: ['newStartTime', 'newEndTime'],
                    required: false,
                },
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
        },
        {
            label: 'Image',
            name: 'image',
            icon: <PictureOutlined />,
            fields: [
                {
                    type: 'upload',
                    name: 'coverImgUrl',
                    label: 'Cover Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'detailImgUrl',
                    label: 'Detail Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'thumbnailImgUrl',
                    label: 'Thumbnail Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'completeImgUrl',
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
                    name: 'genderCode',
                    label: 'Gender',
                    required: true,
                    options: 'BizExerciseGenderEnums'
                },
                {
                    type: 'select',
                    name: 'difficultyCode',
                    label: 'Difficulty',
                    required: true,
                    options: 'BizExerciseDifficultyEnums'
                },
                {
                    type: 'select',
                    name: 'positionCode',
                    label: 'Position',
                    required: true,
                    options: 'BizExercisePositionEnums'
                },
                {
                    type: 'select',
                    name: 'injuredCode',
                    label: 'Injured',
                    mode: 'multiple',
                    required: true,
                    options: 'BizExerciseInjuredEnums'
                },
            ]
        },
        {

            title: 'Structure',
            label: 'Structure Settings',
            name: 'structure',
            isShowAdd: true,
            formterList: (dataList) => {
                return dataList?.map(item => {
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

        }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    // 使用新设计：只维护一个formFields状态，并提供更新回调
    const [formFields, setFormFields] = useState(initialFormFields);

    // 处理formFields变更的回调
    const handleFormFieldsChange = (updatedFields, formValues) => {
        setFormFields(updatedFields);
        if (defaultInitialValues !== initialValues) {
            setInitialValues(formValues);
        }
    };



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
    const initCommonListData = (params) => {
        console.log('initCommonListData', params);

        return new Promise(resolve => {
            request.get({
                url: `/exercise/page`,
                load: false,
                data: params,
                callback: res => resolve(res?.data)
            });
        })
    }

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
                title: 'Exercises',
            }}
            moduleKey='workout'
            isCollapse={true}
            initFormData={initFormData}
            formType="advanced"
            enableDraft={true}
            fieldsToValidate={['name', 'birthday']}
            config={{ formName: 'Workout', title: 'Workout details' }}
            initialValues={initialValues}

        />
    );
} 