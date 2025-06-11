import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { validateEmail, validatePassword } from '@/utils';
import { SaveOutlined, LogoutOutlined, LockOutlined, EyeOutlined, UnlockOutlined } from '@ant-design/icons';
import request from "@/request";
import Password from 'antd/es/input/Password';

export default function UserEditorWithCommon() {
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const [editorRef, setEditorRef] = useState(null);
    const [loading, setLoading] = useState(true);
    // 初始用户数据状态--可设默认值
    const initialValues = {

    }
    const [users, setUser] = useState(initialValues);
    const getUser = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/user/getMyInfo`,
                load: true,
                callback: res => {
                    console.log('res11111', res)
                    setUser({
                        ...res.data.data,
                        password: '******'
                    })
                }
            });
        })
    }

    useEffect(() => {
        getUser()//获取用户信息
    }, []);
    // 表单字段配置
    const formFields = useMemo(() => [

        {
            type: 'upload',
            name: 'profilePicture', // 遵循命名规范，使用Url后缀
            label: 'Profile Picture',
            uploadButtonText: "Change",
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
            name: 'email',
            maxLength: 100,
            label: 'Email',
            required: true,
            disabled: true,
            placeholder: 'Enter email...',
            // buttons: ['Edit', 'Save'],
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
            buttons: [
                <LockOutlined />,
                <UnlockOutlined />
            ],
            buttonClick: (form, buttonText) => {
                //如果密码输入框为禁用状态，则清空密码
                if (buttonText && form.getFieldValue('password').includes('******')) {
                    form.setFieldValue('password', null);
                }
            },
            disabled: true,

            placeholder: 'Enter password...',
            rules: [
                { required: true, message: 'Please input passowrd.' },
                {
                    validator: async (_, value) => {
                        if (value && !validatePassword(value)) {
                            return Promise.reject(
                                'The password must contain both letters and numbers and be 8 to 12 characters long.'
                            );
                        }
                        return Promise.resolve();
                    },
                }
            ]
        }

    ], []); // 使用useMemo优化性能，避免每次渲染重新创建


    const saveBeforeTransform = (info) => {
        console.log(info.formValues)
    }
    const headerButtons = [
        {
            key: 'save',
            text: 'Save',
            icon: <SaveOutlined />,
            type: 'primary',
        }
    ]
    const handleConfirmSuccess = (ret) => {
        if (ret?.success) {
            getUser()
        }
    }
    return (
        <div >
            <CommonEditorForm
                refreshKey={refreshKey}
                formType="basic"
                moduleKey='user'
                confirmSucess={handleConfirmSuccess}
                operationName="profileSave"
                isBack={false}
                config={{ formName: 'Profile', headerButtons,hideTitleOperationName: true }}
                fields={formFields}
                initialValues={users}
                setFormRef={setEditorRef}
            />
            <div style={{ maxWidth: '1000px', margin: '-5px auto', paddingLeft: '20px' }}>
                <Button
                    block
                    onClick={() => {
                        localStorage.clear()
                        navigate('/login');
                    }}
                >
                    SIGN OUT
                </Button>
            </div >
        </div >
    );
}










