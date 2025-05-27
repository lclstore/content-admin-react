// import Categories from './Categories';
import { HeaderContext } from '@/contexts/HeaderContext';
import React, { useContext, useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import {Navigate, useNavigate,Outlet} from 'react-router';
import { Tabs } from 'antd';
import StickyBox from "react-sticky-box";

export default function CollectionsList() {
    // 本地存储token
    const localDown = (defaultActiveKey) => {
        localStorage.setItem('collections', defaultActiveKey);
    };

    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const navigate = useNavigate(); // 路由导航
    const tabItems = [
        {
            key: 'category/list',
            label: 'Category',
        },
        {
            key: 'program/list',
            label: 'Program',
        },
    ];
    const [defaultTabItem, setDefaultTabItem] = useState(tabItems[0]);

    function onChange(key) {
        // localDown(key)
        // const tabBarName = tabItems.find(item => item.key === key).label;
        setDefaultTabItem(tabItems.find(item => item.key === key))
        // setCustomPageTitle(`${tabBarName} List`);
        navigate("/collections2/" + key)
    }
    useEffect(() => {
        // 初始加载自动跳转到默认的tab
        navigate(tabItems[0].key)
        const plansKey = localStorage.getItem('collections');
        if (plansKey) {
            setDefaultTabItem(tabItems[plansKey - 1])
            console.log('defaultTabItem',defaultTabItem)
            localDown(1)

        }

    }, []);
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );
    return (
        <><Tabs style={{ backgroundColor: 'white',flex:1 }} activeKey={defaultTabItem.key}
                 renderTabBar={renderTabBar}
                 items={tabItems.map(i => ({ ...i, children: <div style={{ padding: '20px' }}>{i.children}</div> }))}
                 onChange={onChange} /> <Outlet/>
            </>)
}