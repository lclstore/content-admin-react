import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Tabs } from 'antd';
import StickyBox from 'react-sticky-box';
import LogTable from './components/logTable.jsx';
import { HeaderContext } from '@/contexts/HeaderContext';
import {useLocation} from "react-router";

export const tabLabels = [
    {
        label: "Musics",
        value: "biz-music"
    },
    {
        label: "Playlists",
        value: "biz-playlist"
    },
    {
        label: "Sounds",
        value: "biz-sound"
    },
    {
        label: "Resources",
        value: "biz-music"
    },
    {
        label: "Exercises",
        value: "biz-exercise"
    },
    {
        label: "Workouts",
        value: "biz-workout"
    },
    {
        label: "Templates",
        value: "biz-template"
    },
    {
        label: "Generate Task",
        value: "biz-generate"
    },
    {
        label: "Categories",
        value: "biz-category"
    },
    {
        label: "Programs",
        value: "biz-program"
    },
    {
        label: "Workout Settings",
        value: "biz-workout-settings"
    }
];

export default function CollectionsList() {
    const { setCustomPageTitle } = useContext(HeaderContext);
    const [bizType, setBizType] = useState(tabLabels[0].label); // 默认激活第一个 tab
    const location = useLocation()
    // 设置标题
    useEffect(() => {
        setCustomPageTitle(bizType);
    }, [bizType]);

    const onChange = (key) => {
        setBizType(key);
        // clear cache avoid search data confusion
        sessionStorage.removeItem(location.pathname)
    };

    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );

    const tabItems = useMemo(
        () =>
            tabLabels.map(({label}) => ({
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
