import React, { useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm/index.jsx';

export default function UserEditorWithCommon() {


    // 初始用户数据状态--可设默认值
    const initialValues = {
        layoutType: 1,
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
            name: 'applicationCode',
            label: 'Application',
            options: "BizResourceApplicationEnums",
            required: true,
        },
        {
           type: 'select',
            mode: 'single',
            name: 'genderCode',
            label: 'Gender',
            options: 'BizExerciseGenderEnums',
            required: true
        },
        {
            type: 'upload',
            name: 'coverImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Cover Image',
            acceptedFileTypes: 'png,webp',
            //文件上传后修改name
            onChange: (value, file, form) => {
                const formValus = form.getFieldsValue();
                form.setFieldsValue({
                    detailImage: formValus['detailImage'] || value,
                    thumbnailImage: formValus['thumbnailImage'] || value,
                    completeImage: formValus['completeImage'] || value,
                });
            },
            maxFileSize: 2 * 1024,
            required: true
        },
        {
            type: 'upload',
            name: 'detailImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Detail Image',
            acceptedFileTypes: 'png,webp',
            onChange: (value, file, form) => {
                const formValus = form.getFieldsValue();
                form.setFieldsValue({
                    coverImage: formValus['coverImage'] || value,
                    thumbnailImage: formValus['thumbnailImage'] || value,
                    completeImage: formValus['completeImage'] || value,
                });
            },
            maxFileSize: 2 * 1024,
            required: true
        },
        {
            type: 'upload',
            name: 'thumbnailImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Thumbnail Image',
            acceptedFileTypes: 'png,webp',
            onChange: (value, file, form) => {
                const formValus = form.getFieldsValue();
                form.setFieldsValue({
                    coverImage: formValus['coverImage'] || value,
                    detailImage: formValus['detailImage'] || value,
                    completeImage: formValus['completeImage'] || value,
                });
            },
            maxFileSize: 2 * 1024,
            required: true
        },
        {
            type: 'upload',
            name: 'completeImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Complete Image',
            acceptedFileTypes: 'png,webp',
            onChange: (value, file, form) => {
                const formValus = form.getFieldsValue();
                form.setFieldsValue({
                    coverImage: formValus['coverImage'] || value,
                    detailImage: formValus['detailImage'] || value,
                    thumbnailImage: formValus['thumbnailImage'] || value,
                });
            },
            //文件上传后修改name
            maxFileSize: 2 * 1024,
            required: true
        },

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建
    return (
        <CommonEditorForm
            formType="basic"
            moduleKey="resource"
            config={{ formName: 'Resource', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={initialValues}
        />
    );
} 