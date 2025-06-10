import React, { useState, useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
export default function UserEditorWithCommon() {



    // 初始用户数据状态--可设默认值
    const initialValues = {
        translation: 1,
        usageCode:"FLOW",
        genderCode:"FEMALE_AND_MALE"
    }
    // 表单字段配置
    const formFields = useMemo(() => [

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
            label: 'Usage',
            name: 'usageCode',
            type: 'select',
            required: true,
            options: []
        },
        {
            label: 'Gender',
            name: 'genderCode',
            type: 'select',
            options: 'BizSoundGenderEnums',
            required: true,
        },
        {
            type: 'select',
            name: 'translation',
            label: 'Has a Script',
            options: [
                {
                    label: 'YES',
                    value: 1
                }, {
                    label: "NO",
                    value: 0
                },
            ],
            required: true,
        },
        {
            type: 'textarea',
            name: 'femaleScript',
            label: 'Female Script',
            required: false,
            maxLength: 1000,
            showCount: true,
            // dependencies: ['translation'],           // 声明依赖
            // content: ({ getFieldValue }) => {    // content 支持函数
            //     const layoutType = getFieldValue('translation');
            //     return !!layoutType
            // },
        },
        {
            type: 'textarea',
            name: 'maleScript',
            label: 'Male Script',
            required: false,
            maxLength: 1000,
            showCount: true
        },
        {
            type: 'upload',
            name: 'femaleAudioUrl', // 视频文件
            durationName: 'femaleAudioDuration',
            label: 'Female Audio',
            required: true,
            maxFileSize: 1024 * 5,
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            name: 'maleAudioUrl', // 视频文件
            durationName: 'maleAudioDuration',
            label: 'Male Audio',
            required: true,
            maxFileSize: 1024 * 5,
            acceptedFileTypes: 'mp3',
        }

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建



    return (
        <CommonEditorForm
            enableDraft={true}
            formType="basic"
            moduleKey="sound"
            config={{ formName: 'Sound' }}
            fields={formFields}
            initialValues={initialValues}
        />
    );
} 