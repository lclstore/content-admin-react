import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import CommonEditorForm from '@/components/CommonEditorForm';
import { commonListData, filterSections } from '@/pages/Data';
import { validateEmail, validatePassword } from '@/utils';
import {
    ThunderboltOutlined,
    TagsOutlined,
    ShrinkOutlined,
    ArrowsAltOutlined,
    PictureOutlined,
    InfoOutlined,
    SettingOutlined,
    SlidersOutlined,
    VideoCameraOutlined,
    DeleteOutlined,
    RetweetOutlined,
    MenuOutlined,
    InfoCircleOutlined,
    MinusOutlined,
    PlusOutlined,
    CaretRightOutlined,
    CopyOutlined
} from '@ant-design/icons';
export default function UserEditorWithCommon() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    // 初始用户数据状态--可设默认值
    const initialValues = {
        name: 'hhs',
    }
    const mockUsers = [];


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
                    const user = mockUsers.find(u => u.id === parseInt(id, 10));
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
                    type: 'dateRange',
                    name: 'timeRange',
                    label: 'New Date',
                    keys: ['startTime', 'endTime'],
                    required: false,
                },
                {
                    type: 'switch',
                    name: 'premium',
                    label: 'Premium',
                    defaultChecked: 0,

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
                },
                {
                    type: 'upload',
                    name: 'thumbnailImage',
                    label: 'Thumbnail Image',
                    required: true,
                    onChange: imageUpload
                },
                {
                    type: 'upload',
                    name: 'completeImage',
                    label: 'Complete Image',
                    required: true,
                    onChange: imageUpload
                },

            ]
        },
        {
            label: 'Labels',
            name: 'labels',
            icon: <TagsOutlined />,
            fields: [
                {
                    type: 'select',
                    name: 'difficulty',
                    label: 'Difficulty',
                    required: true,
                    options: [
                        { label: 'Beginner', value: 1 },
                        { label: 'Intermediate', value: 2 },
                        { label: 'Advanced', value: 3 }
                    ],
                },
                {
                    type: 'select',
                    name: 'equipment',
                    label: 'Equipment',
                    required: true,
                    options: [
                        { label: 'Dumbbell', value: 1 },
                        { label: 'Resistance band', value: 2 },
                        { label: 'None', value: 3 }
                    ]
                },
                {
                    type: 'select',
                    name: 'position',
                    label: 'Position',
                    required: true,
                    options: [
                        { label: 'Standing', value: 1 },
                        { label: 'Lying', value: 2 },
                        { label: 'Seated', value: 3 },
                        { label: 'Prone', value: 4 },
                        { label: 'Kneeling', value: 5 }
                    ]
                },
                {
                    type: 'select',
                    mode: 'multiple',
                    name: 'target',
                    label: 'Target',
                    required: true,
                    options: [
                        { label: 'Full Body', value: 1 },
                        { label: 'Arm', value: 2 },
                        { label: 'Back', value: 3 },
                        { label: 'Butt', value: 4 },
                        { label: 'Abs', value: 5 },
                        { label: 'Leg', value: 6 },
                        { label: 'Core', value: 7 }
                    ]
                }
            ]
        },
        {
            label: 'Duration Settings',
            name: 'durationSettings',
            icon: <SettingOutlined />,
            fields: [
                {
                    type: 'numberStepper',
                    min: 0,
                    max: 10,
                    step: 10,
                    formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
                    name: 'introDuration', // 修改字段名避免重复
                    label: 'Intro Duration',

                },
                {
                    type: 'numberStepper',
                    min: 0,
                    max: 10,
                    step: 10,
                    formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
                    name: 'exercisePreviewDuration', // 修改字段名避免重复
                    label: 'Exercise Preview Duration',
                },
                {
                    type: 'numberStepper',
                    min: 10,
                    max: 40,
                    step: 10,
                    formatter: (value) => `0:${String(value).padStart(2, '0')}`, // 格式化显示为 0:XX
                    name: 'exerciseExecutionDuration', // 修改字段名避免重复
                    label: 'Exercise Execution Duration',
                }
            ]
        },
        {

            title: 'Structure',
            label: 'Structure Settings',
            name: 'structure',
            isShowAdd: true,
            isListData: true,//
            icon: <VideoCameraOutlined />,
            fields: [
                {
                    type: 'input',
                    name: 'structureName',
                    label: 'Structure Name',
                    required: true,
                },
                {
                    type: 'numberStepper',
                    min: 1,
                    max: 5,
                    step: 1,
                    formatter: (value) => value, // 格式化显示为 0:XX
                    name: 'reps', // 修改字段名避免重复
                    label: 'Reps',
                    required: true,
                }
            ]

        }


    ], []); // 使用useMemo优化性能，避免每次渲染重新创建
    const [formFields, setFormFields] = useState(initialFormFields);
    const [activeKeys, setActiveKeys] = useState([]);

    // 添加自定义面板的回调函数
    const handleAddCustomPanel = (newPanel) => {
        // 只添加新面板到 formFields
        setFormFields(prevFields => [...prevFields, newPanel]);
        // 不再需要设置 activeKeys，因为 CollapseForm 组件中已经直接调用了 onCollapseChange(newPanelName)
        // setActiveKeys(prevKeys => [...prevKeys, newPanel.name]);
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
    return (
        <CommonEditorForm
            commonListConfig={
                {
                    // renderItemMata: renderItemMata, // 自定义渲染列表项
                    initCommonListData: initCommonListData, // 搜索方法
                    placeholder: 'Search your content name...', // 搜索框提示
                    filterSections: filterSections, // 筛选器
                    defaultQueryParams: { // 默认查询参数
                        page: 1,
                        pageSize: 10,
                        status: 1
                    },
                    activeFilters: {
                        target: ["Core", "Leg"]
                    }
                }
            }
            collapseFormConfig={
                {
                    fields: formFields, // 表单字段配置
                    initialValues: initialValues, // 默认初始值
                    isCollapse: true, //是否折叠分组
                    activeKeys: activeKeys, // 传递激活的keys
                    onCollapseChange: setActiveKeys, // 传递用于更新激活keys的函数
                    handleAddCustomPanel: handleAddCustomPanel, // 传递添加自定义面板的函数
                }
            }
            initFormData={initFormData}
            formType="advanced"
            config={{ formName: 'Collections' }}

            initialValues={initialValues}
            onSave={handleSaveUser}
        />
    );
} 