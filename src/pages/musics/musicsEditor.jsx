import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';


import request from "@/request";

export default function UserEditorWithCommon() {
    const navigate = useNavigate();

    //去掉后缀名
    const delSuffix = (filename) => {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.slice(0, -1).join('.') : filename;
    };
    const [loading, setLoading] = useState(true);
    // 初始用户数据状态--可设默认值
    const initialValues = {
        status: "DRAFT"
    }
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'upload',
            // required: true,
            name: 'audioUrl', // 视频文件
            label: 'Audio',
            // style: {
            //     width: '290px',
            //     height: '140px',
            // },
            //文件上传后修改name
            onChange: (value, file, form) => {
                console.log('delSuffix', delSuffix(file.name))
                form.setFieldsValue({
                    name: delSuffix(file.name) || '',
                });
            },
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Music name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        }


    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    // 保存用户数据
    const handleSaveUser = (values, id, { setLoading, setDirty, messageApi, navigate }) => {

        values.status = "DRAFT"
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
        new Promise(resolve => {
            request.post({
                url: "/music/save",
                load: true,
                data: values,
                success(res) {
                    console.log('res', res)
                    messageApi.success('Saved successfully!');
                    setTimeout(() => {
                        navigate(-1)
                    }, 1500)

                    resolve()
                }
            })
        })


        // 检查 setLoading 是否为函数再调用，防止 CommonEditorForm 未传递该函数导致报错
        if (typeof setLoading === 'function') {
            setLoading(false);
        }
        setDirty(false);


    };

    //请求列数据方法
    const initFormData = (id) => {
        return new Promise((resolve) => {
            // 模拟延迟 1 秒
            if (id) {
                // 查找对应用户
                request.get({
                    url: `/music/detail/${id}`,
                    load: true,
                    callback(res) {
                        resolve(res.data.data || {})
                    }
                })
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
            isTabs={true}
            config={{ formName: 'Music', title: 'Music', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 