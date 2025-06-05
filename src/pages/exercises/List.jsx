import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Modal, Button, Checkbox, Input, Typography, Radio, App } from 'antd';
import { PlusOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';


import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { useImmer } from "use-immer";
import request from "@/request/index.js";

export default () => {
    // 定义筛选器配置
    let filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: [{
                label: 'Draft',
                value: 'DRAFT'
            }, {
                label: 'Enabled',
                value: 'ENABLED'
            }, {
                label: 'Disabled',
                value: 'DISABLED'
            }],
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
            title: 'Equipment',
            key: 'equipmentCodeList',
            type: 'multiple', // 单选 //multiple 多选
            options: 'BizExerciseEquipmentEnums'
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
    ];
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const { message, modal } = App.useApp()
    // 用于接受table 的 search 数据
    const tableRef = useRef(null);
    const fieldOptions = useMemo(() => [
        ["ID", "id"], ["Name", "name"], ["Image URL", "coverImgUrl"], ["MET", "met"], ["Structure Type", "structureTypeCode"], ["Gender", "genderCode"],
        ["Difficulty", "difficultyCode"], ["Equipment", "equipmentCode"], ["Position", "positionCode"], ["Injured", "injuredCodes"],
        ["Guidance Script", "guidanceScript"], ["Howtodo Script", "howtodoScript"], ["Name Audio URL", "nameAudioUrl"], ["Guidance Audio URL", "guidanceAudioUrl"],
        ["Howtodo Audio URL", "howtodoAudioUrl"], ["Front Video URL", "frontVideoUrl"], ["Side Video URL", "sideVideoUrl"]
    ].map(i => ({ label: i[0], value: i[1] })), [])

    const [feishuImportModal, updateFeishuImportModal] = useImmer({
        loading: false,
        modalShow: false,
        bitableUrl: "",
        propertyList: fieldOptions.map(i => i.value),
    })
    const [feishuExportModal, updateFeishuExportModal] = useImmer({
        loading: false,
        modalShow: false,
        bitableUrl: "",
        propertyList: fieldOptions.map(i => i.value),
        exportBy: 1
    })
    const navigate = useNavigate();

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {

        const status = record.status;
        //  console.log(status)
        // 简单的状态-按钮映射关系
        if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
        if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'delete'].includes(btnName)) return true;
        if (status === 'ENABLED' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 'Premium' && ['edit', 'duplicate', 'disable'].includes(btnName)) return true;
        if (status === 'Deprecated' && ['duplicate'].includes(btnName)) return true;

        return false;
    }, []);
    // 3. 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            
            {
                title: 'Image',
                width: 120,
                mediaType: 'image',
                dataIndex: 'coverImgUrl',
                key: 'coverImgUrl',
                visibleColumn: 0
            },
            {
                title: 'ID',
                dataIndex: 'id',
                visibleColumn: 0,
                width: 50,
                key: 'id'
            },
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: true,
                width: 120,
                visibleColumn: 0,
                key: 'name'
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                showSorterTooltip: false,
                options: 'displayStatus',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'MET',
                dataIndex: 'met',
                sorter: true,
                width: 120,
                visibleColumn: 2,
                key: 'met'
            },
            {
                title: 'Structure Type',
                dataIndex: 'structureTypeCode',
                sorter: true,
                width: 120,
                visibleColumn: 2,
                options: "BizExerciseStructureTypeEnums",
                key: 'structureTypeCode'
            },
            {
                title: 'Difficulty',
                dataIndex: 'difficultyCode',
                sorter: true,
                width: 120,
                visibleColumn: 2,
                options: "BizExerciseDifficultyEnums",
                key: 'difficultyCode'
            },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
                width: 120,
                visibleColumn: 1,
                options: "BizExerciseGenderEnums",
                key: 'genderCode'
            },

            {
                title: 'Equipment',
                dataIndex: 'equipmentCode',
                width: 120,
                visibleColumn: 1,
                options: "BizProgramEquipmentEnums",
                key: 'equipmentCode'
            },
            {
                title: 'Position',
                dataIndex: 'positionCode',
                sorter: true,
                width: 120,
                visibleColumn: 1,
                options: "BizExercisePositionEnums",
                key: 'positionCode'
            },
            {
                title: 'Injured',
                dataIndex: 'injuredCodes',
                width: 120,
                visibleColumn: 1,
                options: "BizExerciseInjuredEnums",
                key: 'injuredCodes'
            },
            {
                title: 'Front Video Status',
                dataIndex: 'frontVideoStatus',
                width: 140,
                visibleColumn: 1,
                key: 'frontVideoStatus'
            },
            {
                title: 'Side Video Status',
                dataIndex: 'sideVideoStatus',
                width: 140,
                visibleColumn: 1,
                key: 'sideVideoStatus'
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
                // 按钮点击处理函数
            }
        ];
    }, []);


    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle && setCustomPageTitle('Exercises');
        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Exercise',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => navigate(`/exercises/editor`),
            },
            {
                key: 'Import',
                text: 'Feishu Import',
                icon: <ArrowDownOutlined />,
                type: 'primary',
                onClick: () => updateFeishuImportModal(draft => void (draft.modalShow = true)),
            },
            {
                key: 'Export',
                text: 'Export Feishu',
                icon: <ArrowUpOutlined />,
                type: 'primary',
                onClick: () => updateFeishuExportModal(draft => void (draft.modalShow = true)),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle && setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);
    const feishuImport = useCallback(async () => {
        return new Promise(resolve => {
            request.post({
                url: `/exercise/import`,
                data: feishuImportModal,
                point: true,
                callback() {
                    resolve()
                }
            })
        })
    })
    const feishuExport = useCallback(async () => {
        const data = { ...feishuExportModal }
        data.exportBy === 2 && (data.pageReq = tableRef.current.getSearchData())
        return new Promise(resolve => {
            request.post({
                url: `/exercise/export`,
                data,
                warningPoint: false,
                callback(res) {
                    resolve(res)
                }
            })
        })
    })

    // 渲染 - 组件UI呈现
    return (
        <div className="list-page">
            <ConfigurableTable
                ref={tableRef}
                columns={allColumnDefinitions}
                moduleKey="exercise"
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={true}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
            <Modal
                title="FeiShu Import"
                style={{ top: 20 }}
                styles={{ content: { width: '500px' } }}
                open={feishuImportModal.modalShow}
                footer={[
                    <Button key="submit" type="primary" loading={feishuImportModal.loading} onClick={
                        () => {
                            updateFeishuImportModal(draft => {
                                draft.loading = true
                            })
                            feishuImport().then(() => {
                                updateFeishuImportModal(draft => {
                                    draft.modalShow = false
                                    draft.loading = false
                                })
                            })
                        }
                    }>
                        Import
                    </Button>
                ]}
                onCancel={() => updateFeishuImportModal(draft => void (draft.modalShow = false))}
            >
                <Typography.Title level={5} style={{ color: 'black' }}>Import Link:</Typography.Title>
                <Input.TextArea value={feishuImportModal.bitableUrl}
                    onChange={e => updateFeishuImportModal(draft => void (draft.bitableUrl = e.target.value))} />
                <Typography.Title level={5} style={{ color: 'black' }}>Import Fields:</Typography.Title>
                <Checkbox.Group style={{ display: "grid" }} options={fieldOptions} disabled={true}
                    value={feishuImportModal.propertyList}
                    onChange={(list) => updateFeishuImportModal(draft => void (draft.propertyList = list))} />
            </Modal>
            {/* Export */}
            <Modal
                title="FeiShu Export"
                style={{ top: 20 }}
                styles={{ content: { width: '500px' } }}
                open={feishuExportModal.modalShow}
                footer={[
                    <Button key="submit" type="primary" loading={feishuExportModal.loading} onClick={
                        () => {
                            updateFeishuExportModal(draft => void (draft.loading = true))
                            feishuExport().then((res) => {
                                updateFeishuExportModal(draft => {
                                    draft.modalShow = false
                                    draft.loading = false
                                })
                                if (res.error) {
                                    message.open({
                                        type: 'error',
                                        content: res.data.errMessage,
                                    });
                                } else {
                                    modal.success({
                                        content: (<>
                                            <div>Export Success</div>
                                            <Button style={{ margin: '5px 0' }} onClick={() => window.open(res.data.data)}>View</Button>
                                        </>),
                                        className: "modal-default"
                                    })
                                }
                            })
                        }
                    }>
                        Export
                    </Button>
                ]}
                onCancel={() => updateFeishuExportModal(draft => void (draft.modalShow = false))}
            >
                <Typography.Title level={5} style={{ color: 'black' }}>Export Link:</Typography.Title>
                <Input.TextArea value={feishuExportModal.bitableUrl}
                    onChange={e => updateFeishuExportModal(draft => void (draft.bitableUrl = e.target.value))} />
                <Typography.Title level={5} style={{ color: 'black' }}>Export Type:</Typography.Title>
                <Radio.Group value={feishuExportModal.exportBy}
                    onChange={(e) => updateFeishuExportModal(draft => void (draft.exportBy = e.target.value))}>
                    <Radio value={1}>All</Radio>
                    <Radio value={2}>filter Data</Radio>
                </Radio.Group>
                <Typography.Title level={5} style={{ color: 'black' }}>Export Fields:</Typography.Title>
                <Checkbox.Group style={{ display: "grid" }} options={fieldOptions} disabled={true}
                    value={feishuExportModal.propertyList}
                    onChange={(list) => updateFeishuExportModal(draft => void (draft.propertyList = list))} />
            </Modal>
        </div>
    );
}