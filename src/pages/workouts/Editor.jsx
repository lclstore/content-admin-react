import React, { useState, useMemo, useEffect, useRef } from 'react';
import { formatDate } from '@/utils/index';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from "@/request";
import { sleep } from '@/utils/index';
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
    // const [workoutSettingInfo, setWorkoutSettingInfo] = useState(null);
    let workoutSettingInfo = useRef(null);


    useEffect(() => {
        request.get({
            url: `/workoutSetttings/detail`,
            callback: res => {
                // setWorkoutSettingInfo(res?.data?.data || {});
                workoutSettingInfo.current = res?.data?.data;
                console.log('0000001111');
                window.sessionStorage.setItem('workoutSettingInfo', JSON.stringify(res?.data?.data));
            }
        });
    }, []);

    // 设置运动时长
    const setWorkoutDuration = (data, exerciseGroup) => {
        let workoutDuration = 0;
        try {
            // 确保workoutSettingInfo存在
            workoutSettingInfo.current = workoutSettingInfo.current || JSON.parse(window.sessionStorage.getItem('workoutSettingInfo') || '{}');

            if (!workoutSettingInfo.current || !data) {
                console.warn('缺少必要的配置信息或数据');//缺少配置信息警告
                return workoutDuration;
            }

            const exerciseGroupList = exerciseGroup || data.exerciseGroupList || [];

            // 检查运动组是否有效
            if (!Array.isArray(exerciseGroupList) || exerciseGroupList.length === 0) {
                console.warn('运动组列表为空或无效');//运动组无效警告
                return workoutDuration;
            }

            // 获取第一个运动的视频时长
            const firstExercise = exerciseGroupList[0]?.exerciseList?.[0];
            if (!firstExercise) {
                console.warn('未找到有效的运动数据');//运动数据无效警告
                return workoutDuration;
            }

            const frontVideoUrlDuration = (firstExercise.frontVideoUrlDuration || 0) / 1000;//正机位时长

            // 确保配置参数有效
            const previewReps = Number(workoutSettingInfo.current.previewVideoReps) || 0;//预览次数
            const executionReps = Number(workoutSettingInfo.current.executionVideoReps) || 0;//执行次数
            const introReps = Number(workoutSettingInfo.current.introVideoReps) || 0;//介绍次数

            const Preview = frontVideoUrlDuration * previewReps;//预览时长
            const Execution = frontVideoUrlDuration * executionReps;//执行时长
            const introDuration = frontVideoUrlDuration * introReps;//介绍时长

            let allActionDuration = 0;
            // 计算所有运动组的总时长
            exerciseGroupList.forEach(item => {
                if (item && Array.isArray(item.exerciseList) && typeof item.structureRound === 'number') {
                    item.exerciseList.forEach(exercise => {
                        if (exercise && typeof item.structureRound === 'number') {
                            allActionDuration += item.structureRound * (Preview + Execution);
                        }
                    });
                }
            });
            // 计算总时长（分钟）并向上取整
            workoutDuration = Math.round((introDuration + allActionDuration) / 60) || 0;//取分
        } catch (error) {
            console.error('计算运动时长时发生错误:', error);//计算错误警告
            workoutDuration = 0;
        }

        // 确保返回值为非负数
        data.workoutDuration = Math.max(0, workoutDuration);
        return Math.max(0, workoutDuration);
    }

    // 设置运动卡路里
    const setWorkoutCalorie = (data, exerciseGroup) => {
        let allCalorie = 0;

        try {
            // 确保workoutSettingInfo存在
            workoutSettingInfo.current = workoutSettingInfo.current || JSON.parse(window.sessionStorage.getItem('workoutSettingInfo') || '{}');

            if (!workoutSettingInfo.current || !data) {
                console.warn('缺少必要的配置信息或数据');//缺少配置信息警告
                return allCalorie;
            }

            const exerciseGroupList = exerciseGroup || data.exerciseGroupList || [];

            // 检查运动组是否有效
            if (!Array.isArray(exerciseGroupList) || exerciseGroupList.length === 0) {
                console.warn('运动组列表为空或无效');//运动组无效警告
                return allCalorie;
            }

            // 获取第一个运动的视频时长
            const firstExercise = exerciseGroupList[0]?.exerciseList?.[0];
            if (!firstExercise) {
                console.warn('未找到有效的运动数据');//运动数据无效警告
                return allCalorie;
            }

            const frontVideoUrlDuration = (firstExercise.frontVideoUrlDuration || 0) / 1000;//正机位时长
            const executionReps = Number(workoutSettingInfo.current.executionVideoReps) || 0;//执行次数
            const Execution = frontVideoUrlDuration * executionReps;//执行时长

            // 计算所有运动组的总卡路里
            exerciseGroupList.forEach(item => {
                if (item && Array.isArray(item.exerciseList) && typeof item.structureRound === 'number') {
                    item.exerciseList.forEach(exercise => {
                        if (exercise && typeof exercise.met === 'number') {
                            // 使用标准体重75kg计算
                            const caloriePerExercise = item.structureRound * Execution * exercise.met * 75 / 3600;
                            allCalorie += caloriePerExercise;
                        }
                    });
                }
            });

            // 向上取整
            allCalorie = Math.ceil(allCalorie) || 0;//向上取整
        } catch (error) {
            console.error('计算卡路里时发生错误:', error);//计算错误警告
            allCalorie = 0;
        }

        // 确保返回值为非负数
        data.calorie = Math.max(0, allCalorie);
        return Math.max(0, allCalorie);
    }

    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue();
        form.setFieldsValue({
            coverImgUrl: formValues.coverImgUrl || value,
            detailImgUrl: formValues.detailImgUrl || value,
            thumbnailImgUrl: formValues.thumbnailImgUrl || value,
            completeImgUrl: formValues.completeImgUrl || value,
        });
    }


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
                    type: 'input',
                    name: 'workoutDuration',
                    tooltip: 'Auto-updated based on selected exercise.',
                    tooltipPlacement: 'right',
                    label: 'Duration (Min)',
                    placeholder: ' ',
                    disabled: true,
                },
                {
                    type: 'input',
                    placeholder: ' ',
                    name: 'calorie',
                    tooltip: 'Auto-updated based on selected exercise.',
                    tooltipPlacement: 'right',
                    label: 'Calorie (Kcal)',
                    disabled: true,
                },
                // {
                //     type: 'displayText',
                //     // type: 'displayImage',
                //     name: 'workoutDuration',
                //     label: 'Duration (Min):',
                //     // displayFn: (form) => {
                //     //     return <input disabled value={form.getFieldValue('workoutDuration') || 0} />
                //     // },
                // },
                // {
                //     type: 'displayText',
                //     name: 'calorie',
                //     label: 'Calorie:',
                //     displayFn: (form) => {
                //         return <div>{form.getFieldValue('calorie') || 0}  </div>
                //     },

                // },
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
                    name: 'injuredCodes',
                    label: 'Injured',
                    mode: 'multiple',
                    required: true,
                    options: 'BizExerciseInjuredEnums'
                },
            ]
        },
        {

            title: 'Structure',
            label: 'Structure Settings1',
            name: 'exerciseGroupList',
            isGroup: true,
            systemCount: 1,
            isShowAdd: true,
            formterList: (dataList) => {
                return dataList?.map(item => {
                    return {
                        name: item.name,
                        id: item.id
                    }
                })
            },

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
                    name: 'structureRound', // 修改字段名避免重复
                    label: 'Reps',
                    required: true,
                },
                {
                    type: 'structureList',
                    name: 'exerciseIdList',
                    dataList: [],
                    label: 'Exercises',
                    // placeholder: 'Please add exercises...',
                    required: true,
                },
            ]

        },
        // {

        //     title: 'Structure',
        //     label: 'Structure Settings',
        //     name: 'structure',
        //     isShowAdd: true,
        //     icon: <VideoCameraOutlined />,
        //     fields: [
        //         {
        //             type: 'structureList',
        //             name: 'exerciseList',
        //             // renderItemMata: renderItemMata,
        //             label: 'Exercises',
        //             dataList: [],
        //             structureListFields: [
        //                 {
        //                     type: 'input',
        //                     required: true,
        //                     setDefaultValue: (data) => {
        //                         return data.name
        //                     },
        //                     name: 'displayName',
        //                     label: 'Display Name',
        //                 },
        //                 {
        //                     type: 'select',
        //                     name: 'premium',
        //                     label: 'Premium',
        //                     required: true,
        //                     setDefaultValue: 0,
        //                     options: [
        //                         { label: 'Yes', value: 1 },
        //                         { label: 'No', value: 0 },
        //                     ],
        //                 },

        //             ],

        //             rules: [
        //                 { required: true, message: 'Please add at least one music' },
        //             ]
        //         },


        //     ]


        // }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    // 使用新设计：只维护一个formFields状态，并提供更新回调
    const [formFields, setFormFields] = useState(initialFormFields);
    // 更新运动时长
    const updateWorkoutDuration = (updatedFields, form) => {
        const data = form.getFieldsValue(true);
        const exerciseGroupList = updatedFields.filter(item => item.isGroup) || [];
        if (exerciseGroupList.length > 0) {
            const newExerciseGroupList = exerciseGroupList.map((item, index) => {
                return {
                    ...item,
                    exerciseList: item.fields.find(subItem => subItem.dataList)?.dataList,
                    structureRound: form.getFieldValue(`structureRound${index ? index : ''}`),
                    structureName: form.getFieldValue(`structureName${index ? index : ''}`)
                }
            })
            let workoutDuration = setWorkoutDuration(data, newExerciseGroupList);
            let workoutCalorie = setWorkoutCalorie(data, newExerciseGroupList);
            form.setFieldValue('workoutDuration', workoutDuration)
            form.setFieldValue('calorie', workoutCalorie)
        }
    }

    // 处理formFields变更的回调
    const handleFormFieldsChange = (updatedFields, form) => {

        setFormFields(updatedFields);
        updateWorkoutDuration(updatedFields, form)

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
                        const structureRound = formValues[`structureRound${index == 0 ? '' : index}`] | 0;
                        loopCount = structureRound * item.dataList.length;
                        const calories = MET * 75 / 3600 * execution * structureRound * item.dataList.length;
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
    const saveBeforeTransform = (info) => {
        const { formFields, formValues } = info;
        console.log(info);

        const exerciseGroupList = [];
        const groupList = formFields.filter(item => item.isGroup) || [];
        console.log(formValues);
        groupList.forEach((item, index) => {
            exerciseGroupList.push({
                structureName: formValues[`structureName${index ? index : ''}`],
                structureRound: formValues[`structureRound${index ? index : ''}`],
                exerciseList: formValues[`exerciseIdList${index ? index : ''}`]?.map(item => item.id)
            })
            delete formValues[`exerciseIdList${index ? index : ''}`];
        })
        formValues['exerciseGroupList'] = exerciseGroupList;

        return formValues;
    }
    /**
     * 处理表单数据后的回调函数
     * @param {Object} data - 原始数据
     * @param {Object} params - 回调参数
     * @param {Function} params.setInternalFormFields - 设置内部表单字段的函数
     * @param {Array} params.updatedFields - 更新后的字段配置
     * @returns {Object} 处理后的数据
     */
    const getDataAfter = (data, { setInternalFormFields, updatedFields }) => {
        // 获取基础字段配置（非分组字段）
        const baseFields = updatedFields.filter(item => !item.isGroup);
        // 获取分组类型的字段配置模板
        const structureTemplate = updatedFields.find(item => item.isGroup);

        // 如果没有运动组数据，直接返回原始数据
        if (!data?.exerciseGroupList?.length || !structureTemplate) {
            return data;
        }
        // 初始化新的分组字段列表
        const newStructureFields = [];

        // 处理运动组数据
        data.exerciseGroupList.forEach((exerciseGroup, index) => {
            // 创建新的分组字段配置
            const newField = createGroupField(structureTemplate, index, exerciseGroup, data);
            newStructureFields.push(newField);

            // 在数据对象中设置运动列表
            const fieldKey = `exerciseIdList${index || ''}`;
            data[fieldKey] = exerciseGroup.exerciseList;
        });

        // 合并基础字段和新的分组字段
        const newFields = [...baseFields, ...newStructureFields];
        setWorkoutDuration(data)//计算时长
        setWorkoutCalorie(data)//计算卡路里
        setFormFields(newFields);

        console.log(newFields);

        console.log(data);

        return data;
    };

    /**
     * 创建运动组的字段配置
     * @param {Object} template - 基础字段配置模板
     * @param {number} index - 运动组索引
     * @param {Object} exerciseGroup - 运动组数据
     * @returns {Object} 新的字段配置
     */
    const createGroupField = (template, index, exerciseGroup, data) => {
        const isFirstGroup = index === 0;
        return {
            ...template,
            // 第一个分组保持原名，后续分组添加索引
            name: isFirstGroup ? template.name : `${template.name}${index}`,
            fields: template.fields.map(field => {
                data[`${field.name}${index ? index : ''}`] = exerciseGroup[field.name];
                return {
                    ...field,
                    // 更新exerciseIdList字段的名称和数据
                    name: `${field.name}${isFirstGroup ? '' : index}`,
                    dataList: field.name === 'exerciseIdList'
                        ? exerciseGroup.exerciseList
                        : field.dataList
                }
            })
        };
    };

    return (
        <>{
            <CommonEditorForm
                // 传递当前formFields状态
                fields={formFields}
                // 提供更新配置项回调
                onFormFieldsChange={handleFormFieldsChange}
                saveBeforeTransform={saveBeforeTransform}
                getDataAfter={getDataAfter}
                // 提供折叠面板展开回调
                // onCollapseChange={handleCollapseChange}
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
                formType="advanced"
                enableDraft={true}
                fieldsToValidate={['name', 'birthday']}
                config={{ formName: 'Workout', title: 'Workout details' }}
                initialValues={initialValues}

            />
        }
        </>
    );
} 