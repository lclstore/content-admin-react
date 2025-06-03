import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { message, Form, Switch, Space, } from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { useStore } from "@/store/index.js";
import { router } from "@/utils/index.js";

export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    const optionsBase = useStore(state => state.optionsBase)
    console.log("optionsBase",optionsBase)
    //查询条件数组
    const filterSections = [
        {
            title: 'Status',
            key: 'statusList',
            type: 'multiple', // 单选 //multiple 多选
            options: "status",
        },
        {
            title: 'Duration (Min)',
            key: 'durationCode',
            type: 'multiple',
            options: "BizTemplateDurationEnums",
        }
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            { title: 'ID', dataIndex: 'id', key: 'id', width: 60, visibleColumn: 1 },
            {
                title: 'Name',
                sorter: true,
                showSorterTooltip: false,
                dataIndex: 'name',
                key: 'name',
                width: 350,
                visibleColumn: 1
            },
            { title: "Duration (Min)",dataIndex: "durationCode",options: 'BizTemplateDurationEnums',sorter: true, },
            {
                title: 'Status',
                dataIndex: 'status',
                sorter: true,
                options: 'displayStatus',
                width: 120,
            },
            { title: "Duration (Min)",dataIndex: "durationCode",options: 'BizTemplateDurationEnums',sorter: true, },
            { title: "Workout Num",dataIndex: "durationCode",options: 'BizTemplateDurationEnums',sorter: true, },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                actionButtons: ['edit', 'duplicate', 'enable', 'disable', 'deprecate', 'delete'],
                // isShow(record, key){
                //     let btnType = btn.sign
                //     let status = rowData.status
                //     let state = false
                //     if (
                //         (status === 0 && (btnType === "enable" || btnType === "delete" || btnType === "duplication")) ||
                //         (status === 1 && (btnType === "disabled" || btnType === "duplication")) ||
                //         (status === 2 && (btnType === "enable" || btnType === "duplication"))
                //     ) {
                //         state = true
                //     }
                //     return state
                // }
            },
        ];
    }, []);

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Template');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Template',
                icon: <PlusOutlined />,
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
    );
}   