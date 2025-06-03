import React, { useMemo, } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
export default function UserEditorWithCommon() {


    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'upload',
            // required: true,
            name: 'audioUrl', // 视频文件
            label: 'Audio',
            durationName: 'audioDuration',
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Music name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        }


    ], []); // 使用useMemo优化性能，避免每次渲染重新创建


    return (
        <CommonEditorForm
            formType="basic"
            moduleKey="music"
            enableDraft={true}
            config={{ formName: 'Music', title: 'Music', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={{}}
        />
    );
} 