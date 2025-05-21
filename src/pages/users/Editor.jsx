import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { validateEmail, validatePassword } from '@/utils';
import request from "@/request";
import Password from 'antd/es/input/Password';
import md5 from "md5"
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
            placeholder: 'Enter name...',
            rules: [
                { max: 100, message: 'Please input your name' }
            ]
        },
        {
            type: 'input',
            name: 'email',
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
            name: 'password',
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
        values.password = md5(values.password)
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
        console.log('dataToSave', dataToSave)
        // 模拟API请求（注意：这里为了演示，移除了 setTimeout 模拟延迟）
        // 实际应用中，这里应该是异步请求
        new Promise(resolve => {
            request.post({
                url: "/user/add",
                load: true,
                data: values,
                callback(res) {
                    console.log('res', res)
                    resolve()
                }
            })
        })
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
        console.log(id)
        return new Promise((resolve) => {

            if (id) {
                request.get({
                    url: `/user/detail/${id}`,
                    load: true,
                    callback(res) {
                        console.log('res111', res.data.data)
                        resolve({...res.data.data,password:"*******"}||{})
                    }
                })
                // // 查找对应用户
                // const user = mockUsers.find(u => u.id === parseInt(id, 10));
                // resolve(user || {});  // 找不到也返回空对象，避免 undefined
            } else {
                // 新增场景：直接返回空对象
                resolve(initialValues);
            }
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