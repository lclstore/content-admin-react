import React, { useContext, useEffect, useState, useMemo, useCallback, useForm } from 'react';
import { Modal, message, Form, Table, Switch } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDateRange } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';

export default function WorkoutsList() {

    // 定义筛选器配置
    var filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'statusList',
        },
        {
            title: 'Structure Type',
            key: 'structureTypeCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseStructureTypeEnums'
        },
        {
            title: 'Gender',
            key: 'genderCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseGenderEnums'
        },
        {
            title: 'Difficulty',
            key: 'difficultyCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseDifficultyEnums'
        },
        {
            title: 'Position',
            key: 'positionCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExercisePositionEnums',
        },
        {
            title: 'Injured',
            key: 'injuredCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseInjuredEnums'
        },
        {
            title: 'Equipment',
            key: 'equipmentCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseEquipmentEnums'
        },
        {
            title: 'File Status',
            key: 'fileStatusList',
            type: 'multiple', // 单选 //multiple 多选
            options: [
                {
                    label: 'Succeeded',
                    value: 'SUCCEEDED'
                },
                {
                    label: 'Failed',
                    value: 'FAILED'
                },
                {
                    label: 'Processing',
                    value: 'PROCESSING'
                }
            ]
        }



    ];



    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const [loading, setLoading] = useState(false); // 加载状态
    const [searchValue, setSearchValue] = useState(''); // 搜索关键词
    const [selectedFilters, setSelectedFilters] = useState({ status: [], functionType: [], difficulty: [], position: [], target: [] }); // 筛选条件
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // 删除确认弹窗
    const [currentRecord, setCurrentRecord] = useState(null); // 当前操作的记录
    const [actionInProgress, setActionInProgress] = useState(false); // 操作进行中状态
    const [actionClicked, setActionClicked] = useState(false); // 操作按钮点击状态，用于阻止行点击事件
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行
    const [messageApi, contextHolder] = message.useMessage();

    // 批量创建文件 Modal 状态
    const [isBatchCreateModalVisible, setIsBatchCreateModalVisible] = useState(false); // 批量创建弹窗可见性
    const [batchCreateForm] = Form.useForm(); // 批量创建表单实例
    const [batchCreateLoading, setBatchCreateLoading] = useState(false); // 批量创建提交加载状态

    // 在Modal打开时重置表单
    useEffect(() => {
        console.log('isBatchCreateModalVisible', isBatchCreateModalVisible, batchCreateForm.resetFields())
        if (isBatchCreateModalVisible) {
            batchCreateForm.resetFields();
            batchCreateForm.setFieldsValue({ files: ['Video-M3U8'], lang: ['EN'] }); // 设置默认值
        }
    }, [isBatchCreateModalVisible, batchCreateForm]);

    // 2. 回调函数定义 - 用户交互和事件处理
    /**
     * 批量创建文件按钮点击处理
     * 显示弹窗
     */
    const handleBatchCreateFile = useCallback(() => {
        debugger
        setIsBatchCreateModalVisible(true);
    }, []);



    /**
     * 状态变更处理
     * 更新训练计划的状态（启用/禁用/弃用）
     */
    const handleStatusChange = useCallback((record, newStatus) => {
        setActionInProgress(true);
        const updatedRecord = { ...record, status: newStatus };
        setDataSource(current =>
            current.map(item =>
                item.id === record.id ? updatedRecord : item
            )
        );
        setActionInProgress(false);
        const actionMap = {
            'Enabled': 'enabled',
            'Disabled': 'disabled',
            'Deprecated': 'deprecated',
            'Premium': 'added to subscription'
        };
        messageApi.success(`Successfully ${actionMap[newStatus]} "${record.name}"`);
    }, [messageApi]);


    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        // 简单的状态-按钮映射关系
        if (status === 0 && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 2 && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        if (status === 1 && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 3 && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 4 && ['duplicate'].includes(btnName)) return true;

        return false;
    }, []);

    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [

            {
                title: 'Cover ImgUrl',
                width: 120,
                mediaType: 'image',
                dataIndex: 'coverImgUrl',
                key: 'coverImgUrl',
                visibleColumn: 0
            },
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80, visibleColumn: 0 },
            // {
            //     title: 'Detail ImgUrl',
            //     width: 120,
            //     mediaType: 'image',
            //     dataIndex: 'detailImgUrl',
            //     key: 'detailImgUrl',
            //     visibleColumn: 0
            // },
            // {
            //     title: 'Thumbnail ImgUrl',
            //     width: 120,
            //     mediaType: 'image',
            //     dataIndex: 'thumbnailImgUrl',
            //     key: 'thumbnailImgUrl',
            //     visibleColumn: 0
            // },
            // {
            //     title: 'Complete ImgUrl',
            //     width: 120,
            //     mediaType: 'image',
            //     dataIndex: 'completeImgUrl',
            //     key: 'completeImgUrl',
            //     visibleColumn: 0
            // },

            {
                title: 'Name', dataIndex: 'name', key: 'name', width: 350, visibleColumn: 0, sorter: true,
                render: (text) => <span style={{ fontWeight: 700 }}>{text}</span>,
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                width: 120,
                visibleColumn: 0,
                options: 'displayStatus',
            },

            {
                title: 'Premium',
                align: 'center',
                dataIndex: 'premium',
                key: 'premium',
                width: 120,
                options: 'defaultStatus',
                sorter: true,
                visibleColumn: 2,
                render: (text, record) => {
                    const defaultChecked = record.premium ? true : false;
                    return (
                        <Switch disabled={true} defaultChecked={defaultChecked} checked={text} />
                    );
                }
            },
            {
                title: 'Duration (Min)',
                align: 'center',
                dataIndex: 'duration',
                key: 'duration',
                width: 150,
                visibleColumn: 2,
                // render: (duration) => {
                //     if (!duration) return '-';
                //     const minutes = Math.floor(duration / 60);
                //     const seconds = duration % 60;
                //     return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                // }
            },
            {
                title: 'Calorie (Kcal)',
                align: 'center',
                dataIndex: 'calorie',
                key: 'calorie',
                width: 150,
                visibleColumn: 2
            },
            {
                title: 'Difficulty',
                dataIndex: 'difficultyCode',
                sorter: true,
                width: 120,
                visibleColumn: 2,
                options: 'BizExerciseDifficultyEnums',
                key: 'difficultyCode'
            },

            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'Male',
                        value: 'MALE'
                    }, {
                        label: 'Female',
                        value: 'FEMALE'
                    }
                ],
                key: 'genderCode'
            },

            {
                title: 'Position',
                dataIndex: 'positionCode',
                sorter: true,
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'Seated',
                        value: 'SEATED'
                    }, {
                        label: 'Standing',
                        value: 'STANDING'
                    },
                ],
                key: 'positionCode'
            },
            {
                title: 'Injured',
                dataIndex: 'injuredCodes',
                width: 120,
                visibleColumn: 1,
                options: [
                    {
                        label: 'Shoulder',
                        value: 'SHOULDER'
                    }, {
                        label: 'Back',
                        value: 'BACK'
                    }, {
                        label: 'Wrist',
                        value: 'WRIST'
                    }, {
                        label: 'Knee',
                        value: 'KNEE'
                    }, {
                        label: 'Ankle',
                        value: 'ANKLE'
                    }, {
                        label: 'Hip',
                        value: 'HIP'
                    }, {
                        label: 'None',
                        value: 'NONE'
                    },
                ],
                key: 'injuredCodes'
            },
            {
                title: 'New Date',
                key: 'newStartTime',
                render: (text, record) => {
                    return formatDateRange(record.newStartTime, record.newEndTime);
                },
                width: 220,
                visibleColumn: 1
            },
            {
                title: 'Audio Lang',
                dataIndex: 'audioLang',
                key: 'audioLang',
                width: 120,
                visibleColumn: 1,
                // 渲染音频语言
                // render: (_, record) => {
                //     const langs = Array.isArray(record.audioLang) ? record.audioLang : [];
                //     return langs.join(',');
                // }
            },
            {
                title: 'File Status', dataIndex: 'fileStatus', key: 'fileStatus',
                width: 120,
                ellipsis: true,
                options: 'fileStatus',
                visibleColumn: 1
            },



            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                // 定义所有可能的按钮
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],
                // 控制按钮显示规则
                isShow: isButtonVisible,
            },
        ];
    }, [isButtonVisible]);

    /**
     * 处理行选择变化
     * 用于批量操作功能
     */
    const onSelectChange = useCallback((newSelectedRowKeys) => {
        console.log('11111111')
        setSelectedRowKeys(newSelectedRowKeys);
    }, []);



    /**
     * 批量创建 Modal 取消处理
     */
    const handleBatchCreateModalCancel = useCallback(() => {
        setIsBatchCreateModalVisible(false);
    }, []);

    /**
     * 批量创建 Modal 确认处理
     */
    const handleBatchCreateModalOk = useCallback(async () => {
        try {
            setBatchCreateLoading(true);
            const values = await batchCreateForm.validateFields();
            const { files, lang } = values;


            setDataSource(updatedDataSource);

            messageApi.success(`Task submitted, files will be generated for ${selectedRowKeys.length} workouts.`);
            setIsBatchCreateModalVisible(false);

        } catch (errorInfo) {
            console.log('表单验证失败:', errorInfo);
        } finally {
            setBatchCreateLoading(false);
        }
    }, [batchCreateForm, selectedRowKeys, messageApi]);

    // 7. 副作用 - 组件生命周期相关处理
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Workout');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Create Workout',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate('/workouts/editor'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    /**
     * 重置操作标志
     */
    useEffect(() => {
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);


    /**
     * 左侧工具栏按钮定义
     */
    const leftToolbarItems = useMemo(() => [
        {
            key: 'batchCreate',
            label: 'Batch Create File',
            onClick: handleBatchCreateFile,
            icon: <PlusOutlined />,

            // disabled: selectedRowKeys.length === 0
        }
    ], [handleBatchCreateFile, selectedRowKeys]);

    /**
     * 行选择配置
     */
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 60,
    };


    // 9. 渲染 - 组件UI呈现
    // 渲染 - 组件UI呈现
    // 渲染 - 组件UI呈现
    return (
        <div className="workoutsContainer page-list">
            <ConfigurableTable
                open={isBatchCreateModalVisible}
                onOk={handleBatchCreateModalOk}
                onCancel={handleBatchCreateModalCancel}

                rowSelection={rowSelection}
                columns={allColumnDefinitions}
                leftToolbarItems={leftToolbarItems}
                moduleKey="workout"
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={true}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </div>
    );
}   