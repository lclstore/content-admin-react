import Programs from './components/Programs.jsx';
import Category from './components/Category.jsx'
// import Categories from './Categories';
import { HeaderContext } from '@/contexts/HeaderContext';
import React, { useContext, useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router';
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
            key: '1',
            label: 'Category',
            children: <Category />,
        },
        {
            key: '2',
            label: 'Program',
            children: <Programs />,
        },
    ];
    const [defaultTabItem, setDefaultTabItem] = useState(tabItems[0]);
    useEffect(() => {

        const plansKey = localStorage.getItem('collections');
        if (plansKey) {
            setDefaultTabItem(tabItems[plansKey - 1])
            console.log('defaultTabItem',defaultTabItem)
            localDown(1)

        }

    }, []);
    function onChange(key) {
        localDown(key)
        const tabBarName = tabItems.find(item => item.key === key).label;
         setDefaultTabItem(tabItems.find(item => item.key == key))
        setCustomPageTitle(`${tabBarName} List`);
    }
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );
    return <Tabs style={{ backgroundColor: 'white' }} activeKey={defaultTabItem.key}
        renderTabBar={renderTabBar}
        items={tabItems.map(i => ({ ...i, children: <div style={{ padding: '20px' }}>{i.children}</div> }))}
        onChange={onChange} />
}