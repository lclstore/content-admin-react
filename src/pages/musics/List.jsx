import React, { useContext, useEffect,useState } from 'react';
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
        label: 'Playlists',
        children: <Playlists />,
    }
];

export default function CollectionsList() {
    // 本地存储token
    const localDown = (defaultActiveKey) => {
        localStorage.setItem('musics', defaultActiveKey);
    };
    const { setCustomPageTitle } = useContext(HeaderContext);
    // let defaultTabItem = items[0] || {};
    const [defaultTabItem, setDefaultTabItem] = useState(items[0]);
    console.log('1111')
    // 页面加载时设置默认标题
    useEffect(() => {

        const musicsKey = localStorage.getItem('musics');
        setCustomPageTitle(`${defaultTabItem.label}`);
    }, [setCustomPageTitle]);

    useEffect(() => {
        
        const musicsKey = localStorage.getItem('musics');
        if (musicsKey) {
            setDefaultTabItem(items[musicsKey - 1])
            localDown(1)
            
        }

    }, []);

    const onChange = (key) => {
        console.log('key', key)
        localDown(key)
        const tabBarName = items.find(item => item.key == key).label;
        setDefaultTabItem(items.find(item => item.key == key))
        setCustomPageTitle(`${tabBarName}`);
    };
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    return <Tabs style={{ flex:1 }} activeKey={defaultTabItem.key} onChange={onChange} renderTabBar={renderTabBar} items={items} />;
}