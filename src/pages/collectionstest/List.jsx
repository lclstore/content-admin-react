import React from 'react';
import { Tabs } from 'antd';
import Programs from './components/Programs';
import Categories from './components/Categories';
import StickyBox from 'react-sticky-box';
const onChange = key => {
    console.log(key);
};



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
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );
    return <Tabs defaultActiveKey="1" renderTabBar={renderTabBar} items={items} />;
}