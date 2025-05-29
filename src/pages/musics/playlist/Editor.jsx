import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';

import { validateEmail, validatePassword } from '@/utils';

export default function UserEditorWithCommon() {

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name',
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Music name',
        },
        {
            type: 'switch',
            name: 'premium',
            label: 'Premium',
            checkedChildren: "Yes",
            unCheckedChildren: 'No'

        },
        {
            type: 'select',
            mode: 'single',
            name: 'type',
            label: 'Type',
            options: [
                { label: 'Regular', value: 'Regular' },
                { label: 'Yoga', value: 'Yoga' },
                { label: 'Dance', value: 'Dance' },
            ],
            required: true,
        },
        {
            type: 'input',
            name: 'name',
            label: 'Name',
            required: true,
        },



        {
            type: 'dateRange',
            name: 'timeRange',
            label: 'New Time',
            // keys: ['startDate', 'endDate'],//默认可不设置
            required: true,
        },
        {
            type: 'displayImage',
            name: 'displayImage',
            label: '',
            dependencies: ['status221'],           // 声明依赖
            content: ({ getFieldValue }) => {      // content 支持函数
                const status = getFieldValue('status221');
                return status
                    ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png'
                    : null;
            },
            style: {
                width: '100px',
                height: '100px',
            },
        },
        {
            type: 'date',
            name: 'birthday', // 遵循命名规范，使用Url后缀
            label: 'Birthday',
            required: true,
        },
        {
            type: 'upload',
            // required: true,
            name: 'videoUrl', // 视频文件
            label: 'Introduction Video',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
                // debugger
                form.setFieldsValue({
                    name: file?.name || '',
                });
            },
            style: {
                width: '290px',
                height: '140px',
            },
            acceptedFileTypes: 'mp4,mp3,webm,ts',
        },

        {
            type: 'inputGroup',
            name: 'warmUp',
            label: '',
            // required: true,
            inputConfig: [
                {
                    type: 'input',
                    name: 'warmName',
                    label: 'warmName',
                    required: true,
                    maxLength: 100,
                    width: '340px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'warmNumber',
                    label: 'Number',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'warmCycles',
                    label: 'warmCycles',
                    required: true,
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => `${value}`,
                },

            ]
        },
        {
            type: 'numberStepper',
            min: 0,
            max: 40,
            step: 10,
            formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
            name: 'numberStepper', // 修改字段名避免重复
            label: 'NumberStepper',
            required: true,
        },
        {
            type: 'upload',
            name: 'avatar', // 遵循命名规范，使用Url后缀
            label: 'Avatar',
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
        },
        // 添加带预览的single选择器示例


        {
            type: 'select',
            mode: 'single',
            name: 'status1',
            label: 'Status1',
            options: 'testStatus',
            required: true,

        },
        {
            type: 'select',
            mode: 'multiple',
            disabled: false,
            name: 'status2',
            label: 'Status2',
            options: 'statusList',
            required: true,

        },

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
            type: 'input',
            name: 'email',
            maxLength: 100,
            label: 'Email',
            required: true,
            rules: [
                { required: true, message: 'Please input Email.' },
                { max: 100, message: 'Email cannot exceed 100 characters' },
                // 邮箱格式验证
                {
                    validator: async (_, value) => {
                        if (value && !validateEmail(value)) {
                            return Promise.reject('Email is not valid.');
                        }
                        return Promise.resolve();
                    },
                },
            ]
        },
        {
            type: 'password',
            name: 'userPassword',
            label: 'Password',
            required: true,
            rules: [
                { required: true, message: 'Please input passowrd.' },
                {
                    validator: async (_, value) => {
                        if (value && !validatePassword(value)) {
                            return Promise.reject(
                                'The password must contain letters (uppercase or lowercase) and numbers (0-9) and be 8-12 characters long.'
                            );
                        }
                        return Promise.resolve();
                    },
                }
            ]
        }

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    return (
        <CommonEditorForm
            moduleKey='playlist'
            formType="basic"
            config={{ formName: 'User', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
        />
    );
} 