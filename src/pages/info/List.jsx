import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { SaveOutlined, LogoutOutlined } from '@ant-design/icons';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';


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
            type: 'input',
            name: 'appCode', // 遵循命名规范，使用驼峰命名
            label: 'App Code',
            maxLength: 100,
            required: true,
            placeholder: 'Enter App Code',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'upload',
            name: 'appIcon', // 遵循命名规范，使用Url后缀
            label: 'App Icon',
            // required: true,
            // previewWidth: '96px',//预览宽度
            previewHeight: '96px',//预览高度
            // uploadFn: fileSettings.uploadFile,
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
        },
        {
            type: 'input',
            name: 'appleStoreName', // 遵循命名规范，使用驼峰命名
            label: 'Apple Store Name',
            maxLength: 100,
            placeholder: 'Enter Apple Store Name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    const headerButtons = [
        {
            key: 'save',
            text: 'Save',
            icon: <SaveOutlined />,
            type: 'primary',
        },
        {
            key: 'logout',
            text: 'Logout',
            icon: <LogoutOutlined />,
            type: 'default',
            onClick: () => {
                navigate('/login');
            },
        }
    ]
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
            config={{ formName: 'Info', title: 'Info', headerButtons }}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 