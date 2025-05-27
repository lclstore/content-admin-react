import React, { useState, useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
export default function UserEditorWithCommon() {



    // 初始用户数据状态--可设默认值
    const initialValues = {
        translation: true,
    }
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'upload',
            name: 'femaleAudioUrl', // 视频文件
            label: 'Audio',
            required: true,
            maxFileSize: 1024 * 1024 * 5,
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            name: 'maleAudioUrl', // 视频文件
            label: 'Male Audio',
            required: true,
            maxFileSize: 1024 * 1024 * 5,
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Enter name...',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'switch',
            name: 'translation',
            label: 'Has a Script',
            required: true,
            checkedChildren: 'Yes',
            unCheckedChildren: 'No',
        },
        {
            type: 'textarea',
            name: 'script',
            label: 'Script',
            required: true,
            maxLength: 1000,
            showCount: true,
            dependencies: ['translation'],           // 声明依赖
            content: ({ getFieldValue }) => {      // content 支持函数
                const layoutType = getFieldValue('translation');
                console.log('layoutType', layoutType)
                return layoutType === 1
                    ? true
                    : false;
            },
        }

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建



    return (
        <CommonEditorForm

            formType="basic"
            moduleKey="sound"
            config={{ formName: 'Sound' }}
            fields={formFields}
            initialValues={initialValues}
        />
    );
} 