import React, { useMemo, useState } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from '@/request';
import { validateEmail, validatePassword } from '@/utils';

export default function UserEditorWithCommon() {

    // 表单字段配置
    const initialFormFields = useMemo(() => [
        {
            type: 'input',
            name: 'name',
            label: 'Name',
            maxLength: 100,
            required: true,
            placeholder: 'Music name',
        },
        {
            type: 'switch',
            name: 'premium',
            label: 'Premium',
            checkedChildren: "Yes",
            unCheckedChildren: 'No'

        },
        {
            type: 'select',
            mode: 'single',
            name: 'type',
            label: 'Type',
            options: [
                { label: 'Regular', value: 'REGULAR' },
                { label: 'Yoga', value: 'YOGA' },
                { label: 'Dance', value: 'DANCE' },
            ],
            required: true,
        },
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


    ], []); // 使用useMemo优化性能，避免每次渲染重新创建

    const initCommonListData = (params) => { 
        return new Promise(resolve => {
            request.get({
                url: `/music/page`,
                load: false,
                data: params,
                callback: res => resolve(res?.data)
            });
        })
    }
    // 使用新设计：只维护一个formFields状态，并提供更新回调
    const [formFields, setFormFields] = useState(initialFormFields);

    // 处理formFields变更的回调
    const handleFormFieldsChange = (updatedFields) => {
        // console.log('updatedFields', updatedFields);

        setFormFields(updatedFields);
    };
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList'
        }
    ];
    return (
        <CommonEditorForm
            moduleKey='playlist'
            commonListConfig={{
                initCommonListData: initCommonListData,
                placeholder: 'Search your content name...',
                filterSections: filterSections,
            }}
            formType="advanced"
            enableDraft={true}
            onFormFieldsChange={handleFormFieldsChange}
            config={{ formName: 'Playlist', hideSaveButton: false, hideBackButton: false }}
            fields={formFields}
        />
    );
} 