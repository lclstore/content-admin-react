import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { validateEmail, validatePassword } from '@/utils';
import request from "@/request";
export default function UserEditorWithCommon() {
    const navigate = useNavigate();


    const [loading, setLoading] = useState(true);
    // 初始用户数据状态--可设默认值
    const initialValues = {
        translation: 1
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
            // required: true,
            name: 'femaleAudioUrl', // 视频文件
            label: 'Audio',
            // maxFileSize: 1024 * 1024 * 10,

            style: {
                width: '290px',
                height: '140px',
            },
            // required: true,
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            // required: true,
            name: 'maleAudioUrl', // 视频文件
            label: 'Male Audio',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            style: {
                width: '290px',
                height: '140px',
            },
            // required: true,
            acceptedFileTypes: 'mp3',
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
            type: 'switch',
            name: 'translation',
            label: 'Has a Script',
            required: true,
            checkedChildren: 'Yes',
            unCheckedChildren: 'No',
        },
        {
            type: 'textarea',
            name: 'Script',
            label: 'Script',
            required: true,
            maxLength: 1000,
            showCount: true,
            dependencies: ['translation'],           // 声明依赖
            content: ({ getFieldValue }) => {      // content 支持函数
                const layoutType = getFieldValue('translation');
                console.log('layoutType', layoutType)
                return layoutType === 1
                    ? true
                    : false;
            },
        }

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    // 保存用户数据
    const handleSaveUser = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
        console.log('保存用户数据:', values, id);
        values.audioUrl = "url"
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
        new Promise(resolve => {
            request.post({
                url: "/sound/save",
                load: true,
                data: values,
                callback(res) {
                    console.log('res', res)
                    resolve()
                }
            })
        })
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
        // navigate(-1);
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
            moduleKey="sound"

            config={{ formName: 'Sound' }}
            fields={formFields}
            initialValues={initialValues}
        // onSave={handleSaveUser}
        />
    );
} 