import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';

import CommonEditorForm from '@/components/CommonEditorForm';
import { commonListData, filterSections } from '@/pages/Data';
import {
    ThunderboltOutlined,
    TagsOutlined,
    PictureOutlined,
    VideoCameraOutlined,
    SettingOutlined
} from '@ant-design/icons';

export default function UserEditorWithCommon() {
    const navigate = useNavigate();
    // 初始用户数据状态--可设默认值
    const initialValues = {}
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
        return new Promise((resolve) => {
            // 模拟延迟 1 秒
            setTimeout(() => {
                if (id) {
                    // 查找对应用户
                    // const user = mockUsers.find(u => u.id === parseInt(id, 10));
                    const user = mockUsers[0]
                    resolve(user || {});  // 找不到也返回空对象，避免 undefined
                } else {
                    // 新增场景：直接返回空对象
                    resolve(initialValues);
                }
            }, 1000);
        });
    };

    const initialFormFields = useMemo(() => [

        // {
        //     type: 'select',
        //     mode: 'single',
        //     name: 'layoutType',
        //     label: 'layoutType',
        //     options: 'status',
        //     required: true,
        // },
        // {
        //     type: 'input',
        //     name: 'layoutTypeText',
        //     label: '',
        //     required: true,
        //     maxLength: 100,
        //     showCount: true,
        //     style: {
        //         width: '300px',
        //     },
        //     dependencies: ['layoutType'],           // 声明依赖
        //     content: ({ getFieldValue }) => {      // content 支持函数
        //         const layoutType = getFieldValue('layoutType');
        //         return layoutType === 2
        //             ? true
        //             : false;
        //     },
        // },
        // {
        //     type: 'displayImage',
        //     name: 'displayImage1',
        //     label: '',
        //     dependencies: ['layoutType'],           // 声明依赖
        //     content: ({ getFieldValue }) => {      // content 支持函数
        //         const layoutType = getFieldValue('layoutType');
        //         return layoutType === 1
        //             ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png'
        //             : null;
        //     },
        // },
        // {
        //     type: 'switch',
        //     name: 'status221',
        //     label: 'Status1121',
        // },

        {
            type: 'dateRange',
            name: 'timeRange',
            label: 'New Time',
            // keys: ['startDate', 'endDate'],//默认可不设置
            required: true,
        },
        // {
        //     type: 'displayImage',
        //     name: 'displayImage',
        //     label: '',
        //     dependencies: ['status221'],           // 声明依赖
        //     content: ({ getFieldValue }) => {      // content 支持函数
        //         const status = getFieldValue('status221');
        //         return status
        //             ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png'
        //             : null;
        //     },
        //     style: {
        //         width: '100px',
        //         height: '100px',
        //     },
        // },
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
            acceptedFileTypes: 'mp4,mp3,webm,ts,jpg,png,jpeg',
        },

        // {
        //     type: 'inputGroup',
        //     name: 'warmUp',
        //     label: '',
        //     // required: true,
        //     inputConfig: [
        //         {
        //             type: 'input',
        //             name: 'warmName',
        //             label: 'warmName',
        //             required: true,
        //             maxLength: 100,
        //             width: '320px',
        //             showCount: true,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'warmNumber',
        //             label: 'Number',
        //             required: true,
        //             min: 2,
        //             max: 20,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },
        //         {
        //             type: 'numberStepper',
        //             name: 'warmCycles',
        //             label: 'warmCycles',
        //             required: true,
        //             min: 1,
        //             max: 5,
        //             step: 1,
        //             formatter: (value) => `${value}`,
        //         },

        //     ]
        // },
        // {
        //     type: 'numberStepper',
        //     min: 0,
        //     max: 40,
        //     step: 10,
        //     formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
        //     name: 'numberStepper', // 修改字段名避免重复
        //     label: 'NumberStepper',
        //     required: true,
        // },
        // {
        //     type: 'upload',
        //     name: 'avatar', // 遵循命名规范，使用Url后缀
        //     label: 'Avatar',
        //     required: true,
        //     acceptedFileTypes: 'jpg,png,jpeg',
        //     maxFileSize: 2 * 1024,
        // },
        // // 添加带预览的single选择器示例


        // {
        //     type: 'select',
        //     mode: 'single',
        //     name: 'status1',
        //     label: 'Status1',
        //     options: 'testStatus',
        //     required: true,

        // },
        // {
        //     type: 'select',
        //     mode: 'multiple',
        //     disabled: false,
        //     name: 'status2',
        //     label: 'Status2',
        //     options: 'status',
        //     required: true,

        // },

        // {
        //     type: 'input',
        //     name: 'name', // 遵循命名规范，使用驼峰命名
        //     label: 'Name',
        //     maxLength: 100,
        //     required: true,
        //     placeholder: 'Enter user name',
        //     rules: [
        //         { max: 100, message: 'Name cannot exceed 100 characters' }
        //     ]
        // },
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
                resolve(commonListData.filter(item => item.status === 1));
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
        <CommonEditorForm
            // 传递当前formFields状态
            fields={formFields}
            // 提供更新配置项回调
            onFormFieldsChange={handleFormFieldsChange}
            // 提供折叠面板展开回调
            onCollapseChange={handleCollapseChange}
            // 其他基本配置
            // renderItemMata={renderItemMata}
            commonListConfig={{
                initCommonListData: initCommonListData,
                placeholder: 'Search your content name...',
                filterSections: filterSections,
            }}
            // isCollapse={true}
            initFormData={initFormData}
            formType="advanced"
            config={{ formName: 'Collections' }}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 