import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';

import CommonEditorForm from '@/components/CommonEditorForm';
import { commonListData, filterSections } from '@/pages/Data';
import {
    ThunderboltOutlined,
    TagsOutlined,
    PictureOutlined,
    VideoCameraOutlined, 
    SettingOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined
} from '@ant-design/icons'; 

export default function UserEditorWithCommon() {
    const navigate = useNavigate();
    // 初始用户数据状态--可设默认值
    const initialValues = {
        contentDuration: 0,
    }
    const mockUsers = [{
        id: 1,
        name: 'John Doe',
        description: 'asasdasa',
        startTime: '2025-01-26',
        endTime: '2025-07-26',
        premium: 1,
        coverImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        detailImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        thumbnailImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        completeImage: 'https://pic.rmb.bdstatic.com/bjh/news/6792ab1e35c6a2a6cd10a5990bd033d0.png',
        difficulty: 1,
        equipment: 3,
        position: 2,
        target: [1, 5],
        introDuration: 10,
        exercisePreviewDuration: 20,
        exerciseExecutionDuration: 30,
        list: [{
            reps: 1,
            structureName: 'asd1',
            list: [commonListData[0], commonListData[1]]
        }, {
            reps: 2,
            structureName: 'asd2',
            list: [commonListData[1]]
        },
        {
            reps: 3,
            structureName: 'asd3',
            list: [commonListData[4]]
        }
        ]
    }];

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

    // 保存用户数据
    const handleSaveUser = (values, id, { setLoading, setDirty, messageApi, navigate }) => {
        console.log('保存用户数据:', values, id);

        // 处理数据格式
        // const dataToSave = {
        //     ...(id && { id: parseInt(id, 10) }),
        //     name: values.name.trim(),
        //     email: values.email ? values.email.trim() : '',
        //     avatar: values.avatar,
        //     status: values.status,
        //     userPassword: values.userPassword,
        //     birthday: values.birthday,
        //     // 如果有timeRange，从中提取startDate和endDate
        //     ...(values.timeRange && values.timeRange.length === 2 ? {
        //         startDate: values.timeRange[0],
        //         endDate: values.timeRange[1]
        //     } : {}),
        //     selectedRoles: values.selectedRoles || [],
        //     // 保存联动选择器的值
        //     layoutType: values.layoutType,
        //     contentStyle: values.contentStyle
        // };

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

    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue();
        form.setFieldsValue({
            coverImage: formValues.coverImage || value,
            detailImage: formValues.detailImage || value,
            thumbnailImage: formValues.thumbnailImage || value,
            completeImage: formValues.completeImage || value,
        });
    }

    //请求列数据方法
    const initFormData = (id) => {
        // return new Promise((resolve) => {
        //     // 模拟延迟 1 秒
        //     setTimeout(() => {
        //         if (id) {
        //             // 查找对应用户
        //             // const user = mockUsers.find(u => u.id === parseInt(id, 10));
        //             const user = mockUsers[0]
        //             resolve(user || {});  // 找不到也返回空对象，避免 undefined
        //         } else {
        //             // 新增场景：直接返回空对象
        //             resolve(initialValues);
        //         }
        //     }, 1000);
        // });
    };

    const initialFormFields = useMemo(() => [
        {
            label: 'Workout Intro',
            name: 'basicInfo',
            icon: <ThunderboltOutlined />,
            fields: [
                {
                    type: 'numberStepper',
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'introVideoReps', // 修改字段名避免重复
                    label: 'numberStepper',
                    required: true,
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Intro Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'contentDuration',
                            label: 'Countdown Seconds (s)',
                            required: true,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },


            ]
        },
        {
            label: 'Exercise Preview',
            name: 'image',
            icon: <PictureOutlined />,
            fields: [
                {
                    type: 'numberStepper',
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'reps', // 修改字段名避免重复
                    label: 'Preview Video Reps',
                    required: true,
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Preview Rest Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Start Seconds',
                            required: true,
                            defaultValue: 0.1,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Preview First Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Start Seconds',
                            required: true,
                            defaultValue: 3.1,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Preview Next Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Start Seconds',
                            defaultValue: 3.1,
                            required: true,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'PreviewLast Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Start Seconds',
                            defaultValue: 3.1,
                            required: true,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Preview Name Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio1',
                            // style: {
                            //     width: '300px',
                            // },
                            disabled: true,
                            options: [
                                { value: 1, label: 'option1', url: 'https://amber.7mfitness.com/cms/music/audio/5f67cb64f5f5448a8f6a1a0a322dd2bd.mp3' },
                                { value: 2, label: 'option2', url: 'https://amber.7mfitness.com/cms/music/audio/46c966674c9d43b391c4b835eaa829ea.mp3' },
                                { value: 3, label: 'option3', url: 'https://amber.7mfitness.com/cms/music/audio/90735f772cfd4888a813390fec672d26.mp3' }
                            ],
                            renderLabel: (option, isPlaying, setIsPlaying, form) => {
                                return (
                                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, justifyContent: 'space-between', padding: '0 20px' }}>
                                        {option.label}
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Start Seconds',
                            required: true,
                            maxLength: 100,
                            defaultValue: 6.1,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Preview 321 Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio1',
                            // style: {
                            //     width: '300px',
                            // },
                            disabled: true,
                            options: [
                                { value: 1, label: 'option1', url: 'https://amber.7mfitness.com/cms/music/audio/5f67cb64f5f5448a8f6a1a0a322dd2bd.mp3' },
                                { value: 2, label: 'option2', url: 'https://amber.7mfitness.com/cms/music/audio/46c966674c9d43b391c4b835eaa829ea.mp3' },
                                { value: 3, label: 'option3', url: 'https://amber.7mfitness.com/cms/music/audio/90735f772cfd4888a813390fec672d26.mp3' }
                            ],
                            renderLabel: (option, isPlaying, setIsPlaying, form) => {
                                return (
                                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, justifyContent: 'space-between', padding: '0 20px' }}>
                                        {option.label}
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Start Seconds',
                            required: true,
                            maxLength: 100,
                            defaultValue: 3,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },



            ]
        },
        {
            label: 'Exercise Execution',
            name: 'basicInfo1',
            icon: <ThunderboltOutlined />,
            fields: [
                {
                    type: 'numberStepper',
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'reps', // 修改字段名避免重复
                    label: 'Execution Video Reps',
                    required: true,
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Execution Go Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Countdown Seconds (s)',
                            defaultValue: 3,
                            required: true,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp1',
                    label: 'Execution Guidance Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Countdown Seconds (s)',
                            defaultValue: 0.1,
                            required: true,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Execution Halfway Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            disabled: true,
                            required: true,
                        },
                        {
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Countdown Seconds (s)',
                            defaultValue: 2.1,
                            required: true,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Execution 321 Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Countdown Seconds (s)',
                            required: true,
                            defaultValue: 30.1,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Execution Rest Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Countdown Seconds (s)',
                            required: true,
                            defaultValue: 4,
                            maxLength: 100,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                },
                {

                    type: 'inputGroup',
                    name: 'warmUp',
                    label: 'Execution Beep Audio',
                    // required: true,
                    inputConfig: [
                        {
                            type: 'antdSelect',
                            name: 'Audio',
                            label: 'Audio',
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
                                        <span
                                            onClick={(e) => {
                                                playAudio(option, e, isPlaying, setIsPlaying);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                playAudio(option, e, isPlaying, setIsPlaying);

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
                            type: 'input',
                            name: 'Countdown Seconds (s)',
                            label: 'Countdown Seconds (s)',
                            required: true,
                            maxLength: 100,
                            defaultValue: 1,
                            rules: [{
                                pattern: /^\d+(\.\d+)?$/,
                                message: 'Please enter a valid URL'
                            }],
                            width: '200px',
                            showCount: true,
                        },
                        {
                            type: 'switch',
                            name: 'isSelected',
                            label: 'Can it be closed?',
                            required: true,
                        }



                    ]
                }


            ]
        },
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    // 使用新设计：只维护一个formFields状态，并提供更新回调
    const [formFields, setFormFields] = useState(initialFormFields);

    // 处理formFields变更的回调
    const handleFormFieldsChange = (updatedFields) => {
        setFormFields(updatedFields);
    };

    //请求列表数据方法
    const initCommonListData = (params) => {
        return new Promise((resolve) => {
            // 模拟延迟 1 秒
            setTimeout(() => {
                resolve(commonListData.filter(item => item.status === "ENABLE"));
            }, 1000);
        });
    }

    // 自定义渲染列表项展示
    const renderItemMata = (item) => {
        return <div>{item.displayName}</div>
    }
    //折叠面板展开
    const handleCollapseChange = (activeKeys, form) => {
        // 如果在此函数内更新了 formFields，可以在更新回调中获取最新值
        if (activeKeys[0] == 'workoutData') {
            setFormFields(prevFields => {
                const newFields = [...prevFields]; // 进行某些更新操作、
                const formValues = form.getFieldsValue(true);//表单数据
                const preview = formValues.exercisePreviewDuration || 0;
                const execution = formValues.exerciseExecutionDuration || 0;
                const introDuration = formValues.introDuration || 0;

                let loopCount = 0;
                let workoutCalorie = 0;
                const MET = 1

                const structureList = newFields.filter(item => Array.isArray(item.dataList) && item.dataList.length > 0);
                if (structureList.length > 0) {
                    structureList.forEach((item, index) => {
                        const reps = formValues[`reps${index == 0 ? '' : index}`] | 0;
                        loopCount = reps * item.dataList.length;
                        const calories = MET * 75 / 3600 * execution * reps * item.dataList.length;
                        workoutCalorie += calories
                    })
                    const workOutTime = (preview + execution) * loopCount;
                    const workoutDurationRaw = introDuration + workOutTime;
                    // 如果时长小于30，则向下取整，否则向上取整
                    const workoutDuration = workoutDurationRaw < 30
                        ? Math.floor(workoutDurationRaw)
                        : Math.ceil(workoutDurationRaw);
                    form.setFieldsValue({
                        duration: workoutDuration,
                        calorie: Math.ceil(workoutCalorie)//向上取整
                    });
                } else {
                    form.setFieldsValue({
                        duration: 0,
                        calorie: 0
                    });
                }
                console.log(newFields);

                return newFields;
            });
        }


    };

    return (
        <div
        >
            <CommonEditorForm
                // 传递当前formFields状态
                fields={formFields}
                // 提供更新配置项回调
                onFormFieldsChange={handleFormFieldsChange}
                // 提供折叠面板展开回调
                onCollapseChange={handleCollapseChange}
                // 其他基本配置
                // renderItemMata={renderItemMata}
                isCollapse={true}
                initFormData={initFormData}
                formType="advanced"
                config={{ formName: 'Collections' }}
                initialValues={initialValues}
                onSave={handleSaveUser}
            />
        </div>
    );
} 