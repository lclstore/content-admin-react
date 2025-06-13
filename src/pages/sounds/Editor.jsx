import React, {useState, useMemo, useReducer, useCallback} from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import { formFieldsReducer } from "@/reducer/tableReducer.jsx";

export default function UserEditorWithCommon() {

    // 初始用户数据状态--可设默认值
    const [initialValues,  setInitialValues] = useState({
        translation: 1,
        usageCode:"FLOW",
        genderCode:"FEMALE_AND_MALE"
    })
    function formFieldsManage(val,{ getFieldsValue }){
        const formData = getFieldsValue()
        // 必填 变化
        setFormFields(formFields.map(i => {
            if (i.name === 'femaleScript') {
                return {...i, required: formData.translation === 1 && formData.genderCode === "FEMALE"}
            }
            if (i.name === 'maleScript') {
                return {...i, required: formData.translation === 1 && formData.genderCode === "MALE"}
            }
            if (i.name === 'femaleAudioUrl') {
                return {...i, required: formData.genderCode === "FEMALE" || formData.genderCode === "FEMALE_AND_MALE"}
            }
            if (i.name === 'maleAudioUrl') {
                return {...i, required: formData.genderCode === "MALE" || formData.genderCode === "FEMALE_AND_MALE"}
            }
            return i
        }))
        // setFormFields({type: 'itemReplace',itemSearch:(i) => i.name === 'femaleScript',
        //     factory:(item) => ({...item,required: formData.translation === 1 && formData.genderCode === "FEMALE"})})
    }
    // 表单字段配置
    const [formFields,setFormFields] = useState( [
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
            label: 'Usage',
            name: 'usageCode',
            type: 'select',
            required: true,
            options: "BizSoundUsageEnums"
        },
        {
            label: 'Gender',
            name: 'genderCode',
            type: 'select',
            options: 'BizSoundGenderEnums',
            required: true,
        },
        {
            type: 'select',
            name: 'translation',
            label: 'Has a Script',
            options: [
                {
                    label: 'Yes',
                    value: 1
                }, {
                    label: "No",
                    value: 0
                },
            ],
            required: true,
        },
        {
            type: 'textarea',
            name: 'femaleScript',
            label: 'Female Script',
            required: true,
            maxLength: 1000,
            showCount: true,
            dependencies: ['translation','genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {    // content 支持函数
                return getFieldValue("translation") === 1 && (getFieldValue("genderCode") === "FEMALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
            },
        },
        {
            type: 'textarea',
            name: 'maleScript',
            label: 'Male Script',
            required: true,
            maxLength: 1000,
            showCount: true,
            dependencies: ['translation','genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {    // content 支持函数
                return getFieldValue("translation") === 1 && (getFieldValue("genderCode") === "MALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
            },
        },
        {
            type: 'upload',
            name: 'femaleAudioUrl', // 视频文件
            durationName: 'femaleAudioDuration',
            label: 'Female Audio',
            required: true,
            maxFileSize: 1024 * 5,
            acceptedFileTypes: 'mp3',
            dependencies: ['genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {    // content 支持函数
                return (getFieldValue("genderCode") === "FEMALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
            },
        },
        {
            type: 'upload',
            name: 'maleAudioUrl', // 视频文件
            durationName: 'maleAudioDuration',
            label: 'Male Audio',
            required: true,
            maxFileSize: 1024 * 5,
            acceptedFileTypes: 'mp3',
            dependencies: ['genderCode'],           // 声明依赖
            content: ({ getFieldValue }) => {    // content 支持函数
                return (getFieldValue("genderCode") === "MALE" || getFieldValue("genderCode") === "FEMALE_AND_MALE")
            },
        }

    ]); // 使用useMemo优化性能，避免每次渲染重新创建


    return (
        <>
            <CommonEditorForm
                enableDraft={true}
                formType="basic"
                moduleKey="sound"
                config={{ formName: 'Sound' }}
                fields={formFields}
                initialValues={initialValues}
            />
        </>
    );
} 