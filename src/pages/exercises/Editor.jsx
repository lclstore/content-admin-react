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
        structureTypeCode: 'MAIN',
        genderCode: 'MALE',
        difficultyCode: 'BEGINNER',
        equipmentCode: 'CHAIR',
        positionCode: 'SEATED'
    }
    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'name', // 遵循命名规范，使用驼峰命名
            label: 'Name',
            maxLength: 100,
            width: '50%',
            required: true,
            placeholder: 'Enter name',
            rules: [
                { max: 100, message: 'Name cannot exceed 100 characters' }
            ]
        },
        {
            type: 'numberStepper',
            name: 'met',
            label: 'Met',
            required: true,
            width: "50%",
            min: 1,
            max: 12,
            step: 1,
            formatter: (value) => `${value}`,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'structureTypeCode',
            label: 'Structure Type',
            // disabled: true,
            width: "50%",
            options: "BizExerciseStructureTypeEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'genderCode',
            label: 'Gender',
            width: "50%",
            options:"BizExerciseGenderEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'equipmentCode',
            label: 'Equipment',
            width: "50%",
            options: "BizProgramEquipmentEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'single',
            name: 'difficultyCode',
            label: 'Difficulty',
            width: "50%",
            options: "BizExerciseDifficultyEnums",
            required: true,
        },
        {
            type: 'select',
            name: 'positionCode',
            label: 'position',
            width: "50%",
            options: "BizExercisePositionEnums",
            required: true,
        },
        {
            type: 'select',
            mode: 'multiple',
            name: 'injuredCodes',
            label: 'Injured',
            width: "50%",
            options: "BizExerciseInjuredEnums",
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
            ],
        },
        {
            type: 'upload',
            name: 'coverImgUrl', // 遵循命名规范，使用Url后缀
            label: 'Image',
            required: true,
            // uploadFn: fileSettings.uploadFile,
            acceptedFileTypes: 'png,webp',
            maxFileSize: 2 * 1024,
        },
        {
            type: 'upload',
            required: true,
            name: 'nameAudioUrl', // 视频文件
            label: 'Name Audio',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },

            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            required: true,
            name: 'guidanceAudioUrl', // 视频文件
            label: 'Guidance Audio',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },

            acceptedFileTypes: 'mp3',
        },

        {
            type: 'upload',
            required: true,
            name: 'howtodoAudioUrl', // 视频文件
            label: 'Howtodo Audio',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },

            acceptedFileTypes: 'mp3',
        },
        {
            type: 'upload',
            required: true,
            name: 'frontVideoUrl', // 视频文件
            label: 'Front Video',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },

            acceptedFileTypes: 'mp4',
        },
        {
            type: 'upload',
            required: true,
            name: 'sideVideoUrl', // 视频文件
            label: 'Side Video',
            // maxFileSize: 1024 * 1024 * 10,

            //文件上传后修改name
            onChange: (value, file, form) => {
            },

            acceptedFileTypes: 'mp4',
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
            enableDraft={true}
            formType="basic"
            moduleKey='exercise'
            config={{ formName: 'Exercise', headerButtons: null }}
            fields={formFields}
            initialValues={initialValues}
        />
    );
} 