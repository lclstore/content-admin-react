import React, { useContext, useEffect } from 'react';
import { Tabs } from 'antd';
import Programs from './components/Programs';
import Categories from './components/Categories';
import StickyBox from 'react-sticky-box';
import { HeaderContext } from '@/contexts/HeaderContext';

const items = [
    {
        key: '1',
        label: 'Programs',
        children: <Programs />,
    },
    {
        key: '2',
        label: 'Categories',
        children: <Categories />,
    }
];

export default function CollectionsList() {
    const { setCustomPageTitle } = useContext(HeaderContext);
    const defaultTabKey = '1';
    // 页面加载时设置默认标题
    useEffect(() => {
        const tabBarName = items.find(item => item.key === defaultTabKey)?.label;
        setCustomPageTitle(`${tabBarName} List`);
    }, [setCustomPageTitle]);

    const onChange = (key) => {
        const tabBarName = items.find(item => item.key == key)?.label;
        setCustomPageTitle(`${tabBarName} List`);
    };
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    return <Tabs defaultActiveKey={defaultTabKey} onChange={onChange} renderTabBar={renderTabBar} items={items} />;
}