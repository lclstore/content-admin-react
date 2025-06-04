import { Layout, Spin } from 'antd'
import AppSider from './components/sider'
import AppHeader from './components/header'
import React, { useCallback, useEffect, useState } from 'react'
import settings from '@/config/settings'
import './layout.css';
import { Outlet } from 'react-router-dom'
import { useStore } from "@/store/index.js";
import { useNavigate } from "react-router";
import { getEnumList } from "@/config/api.js";
import { UpSquareOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout

const style = {
    height: 40,
    width: 40,
    lineHeight: '40px',
    borderRadius: 4,
    backgroundColor: '#1088e9',
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
};

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const loadingGlobal = useStore(state => state.loadingGlobal);
    const setNavigate = useStore(state => state.setNavigate);
    const optionsBaseAdd = useStore(state => state.optionsBaseAdd)
    const navigate = useNavigate();
    const [resouseLoaded, setResouseLoaded] = useState(false)
    useEffect(() => {
        // store 注入一个全局的 navigate
        setNavigate(navigate);
    }, [navigate]);

    useEffect(() => {
        const runScriptList = [
            getEnumList
        ]
        let state = 0
        runScriptList.forEach((fun, index) => {
            fun().then((res) => {
                state++;
                // getEnumList 获取枚举后加入optionsBase
                if (index === 0) { optionsBaseAdd(res) }
                if (state === runScriptList.length) {
                    setResouseLoaded(true)
                }
            })
        })
    }, []);
    return (
        <Layout className='layoutContainer'>
            <Spin spinning={loadingGlobal} fullscreen tip="Loading..." />
            <Sider className='siderContainer' theme={settings.layout.theme} width={settings.layout.sidebarWidth}
                trigger={null} collapsible collapsed={collapsed}>
                <AppSider />
            </Sider>
            <Layout>
                <Header
                    style={{
                        height: settings.layout.headerHeight,
                    }}
                    className='headerContainer'
                >
                    <AppHeader />
                </Header>
                <Content
                    className='contentContainer'
                    style={{
                        background: 'none',
                        position: 'relative',
                    }}
                >

                    {resouseLoaded && <Outlet />}
                </Content>
                
            </Layout>
        </Layout>

    );
}