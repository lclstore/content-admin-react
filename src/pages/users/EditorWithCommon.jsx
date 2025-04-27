import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import CommonEditor from '@/components/CommonEditorForm';

// 模拟用户数据 (与 UsersList.jsx 中的数据保持一致)
const mockUsers = [
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Admin',
        createTime: '2024-01-15 10:00:00',
        status: 'Enable'
    },
    {
        id: 2,
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        avatar: '',
        createUser: 'Admin',
        createTime: '2024-01-16 14:30:00',
        status: 'Enable'
    },
    {
        id: 3,
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        avatar: null,
        createUser: 'Manager',
        createTime: '2024-01-17 09:15:00',
        status: 'Disable'
    },
    {
        id: 4,
        name: 'Sarah Davis',
        email: 'sarah.davis@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Manager',
        createTime: '2024-01-18 16:45:00',
        status: 'Enable'
    }
];

/**
 * 使用通用编辑器的用户编辑页面
 * 展示如何使用CommonEditor简化表单开发
 */
export default function UserEditorWithCommon() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('id'); // 获取用户ID

    // 初始用户数据状态
    const [initialValues, setInitialValues] = useState({});
    // 加载状态
    const [loading, setLoading] = useState(false);

    // 上传前的校验
    const beforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('只能上传JPG/PNG格式的图片!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('图片大小不能超过2MB!');
        }
        return isJpgOrPng && isLt2M;
    };

    // 表单字段配置
    const formFields = [
        {
            type: 'avatar',
            name: 'avatar',
            label: '用户头像',
            required: true,
            uploadUrl: '/api/upload/avatar', // 实际上传API地址
            beforeUpload: beforeUpload,
            uploadText: '点击或拖拽文件上传',
            uploadDescription: 'JPG或PNG格式，最大2MB',
            changeButtonText: '更改'
        },
        {
            type: 'input',
            name: 'name',
            label: '姓名',
            required: true,
            placeholder: '请输入用户姓名',
            rules: [
                { max: 100, message: '姓名不能超过100个字符' }
            ]
        },
        {
            type: 'input',
            name: 'email',
            label: '邮箱地址',
            required: true,
            placeholder: '请输入邮箱地址',
            rules: [
                { type: 'email', message: '请输入有效的邮箱地址' },
                { max: 100, message: '邮箱不能超过100个字符' }
            ]
        },
        {
            type: 'password',
            name: 'password',
            label: '密码',
            required: true,
            placeholder: '请输入密码',
            rules: [
                { max: 100, message: '密码不能超过100个字符' }
            ]
        },
        {
            type: 'switch',
            name: 'status',
            label: '状态',
            showStatus: true,
            enableText: '启用',
            disableText: '禁用'
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
                        name: userToEdit.name,
                        email: userToEdit.email,
                        avatar: userToEdit.avatar || '',
                        status: userToEdit.status === 'Enable', // 将字符串转为布尔值
                    });
                } else {
                    message.error('找不到用户数据，即将返回列表页');
                    setTimeout(() => navigate('/users'), 1500);
                }
                setLoading(false);
            }, 800);
        } else {
            // 新增用户，设置默认值
            setInitialValues({
                name: '',
                email: '',
                avatar: '',
                status: true,
            });
        }
    }, [userId, navigate]);

    // 保存用户数据
    const handleSaveUser = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
        console.log('保存用户数据:', values, id);

        // 处理数据格式
        const dataToSave = {
            ...(id && { id: parseInt(id, 10) }),
            name: values.name.trim(),
            email: values.email.trim(),
            avatar: values.avatar,
            status: values.status ? 'Enable' : 'Disable',
            password: values.password,
        };

        // 模拟API请求
        setTimeout(() => {
            // 成功处理
            messageApi.success('用户数据保存成功！');
            setLoading(false);
            setDirty(false);

            // 2秒后跳转回列表页
            setTimeout(() => navigate('/users'), 1000);
        }, 800);
    };

    // 编辑器配置
    const editorConfig = {
        itemName: '用户',
        editTitle: '编辑',
        addTitle: '新增',
        saveButtonText: '保存用户',
        backButtonText: '返回',
        backUrl: '/users',
        confirmUnsavedChanges: true,
        unsavedChangesMessage: '你有未保存的更改，确定要离开吗？',
        saveSuccessMessage: '用户数据保存成功！',
        validationErrorMessage: '请检查表单填写是否正确',
        uploadSuccessMessage: '头像上传成功',
        uploadFailMessage: '无法获取头像URL',
        uploadErrorMessage: '头像上传失败',
        containerClassName: 'editor-form-container'
    };

    return (
        <CommonEditor
            formType="simple"
            config={editorConfig}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
            loading={loading}
        />
    );
} 