import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';

export default function HomeEditorWithCommon({ id, setFormRef }) {
    // 初始数据状态
    const initialValues = {
    }

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'appCode',
            label: 'App Code',
            maxLength: 100,
            required: true,
            placeholder: 'Enter App Code',
            rules: [
                { required: true, message: 'Please input App Code' },
                { max: 100, message: 'App Code cannot exceed 100 characters' }
            ]
        },
        {
            type: 'upload',
            name: 'appIcon',
            label: 'App Icon',
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
            style: {
                width: '96px',
                height: '96px'
            }
        },
        {
            type: 'input',
            name: 'appleStoreName',
            label: 'Apple Store Name',
            maxLength: 100,
            placeholder: 'Enter Apple Store Name',
            rules: [
                { max: 100, message: 'Apple Store Name cannot exceed 100 characters' }
            ]
        }
    ], []);

    return (
        <CommonEditorForm
            changeHeader={false}
            formType="basic"
            isBack={false}
            config={{ formName: 'Info', hideSaveButton: false, hideBackButton: true }}
            fields={formFields}
            initialValues={initialValues}
            id={id}
            moduleKey="home"
            setFormRef={setFormRef}
        />
    );
}