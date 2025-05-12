import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { validateEmail, validatePassword } from '@/utils';
import { optionsConstants } from '@/constants';
import settings from '@/config/settings';
const { file: fileSettings } = settings;
export default function UserEditorWithCommon() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('id'); // 获取用户ID

    // 初始用户数据状态
    const [initialValues, setInitialValues] = useState({});
    // 加载状态
    const [loading, setLoading] = useState(false); // 默认为false，页面初始加载时显示loading状态
    const [formFields, setFormFields] = useState([
        {
            type: 'switch',
            name: 'status221',
            label: 'Status1121',
            onChange: (value) => {
                // 更新formFields配置
                setFormFields(prev => {
                    const newFields = prev.map(item =>
                        item.name === 'displayImage'
                            ? { ...item, content: value ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png' : '' }
                            : item
                    );
                    console.log('新的表单字段配置已更新:', newFields);
                    return newFields;
                });

                // 更新initialValues中的值，确保switch组件的状态被正确设置
                setInitialValues(prev => ({
                    ...prev,
                    status221: value,
                    displayImage: value ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png' : ''
                }));
            },
        },

        {
            type: 'dateRange',
            name: 'timeRange', // 仍然保留此字段名以兼容原有逻辑
            label: 'New Time',
            // keys: ['startDate', 'endDate'],//默认可不设置
            required: true,
        },
        {
            type: 'displayImage',
            name: 'displayImage',
            label: 'Display Image',
            content: 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png',
            style: {
                width: '100px',
                height: '100px',
            },
        },
        {
            type: 'date',
            name: 'birthday', // 遵循命名规范，使用Url后缀
            label: 'Birthday',
            required: true,
            // 移除不相关的上传属性
            // previewWidth: '96px',//预览宽度
            // previewHeight: '96px',//预览高度
            // uploadFn: fileSettings.uploadFile,
            // acceptedFileTypes: 'jpg,png,jpeg',
            // maxFileSize: 2 * 1024,
        },
        {
            type: 'upload',
            // required: true,
            name: 'videoUrl', // 视频文件
            label: 'Introduction Video',
            // maxFileSize: 3.21,
            // previewWidth: '190px',//预览宽度
            // previewHeight: '190px',//预览高度
            acceptedFileTypes: 'mp4,mp3,webm,ts',
        },
        {
            type: 'select',
            mode: 'single',
            name: 'layoutType',
            label: 'layoutType',
            // previewStyle: { width: '1400px', height: '150px' }, // 增大高度并添加边框颜色以测试样式是否生效
            options: [
                {
                    value: 1, // 确保使用数字类型
                    label: 'Banner', // 使用label属性定义显示文本
                    // 定义预览内容，有此对象时会自动显示预览
                    preview: {
                        type: 'image', // 预览内容类型：text文本类型或image图片类型
                        content: 'https://inews.gtimg.com/om_bt/OXUoiYf_yZjuc_eIBOjTWwf4wQ47dH4bFK85-ZPZiF_p8AA/641'
                    }
                },
                {
                    value: 2, // 确保使用数字类型
                    label: 'Intro', // 使用label属性定义显示文本
                    preview: {
                        type: 'image', // 文本类型预览
                        content: 'https://inews.gtimg.com/om_bt/OPDx1Hq5wp8xwEdAtU7IH4ZQxxXgBaPIb2Q4OUGSYeh2MAA/641'
                    }
                },
                {
                    value: 3, // 确保使用数字类型
                    label: 'Horizontal', // 使用label属性定义显示文本
                    preview: {
                        type: 'input',
                        content: 'soundScript',
                        required: true
                    }
                },
                {
                    value: 4, // 确保使用数字类型
                    label: 'Grid', // 使用label属性定义显示文本
                    preview: {
                        type: 'displayText', // 文本类型预览
                        content: 'Grid预览内容测试'
                    }
                },
                {
                    value: 5, // 确保使用数字类型
                    label: 'Card', // 使用label属性定义显示文本
                    preview: {
                        type: 'displayText', // 文本类型预览
                        content: 'Card预览内容测试'
                    }
                }
            ],
            required: true,
        },
        {
            type: 'inputGroup',
            name: 'warmUp',
            label: '',
            // required: true,
            componentConfig: [
                {
                    type: 'input',
                    name: 'warmName',
                    label: 'warmName',
                    required: true,
                    maxLength: 100,
                    previewWidth: '310px',
                    showCount: true,
                },
                {
                    type: 'numberStepper',
                    name: 'warmNumber',
                    label: 'Number',
                    required: true,
                    min: 2,
                    max: 20,
                    step: 1,
                    formatter: (value) => `${value}`,
                },
                {
                    type: 'numberStepper',
                    name: 'warmCycles',
                    label: 'warmCycles',
                    required: true,
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => `${value}`,
                },

            ]
        },
        {
            type: 'numberStepper',
            min: 0,
            max: 40,
            step: 10,
            formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
            name: 'numberStepper', // 修改字段名避免重复
            label: 'NumberStepper',
            required: true,
        },
        {
            type: 'upload',
            name: 'avatar', // 遵循命名规范，使用Url后缀
            label: 'Avatar',
            // required: true,
            // previewWidth: '96px',//预览宽度
            previewHeight: '96px',//预览高度
            uploadFn: fileSettings.uploadFile,
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
        },
        // 添加带预览的single选择器示例


        {
            type: 'select',
            mode: 'single',
            // disabled: true,
            name: 'status1', // 遵循命名规范，使用Url后缀
            label: 'Status1',
            options: optionsConstants.status,
            required: true,
            // previewWidth: '96px',//预览宽度
            previewHeight: '96px',//预览高度
            uploadFn: fileSettings.uploadFile,
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
        },
        {
            type: 'select',
            mode: 'multiple',
            // disabled: true,
            name: 'status2', // 遵循命名规范，使用Url后缀
            label: 'Status2',
            options: optionsConstants.status,
            required: true,

        },

        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Enter user name',
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
            // placeholder: 'Enter email address',
            // disabled: !!userId,
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
                {
                    validator: async (_, value) => {
                        if (!value) return Promise.resolve();

                        const currentId = userId ? parseInt(userId, 10) : null;
                        const isDuplicate = mockUsers.some(user => user.email === value && user.id !== currentId);

                        if (isDuplicate) {
                            return Promise.reject('Email existed.');
                        }
                        return Promise.resolve();
                    },
                    validateTrigger: 'onBlur',
                }
            ]
        },
        {
            type: 'password',
            name: 'userPassword',
            label: 'Password',
            required: true,
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
    ]);




    // 加载用户数据
    useEffect(() => {

        let isMounted = true; // 组件挂载标记

        const loadUserData = async () => {
            if (userId) {
                setLoading(true);
                // 用户编辑模式，加载现有数据
                const currentId = parseInt(userId, 10);
                const userToEdit = mockUsers.find(user => user.id === currentId);

                if (userToEdit) {
                    // 模拟数据加载延迟，保持loading状态
                    setTimeout(() => {
                        if (isMounted) {
                            // 设置初始值
                            setInitialValues(userToEdit);

                            // 数据加载完成后，关闭loading状态
                            setLoading(false);
                        }
                    }, 400); // 模拟加载时间
                } else if (isMounted) {
                    message.error('用户数据未找到，正在返回列表页');
                    setTimeout(() => navigate('/users'), 300);
                }
            } else {
                // 新增用户，设置默认值
                setInitialValues({
                    layoutType: 1,
                    status2: [1, 2],
                    status: 1, // 确保status有默认值1
                    // 为联动选择器设置默认值 - 使用数字类型
                    contentStyle: 'style1'
                });

                // 新增用户不需要等待，直接关闭loading状态
                setLoading(false);
            }
        };

        // 执行数据加载
        loadUserData();

        // 清理函数
        return () => {
            isMounted = false;
        };
    }, [userId, navigate]);

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

    // 编辑器配置
    const editorConfig = useMemo(() => ({
        formName: 'User',
    }), []); // 使用useMemo优化性能

    // 为表单提供唯一key，确保在userId变更时重新创建表单
    const formKey = userId || 'new-user';
    const initFormData = () => userId ? mockUsers.find(user => user.id === parseInt(userId, 10)) : {};//初始化表单数据
    return (
        <Spin spinning={loading} size="large" tip="loading...">
            <CommonEditorForm
                initFormData={initFormData}
                key={formKey}
                formType="basic"
                config={editorConfig}
                fields={formFields}
                initialValues={initialValues}
                onSave={handleSaveUser}
            />
        </Spin>
    );
} 