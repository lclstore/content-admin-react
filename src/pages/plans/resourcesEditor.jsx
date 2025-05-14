import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './components/Data';
import { validateEmail, validatePassword } from '@/utils';

export default function UserEditorWithCommon() {
    const navigate = useNavigate();


    const [loading, setLoading] = useState(true);
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
            placeholder: '',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'select',
            mode: 'single',
            name: 'application',
            label: 'Application',
            options: [
                { name: 'Plan', value: 'Plan' },
                { name: 'Plan-Workout', value: 'Plan-Workout' },
            ],
            required: true,
        },
        {
            type: 'upload',
            name: 'coverImage', // 遵循命名规范，使用Url后缀
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
        },
        {
            type: 'upload',
            name: 'detailImage', // 遵循命名规范，使用Url后缀
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
        },
        {
            type: 'upload',
            name: 'thumbnailImage', // 遵循命名规范，使用Url后缀
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
        },
        {
            type: 'upload',
            name: 'completeImage', // 遵循命名规范，使用Url后缀
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
        },

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    // 保存用户数据
    const handleSaveUser = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
        console.log('保存用户数据:', values, id);

        // 处理数据格式
        const dataToSave = {
            ...(id && { id: parseInt(id, 10) }),
            name: values.name.trim(),
            email: values.email ? values.email.trim() : '',
            avatar: values.avatar,
            status: values.status,
            userPassword: values.userPassword,
            birthday: values.birthday,
            // 如果有timeRange，从中提取startDate和endDate
            ...(values.timeRange && values.timeRange.length === 2 ? {
                startDate: values.timeRange[0],
                endDate: values.timeRange[1]
            } : {}),
            selectedRoles: values.selectedRoles || [],
            // 保存联动选择器的值
            layoutType: values.layoutType,
            contentStyle: values.contentStyle
        };

        // 模拟API请求（注意：这里为了演示，移除了 setTimeout 模拟延迟）
        // 实际应用中，这里应该是异步请求

        // 成功处理
        messageApi.success('用户数据保存成功！');

        // 检查 setLoading 是否为函数再调用，防止 CommonEditorForm 未传递该函数导致报错
        if (typeof setLoading === 'function') {
            setLoading(false);
        }
        setDirty(false);

        // 保存成功后立即跳转回列表页
        navigate(-1);
    };

    //请求列数据方法
    const initFormData = (id) => {
        return new Promise((resolve) => {
            // 模拟延迟 1 秒
            setTimeout(() => {
                if (id) {
                    // 查找对应用户
                    const user = mockUsers.find(u => u.id === parseInt(id, 10));
                    resolve(user || {});  // 找不到也返回空对象，避免 undefined
                } else {
                    // 新增场景：直接返回空对象
                    resolve(initialValues);
                }
            }, 1000);
        });
    };
    return (
        <CommonEditorForm
            initFormData={initFormData}
            formType="basic"
            config={{ formName: 'User', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 