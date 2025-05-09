import Programs from './components/Programs.jsx';
import Category from './components/Category.jsx'
// import Categories from './Categories';
import {HeaderContext} from '@/contexts/HeaderContext';
import React, {useContext, useEffect} from "react";
import {PlusOutlined} from "@ant-design/icons";
import {useNavigate} from 'react-router';
import {Tabs} from 'antd';
import StickyBox from "react-sticky-box";

export default function CollectionsList() {
    const {setButtons, setCustomPageTitle} = useContext(HeaderContext);
    const navigate = useNavigate(); // 路由导航
    const tabItems = [
        {
            key: 'category',
            label: 'Category',
            children: <Category/>,
        },
        {
            key: 'program',
            label: 'Program',
            children: <Programs/>,
        },
    ];
    const defaultTabItem = tabItems[0] || {};
    // 页面加载时设置默认标题
    useEffect(() => {
        setCustomPageTitle(`${defaultTabItem.label} List`);
    }, [setCustomPageTitle]);
    function onChange(key) {
        const tabBarName = tabItems.find(item => item.key === key).label;
        setCustomPageTitle(`${tabBarName} List`);
    }

    useEffect(() => {
        setButtons([
            {
                key: 'create',
                text: 'Create Workout',
                icon: <PlusOutlined/>,
                type: 'primary',
                onClick: () => navigate('/workouts/editor'),
            }
        ])
    }, []);
    const renderTabBar = (props, DefaultTabBar) => (
        <StickyBox offsetTop={0} style={{ zIndex: 1 }}>
            <DefaultTabBar {...props} />
        </StickyBox>
    );
    return <Tabs style={{backgroundColor: 'white'}} defaultActiveKey="1"
                 renderTabBar={renderTabBar}
                 items={tabItems.map(i => ({ ...i,children: <div style={{padding:'20px'}}>{i.children}</div> }))}
                 onChange={onChange}/>
}