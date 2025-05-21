import React, {useContext, useEffect, useMemo} from 'react';
import { Tabs } from 'antd';
import LogTable from './components/logTable.jsx';
import StickyBox from 'react-sticky-box';
import { HeaderContext } from '@/contexts/HeaderContext';
import request from "@/request";

const tabItemsList = [
    {
        label: 'Musics',
    },
    {
        label: 'Playlists',
    },
    {
        label: 'Sounds',
    },
    {
        label: 'Images',
    },
    {
        label: 'Exercises',
    },
    {
        label: 'Workouts',
    },
    {
        label: 'Categories',
    },
    {
        label: 'Programs',
    },
    {
        label: 'Templates',
    },
    {
        label:'Audio & Video default settings'
    }
].map(i => ({...i, children: <div style={{padding: '20px'}}><LogTable tabData={i}/></div>,key: i.label}))

export default function CollectionsList() {
    const { setCustomPageTitle } = useContext(HeaderContext);
    const items = useMemo(() => tabItemsList,[])
    const defaultTabItem = items[0] || {};
    const onChange = (key) => {
        console.log(key)
        const tabBarName = items.find(item => item.key === key).label;
        setCustomPageTitle(`${tabBarName}`);
    };
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );
    // 页面加载时设置默认标题
    useEffect(() => {
        setCustomPageTitle(`${defaultTabItem.label}`);
    }, []);

    return <Tabs defaultActiveKey={defaultTabItem.label} onChange={onChange} renderTabBar={renderTabBar} items={items} />;
}