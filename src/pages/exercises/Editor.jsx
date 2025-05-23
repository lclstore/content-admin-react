import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { mockUsers } from './Data';
import { validateEmail, validatePassword } from '@/utils';

export default function UserEditorWithCommon() {
    const navigate = useNavigate();


    const [loading, setLoading] = useState(true);
    // 初始用户数据状态--可设默认值
    const initialValues = {
        structureType:'Main',
        gender:'Male',
        difficulty:'Beginner',
        equipment:'Chair',
        position:"Seated"
        // layoutType: 1,
        // status2: [1, 2],
        // status: 1, // 确保status有默认值1
        // // 为联动选择器设置默认值 - 使用数字类型
        // contentStyle: 'style1'
    }
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Enter name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'upload',
            name: 'image', // 遵循命名规范，使用Url后缀
            label: 'Image',
            // uploadFn: fileSettings.uploadFile,
            acceptedFileTypes: 'png,webp',
            maxFileSize: 2 * 1024,
        },
        {
            type: 'numberStepper',
            name: 'met',
            label: 'MET',
            required: true,
            min: 1,
            max: 12,
            step: 1,
            formatter: (value) => `${value}`,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'structureType',
            label: 'Structure Type',
            options: [
                { name: 'Warm Up', value: 'Warm_Up' },
                { name: 'Main', value: 'Main' },
                { name: 'Cool Down', value: 'Cool_Down' },
            ],
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'gender',
            label: 'Gender',
            options: [
                { name: 'Female', value: 'Female' },
                { name: 'Male', value: 'Male' },
            ],
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'difficulty',
            label: 'Difficulty',
            options: [
                { name: 'Beginner', value: 'Beginner' },
                { name: 'Intermediate', value: 'Intermediate' },
                { name: 'Advanced', value: 'Advanced' },
            ],
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'equipment',
            label: 'Equipment',
            options: [
                { name: 'No equipment', value: 'noEquipment' },
                { name: 'Chair', value: 'Chair' },
            ],
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'position',
            label: 'Position',
            options: [
                { name: 'Standing', value: 'Standing' },
                { name: 'Seated', value: 'Seated' },

            ],
            required: true,
        },
        {
            type: 'select',
            mode: 'multiple',
            name: 'injured',
            label: 'Injured',
            options: [
                { name: 'Shoulder', value: 'Shoulder' },
                { name: 'Back', value: 'Back' },
                { name: 'Wrist', value: 'Wrist' },
                { name: 'Knee', value: 'Knee' },
                { name: 'Ankle', value: 'Ankle' },
                { name: 'Hip', value: 'Hip' },

            ]
        },
         {
            type: 'textarea',
            name: 'howtodoScript', // 遵循命名规范，使用驼峰命名
            label: 'Howtodo Script',
            maxLength: 1000,
            placeholder: 'Howtodo Script',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ],
            required: true,
        },
        {
            type: 'textarea',
            name: 'guidanceScript', // 遵循命名规范，使用驼峰命名
            label: 'Guidance Script',
            maxLength: 1000,
            placeholder: 'Guidance Script',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
       
        {
            type: 'upload',
            // required: true,
            name: 'nameAudio', // 视频文件
            label: 'Name Audio',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },
            style: {
                width: '290px',
                height: '140px',
            },
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            // required: true,
            name: 'guidanceAudio', // 视频文件
            label: 'Guidance Audio',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },
            style: {
                width: '290px',
                height: '140px',
            },
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            // required: true,
            name: 'howtodoAudio', // 视频文件
            label: 'Howtodo Audio',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },
            style: {
                width: '290px',
                height: '140px',
            },
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            // required: true,
            name: 'frontVideo', // 视频文件
            label: 'Front Video',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },
            style: {
                width: '290px',
                height: '140px',
            },
            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            // required: true,
            name: 'sideVideo', // 视频文件
            label: 'Side Video',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },
            style: {
                width: '290px',
                height: '140px',
            },
            acceptedFileTypes: 'mp3',
        },

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
            config={{ formName: 'Exercise',headerButtons:null }}
            fields={formFields}
            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 