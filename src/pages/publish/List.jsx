import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Table, Input, Button, Spin } from 'antd';
const { TextArea } = Input;
import { HeaderContext } from '@/contexts/HeaderContext';
import { listData } from './Data';
import "./List.css"
import {  CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

export default () => {
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const [dataSource, setDataSource] = useState(listData); // 表格数据源
    const [loading, setLoading] = useState(false); // 加载状态
    const [messageApi, contextHolder] = message.useMessage();
    const [comment, setComment] = useState("")

    // 表格渲染配置项
    const columns = useMemo(() => {
        return [
            {
                title: 'Version',
                dataIndex: 'version',
                width: 100,
            },
            {
                title: 'Comment',
                dataIndex: 'comment',
                width: 400,
            },

            {
                title: 'Result',
                dataIndex: 'result',
                key: 'result',
                render: (val) => {
                    return val==1?(
                        <div><CheckCircleFilled style={{ marginLeft: '5px', color: "#52c41a" }} /></div>
                    ):(
                        <div><CloseCircleFilled style={{ marginLeft: '5px', color: "#ff4d4f" }} /></div>
                    )
                },

                width: 100,
            },
            {
                title: 'User',
                dataIndex: 'user',
                width: 100,

            },
            {
                title: 'Time',
                dataIndex: 'time',
                width: 100,
            }
        ].map(i => ({ ...i, key: i.dataIndex }));
    }, []);
    const publish = useCallback(() => {
    }, []);
    const prePublish = useCallback(() => {
    }, []);
    const getData = useCallback(() => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            messageApi.success("get data success")
        }, 2000)
    }, []);
    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle && setCustomPageTitle('Publish');

        // 设置头部按钮
        setButtons([]);
        // 获取数据
        console.log("effect loaded")
        getData()
        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle && setCustomPageTitle(null);
        };
    }, []);
    // 渲染 - 组件UI呈现
    return (
        <div className="publishContainer">
            {/* 消息上下文提供器 */}
            {contextHolder}
            <div style={{}}>
                <TextArea placeholder="Enter comment..." className="publish-commit" rows={4} value={comment} onInput={(e) => setComment(e.target.value)}></TextArea>
                <div className="publish-btnBox">
                    <Button type="primary" onClick={publish}>Publish</Button>
                    <Button type="primary" onClick={prePublish}>Pre-Publish</Button>
                </div>
            </div>
            <Spin spinning={loading} size="large" tip="loading...">
                <Table dataSource={dataSource.map(i => ({ ...i, key: i.id }))}
                    columns={columns}
                    pagination={false}
                />
            </Spin>
        </div>
    );
}