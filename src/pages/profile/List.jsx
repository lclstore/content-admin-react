import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { validateEmail, validatePassword } from '@/utils';
import { SaveOutlined, LogoutOutlined, LockOutlined, EyeOutlined, UnlockOutlined } from '@ant-design/icons';
import request from "@/request";

export default function UserEditorWithCommon() {
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const [editorRef, setEditorRef] = useState(null);
    const [loading, setLoading] = useState(true);
    const saveDom = useRef(null)
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
            name: 'avatar', // 遵循命名规范，使用Url后缀
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
        // 第一个保证是save按钮，会被隐藏
        {
            key: 'save',
            text: 'Save',
            icon: <SaveOutlined />,
            type: 'primary',
            style: { display: "none" },
            onClick() {
                localStorage.clear()
                navigate('/login');
            }
        },
        {
            key: 'signout',
            text: <div style={{ color: "rgb(255, 82, 82)" }}>SIGN OUT</div>,
            icon: <LogoutOutlined />,
            type: 'default',
            onClick() {
                localStorage.clear()
                navigate('/login');
            }
        },
    ]
    const handleConfirmSuccess = (ret) => {
        if (ret?.success) {
            getUser()
        }
    }
    useEffect(() => {
        setTimeout(() => {
            console.log(document.querySelector('.header-actions').querySelector("button"))
            saveDom.current = document.querySelector('.header-actions').querySelector("button")
            saveDom.current.style.display = "none";
        }, 100)

    }, []);
    return (
        <div >
            <CommonEditorForm
                refreshKey={refreshKey}
                formType="basic"
                moduleKey='user'
                confirmSucess={handleConfirmSuccess}
                operationName="profileSave"
                isBack={false}
                config={{ formName: 'Profile', headerButtons, hideTitleOperationName: true }}
                fields={formFields}
                initialValues={users}
                setFormRef={setEditorRef}
            />
            <div style={{ maxWidth: '1000px', margin: '-10px auto', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    style={{ marginLeft: '20px' }}
                    block
                    type='primary'
                    onClick={() => {
                        saveDom.current.click()
                    }}
                >
                    SAVE
                </Button>
            </div >
        </div >
    );
}










