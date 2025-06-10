import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { router } from "@/utils/index.js";
import request from "@/request/index.js";
import { App, Table, Modal, Button, Checkbox, Typography, Select } from "antd";
import { useImmer } from "use-immer";

export default function WorkoutsList() {
    const tableRef = useRef(null);
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const location = useLocation()
    const [templateList, setTemplateList] = useState([])
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
    // 弹窗
    const [createFileConfig, updateCreateFileConfig] = useImmer({
        visible: false,
        "videoFlag": false,
        "audioFlag": false,
        "languages": [],
        "workoutIds": [],
        templateId,
        loading: false,
    })
    const languageOptions = [
        {
            value: "en",
            label: "English"
        },
    ]
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
                dataIndex: 'id',
                key: 'id',
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
            onClick: () => updateCreateFileConfig(draft => void (draft.visible = true)),
            icon: <PlusOutlined />,
            // disabled: selectedRowKeys.length === 0
        }
    ], []);
    const generate = useCallback(() => {
        return new Promise(resolve => {
            request.post({
                url: `/template/workout/generateFile`,
                point: true,
                data: {
                    // 获取 workoutIds
                    workoutIds: tableRef.current.selectList.get(),
                    ...createFileConfig
                },
                callback() {
                    resolve()
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
            setTemplateList(res.data.data.map(i => ({ value: i.id, label: `(${i.id}) ${i.name}`, ...i })))
        }
    }))
    useEffect(() => {
        getTemplateList()
    }, [])
    //渲染表格组件
    return (
        <>
            {/* Batch Create File */}
            <Modal
                title="Generate"
                styles={{ content: { width: '200px' } }}
                open={createFileConfig.visible}
                okText="OK"
                onOk={() => {
                    updateCreateFileConfig(draft => {
                        draft.loading = true
                    })
                    generate().then(() => {
                        updateCreateFileConfig(draft => {
                            draft.visible = false
                            draft.loading = false
                        })
                    })
                }}
                confirmLoading={createFileConfig.loading}
                onCancel={() => updateCreateFileConfig(draft => void (draft.visible = false))}
                okButtonProps={{
                    disabled: (
                        !(createFileConfig.videoFlag || createFileConfig.audioFlag) ||
                        !createFileConfig.templateId) ||
                        (createFileConfig.audioFlag && !createFileConfig.languages.length)
                }}
            >
                <Typography.Title level={5} style={{ color: 'black' }}>File:</Typography.Title>
                <div>
                    <Checkbox checked={createFileConfig.videoFlag} onChange={
                        (e) =>
                            updateCreateFileConfig(draft => void (draft.videoFlag = e.target.checked))
                    }>Video-M3U8</Checkbox>
                    <Checkbox checked={createFileConfig.audioFlag} onChange={
                        (e) => {
                            if (!e.target.checked) {
                                updateCreateFileConfig(draft => void (draft.languages = []))
                            }
                            updateCreateFileConfig(draft => void (draft.audioFlag = e.target.checked))
                        }}>Audio-JSON</Checkbox>
                </div>
                {
                    createFileConfig.audioFlag && <div>
                        <Typography.Title level={5} style={{ color: 'black' }}>Lang:</Typography.Title>
                        <Checkbox.Group options={languageOptions} value={createFileConfig.languages} onChange={
                            (val) =>
                                updateCreateFileConfig(draft => void (draft.languages = val))} />
                    </div>
                }
                <Typography.Title level={5} style={{ color: 'black' }}>Template:</Typography.Title>
                <Select
                    style={{ width: '100%' }}
                    value={createFileConfig.templateId}
                    onChange={
                        (val) =>
                            updateCreateFileConfig(draft => void (draft.templateId = val))}
                    options={templateList}
                />
            </Modal>
            <ConfigurableTable
                ref={tableRef}
                columns={allColumnDefinitions}
                expandedRowRender={expandedRowRender}
                rowSelection={true}
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