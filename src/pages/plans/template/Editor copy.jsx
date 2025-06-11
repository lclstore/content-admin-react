import React, { useCallback, useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/index.jsx';

export default function UserEditorWithCommon() {

    // 初始用户数据状态--可设默认值
    const initialValues = {
        layoutType: 1,
        days: 28,
        durationCode: "TEN_FIFTEEN_MINUTES",
        structureType1: 1
        // status2: [1, 2],
        // status: 1, // 确保status有默认值1
        // // 为联动选择器设置默认值 - 使用数字类型
        // contentStyle: 'style1'
    }
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Enter user name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'textarea',
            name: 'description', // 遵循命名规范，使用驼峰命名
            label: 'Description',
            maxLength: 1000,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'durationCode',
            label: 'Duration (Min)',
            options: "BizTemplateDurationEnums",
            required: true,
        },
        {
            type: 'numberStepper',
            name: 'days',
            label: 'Days',
            required: true,
            min: 1,
            max: 28,
            step: 28,
            formatter: (value) => `${value}`,
        },
        {
            type: 'inputGroup',
            name: 'warmUp',
            label: '',
            inputConfig: [
                {
                    type: 'select',
                    name: 'structureType1',
                    label: 'structureType',
                    width: '300px',
                    options: [
                        {
                            label: 'Warm Up',
                            value: 0
                        }, {
                            label: "Main",
                            value: 1
                        }, {
                            label: "Cool Down",
                            value: 2
                        },
                    ],
                    required: true,
                },
                {
                    type: 'input',
                    name: 'WARM_UP_name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    width: '240px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_count',
                    label: 'Main',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_round',
                    label: 'Warm Up',
                    required: true,
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => `${value}`,
                },

            ]
        },
        {
            type: 'inputGroup',
            name: 'warmUp',
            label: '',
            inputConfig: [
                {
                    type: 'select',
                    name: 'structureType1',
                    label: '',
                    width: '300px',
                    options: [
                        {
                            label: 'Warm Up',
                            value: 0
                        }, {
                            label: "Main",
                            value: 1
                        }, {
                            label: "Cool Down",
                            value: 2
                        },
                    ],
                    required: true,
                },
                {
                    type: 'input',
                    name: 'WARM_UP_name',
                    label: '',
                    required: true,
                    maxLength: 100,
                    width: '240px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_count',
                    label: '',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_round',
                    label: '',
                    required: true,
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => `${value}`,
                },

            ]
        },
        {
            type: 'inputGroup',
            name: 'warmUp',
            label: '',
            inputConfig: [
                {
                    type: 'select',
                    name: 'structureType1',
                    label: '',
                    width: '300px',
                    options: [
                        {
                            label: 'Warm Up',
                            value: 0
                        }, {
                            label: "Main",
                            value: 1
                        }, {
                            label: "Cool Down",
                            value: 2
                        },
                    ],
                    required: true,
                },
                {
                    type: 'input',
                    name: 'WARM_UP_name',
                    label: '',
                    required: true,
                    maxLength: 100,
                    width: '240px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_count',
                    label: '',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_round',
                    label: '',
                    required: true,
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => `${value}`,
                },

            ]
        },
        // {
        //     type: 'inputGroup',
        //     name: 'warmUp',
        //     label: 'Warm Up',
        //     inputConfig: [
        //         {
        //             type: 'input',
        //             name: 'WARM_UP_name',
        //             label: 'Name',
        //             required: true,
        //             maxLength: 100,
        //             width: '340px',
        //             showCount: true,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'WARM_UP_count',
        //             label: 'Count',
        //             required: true,
        //             min: 2,
        //             max: 20,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'WARM_UP_round',
        //             label: 'Rounds',
        //             required: true,
        //             min: 1,
        //             max: 5,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },

        //     ]
        // },
        // {
        //     type: 'inputGroup',
        //     name: 'main',
        //     label: 'Main',
        //     // required: true,
        //     inputConfig: [
        //         {
        //             type: 'input',
        //             name: 'MAIN_name',
        //             label: 'Name',
        //             required: true,
        //             maxLength: 100,
        //             width: '340px',
        //             showCount: true,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'MAIN_count',
        //             label: 'Count',
        //             required: true,
        //             min: 2,
        //             max: 20,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'MAIN_round',
        //             label: 'Rounds',
        //             required: true,
        //             min: 1,
        //             max: 5,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },

        //     ]
        // },
        // {
        //     type: 'inputGroup',
        //     name: 'coolDown',
        //     label: 'Cool Down',
        //     // required: true,
        //     inputConfig: [
        //         {
        //             type: 'input',
        //             name: 'COOL_DOWN_name',
        //             label: 'Name',
        //             required: true,
        //             maxLength: 100,
        //             width: '340px',
        //             showCount: true,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'COOL_DOWN_count',
        //             label: 'Count',
        //             required: true,
        //             min: 2,
        //             max: 20,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'COOL_DOWN_round',
        //             label: 'Rounds',
        //             required: true,
        //             min: 1,
        //             max: 5,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },

        //     ]
        // }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    const saveBeforeTransform = useCallback(({ formValues: formData }) => {
        console.log("formDataStart", formData)
        const unitNameList = ["WARM_UP", "MAIN", "COOL_DOWN"]
        formData.unitList = unitNameList.map((unitName) => {
            return {
                "structureName": formData[`${unitName}_name`],
                "structureTypeCode": unitName,
                "count": formData[`${unitName}_count`],
                "round": formData[`${unitName}_round`]
            }
        })
        console.log("formData", formData)
        return formData
    })
    const getDataAfter = useCallback((responseData) => {
        responseData.unitList?.forEach(i => {
            responseData[`${i.structureTypeCode}_name`] = i.structureName;
            responseData[`${i.structureTypeCode}_count`] = i.count;
            responseData[`${i.structureTypeCode}_round`] = i.round;
        })
        return responseData
    })
    return (
        <CommonEditorForm
            saveBeforeTransform={saveBeforeTransform}
            getDataAfter={getDataAfter}
            formType="basic"
            config={{ formName: 'Template', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={initialValues}
            moduleKey='template'
        />
    );
} 