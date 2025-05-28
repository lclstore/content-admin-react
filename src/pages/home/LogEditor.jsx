import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import { validateVersion } from '@/utils';

export default function LogEditorWithCommon({ id, setFormRef }) {
    // 初始日志数据状态
    const initialValues = {
    }

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'title',
            label: '标题',
            maxLength: 100,
            required: true,
            placeholder: '请输入更新标题...',
            rules: [
                { required: true, message: '请输入标题' },
                { max: 100, message: '标题不能超过100个字符' }
            ]
        },
        {
            type: 'input',
            name: 'version',
            label: '版本号',
            required: true,
            placeholder: '请输入版本号(如: 1.0.0)...',
            rules: [
                { required: true, message: '请输入版本号' },
                {
                    validator: async (_, value) => {
                        if (value && !validateVersion(value)) {
                            return Promise.reject('请输入有效的版本号格式 (如: 1.0.0)');
                        }
                        return Promise.resolve();
                    },
                }
            ]
        },
        {
            type: 'textarea',
            name: 'new',
            label: '新功能',
            placeholder: '请输入新功能描述...',
            maxLength: 1000,
            showCount: true,
            rules: [
                { max: 1000, message: '新功能描述不能超过1000个字符' }
            ]
        },
        {
            type: 'textarea',
            name: 'improved',
            label: '改进功能',
            placeholder: '请输入改进功能描述...',
            maxLength: 1000,
            showCount: true,
            rules: [
                { max: 1000, message: '改进功能描述不能超过1000个字符' }
            ]
        },
        {
            type: 'textarea',
            name: 'fixed',
            label: '修复问题',
            placeholder: '请输入修复问题描述...',
            maxLength: 1000,
            showCount: true,
            rules: [
                { max: 1000, message: '修复问题描述不能超过1000个字符' }
            ]
        },
        {
            type: 'datepicker',
            name: 'releaseDate',
            label: '发布日期',
            required: true,
            placeholder: '请选择发布日期...',
            rules: [
                { required: true, message: '请选择发布日期' }
            ]
        }
    ], []);

    return (
        <CommonEditorForm
            changeHeader={false}
            formType="basic"
            isBack={false}
            config={{ formName: 'Log', hideSaveButton: false, hideBackButton: true }}
            fields={formFields}
            initialValues={initialValues}
            id={id}
            moduleKey="log"
            setFormRef={setFormRef}
        />
    );
} 