import React, {useContext, useEffect, useState, useMemo, useCallback} from 'react';
import {message, Form, Switch, Space, Checkbox, Modal, Button} from 'antd';
import {
    CopyOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {useNavigate} from 'react-router';
import {HeaderContext} from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import {useStore} from "@/store/index.js";
import {router} from "@/utils/index.js";
import request from "@/request/index.js";
import {useImmer} from "use-immer";

export default function WorkoutsList() {
    const [generateModal, updateGenerateModal] = useImmer({
        id: null,
        loading: false,
        cleanWorkout: 0,
        modalShow: false
    })
    const {setButtons, setCustomPageTitle} = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const optionsBase = useStore(state => state.optionsBase)
    console.log("optionsBase", optionsBase)
    //查询条件数组
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: "statusList",
        },
        {
            title: 'Duration (Min)',
            key: 'durationCode',
            type: 'single',
            options: "BizTemplateDurationEnums",
        }
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name',
                sorter: true,
                showSorterTooltip: false,
                dataIndex: 'name',
                key: 'name',
                width: 350,
                visibleColumn: 1,
                render: (text,row) => (<div>
                    <div style={{ fontWeight:600 }}>{text}</div>
                    <div style={{ color:"var(--text-secondary)",fontSize:"12px" }}>ID:{row.id}</div>
                </div>),
            },
            {title: "Duration (Min)", dataIndex: "durationCode", options: 'BizTemplateDurationEnums', sorter: true},
            {
                title: 'Status',
                dataIndex: 'status',
                sorter: true,
                options: 'displayStatus',
                width: 120,
            },
            {title: "Generate Status", dataIndex: "generateStatus", options: 'publishStatus',},
            {title: "Workout Num", dataIndex: "workoutCount",render: (text,record) => <div onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/plans/workout/list?id=${record.id}`)
                }}>{text}</div>},
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'generate', 'delete'],
                customButtons: [
                    {
                        key: "generate",
                        icon: CopyOutlined,
                        click: ({selectList}) => {
                            updateGenerateModal(draft => {
                                draft.id = selectList[0].id
                                draft.modalShow = true
                            })
                        }
                    }
                ],
                isShow(record, btnName) {
                    const status = record.status;
                    // 简单的状态-按钮映射关系
                    if (status === 'DRAFT' && ['edit', 'duplicate', 'delete'].includes(btnName)) return true;
                    if (status === 'DISABLED' && ['edit', 'duplicate', 'enable', 'generate', 'delete'].includes(btnName)) return true;
                    if (status === 'ENABLED' && ['disable', 'generate', 'duplicate'].includes(btnName)) return true;
                    return false;
                }
            },
        ];
    }, []);
    // 生成方法
    const generate = async () => {
        return new Promise(resolve => {
            request.post({
                url: `/template/generate`,
                data: generateModal,
                point: true,
                callback() {
                    resolve()
                }
            })
        })
    }

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Templates');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Template',
                icon: <PlusOutlined/>,
                type: 'primary',
                onClick: () => router().push('editor'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);

    //渲染表格组件
    return (
        <>
            <ConfigurableTable
                columns={allColumnDefinitions}
                moduleKey="template"
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
            <Modal
                title="Generate"
                styles={{content: {width: '300px'}}}
                open={generateModal.modalShow}
                footer={[
                    <Button key="submit" type="primary" loading={generateModal.loading} onClick={
                        () => {
                            updateGenerateModal(draft => {
                                draft.loading = true
                            })
                            generate().then(() => {
                                updateGenerateModal(draft => {
                                    draft.modalShow = false
                                    draft.loading = false
                                })
                            })
                        }
                    }>
                        Generate
                    </Button>
                ]}
                onCancel={() => updateGenerateModal(draft => void (draft.modalShow = false))}
            >
                <Checkbox onChange={() => updateGenerateModal(draft => void (draft.cleanWorkout = generateModal.cleanWorkout === 0 ? 1 : 0))}>Checkbox</Checkbox>
            </Modal>
        </>
    );
}   