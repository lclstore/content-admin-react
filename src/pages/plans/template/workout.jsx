import React, {useContext, useEffect, useState, useMemo, useCallback} from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import {useNavigate} from 'react-router';
import {HeaderContext} from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import {router} from "@/utils/index.js";
import request from "@/request/index.js";
import {Table} from "antd";

export default function WorkoutsList() {
    const {setButtons, setCustomPageTitle} = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    //查询条件数组
    const filterSections = [
        {
            title: 'Gender',
            key: 'genderCode',
            type: 'multiple',
            options: "BizExerciseGenderEnums",
        },
        {
            title: 'Injured',
            key: 'applicationCodeList',
            type: 'multiple',
            options: "BizExerciseInjuredEnums",
        },
        {
            title: 'File Status',
            key: 'applicationCodeList',
            type: 'multiple',
            options: "BizGenerateTaskStatusEnums",
        },
    ];

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            {title: 'ID', dataIndex: 'id', key: 'id', width: 60, visibleColumn: 1},
            {
                title: 'Audio language',
                sorter: true,
                showSorterTooltip: false,
                dataIndex: 'name',
                key: 'name',
                width: 350,
                visibleColumn: 1
            },
            {
                title: 'File Status',
                dataIndex: 'status',
                sorter: true,
                options: 'displayStatus',
                width: 120,
            },
            {
                title: 'Duration',
                dataIndex: 'applicationCode',
                options: 'BizResourceApplicationEnums',
                width: 120,
            },
            { title: "Calorie",dataIndex: "calorie" },
            {
                title: 'Gender',
                dataIndex: 'genderCode',
                sorter: true,
                options: 'BizExerciseGenderEnums',
                width: 120,
            },
            {
                title: 'Injured (Query Param)',
                dataIndex: 'genderCode',
                sorter: true,
                options: 'BizExerciseGenderEnums',
                width: 120,
            },
            {
                title: 'Injured (Actual Result)',
                dataIndex: 'genderCode',
                sorter: true,
                options: 'BizExerciseGenderEnums',
                width: 120,
            },
            {title: "Create Time", dataIndex: "createTime"},
        ];
    }, []);

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Resource');

        // 设置头部按钮
        setButtons([
            {
                key: 'create',
                text: 'Add Image',
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
    const getTableList = useCallback(async (params) => {
        const {data} = await request.get('/api/v1/exercises', {params});
        return data;
    }, []);
    const expandedRowRender =useCallback( (record) => {

        // 定义展开行表格的列配置
        const columns = [
            {
                title: 'ID',
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
                title: 'Show Type',
                dataIndex: 'showTypeCode',
                key: 'showTypeCode',
                width: 120
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 100
            },
            {
                title: 'New Start Time',
                dataIndex: 'newStartTime',
                key: 'newStartTime',
                width: 160
            },
            {
                title: 'New End Time',
                dataIndex: 'newEndTime',
                key: 'newEndTime',
                width: 160,
            }
        ];

        return (
            <Table
                columns={columns}
                dataSource={record}
                pagination={false}
                rowKey="id"
                size="small"
                bordered={false}
            />
        );
    })
    //渲染表格组件
    return (
        <>
            <ConfigurableTable
                columns={allColumnDefinitions}
                expandedRowRender={expandedRowRender}
                getTableList={getTableList}
                moduleKey="workout"
                searchConfig={{
                    placeholder: "Search name or ID...",
                }}
                showColumnSettings={false}
                filterConfig={{
                    filterSections: filterSections,
                }}
            />
        </>
    );
}