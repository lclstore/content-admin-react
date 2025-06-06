import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { validateEmail, validatePassword } from '@/utils';
import { SaveOutlined, LogoutOutlined } from '@ant-design/icons';
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
        console.log('2222222')
        return new Promise(resolve => {
            request.get({
                url: `/user/getMyInfo`,
                load: true,
                callback: res => {
                    console.log('res11111', res)
                    // initialValues = res.data.data
                    resolve(res.data.data)
                }
            });
        })
    }
    // useEffect(() => {
    //     console.log('1111111111111')
    // }, [users]);
    useEffect(() => {
        console.log('1111111111111')
        getUser().then(res => {
            console.log(res)
            res = { ...res, password: '******' }
            setUser(res)
        })
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
            buttons: ['Edit', 'Save'],
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
    const saveBeforeTransform = (info) => {
        console.log(info.formValues)
    }
    const headerButtons = [
        {
            key: 'save',
            text: 'Save',
            icon: <SaveOutlined />,
            type: 'primary',

            onClick: (e) => {
                debugger
                triggerSave
            },
        }
    ]
    return (
        <div >
            <CommonEditorForm
                refreshKey={refreshKey}
                formType="basic"
                moduleKey='user'
                operationName="profileSave"
                isBack={false}
                config={{ formName: 'Profile', headerButtons }}
                fields={formFields}
                initialValues={users}
                setFormRef={setEditorRef}
            />
            <div style={{ maxWidth: '1000px', margin: '-5px auto', paddingLeft: '20px' }}>
                <Button
                    block
                    onClick={() => navigate('/login')}
                >
                    SIGN OUT
                </Button>
            </div >
        </div >
    );
} 