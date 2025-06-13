import React, { useMemo, useState } from 'react';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from '@/request';
import { validateEmail, validatePassword } from '@/utils';
import { LockFilled, UnlockFilled } from '@ant-design/icons';
export default function UserEditorWithCommon() {
    const [initialValues, setInitialValues] = useState({
        type: 'REGULAR',
        premium: 0,
    })
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
            type: 'select',
            mode: 'single',
            name: 'type',
            label: 'Type',
            options: "BizPlaylistTypeEnums",
            required: true,
        },
        {
            type: 'select',
            name: 'premium',
            label: 'Premium',
            required: true,
            setDefaultValue: 0,
            options: [
                { label: 'Yes', value: 1 },
                { label: 'No', value: 0 },
            ],
        },
        {
            type: 'structureList',
            name: 'musicList',
            // renderItemMata: renderItemMata,
            label: 'Musics',
            dataList: [],
            emptyPlaceholder: 'Please add music',
            lockName: 'premium',
            defaultLockValue: 0,
            structureListFields: [
                // {
                //     type: 'icon',
                //     name: 'lock',
                //     label: 'Lock',
                //     options: [
                //         { value: 1, label: <LockFilled /> },
                //         { value: 0, label: <UnlockFilled /> },
                //     ],
                //     defaultValue: 0,
                // }
                // {
                //     type: 'input',
                //     required: true,
                //     setDefaultValue: (data) => {
                //         return data.name
                //     },
                //     name: 'displayName',
                //     label: 'Display Name',
                // },
                // {
                //     type: 'select',
                //     name: 'premium',
                //     label: 'Premium',
                //     required: true,
                //     setDefaultValue: 0,
                //     options: [
                //         { label: 'Yes', value: 1 },
                //         { label: 'No', value: 0 },
                //     ],
                // },

            ],

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

        setFormFields(updatedFields);
    };
    const saveBeforeTransform = (info) => {
        const { formFields, formValues } = info;
        const musicListField = formFields.find(field => field.type === 'structureList');
        if (musicListField) {
            formValues.musicList = musicListField.dataList.map(item => {
                return {
                    bizMusicId: item.id,
                    // displayName: item.name,
                    displayName: item.displayName,
                    premium: item.premium,
                }
            });
        }
        return formValues;
    }

    return (
        <CommonEditorForm
            moduleKey='playlist'
            commonListConfig={{
                initCommonListData: initCommonListData,
                placeholder: 'Search your content name...',
                // filterSections: filterSections,
                title: 'Musics',
            }}
            initialValues={initialValues}
            saveBeforeTransform={saveBeforeTransform}
            formType="advanced"
            enableDraft={true}
            onFormFieldsChange={handleFormFieldsChange}
            config={{ formName: 'Playlist', hideSaveButton: false, hideBackButton: false, title: 'Playlist details' }}
            fields={formFields}
        />
    );
} 