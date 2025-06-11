import React, { useMemo, } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
export default function UserEditorWithCommon({id, setFormRef}) {

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'upload',
            // required: true,
            name: 'audioUrl', // 视频文件
            label: 'Audio',
            required: true,
            durationName: 'audioDuration',
            acceptedFileTypes: 'mp3',
            //文件上传后修改name
            onChange: (value, file, form) => {
                form.setFieldsValue({
                    displayName: file?.name || '',
                    name: file?.name || '',
                });
            },
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
        },
        {
            type: 'input',
            name: 'displayName', // 遵循命名规范，使用驼峰命名
            label: 'Display Name',
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
            
            changeHeader={false}
            formType="basic"
            moduleKey="music"
            isBack={false}
            enableDraft={true}
            config={{ formName: 'Music', hideSaveButton
                : false, hideBackButton: true }}
            fields={formFields}
            id={id}
            initialValues={{}}
            setFormRef={setFormRef}
        />
    );
} 