import { Layout } from 'antd'
import AppSider from './components/sider'
import AppHeader from './components/header'
import { useState } from 'react'
import settings from '@/config/settings'
import './layout.css';
import { Outlet } from 'react-router-dom'

const { Header, Sider, Content } = Layout

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Layout className='layoutContainer'>
      <Sider className='siderContainer' theme={settings.layout.theme} width={settings.layout.sidebarWidth} trigger={null} collapsible collapsed={collapsed}>
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
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>

  );
}