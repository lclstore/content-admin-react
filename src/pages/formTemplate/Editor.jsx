import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { validateEmail, validatePassword } from '@/utils';

export default function UserEditorWithCommon() {
    const navigate = useNavigate();

    // 创建音频播放器的引用
    let audioPlayer = null;
    // 当前播放的音频URL
    let playingUrl = null;

    // 播放或暂停音频的函数
    const playAudio = (option, e, isPlaying, setIsPlaying) => {
        // 阻止事件冒泡和默认行为
        e.preventDefault();
        e.stopPropagation();
        setIsPlaying(isPlaying === option.value ? null : option.value);
        // 如果点击的是当前正在播放的音频，则暂停
        if (playingUrl === option.url && audioPlayer) {
            audioPlayer.pause();
            audioPlayer.src = '';
            playingUrl = null;
            return;
        }

        // 如果有正在播放的音频，先停止它
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.src = '';
        }

        // 创建新的音频对象并播放
        const audio = new Audio(option.url);
        audio.play();
        audioPlayer = audio;
        playingUrl = option.url;

        // 监听音频播放结束事件
        audio.onended = () => {
            playingUrl = null;
        };
    };

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
            type: 'antdSelect',
            name: 'customSelect',
            label: 'customSelect',
            // style: {
            //     width: '300px',
            // },
            options: [
                { value: 1, label: 'option1', url: 'https://amber.7mfitness.com/cms/music/audio/5f67cb64f5f5448a8f6a1a0a322dd2bd.mp3' },
                { value: 2, label: 'option2', url: 'https://amber.7mfitness.com/cms/music/audio/46c966674c9d43b391c4b835eaa829ea.mp3' },
                { value: 3, label: 'option3', url: 'https://amber.7mfitness.com/cms/music/audio/90735f772cfd4888a813390fec672d26.mp3' }
            ],
            renderLabel: (option, isPlaying, setIsPlaying, form) => {
                return (
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, justifyContent: 'space-between', padding: '0 20px' }}>
                        {option.label}
                        {isPlaying}
                        <span
                            onClick={(e) => {
                                playAudio(option, e, isPlaying, setIsPlaying);
                            }}
                            onMouseDown={(e) => {
                                // e.stopPropagation();

                            }}>
                            {isPlaying && isPlaying === option.value ? (
                                <PauseCircleOutlined
                                    style={{ marginLeft: 16, color: '#1c8', fontSize: 20 }}
                                />
                            ) : (
                                <PlayCircleOutlined
                                    style={{ marginLeft: 16, color: '#1c8', fontSize: 20 }}
                                />
                            )}
                        </span>
                    </span >
                );
            },
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'layoutType',
            label: 'layoutType',
            options: 'status',
            required: true,
        },
        {
            type: 'input',
            name: 'layoutTypeText',
            label: '',
            required: true,
            maxLength: 100,
            showCount: true,
            style: {
                width: '300px',
            },
            dependencies: ['layoutType'],           // 声明依赖
            content: ({ getFieldValue }) => {      // content 支持函数
                const layoutType = getFieldValue('layoutType');
                return layoutType === 2
                    ? true
                    : false;
            },
        },
        {
            type: 'displayImage',
            name: 'displayImage1',
            label: '',
            dependencies: ['layoutType'],           // 声明依赖
            content: ({ getFieldValue }) => {      // content 支持函数
                const layoutType = getFieldValue('layoutType');
                return layoutType === 1
                    ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png'
                    : null;
            },
        },
        {
            type: 'switch',
            name: 'status221',
            label: 'Status1121',
        },

        {
            type: 'dateRange',
            name: 'timeRange',
            label: 'New Time',
            // keys: ['startDate', 'endDate'],//默认可不设置
            required: true,
        },
        {
            type: 'displayImage',
            name: 'displayImage',
            label: '',
            dependencies: ['status221'],           // 声明依赖
            content: ({ getFieldValue }) => {      // content 支持函数
                const status = getFieldValue('status221');
                return status
                    ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png'
                    : null;
            },
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
        },
        {
            type: 'upload',
            // required: true,
            name: 'videoUrl', // 视频文件
            label: 'Introduction Video',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
                form.setFieldsValue({
                    avatar: value || '',
                    name: file?.name || '',
                    email: file?.name || '',
                });
                console.log(file, form);
            },
            style: {
                width: '290px',
                height: '140px',
            },
            acceptedFileTypes: 'mp4,mp3,webm,ts,jpg,png,jpeg',
        },

        {
            type: 'inputGroup',
            name: 'warmUp',
            label: '',
            // required: true,
            inputConfig: [
                {
                    type: 'input',
                    name: 'warmName',
                    label: 'warmName',
                    required: true,
                    maxLength: 100,
                    width: '340px',
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
            acceptedFileTypes: 'jpg,png,jpeg',
            maxFileSize: 2 * 1024,
        },
        // 添加带预览的single选择器示例


        {
            type: 'select',
            mode: 'single',
            name: 'status1',
            label: 'Status1',
            options: 'testStatus',
            required: true,

        },
        {
            type: 'select',
            mode: 'multiple',
            disabled: false,
            name: 'status2',
            label: 'Status2',
            options: 'status',
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
            config={{ formName: 'User', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 