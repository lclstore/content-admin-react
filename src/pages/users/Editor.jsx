import React, { useState, useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import { validateEmail, validatePassword } from '@/utils';
import request from "@/request";
import { md5Encrypt } from '@/utils';

export default function UserEditorWithCommon({ id, onSubmit }) {
    // 初始用户数据状态
    const initialValues = {}

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name',
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
    ], []);

    // 保存用户数据
    const handleSaveUser = (values, formId, { setLoading, setDirty, messageApi }) => {
        values.password = md5Encrypt(values.password)

        const dataToSave = {
            ...(formId && { id: parseInt(formId, 10) }),
            name: values.name.trim(),
            email: values.email ? values.email.trim() : '',
            password: values.password
        };

        request.post({
            url: "/user/add",
            load: true,
            data: dataToSave,
            callback(res) {
                messageApi.success('用户数据保存成功！');
                if (typeof setLoading === 'function') {
                    setLoading(false);
                }
                setDirty(false);
                onFinish && onFinish();
            }
        });
    };

    // 请求用户数据
    const initFormData = (formId) => {
        return new Promise((resolve) => {
            if (formId) {
                request.get({
                    url: `/user/detail/${formId}`,
                    load: true,
                    callback(res) {
                        resolve({ ...res.data.data, password: "*******" } || {})
                    }
                })
            } else {
                resolve(initialValues);
            }
        });
    };
    return (
        <CommonEditorForm
            changeHeader={false}
            initFormData={initFormData}
            formType="basic"
            config={{ formName: 'User', hideSaveButton: false, hideBackButton: true }}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
            onSubmit={onSubmit}
            id={id}
        />
    );
} 