import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import CommonEditorForm from '@/components/CommonEditorForm/CommonEditorForm';
import { mockUsers } from './Data';


export default function UserEditorWithCommon() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('id'); // 获取用户ID

    // 初始用户数据状态
    const [initialValues, setInitialValues] = useState({});
    // 加载状态
    const [loading, setLoading] = useState(false);



    // 表单字段配置
    const formFields = [
        {
            type: 'text',
            name: 'email',
            label: 'Email',
            required: true,
            placeholder: 'Enter email address',
            rules: [
                { type: 'email', message: 'Please enter a valid email address' },
                { max: 100, message: 'Email cannot exceed 100 characters' }
            ]
        },
        {
            type: 'upload',
            name: 'avatar', // 遵循命名规范，使用Url后缀
            label: 'Avatar',
            required: true,
            uploadUrl: '/api/upload/avatar',
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
        },
        {
            type: 'upload',
            name: 'avatar1', // 遵循命名规范，使用Url后缀
            label: 'Avatar1',
            required: true,
            uploadUrl: '/api/upload/avatar',
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
        },
        {
            type: 'upload',
            name: 'videoUrl', // 视频文件
            label: 'Introduction Video',
            uploadUrl: '/api/upload/video',
            acceptedFileTypes: 'mp4,webm',
            showControls: true,
            previewHeight: '150px',
        },
        {
            type: 'input',
            name: 'userName', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            required: true,
            placeholder: 'Enter user name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        // {
        //     type: 'input',
        //     name: 'email',
        //     label: 'Email',
        //     required: true,
        //     placeholder: 'Enter email address',
        //     rules: [
        //         { type: 'email', message: 'Please enter a valid email address' },
        //         { max: 100, message: 'Email cannot exceed 100 characters' }
        //     ]
        // },
        {
            type: 'password',
            name: 'userPassword',
            label: 'Password',
            required: true,
            placeholder: 'Enter password',
            rules: [
                { max: 100, message: 'Password cannot exceed 100 characters' }
            ]
        },
        {
            type: 'switch',
            name: 'isActive', // 遵循命名规范，使用is前缀
            label: 'Status',
            showStatus: true,
            enableText: 'Enabled',
            disableText: 'Disabled'
        }
    ];

    // 加载用户数据
    useEffect(() => {
        if (userId) {
            setLoading(true);
            // 模拟API调用
            setTimeout(() => {
                const currentId = parseInt(userId, 10);
                const userToEdit = mockUsers.find(user => user.id === currentId);
                if (userToEdit) {
                    // 设置初始值
                    setInitialValues({
                        userName: userToEdit.userName,
                        email: userToEdit.email,
                        avatarUrl: userToEdit.avatarUrl || '',
                        isActive: userToEdit.isActive,
                        // 假设从API获取的角色数据
                        selectedRoles: userToEdit.id === 1 ? ['admin', 'editor'] : ['viewer']
                    });
                } else {
                    message.error('User data not found, returning to list page');
                    setTimeout(() => navigate('/users'), 1500);
                }
                setLoading(false);
            }, 800);
        } else {
            // 新增用户，设置默认值
            setInitialValues({
                userName: '',
                email: '',
                avatarUrl: '',
                isActive: true,
                selectedRoles: []
            });
        }
    }, [userId, navigate]);

    // 保存用户数据
    const handleSaveUser = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
        console.log('保存用户数据:', values, id);

        // 处理数据格式
        const dataToSave = {
            ...(id && { id: parseInt(id, 10) }),
            userName: values.userName.trim(),
            email: values.email.trim(),
            avatarUrl: values.avatarUrl,
            isActive: values.isActive,
            userPassword: values.userPassword,
            selectedRoles: values.selectedRoles || []
        };

        // 模拟API请求
        setTimeout(() => {
            // 成功处理
            messageApi.success('User data saved successfully!');
            setLoading(false);
            setDirty(false);

            // 2秒后跳转回列表页
            setTimeout(() => navigate(-1), 1000);
        }, 800);
    };

    // 编辑器配置
    const editorConfig = {
        itemName: 'User',
        editTitle: 'Edit',
        addTitle: 'Add',
        saveButtonText: 'Save User',
        backButtonText: 'Back',
        confirmUnsavedChanges: true,
        unsavedChangesMessage: 'You have unsaved changes. Are you sure you want to leave?',
        saveSuccessMessage: 'User data saved successfully!',
        validationErrorMessage: 'Please check the form for errors',
        uploadSuccessMessage: 'Avatar uploaded successfully',
        uploadFailMessage: 'Could not get avatar URL',
        uploadErrorMessage: 'Avatar upload failed'
    };

    // 为表单提供唯一key，确保在userId变更时重新创建表单
    const formKey = userId || 'new-user';

    return (
        <CommonEditorForm
            key={formKey}
            formType="basic"
            config={editorConfig}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
            loading={loading}
        />
    );
} 