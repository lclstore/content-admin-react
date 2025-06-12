import React, { useCallback, useMemo, useState } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/index.jsx';
import { FormOutlined, ThunderboltOutlined } from '@ant-design/icons';
export default function UserEditorWithCommon() {

    // 初始用户数据状态--可设默认值
    const [initialValues, setInitialValues] = useState({
        days: 28,
        durationCode: "MIN_10_15",
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
                    min: 28,
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
            label: 'Structure',
            name: 'structure',
            isGroup: true,
            isShowAdd: true,
            systemCount: 3,
            // dataList: [],
            icon: <ThunderboltOutlined />,
            fields: [
                {
                    type: 'inputGroup',
                    name: 'unitList',
                    label: '',
                    required: true,
                    requiredMessage: '',
                    inputConfig: [

                        {
                            type: 'input',
                            name: 'structureName',
                            label: 'Name',
                            required: true,
                            flex: 1,
                            maxLength: 100,
                            showCount: true,
                        },
                        {
                            type: 'numberStepper',
                            name: 'count',
                            label: 'Count',
                            initValue: 2,
                            required: true,
                            min: 2,
                            max: 20,
                            step: 1,
                        },
                        {
                            type: 'numberStepper',
                            name: 'round',
                            label: 'Rounds',
                            required: true,
                            initValue: 1,
                            min: 1,
                            max: 5,
                            step: 1,
                        },

                    ]
                },
            ]
        },
        {
            label: 'Structure',
            name: 'structure1',
            isGroup: true,
            systemCount: 3,
            isShowAdd: true,
            // dataList: [],
            icon: <ThunderboltOutlined />,
            fields: [
                {
                    type: 'inputGroup',
                    name: 'unitList1',
                    label: '',
                    required: true,
                    requiredMessage: '',
                    inputConfig: [

                        {
                            type: 'input',
                            name: 'structureName1',
                            flex: 1,
                            label: 'Name',
                            required: true,
                            maxLength: 100,
                            showCount: true,
                        },
                        {
                            type: 'numberStepper',
                            name: 'count1',
                            label: 'Count',
                            initValue: 2,
                            required: true,
                            min: 2,
                            max: 20,
                            step: 1,
                        },
                        {
                            type: 'numberStepper',
                            name: 'round1',
                            label: 'Rounds',
                            required: true,
                            initValue: 1,
                            min: 1,
                            max: 5,
                            step: 1,
                        },

                    ]
                },
            ]
        },
        {
            label: 'Structure',
            name: 'structure2',
            isGroup: true,
            isShowAdd: true,
            systemCount: 3,
            // dataList: [],
            icon: <ThunderboltOutlined />,
            fields: [
                {
                    type: 'inputGroup',
                    name: 'unitList2',
                    label: '',
                    required: true,
                    requiredMessage: '',
                    inputConfig: [

                        {
                            type: 'input',
                            name: 'structureName2',
                            flex: 1,
                            label: 'Name',
                            required: true,
                            maxLength: 100,
                            showCount: true,
                        },
                        {
                            type: 'numberStepper',
                            name: 'count2',
                            label: 'Count',
                            initValue: 2,
                            required: true,
                            min: 2,
                            max: 20,
                            step: 1,
                        },
                        {
                            type: 'numberStepper',
                            name: 'round2',
                            label: 'Rounds',
                            required: true,
                            initValue: 1,
                            min: 1,
                            max: 5,
                            step: 1,
                        },

                    ]
                },
            ]
        }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建
    const [formFields, setFormFields] = useState(initialFormFields);
    let newFormFields = initialFormFields
    const handleFormFieldsChange = useCallback((updatedFields, form) => {
        setFormFields(updatedFields)
        newFormFields = updatedFields
    }, []);
    const saveBeforeTransform = useCallback(({ formValues: formData }) => {
        const structureList = newFormFields.filter(item => item.isGroup);

        const unitList = structureList.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === structureList.length - 1;

            const structureTypeCode = isFirst
                ? 'WARM_UP'
                : isLast
                    ? 'COOL_DOWN'
                    : 'MAIN';

            return {
                structureTypeCode,
                structureName: formData[`structureName${index ? index : ''}`],
                count: formData[`count${index ? index : ''}`],
                round: formData[`round${index ? index : ''}`],
            };
        });
        return {
            ...formData,
            unitList,
        };
    })
    const getDataAfter = useCallback((responseData) => {
        const currentFields = formFields.find(item => item.isGroup);

        let updatedFields = formFields;
        responseData.unitList?.forEach((item, index) => {
            const suffix = index === 0 ? '' : index;
            Object.assign(responseData, {
                [`structureName${suffix}`]: item.structureName,
                [`count${suffix}`]: item.count,
                [`round${suffix}`]: item.round,
                [`unitList${suffix}`]: item.structureName, // 注意：这行逻辑好像多余/错误？
            });
            if (index > 2) {
                updatedFields.push({
                    label: `Structure`,
                    name: `structure${index}`,
                    isGroup: true,
                    isShowAdd: true,
                    systemCount: 3,
                    icon: <ThunderboltOutlined />,
                    fields: currentFields.fields.map(field => {
                        return {
                            ...field,
                            name: `${field.name}${index}`,
                            inputConfig: field.inputConfig.map(item => {
                                return {
                                    ...item,
                                    name: `${item.name}${index}`
                                }
                            })
                        }
                    })
                })
            }
        })
        setFormFields(updatedFields);//更新表单配置
        newFormFields = updatedFields
        return responseData
    })
    return (
        <CommonEditorForm
            saveBeforeTransform={saveBeforeTransform}
            getDataAfter={getDataAfter}
            onFormFieldsChange={handleFormFieldsChange}
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