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
        }, {
            title: 'Difficulty',
            key: 'difficultyCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseDifficultyEnums'
        },

    ];
    const [initialValues, setInitialValues] = useState({
        showTypeCode: "CARD"
    })


    const imageUpload = (value, file, form) => {
        const formValues = form.getFieldsValue(true);
        form.setFieldsValue({
            coverImgUrl: formValues.coverImgUrl || value,
            detailImgUrl: formValues.detailImgUrl || value,
        });
    }



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
                    maxLength: 1000,
                    showCount: true,
                },
                {
                    type: 'select',
                    name: 'showTypeCode',
                    label: 'Show Type',
                    required: true,
                    options: 'BizCategoryShowTypeEnums',
                },
                {
                    type: 'displayImage',
                    name: 'displayImage',
                    label: '',
                    dependencies: ['showTypeCode'],
                    content: ({ getFieldValue }) => {
                        const CARD = 'https://amber.7mfitness.com/category/image/e45cf328-57dc-4c23-a8cf-ad2e4cf14575.png?name=CARD.png'
                        const HORIZONTAL = 'https://amber.7mfitness.com/category/image/363ba524-6876-4ff2-b14c-b25f77e529c4.jpeg?name=HORIZONTAL.jpeg'
                        const showTypeCode = getFieldValue('showTypeCode');
                        return showTypeCode ? showTypeCode == 'CARD' ? CARD : HORIZONTAL : null
                    },
                    style: {
                        height: '100px',
                    },
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
                    name: 'coverImgUrl',
                    label: 'Cover Image',
                    required: true,
                    acceptedFileTypes: 'png,webp',
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'detailImgUrl',
                    label: 'Detail Image',
                    required: true,
                    acceptedFileTypes: 'png,webp',
                    onChange: imageUpload
                }

            ]
        },
        {
            label: 'Workout',
            name: 'Workout',
            fields: [
                {
                    type: 'structureList',
                    name: 'workoutList',
                    // renderItemMata: renderItemMata,
                    label: 'Workout',
                    isCollapse: true,
                    formterList: (dataList, formValues) => {
                        return dataList?.map(item => {
                            return {
                                bizMusicId: item.id,
                                displayName: item.name,
                                premium: formValues.premium,
                            }
                        });
                    },
                    dataList: [],
                    emptyPlaceholder: 'Please add workouts',
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
    const handleFormFieldsChange = (updatedFields, formValues) => {
        setFormFields(updatedFields);
        // setInitialValues(formValues);
    };

    const saveBeforeTransform = (info) => {
        const { formFields, formValues } = info;

        // 递归处理表单字段的函数
        const processFields = (fields) => {
            fields.forEach(field => {
                // 处理结构化列表类型
                if (field.type === 'structureList') {
                    formValues[field.name] = field.dataList.map(item => item.id);
                }
                // 如果字段包含子字段，递归处理
                if (field.fields && Array.isArray(field.fields)) {
                    processFields(field.fields);
                }
            });
        };

        // 开始递归处理所有字段
        processFields(formFields);
        return formValues;
    }

    // 自定义渲染列表项展示
    const renderItemMata = (item) => {
        return <div>{item.displayName}</div>
    }
    const initCommonListData = (params) => {
        return new Promise(resolve => {
            request.get({
                url: `/workout/page`,
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
                title: 'Workouts',
            }}
            moduleKey='category'
            isCollapse={true}
            formType="advanced"
            // getDataAfter={getDataAfter}
            saveBeforeTransform={saveBeforeTransform}
            enableDraft={true}
            config={{ formName: 'Collections', title: 'Category details' }}
            initialValues={initialValues}
        />
    );
} 