import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Tabs } from 'antd';
import StickyBox from 'react-sticky-box';
import LogTable from './components/logTable.jsx';
import { HeaderContext } from '@/contexts/HeaderContext';

const tabLabels = [
    'Musics',
    'Playlists',
    'Sounds',
    'Images',
    'Exercises',
    'Workouts',
    'Categories',
    'Programs',
    'Templates',
    'Audio & Video default settings',
];

export default function CollectionsList() {
    const { setCustomPageTitle } = useContext(HeaderContext);
    const [bizType, setBizType] = useState(tabLabels[0]); // 默认激活第一个 tab

    // 设置标题
    useEffect(() => {
        setCustomPageTitle(bizType);
    }, [bizType]);

    const onChange = (key) => {
        console.log(key)
        setBizType(key);
    };

    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    const tabItems = useMemo(
        () =>
            tabLabels.map((label) => ({
                label,
                key: label,
                children: (
                    <div style={{ padding: '20px' }}>
                        <LogTable bizType={label} tabData={{ label }} />
                    </div>
                ),
            })),
        []
    );

    return (
        <Tabs
            style={{flex:1}}
            items={tabItems}
            activeKey={bizType}
            onChange={onChange}
            destroyInactiveTabPane
            renderTabBar={renderTabBar}
        />
    );
}
