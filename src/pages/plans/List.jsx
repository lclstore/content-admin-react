import React, { useContext, useEffect, useState } from 'react';
import { Tabs } from 'antd';
import Temlates from './components/Temlates';
import Resources from './components/Resources';
import StickyBox from 'react-sticky-box';
import { HeaderContext } from '@/contexts/HeaderContext';



const items = [
    {
        key: '1',
        label: 'Temlates',
        children: <Temlates />,
    },
    {
        key: '2',
        label: 'Resources',
        children: <Resources />,
    }
];
export default function CollectionsList() {
    // 本地存储token
    const localDown = (defaultActiveKey) => {
        localStorage.setItem('plans', defaultActiveKey);
    };
    const { setCustomPageTitle } = useContext(HeaderContext);
    const [defaultTabItem, setDefaultTabItem] = useState(items[0]);
    // 页面加载时设置默认标题
    useEffect(() => {
        setCustomPageTitle(`${defaultTabItem.label}`);
    }, [setCustomPageTitle]);

    useEffect(() => {

        const plansKey = localStorage.getItem('plans');
        if (plansKey) {
            setDefaultTabItem(items[plansKey - 1])
            localDown(1)

        }

    }, []);

    const onChange = (key) => {
        localDown(key)
        const tabBarName = items.find(item => item.key == key).label;
        setDefaultTabItem(items.find(item => item.key == key))
        setCustomPageTitle(`${tabBarName} List`);
    };

    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    return <Tabs activeKey={defaultTabItem.key} onChange={onChange} renderTabBar={renderTabBar} items={items} />;
}