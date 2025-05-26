import React, { useState, useMemo } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import { validateEmail, validatePassword } from '@/utils';
import request from "@/request";
import { md5Encrypt } from '@/utils';

export default function UserEditorWithCommon({ id, setFormRef }) {
    // 初始用户数据状态
    const initialValues = {
        status: 'ENABLE',
        password: 'dfjfhj42',
        name: 'dfjfhj42',
        email: 'dfjfhj42@gmail.com',
    }

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
        return new Promise((resolve, reject) => {
            const dataToSave = { ...values };

            // 处理密码：如果正在编辑用户 (formId 存在) 且密码未更改 (仍为 "*******")，则不应发送密码字段。
            // 如果密码字段存在且不是占位符，则进行加密。
            if (formId && dataToSave.password === "*******") {
                delete dataToSave.password;
            } else if (dataToSave.password) {
                dataToSave.password = md5Encrypt(dataToSave.password);
            } else {
                // 如果密码字段为空或未定义 (可能在编辑时用户清空了它，希望设为空)
                // 但我们的校验规则是 password required: true。
                // 如果希望在编辑时允许不修改密码，则 UserEditorWithCommon 的 password 字段不应是 required: true，或者校验应更智能。
                // 当前逻辑下，如果密码为空会触发校验失败。如果校验通过了但密码为空，这里可以选择删除或发送空。
                // 为安全起见，如果密码字段最终为空，不发送。
                delete dataToSave.password;
            }

            if (formId) {
                dataToSave.id = parseInt(formId, 10);
            }

            const isEdit = !!formId;
            const apiCall = isEdit ? request.put : request.post;
            const url = isEdit ? `/user/${formId}` : "/user";

            apiCall({
                url: url,
                load: true,
                data: dataToSave,
                // Assuming request utility handles success/error internally or via these callbacks for promise behavior
                // For robust promise behavior, request.put/post should ideally return promises themselves.
                // If they don't, this promise wrapper relies on these callbacks being reliably called.
                callback: (response) => { // 'callback' usually implies success
                    messageApi.success(`User ${isEdit ? 'updated' : 'added'} successfully!`);
                    if (typeof setLoading === 'function') setLoading(false);
                    if (typeof setDirty === 'function') setDirty(false);
                    resolve(response);
                },
                // It's common for request utilities to have a separate error callback or for the main callback
                // to receive an error object. Adjust if 'request' has a different convention.
                // For now, let's assume errors are caught by a global handler or the promise from apiCall itself if it returns one.
                // If request.put/post directly return a promise that rejects on error:
            }).then(response => {
                // This .then() is redundant if apiCall's callback already resolves.
                // If apiCall itself returns a promise, the structure would be:
                // apiCall(...).then(resolve).catch(reject);
                // For now, assuming 'callback' is the primary success path.
            }).catch(error => { // This catch is for if apiCall returns a promise that might reject
                console.error(`Failed to ${isEdit ? 'update' : 'add'} user:`, error);
                messageApi.error(error?.message || `Failed to ${isEdit ? 'update' : 'add'} user.`);
                if (typeof setLoading === 'function') setLoading(false);
                reject(error);
            });
            // If apiCall doesn't return a promise and only uses callbacks, ensure error handling
            // within those callbacks can call reject(). This might require an 'errorCallback' in apiCall.
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
            // onSave={handleSaveUser}
            id={id}
            setFormRef={setFormRef}
        />
    );
} 