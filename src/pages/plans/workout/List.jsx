import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import request from "@/request/index.js";
import TagSelector from '@/components/TagSelector/TagSelector';
import { Table, Modal, Select, Form, Spin, message } from "antd";


export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const location = useLocation()
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行
    const currentSelectedRowKeys = useRef([])
    const [templateList, setTemplateList] = useState([])
    const [languageOptions, setLanguageOptions] = useState([])
    const [generateForm] = Form.useForm(); // 生成文件表单实例
    const [messageApi, contextHolder] = message.useMessage();
    const [generateModalVisible, setGenerateModalVisible] = useState(false);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [showLangField, setShowLangField] = useState(false); // 添加状态控制Lang字段显示


    //查询条件数组
    const filterSections = useMemo(() => [
        {
            title: 'Gender',
            key: 'genderCodes',
            type: 'multiple',
            options: "BizExerciseGenderEnums",
        },
        {
            title: 'Injured',
            key: 'injuredCodes',
            type: 'multiple',
            options: "BizExerciseInjuredEnums",
        },
        {
            title: 'Duration (Min)',
            key: 'durationCode',
            type: 'multiple',
            options: "BizTemplateDurationEnums",
        },
        {
            title: 'Template ID',
            key: 'templateId',
            type: 'single',
            options: templateList,
        },
        {
            title: 'File Status',
            key: 'fileStatus',
            type: 'multiple',
            options: "BizGenerateTaskStatusEnums",
        },
    ], [templateList]);
    let templateId = new URLSearchParams(location.search).get('id')
    templateId = templateId ? Number(templateId) : null
    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            { title: 'ID', dataIndex: 'id', key: 'id', width: 60, visibleColumn: 1 },
            { title: "Duration (Min)", dataIndex: "duration", render: (text, record) => record.duration / 60000, },
            { title: "Calorie (Kcal)", dataIndex: "calorie" },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
                showSorterTooltip: false,
                options: 'BizExerciseGenderEnums',
                width: 120,
            },
            {
                title: 'Injured (Query Param)',
                dataIndex: 'injuredCodes',
                sorter: true,
                showSorterTooltip: false,
                options: 'BizExerciseInjuredEnums',
                width: 140,
            },
            {
                title: 'Injured (Actual Result)',
                dataIndex: 'injuredActualCodes',
                sorter: true,
                showSorterTooltip: false,
                options: 'BizExerciseInjuredEnums',
                width: 140,
            },
            { title: "Create Time", dataIndex: "createTime", width: 180, },
            {
                title: 'Audio Lang',
                sorter: true,
                showSorterTooltip: false,
                width: 150,
                visibleColumn: 1,
                render: (text, record) => record.audioJsonLanguages,
            },
            {
                title: 'File Status',
                dataIndex: 'fileStatus',
                sorter: true,
                showSorterTooltip: false,
                options: 'displayStatus',
                width: 120,
            },
        ];
    }, []);

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Auto Workouts');

        // // 设置头部按钮
        // setButtons([
        //     {
        //         key: 'create',
        //         text: 'Add Auto Workouts',
        //         icon: <PlusOutlined/>,
        //         type: 'primary',
        //         onClick: () => router().push('editor'),
        //     }
        // ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);
    const getTableList = useCallback(async (params) => {
        return new Promise(resolve => {
            request.get({
                url: '/template/workout/page', data: { templateId, ...params },
                callback: (res) => {
                    resolve(res.data)
                }
            });
        })
    }, [])

    /**
     *
     * 批量生成功能
     */
    // 监听files字段变化
    const handleFilesChange = useCallback((checkedValues = []) => {
        // 确保 checkedValues 是数组
        const values = Array.isArray(checkedValues) ? checkedValues : [];
        const videoFlag = values.includes('Video-M3U8');
        const audioFlag = values.includes('Audio-JSON');
        // 如果选择了 Audio-JSON，显示 Lang 字段
        setShowLangField(audioFlag);
        generateForm.setFieldsValue({ videoFlag, audioFlag });
        // 如果取消选择 Audio-JSON，清空 Lang 字段的值
        if (!audioFlag) {
            generateForm.setFieldsValue({ languageList: [] });
        }
        // 触发表单验证
        generateForm.validateFields(['files', 'languageList']).catch(() => { });
    }, [generateForm]);

    // 监听language字段变化
    const handleLanguageChange = useCallback((checkedValues = []) => {
        // 确保 checkedValues 是数组
        const values = Array.isArray(checkedValues) ? checkedValues : [];
        generateForm.setFieldsValue({ languageList: values });
    }, [generateForm]);

    // 生成文件的表单配置
    const generateFormConfig = useMemo(() => [
        {
            label: 'File',
            name: 'files',
            rules: [{ required: true, message: 'Please Select File' }],
            validateTrigger: ['onChange', 'onSubmit'],
            type: 'tagSelector',
            mode: 'multiple',
            options: [
                { label: 'Video-M3U8', value: 'Video-M3U8' },
                { label: 'Audio-JSON', value: 'Audio-JSON' }
            ],
            onChange: handleFilesChange
        },
        {
            label: 'Lang',
            name: 'languageList',
            rules: [{ required: true, message: 'Please Select Lang' }],
            validateTrigger: ['onChange'],
            type: 'tagSelector',
            mode: 'multiple',
            placeholder: 'Please Select Lang',
            options: languageOptions,
            visible: showLangField,
            onChange: handleLanguageChange
        },
        {
            label: 'Template',
            name: 'templateId',
            rules: [{ required: true, message: 'Please Select Template' }],
            type: 'tagSelector',
            options: templateList
        }
    ], [languageOptions, templateList, showLangField, handleFilesChange, handleLanguageChange]);
    const onSelectChange = useCallback((newSelectedRowKeys) => {
        currentSelectedRowKeys.current = newSelectedRowKeys
        setSelectedRowKeys(newSelectedRowKeys)

    }, []);
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 60,
    };
    // 渲染表单项
    const renderFormItem = (item) => {
        if (item.visible === false) {
            // 对于隐藏字段，渲染Form.Item但不显示
            return (
                <Form.Item
                    key={item.name}
                    name={item.name}
                    hidden
                >
                    <input type="hidden" />
                </Form.Item>
            );
        }
        if (item.name === 'languageList' && !showLangField) return null;

        let childNode;
        switch (item.type) {
            case 'tagSelector':
                childNode = <TagSelector backgroundColor="#f8f8f8" key={item.name} {...item} />;
                break;
            case 'select':
                childNode = <Select {...item.props} />;
                break;
            default:
                childNode = null;
        }

        return (
            <Form.Item
                key={item.name}
                label={item.label}
                name={item.name}
                rules={item.rules}
                style={{ height: item.height || '96px' }}
                validateTrigger={item.validateTrigger}
            >
                {childNode}
            </Form.Item>
        );
    };

    // 处理生成文件
    const handleGenerate = useCallback(async () => {
        try {
            const formValues = await generateForm.validateFields(true);
            formValues.videoFlag = formValues.files.includes('Video-M3U8');
            formValues.audioFlag = formValues.files.includes('Audio-JSON');
            formValues.workoutIdList = currentSelectedRowKeys.current;

            setGenerateLoading(true);
            generate(formValues);
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    }, [generateForm]);

    const expandedRowRender = useCallback((record) => {

        // 定义展开行表格的列配置
        const columns = [
            {
                title: 'Video Id',
                dataIndex: 'id',
                key: 'id',
                width: 80
            },
            {
                title: 'Image',
                dataIndex: 'coverImgUrl',
                key: 'id',
                mediaType: 'image',
                render: (text, record) => <img src={record.coverImgUrl} style={{ width: 80, height: 80 }} />,
                width: 80
            },
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                width: 200
            },
            {
                title: 'Structure Type',
                dataIndex: 'structureTypeCode',
                options: 'BizExerciseStructureTypeEnums',
                width: 120
            },
            {
                title: 'Unit Name',
                dataIndex: 'unitName',
                width: 200
            },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                options: "BizExerciseGenderEnums",
                width: 200
            },
            {
                title: 'Injured',
                dataIndex: 'injuredCodes',
                options: "BizExerciseInjuredEnums",
                width: 200
            },
        ];

        return (
            <Table
                columns={columns}
                dataSource={record.videoList}
                pagination={false}
                rowKey="id"
                size="small"
                bordered={false}
            />
        );
    });


    const leftToolbarItems = useMemo(() => [
        {
            key: 'batchCreate',
            label: 'Batch Create File',
            onClick: () => {
                setGenerateModalVisible(true);
                // 设置表单初始值
                generateForm.setFieldsValue({
                    templateId
                });
            },
            icon: <PlusOutlined />,
            // disabled: selectedRowKeys.length === 0
        }
    ], [templateId]);
    const generate = useCallback((params) => {
        return new Promise(resolve => {
            request.post({
                url: `/template/workout/generateFile`,
                point: false,
                data: params,
                callback(res) {
                    if (res?.data?.success) {
                        setGenerateLoading(false);
                        setGenerateModalVisible(false);
                        messageApi.success('Task in progress...');
                        // 成功后清空表单
                        generateForm.resetFields();
                        setShowLangField(false);
                    } else {
                        messageApi.error(res.message);
                    }
                }
            })
        })
    })
    // 获取template所有数据
    const getTemplateList = useCallback(() => request.get({
        url: '/template/page',
        data: {
            pageIndex: 1,
            pageSize: 999999
        },
        success(res) {
            const options = res?.data?.data?.map(i => ({ label: `${i.name} (ID:${i.id})`, value: i.id })) || [];
            setTemplateList(options)
        }
    }))
    // 获取语言数据
    const getLanguageList = useCallback(() => request.get({
        url: '/common/language/list',
        success(res) {
            setLanguageOptions(res?.data?.data?.map(i => ({ label: i.toLocaleUpperCase(), value: i })) || [])
        }
    }))
    useEffect(() => {
        getTemplateList()
        getLanguageList()
    }, [])
    //渲染表格组件
    return (
        <>
            {/* Generate Files Modal */}
            <Modal
                title="Batch Create File"
                open={generateModalVisible}
                onOk={handleGenerate}
                onCancel={() => {
                    setGenerateModalVisible(false);
                    generateForm.resetFields();
                    setShowLangField(false);
                }}
                confirmLoading={generateLoading}
            >
                <Spin spinning={generateLoading} tip="Generating files...">
                    <Form
                        form={generateForm}
                        layout="vertical"
                        style={{ minHeight: '300px' }}
                        initialValues={{
                            templateId
                        }}
                    >
                        {generateFormConfig.map(renderFormItem)}
                    </Form>
                </Spin>
            </Modal>
            {contextHolder}
            <ConfigurableTable
                columns={allColumnDefinitions}
                expandedRowRender={expandedRowRender}
                rowSelection={rowSelection}
                leftToolbarItems={leftToolbarItems}
                getTableList={getTableList}
                moduleKey="workout"
                operationName="page"
                searchConfig={{
                    placeholder: "Search ID",
                    fieldName: "id"
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </>
    );
}