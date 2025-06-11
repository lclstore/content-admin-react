import React, { useCallback, useMemo, useState } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/index.jsx';
import { FormOutlined, ThunderboltOutlined } from '@ant-design/icons';
export default function UserEditorWithCommon() {

    // 初始用户数据状态--可设默认值
    const [initialValues, setInitialValues] = useState({
        layoutType: 1,
        days: 28,
        durationCode: "MIN_10_15",
        structureType1: 1,
    })
    // 表单字段配置
    const initialFormFields = useMemo(() => [
        {
            label: 'Basic Information',
            name: 'basicInfo',
            icon: <FormOutlined />,
            fields: [
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
                    type: 'numberStepper',
                    name: 'days',
                    label: 'Days',
                    required: true,
                    min: 1,
                    max: 28,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'select',
                    mode: 'single',
                    name: 'durationCode',
                    label: 'Duration (Min)',
                    options: "BizTemplateDurationEnums",
                    required: true,
                },
            ]
        },
        {
            label: 'Structure1',
            name: 'structure',
            isGroup: true,
            isShowAdd: true,
            // dataList: [],
            icon: <ThunderboltOutlined />,
            fields: [
                // {
                //     type: 'inputGroup',
                //     name: 'warmUp',
                //     label: '',

                //     // inputConfig: [


                //     // ]
                // },
                {
                    type: 'input',
                    name: 'WARM_UP_name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    width: '240px',
                    colSpan: 2,
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_count',
                    label: 'Main',
                    required: true,
                    min: 2,
                    max: 20,
                    colSpan: 2,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'WARM_UP_round',
                    label: 'Warm Up',
                    required: true,
                    colSpan: 2,
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
            ]
        }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建
    const [formFields, setFormFields] = useState(initialFormFields);
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
            formType="advanced"
            config={{ formName: 'Template', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            isCollapse={true}
            enableDraft={true}
            initialValues={initialValues}
            moduleKey='template'
        />
    );
} 