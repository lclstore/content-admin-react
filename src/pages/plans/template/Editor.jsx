import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/index.jsx';

export default function UserEditorWithCommon() {

    // 初始用户数据状态--可设默认值
    const initialValues = {
        layoutType: 1,
        days:28
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
            name: 'duration',
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
            max: 30,
            step: 1,
            formatter: (value) => `${value}`,
        },
        {
            type: 'inputGroup',
            name: 'warmUp',
            label: 'Warm Up',
            inputConfig: [
                {
                    type: 'input',
                    name: 'name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    width: '340px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'count',
                    label: 'Count',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'rounds',
                    label: 'Rounds',
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
            name: 'main',
            label: 'Main',
            // required: true,
            inputConfig: [
                {
                    type: 'input',
                    name: 'name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    width: '340px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'count',
                    label: 'Count',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'rounds',
                    label: 'Rounds',
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
            name: 'coolDown',
            label: 'Cool Down',
            // required: true,
            inputConfig: [
                {
                    type: 'input',
                    name: 'name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    width: '340px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'count',
                    label: 'Count',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'rounds',
                    label: 'Rounds',
                    required: true,
                    min: 1,
                    max: 5,
                    step: 1,

                    formatter: (value) => `${value}`,
                },

            ]
        }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    return (
        <CommonEditorForm
            formType="basic"
            config={{ formName: 'User', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={initialValues}
            moduleKey='template'
        />
    );
} 