import React, { useContext, useEffect } from 'react';
import { Tabs } from 'antd';
import Musics from './components/Musics';
import Playlists from './components/Playlists';
import StickyBox from 'react-sticky-box';
import { HeaderContext } from '@/contexts/HeaderContext';

const items = [
    {
        key: '1',
        label: 'Musics',
        children: <Musics />,
    },
    {
        key: '2',
        label: 'Categories',
        children: <Playlists />,
    }
];

export default function CollectionsList() {
    const { setCustomPageTitle } = useContext(HeaderContext);
    const defaultTabItem = items[0] || {};
    // 页面加载时设置默认标题
    useEffect(() => {
        setCustomPageTitle(`${defaultTabItem.label} List`);
    }, [setCustomPageTitle]);

    const onChange = (key) => {
        const tabBarName = items.find(item => item.key == key).label;
        setCustomPageTitle(`${tabBarName} List`);
    };
    const renderTabBar = (props, DefaultTabBar) => ( 
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    return <Tabs defaultActiveKey={defaultTabItem.key} onChange={onChange} renderTabBar={renderTabBar} items={items} />;
}