import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { PlusOutlined } from '@ant-design/icons';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { HeaderContext } from '@/contexts/HeaderContext';
import { validateEmail, validatePassword } from '@/utils';
import { SaveOutlined, LogoutOutlined } from '@ant-design/icons';

export default function UserEditorWithCommon() {
    const navigate = useNavigate();


    const [loading, setLoading] = useState(true);
    // 初始用户数据状态--可设默认值
    const initialValues = {
        // layoutType: 1,
        // status2: [1, 2],
        // status: 1, // 确保status有默认值1
        // // 为联动选择器设置默认值 - 使用数字类型
        // contentStyle: 'style1'
    }
    // 表单字段配置
    const formFields = useMemo(() => [

        {
            type: 'upload',
            name: 'profilePicture', // 遵循命名规范，使用Url后缀
            label: 'Profile Picture',
            uploadButtonText: "Change",
            // uploadFn: fileSettings.uploadFile,
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
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
            type: 'input',
            name: 'emailAddress',
            maxLength: 100,
            label: 'Email',
            required: true,
            placeholder: 'Enter email...',
            rules: [
                { required: true, message: 'Please input Email.' },
                { max: 100, message: 'Email cannot exceed 100 characters' },
                // 邮箱格式验证
                {
                    validator: async (_, value) => {
                        if (value && !validateEmail(value)) {
                            return Promise.reject('Email is not valid.');
                        }
                        return Promise.resolve();
                    },
                },
            ]
        },
        {
            type: 'password',
            name: 'userPassword',
            label: 'Password',
            required: true,
            placeholder: 'Enter password...',
            rules: [
                { required: true, message: 'Please input passowrd.' },
                {
                    validator: async (_, value) => {
                        if (value && !validatePassword(value)) {
                            return Promise.reject(
                                'The password must contain letters (uppercase or lowercase) and numbers (0-9) and be 8-12 characters long.'
                            );
                        }
                        return Promise.resolve();
                    },
                }
            ]
        }

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
        //  if (!account) {
        //     setAccountError("Email cannot be empty.");
        //     hasError = true;
        // } else if (!validateEmail(account)) {
        //     setAccountError("Email is not valid.");
        //     hasError = true;
        // }

        // if (!password) {
        //     setPasswordError("Password cannot be empty.");
        //     hasError = true;
        // }

        // if (hasError) {
        //     return false;
        // }
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
        navigate('/profile/list');
    };
    const headerButtons = [
        {
            key: 'save',
            text: 'Save',
            icon: <SaveOutlined />,
            type: 'primary',
            onClick: () => {
                
            },
        },
        {
            key: 'logout',
            text: 'SIGN OUT',
            icon: <LogoutOutlined />,
            type: 'default',
            onClick: () => {
                navigate('/login');
            },
        }
    ]
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
            config={{ formName: 'Profile', title: 'Profile', headerButtons }}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 