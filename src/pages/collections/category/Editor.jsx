import React, { useState, useMemo, useEffect } from 'react';
import { data, useNavigate } from 'react-router';

import CommonEditorForm from '@/components/CommonEditorForm';
import { commonListData } from '@/pages/Data';
import request from "@/request";

import {
    ThunderboltOutlined,
    TagsOutlined,
    PictureOutlined,
    VideoCameraOutlined,
    SettingOutlined
} from '@ant-design/icons';

export default function UserEditorWithCommon() {

    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList'
        },

    ];
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
        {
            label: 'Basic Information',
            name: 'basicInfo',
            icon: <ThunderboltOutlined />,
            fields: [
                {
                    type: 'input',
                    name: 'name',
                    label: 'Name',
                    required: true,
                    maxLength: 100,
                    showCount: true,
                },
                {
                    type: 'textarea',
                    name: 'description',
                    label: 'Description',
                    required: true,
                    maxLength: 1000,
                    showCount: true,
                },
                {
                    type: 'select',
                    name: 'showTypeCode',
                    label: 'Show Type',
                    required: true,
                    options: [
                        {
                            label: 'Horizontal',
                            value: 'HORIZONTAL'
                        }, {
                            label: 'Card',
                            value: 'CARD'
                        }
                    ],
                },
                {
                    type: 'displayImage',
                    name: 'displayImage',
                    label: '',
                    dependencies: ['showTypeCode'],           // 声明依赖
                    content: ({ getFieldValue }) => {      // content 支持函数
                        console.log('11111111')
                        const status = getFieldValue('showTypeCode');
                        console.log('status', status)
                        // return status
                        //     ? 'internal/test/268a8e7dd3ea45268a96588f0f07e4f8.png'
                        //     : null;
                    },
                    style: {
                        width: '100px',
                        height: '100px',
                    },
                },

                {
                    type: 'dateRange',
                    name: 'timeRange',
                    label: 'New Date',
                    keys: ['startTime', 'endTime'],
                    required: false,
                }
            ]
        },
        {
            label: 'Image',
            name: 'image',
            icon: <PictureOutlined />,
            fields: [
                {
                    type: 'upload',
                    name: 'coverImage',
                    label: 'Cover Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'detailImage',
                    label: 'Detail Image',
                    required: true,
                    onChange: imageUpload
                }

            ]
        },
        {
            label: 'Workout',
            name: 'workoutData',
            fields: [
                {
                    type: 'structureList',
                    name: 'musicIdList',
                    // renderItemMata: renderItemMata,
                    label: 'Musics',
                    formterList: (dataList, formValues) => {
                        return dataList.map(item => {
                            return {
                                bizMusicId: item.id,
                                displayName: item.name,
                                premium: formValues.premium,
                            }
                        });
                    },
                    dataList: [],
                    rules: [
                        { required: true, message: 'Please add at least one music' },
                    ]
                },
            ]
        }
    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    // 使用新设计：只维护一个formFields状态，并提供更新回调
    const [formFields, setFormFields] = useState(initialFormFields);

    // 处理formFields变更的回调
    const handleFormFieldsChange = (updatedFields) => {
        setFormFields(updatedFields);
    };



    // 自定义渲染列表项展示
    const renderItemMata = (item) => {
        return <div>{item.displayName}</div>
    }
    const initCommonListData = (params) => {
        return new Promise(resolve => {
            request.get({
                url: `/exercise/page`,
                load: false,
                data: params,
                callback: res => resolve(res?.data)
            });
        })
    }

    return (
        <CommonEditorForm
            // 传递当前formFields状态
            fields={formFields}
            // 提供更新配置项回调
            onFormFieldsChange={handleFormFieldsChange}
            // 其他基本配置
            // renderItemMata={renderItemMata}
            commonListConfig={{
                initCommonListData: initCommonListData,
                placeholder: 'Search your content name...',
                filterSections: filterSections,
            }}
            isCollapse={true}
            initFormData={initFormData}
            formType="advanced"
            fieldsToValidate={['name', 'birthday']}
            config={{ formName: 'Workouts' }}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 