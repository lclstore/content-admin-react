import React, { useContext, useEffect, useState } from 'react';
import { Tabs } from 'antd';
import Musics from './music/List';
import Playlists from './playlist/List';
import StickyBox from 'react-sticky-box';
import { HeaderContext } from '@/contexts/HeaderContext';
import { useNavigate, useLocation } from 'react-router';
import { use } from 'react';

// 定义标签页配置
const items = [
    {
        key: '/musics/music/list',
        label: 'Musics',
        children: <Musics />,
    },
    {
        key: '/musics/playlist/list',
        label: 'Playlists',
        children: <Playlists />,
    }
];

export default function CollectionsList() {
    const navigate = useNavigate();
    const location = useLocation();

    const { setCustomPageTitle } = useContext(HeaderContext);
    console.log(location.pathname);
    let currentPath = items.find(item => item.key === location.pathname);
    currentPath = currentPath ? currentPath : items[0].key
    const [defaultTabItem, setDefaultTabItem] = useState(currentPath);



    useEffect(() => {
        navigate(currentPath);
    }, []);

    // 从本地存储加载上次选中的标签页
    useEffect(() => {
        try {
            const musicsKey = localStorage.getItem('musics');
            if (musicsKey) {
                const foundItem = items.find(item => item.key === musicsKey);
                if (foundItem) {
                    setDefaultTabItem(foundItem);
                    setCustomPageTitle(foundItem.label);
                } else {
                    // 如果找不到对应的标签页，使用默认值
                    setDefaultTabItem(items[0]);
                    setCustomPageTitle(items[0].label);
                }
            } else {
                // 如果本地存储中没有值，使用默认值
                setCustomPageTitle(items[0].label);
            }
        } catch (error) {
            console.error('从本地存储加载失败:', error);
            setCustomPageTitle(items[0].label);
        }
    }, [setCustomPageTitle]);

    // 标签页切换处理
    const onChange = (key) => {
        const selectedItem = items.find(item => item.key === key);
        if (selectedItem) {
            setDefaultTabItem(selectedItem);
            setCustomPageTitle(selectedItem.label);
            navigate(key);
        }
    };

    // 固定标签页头部
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    // 确保 defaultTabItem 存在，如果不存在则使用默认值
    const activeKey = defaultTabItem?.key || items[0].key;

    return (
        <Tabs
            style={{ flex: 1 }}
            defaultActiveKey={defaultTabItem}
            activeKey={activeKey}
            onChange={onChange}
            renderTabBar={renderTabBar}
            items={items}
        />
    );
}